/* ------------------------------------------------------------------ *
 * Reader for GeoTIFFs whose pixels are packed into fewer than 8 bits (1, 2 or 4 bits per pixel).
 *
 * ArcGIS writes small classified rasters (such as the LULC map, 7 classes) this way, and the
 * GeoTIFF library inside "georaster" cannot decode them ("Unsupported data format/bitsPerSample").
 * This file reads the pixels itself and hands georaster an ordinary in-memory raster, so the
 * original .tif can be used without re-exporting it.
 *
 * Supported: classic TIFF, uncompressed, one band, striped or tiled.
 * ------------------------------------------------------------------ */

export interface PackedRaster {
  /** [band][row][column] */
  values: Uint8Array[][];
  metadata: {
    noDataValue?: number;
    projection?: number;
    xmin: number;
    ymax: number;
    pixelWidth: number;
    pixelHeight: number;
    width: number;
    height: number;
  };
}

const TYPE_SIZE: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8,
};

function readTags(buf: ArrayBuffer) {
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  const le = dv.getUint16(0) === 0x4949; // "II" = little endian
  if (dv.getUint16(2, le) !== 42)
    throw new Error("Only classic (non-BigTIFF) GeoTIFF files are supported");

  /* ---- read the tag directory ---- */
  const ifd = dv.getUint32(4, le);
  const count = dv.getUint16(ifd, le);
  const tags = new Map<number, number[] | string>();
  for (let i = 0; i < count; i++) {
    const e = ifd + 2 + i * 12;
    const tag = dv.getUint16(e, le);
    const type = dv.getUint16(e + 2, le);
    const n = dv.getUint32(e + 4, le);
    const size = (TYPE_SIZE[type] ?? 1) * n;
    const at = size <= 4 ? e + 8 : dv.getUint32(e + 8, le);
    if (type === 2) {
      let s = "";
      for (let k = 0; k < n; k++) s += String.fromCharCode(u8[at + k]);
      tags.set(tag, s.replace(/\0+$/, ""));
      continue;
    }
    const vals: number[] = [];
    for (let k = 0; k < n; k++) {
      if (type === 3) vals.push(dv.getUint16(at + k * 2, le));
      else if (type === 4) vals.push(dv.getUint32(at + k * 4, le));
      else if (type === 12) vals.push(dv.getFloat64(at + k * 8, le));
      else if (type === 1 || type === 7) vals.push(u8[at + k]);
    }
    tags.set(tag, vals);
  }
  const num = (tag: number, fallback?: number) => {
    const v = tags.get(tag);
    return Array.isArray(v) && v.length ? v[0] : fallback;
  };
  const arr = (tag: number) => {
    const v = tags.get(tag);
    return Array.isArray(v) ? v : undefined;
  };
  return { u8, tags, num, arr };
}

/**
 * true when the file stores fewer than 8 bits per pixel. Checked BEFORE georaster is called, because
 * georaster decodes in a web worker where a failure cannot be caught and the layer would silently stay empty.
 */
export function isPackedGeoTiff(buf: ArrayBuffer): boolean {
  try {
    return (readTags(buf).num(258, 8) ?? 8) < 8;
  } catch {
    return false;
  }
}

export function readPackedGeoTiff(buf: ArrayBuffer): PackedRaster {
  const { u8, tags, num, arr } = readTags(buf);

  const width = num(256)!;
  const height = num(257)!;
  const bps = num(258, 1)!;
  const compression = num(259, 1)!;
  if (compression !== 1)
    throw new Error(
      `Compressed TIFF (code ${compression}) with ${bps}-bit pixels is not supported. Re-export it as an 8-bit GeoTIFF.`,
    );
  if (bps >= 8 || 8 % bps !== 0)
    throw new Error(`Unsupported bitsPerSample ${bps}`);

  const mask = (1 << bps) - 1;
  const rowBytes = (w: number) => Math.ceil((w * bps) / 8);
  const rows: Uint8Array[] = Array.from(
    { length: height },
    () => new Uint8Array(width),
  );

  /** unpack `n` pixels that start at byte `from` into `dest`, starting at column `x0` */
  const unpack = (from: number, n: number, dest: Uint8Array, x0: number) => {
    for (let x = 0; x < n; x++) {
      const bit = x * bps;
      dest[x0 + x] = (u8[from + (bit >> 3)] >> (8 - bps - (bit & 7))) & mask; // first pixel sits in the high bits
    }
  };

  const tileW = num(322);
  const tileH = num(323);
  const tileOffsets = arr(324);
  if (tileW && tileH && tileOffsets) {
    const across = Math.ceil(width / tileW);
    tileOffsets.forEach((off, t) => {
      const x0 = (t % across) * tileW;
      const y0 = Math.floor(t / across) * tileH;
      for (let r = 0; r < tileH && y0 + r < height; r++) {
        unpack(
          off + r * rowBytes(tileW),
          Math.min(tileW, width - x0),
          rows[y0 + r],
          x0,
        );
      }
    });
  } else {
    const offsets = arr(273);
    if (!offsets) throw new Error("TIFF has neither strips nor tiles");
    const rps = num(278, height)!;
    offsets.forEach((off, s) => {
      for (let r = 0; r < rps && s * rps + r < height; r++)
        unpack(off + r * rowBytes(width), width, rows[s * rps + r], 0);
    });
  }

  /* ---- georeferencing ---- */
  const scale = arr(33550); // ModelPixelScale
  const tie = arr(33922); // ModelTiepoint
  if (!scale || !tie) throw new Error("GeoTIFF has no georeferencing tags");
  const xmin = tie[3] - tie[0] * scale[0];
  const ymax = tie[4] + tie[1] * scale[1];

  let projection: number | undefined;
  const keys = arr(34735); // GeoKeyDirectory
  if (keys) {
    for (let k = 0; k < keys[3]; k++) {
      const id = keys[4 + k * 4];
      const loc = keys[4 + k * 4 + 1];
      const val = keys[4 + k * 4 + 3];
      if (loc === 0 && id === 3072 && val !== 32767) projection = val; // ProjectedCSTypeGeoKey
      if (loc === 0 && id === 2048 && projection === undefined)
        projection = val; // GeographicTypeGeoKey
    }
  }
  const nd = tags.get(42113); // GDAL_NODATA
  const noDataValue =
    typeof nd === "string" && nd.trim() !== "" ? Number(nd) : undefined;

  return {
    values: [rows],
    metadata: {
      noDataValue,
      projection,
      xmin,
      ymax,
      pixelWidth: scale[0],
      pixelHeight: scale[1],
      width,
      height,
    },
  };
}
