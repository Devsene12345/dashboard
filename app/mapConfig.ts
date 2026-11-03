import type { ScenarioKey } from "./data";

/* ------------------------------------------------------------------ *
 * Where the GIS files live: public/Hulu Ganga/
 * ------------------------------------------------------------------ */
export const DATA_DIR = "/Hulu%20Ganga";
const f = (name: string) => `${DATA_DIR}/${encodeURIComponent(name)}`;

export const MAP_CENTER: [number, number] = [7.4, 80.77];
export const MAP_ZOOM = 11;

/** Shapefiles (give the path without the extension). Add public/Hulu Ganga/Watersheds.* to switch on the Watersheds layer. */
export const VECTORS = {
  gn: { label: "GN boundary", base: f("GN") },
  weirs: { label: "Hydro weirs", base: f("hydro_weir_locations") },
  ws: { label: "Watersheds", base: f("Watersheds") },
} as const;
export type VectorId = keyof typeof VECTORS;

/** GeoTIFF per scenario. Only the BAU files exist today; add the others with these names (or rename here). */
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

/**
 * Verified spatial files included in the supplied project folder.
 * Keep this in sync with public/Hulu Ganga/. A missing scenario raster must
 * never be substituted with the BAU raster, because that would misrepresent
 * the selected scenario on the map.
 */
export const RASTER_AVAILABILITY: Record<
  "lulc" | "sdr" | "swy",
  Record<ScenarioKey, boolean>
> = {
  lulc: { S1: true, S2: false, S3: false, S4: false },
  sdr: { S1: true, S2: false, S3: false, S4: false },
  swy: { S1: false, S2: false, S3: false, S4: false },
};

export const SPATIAL_DATA_STATUS = {
  vectors: ["GN boundary", "Hydro weir locations"],
  rasters: ["BAU land-use raster", "BAU sediment-export raster"],
  missing:
    "Scenario-specific S2–S4 rasters and Seasonal Water Yield GeoTIFFs are not included in the supplied project folder.",
} as const;

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
  { max: Infinity, color: "#d7191c", label: "1 – 38" },
];
export function sdrColor(v: number): string {
  for (const b of SDR_BINS) if (v < b.max) return b.color;
  return SDR_BINS[SDR_BINS.length - 1].color;
}

/* ------------------------------------------------------------------ *
 * LULC classes. EDIT THE CODES to match the "Value" column of your raster's
 * attribute table (Land use_ Hulu ganga1.tif.vat.dbf, open it in QGIS or Excel).
 * Codes 1-17 are the BAU classes in legend order; 18+ are scenario-specific classes.
 * ------------------------------------------------------------------ */
export interface LulcClass {
  code: number;
  name: string;
  color: string;
}
export const LULC_CLASSES: LulcClass[] = [
  { code: 1, name: "High-impervious urban / Playgrounds", color: "#a07cd8" },
  { code: 2, name: "Institutional", color: "#d97fa6" },
  { code: 3, name: "Residential", color: "#7b70ca" },
  { code: 4, name: "Home garden", color: "#74e832" },
  { code: 5, name: "Dense forest", color: "#ebe83f" },
  { code: 6, name: "Open forest", color: "#dc4568" },
  { code: 7, name: "Tea", color: "#629fc9" },
  { code: 8, name: "Perennial plantation", color: "#6a7ccb" },
  { code: 9, name: "Paddy", color: "#e0401a" },
  { code: 10, name: "Abandoned paddy", color: "#33eca6" },
  { code: 11, name: "Annual cropland", color: "#1f1ff0" },
  { code: 12, name: "Grassland", color: "#e283e3" },
  { code: 13, name: "Shrubland", color: "#b02acd" },
  { code: 14, name: "Bare/disturbed", color: "#8a2bd0" },
  { code: 15, name: "Wetland", color: "#e862c8" },
  { code: 16, name: "Water", color: "#d6ef64" },
  { code: 17, name: "Fallow/abandoned", color: "#c9ae45" },
  // S2 (SWC)
  { code: 18, name: "Home garden - contour bunds", color: "#e31a1c" },
  { code: 19, name: "Home garden - grass strips", color: "#ee74b6" },
  { code: 20, name: "Tea - riparian buffer", color: "#7fd6d6" },
  { code: 21, name: "Tea - bench terrace", color: "#6dc08b" },
  { code: 22, name: "Tea - bunds + vetiver", color: "#4cc24c" },
  { code: 23, name: "Paddy - riparian buffer", color: "#2ee86b" },
  { code: 24, name: "Paddy - contour bunds", color: "#4a7fdc" },
  { code: 25, name: "Abandoned paddy - riparian buffer", color: "#9bcb42" },
  { code: 26, name: "Annual crop - riparian buffer", color: "#22b8e0" },
  { code: 27, name: "Bare - riparian buffer", color: "#f29150" },
  { code: 28, name: "Bare - bunds + vetiver", color: "#33cc33" },
  { code: 29, name: "Fallow - riparian buffer", color: "#7fe8d0" },
  { code: 30, name: "Fallow - grass strips", color: "#e0b070" },
  // S3 (REST)
  { code: 31, name: "Reforested degraded uplands", color: "#e8334a" },
  { code: 32, name: "Mixed tea + tree systems", color: "#b88a7c" },
  { code: 33, name: "River buffer vegetation", color: "#ff3be6" },
];
export const LULC_BY_CODE = new Map(LULC_CLASSES.map((c) => [c.code, c]));

const BASE_CODES = Array.from({ length: 17 }, (_, i) => i + 1);
/** Class codes listed in the legend of each scenario's LULC map */
export const LULC_LEGEND_CODES: Record<ScenarioKey, number[]> = {
  S1: BASE_CODES,
  S2: [...BASE_CODES, ...Array.from({ length: 13 }, (_, i) => 18 + i)],
  S3: [...BASE_CODES, 31, 32, 33],
  S4: [...BASE_CODES, 31, 18, 19],
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
