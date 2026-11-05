import type { ScenarioKey } from "./data";
import { CATCHMENT_OUTLINE } from "./catchmentOutline";

/* ------------------------------------------------------------------ *
 * Where the GIS files live.
 *  - default:  public/Hulu Ganga/  (served by the same site, e.g. Vercel's CDN)
 *  - optional: set NEXT_PUBLIC_DATA_BASE_URL to the address of a bucket that holds the same files
 *              (Cloudflare R2, Vercel Blob, AWS S3 ...), e.g. https://data.example.com/Hulu%20Ganga
 *              The bucket must allow CORS GET/HEAD from the site.
 * ------------------------------------------------------------------ */
export const DATA_DIR = (
  process.env.NEXT_PUBLIC_DATA_BASE_URL || "/Hulu%20Ganga"
).replace(/\/+$/, "");
const f = (name: string) => `${DATA_DIR}/${encodeURIComponent(name)}`;

export const MAP_CENTER: [number, number] = [7.4, 80.77];
export const MAP_ZOOM = 11;

/**
 * Vector layers.
 *  - base:    path of a shapefile without the extension (needs the .shp and .dbf next to each other)
 *  - crs:     coordinate system of the shapefile when it must be set by hand (see PROJ_DEFS); leave it out to read the .prj file
 *  - geojson: path of a ready-made GeoJSON file in longitude/latitude (EPSG:4326)
 *  - inline:  GeoJSON written directly in the code (longitude/latitude)
 *
 * ws: no Watersheds shapefile has been added to public/Hulu Ganga yet, so the outer catchment outline
 *     (app/catchmentOutline.ts, traced from the valid area of "Sediment export BAU.tif") is shown instead.
 *     When you have the real shapefile, replace the ws line with:  ws: { label: 'Watersheds', base: f('Watersheds') },
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface VectorDef {
  label: string;
  base?: string;
  crs?: string;
  geojson?: string;
  inline?: any;
}
export const VECTORS: Record<"gn" | "weirs" | "ws", VectorDef> = {
  gn: { label: "GN boundary", base: f("GN"), crs: "KANDAWALA_SLG" },
  weirs: {
    label: "Hydro weirs",
    base: f("hydro_weir_locations"),
    crs: "EPSG:4326",
  },
  ws: { label: "Catchment outline", inline: CATCHMENT_OUTLINE },
};
export type VectorId = keyof typeof VECTORS;

/** GeoTIFF per scenario. Only the BAU land-use and BAU sediment-export files exist today; add the others with these names (or rename them here). */
export const LULC_FILES: Record<ScenarioKey, string> = {
  S1: f("Land use_ Hulu ganga1.tif"),
  S2: f("Land use_ SWC.tif"),
  S3: f("Land use_ REST.tif"),
  S4: f("Land use_ INTEGRATED.tif"),
};
export const SDR_FILES: Record<ScenarioKey, string> = {
  S1: f("Sediment export BAU.tif"),
  S2: f("Sediment export SWC.tif"),
  S3: f("Sediment export REST.tif"),
  S4: f("Sediment export INTEGRATED.tif"),
};
export const SWY_FILES: Record<ScenarioKey, string> = {
  S1: f("Seasonal water yield BAU.tif"),
  S2: f("Seasonal water yield SWC.tif"),
  S3: f("Seasonal water yield REST.tif"),
  S4: f("Seasonal water yield INTEGRATED.tif"),
};

/** Projections that georaster-layer-for-leaflet may need (EPSG:4326 and 3857 are built in).
 *  If the browser console reports an unsupported projection, add its proj4 string here,
 *  or re-export the raster from QGIS as EPSG:4326. */
export const PROJ_DEFS: [string, string][] = [
  [
    "EPSG:5235",
    "+proj=tmerc +lat_0=7.00047152777778 +lon_0=80.7717111111111 +k=0.9999238418 +x_0=500000 +y_0=500000 +ellps=GRS80 +towgs84=0.2933,766.9499,87.713,0.195704,1.695068,3.473016,-0.039338 +units=m +no_defs",
  ],
  [
    "EPSG:5234",
    "+proj=tmerc +lat_0=7.00047152777778 +lon_0=80.77171308333334 +k=0.9999238418 +x_0=500000 +y_0=500000 +a=6377276.345 +b=6356075.41314024 +towgs84=-97,787,86,0,0,0,0 +units=m +no_defs",
  ],
  // Kandawala / Sri Lanka Grid, the system of GN.shp (false easting/northing 200000, datum shift to WGS84 from EPSG:4244)
  [
    "KANDAWALA_SLG",
    "+proj=tmerc +lat_0=7.000480277777778 +lon_0=80.77171111111112 +k=0.9999238418 +x_0=200000 +y_0=200000 +a=6377276.345 +rf=300.8017 +towgs84=-97,787,86,0,0,0,0 +units=m +no_defs",
  ],
  ["EPSG:32644", "+proj=utm +zone=44 +datum=WGS84 +units=m +no_defs"],
];

/* ------------------------------------------------------------------ *
 * Sediment export legend (t/ha). Colours are taken from the legend on slide 12.
 * ------------------------------------------------------------------ */
export const SDR_BINS = [
  { max: 0.0001, color: "#2b83ba", label: "< 0.0001" },
  { max: 0.001, color: "#fedf9c", label: "0.0001 – 0.001" },
  { max: 0.01, color: "#8fc9a8", label: "0.001 – 0.01" },
  { max: 0.1, color: "#f58f55", label: "0.01 – 0.1" },
  { max: 1, color: "#d9efb4", label: "0.1 – 1" },
  { max: Infinity, color: "#d7191c", label: "1 – 47" },
];
export function sdrColor(v: number): string {
  for (const b of SDR_BINS) if (v < b.max) return b.color;
  return SDR_BINS[SDR_BINS.length - 1].color;
}

/* ------------------------------------------------------------------ *
 * LULC classes. These are the 7 classes stored in "Land use_ Hulu ganga1.tif"
 * (the Value / Level_1 columns of its attribute table, Land use_ Hulu ganga1.tif.vat.dbf).
 * If a scenario raster uses extra codes, add them here and list them in LULC_LEGEND_CODES.
 * ------------------------------------------------------------------ */
export interface LulcClass {
  code: number;
  name: string;
  color: string;
}
export const LULC_CLASSES: LulcClass[] = [
  { code: 1, name: "Agricultural land", color: "#f2cf5b" },
  { code: 2, name: "Bare land", color: "#c8a27c" },
  { code: 3, name: "Built-up land", color: "#e0483e" },
  { code: 4, name: "Forest land", color: "#2f7d3b" },
  { code: 5, name: "Rocky area", color: "#8d9299" },
  { code: 6, name: "Water bodies", color: "#2f80ed" },
  { code: 7, name: "Wetland", color: "#4fc3b0" },
];
export const LULC_BY_CODE = new Map(LULC_CLASSES.map((c) => [c.code, c]));

const BASE_CODES = LULC_CLASSES.map((c) => c.code);
/** Class codes listed in the legend of each scenario's LULC map */
export const LULC_LEGEND_CODES: Record<ScenarioKey, number[]> = {
  S1: BASE_CODES,
  S2: BASE_CODES,
  S3: BASE_CODES,
  S4: BASE_CODES,
};

/* ------------------------------------------------------------------ *
 * Seasonal water yield: continuous light-to-dark blue ramp between the raster's min and max
 * ------------------------------------------------------------------ */
const RAMP = ["#e8f3fb", "#4a9bd0", "#0b3c78"];
const hex = (h: string) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export function rampColor(t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  const a = hex(RAMP[i]);
  const b = hex(RAMP[i + 1]);
  const k = x - i;
  const c = a.map((v, j) => Math.round(v + (b[j] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export const RAMP_CSS = `linear-gradient(90deg, ${RAMP.join(", ")})`;

/* ------------------------------------------------------------------ *
 * pixel value -> colour functions used by GeoRasterLayer
 * ------------------------------------------------------------------ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rasterColorFn(kind: "lulc" | "sdr" | "swy", georaster: any) {
  const nodata = georaster.noDataValue;
  const min = georaster.mins?.[0] ?? 0;
  const max = georaster.maxs?.[0] ?? 1;
  return (values: number[]): string | null => {
    const v = values[0];
    if (v === undefined || v === null || Number.isNaN(v) || v === nodata)
      return null;
    if (kind === "lulc") return LULC_BY_CODE.get(Math.round(v))?.color ?? null;
    if (kind === "sdr") return v < 0 ? null : sdrColor(v);
    return rampColor((v - min) / (max - min || 1));
  };
}
