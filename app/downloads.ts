import {
  SCEN,
  SDR_BASE,
  SDR_SCEN,
  SKEYS,
  SW,
  SWY_SCEN,
  WS,
  WS_AREA,
  MHP,
} from "./data";

/* ---------------- helpers ---------------- */
const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(head: string[], rows: (string | number)[][]): string {
  return (
    [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n"
  );
}

/** UTF-8 with BOM so Excel opens "m²", "·" etc. correctly */
export const csvBlob = (text: string) =>
  new Blob(["\ufeff", text], { type: "text/csv;charset=utf-8" });

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function fetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (type.includes("text/html")) throw new Error("not found"); // a host that answers missing files with its HTML page
  return res.blob();
}

export const fileNameOf = (url: string) =>
  decodeURIComponent(url.split("/").pop() || url);

/* ---------------- CSV datasets (built from app/data.ts) ---------------- */
export interface Dataset {
  id: string;
  title: string;
  desc: string;
  file: string;
  build: () => { head: string[]; rows: (string | number)[][] };
}

const names = SKEYS.map((k) => SCEN[k].name);

export const DATASETS: Dataset[] = [
  {
    id: "scenarios",
    title: "Scenario summary",
    desc: "Four land-use scenarios with outlet sediment export and outlet water yield.",
    file: "scenario_summary.csv",
    build: () => ({
      head: [
        "scenario",
        "description",
        "sediment_export_outlet_t_per_yr",
        "sediment_change_vs_BAU_pct",
        "water_yield_outlet_WS8",
        "water_yield_change_vs_BAU_pct",
      ],
      rows: SKEYS.map((k) => [
        SCEN[k].name,
        SCEN[k].desc,
        SDR_SCEN[k][0],
        (((SDR_SCEN[k][0] - SDR_SCEN.S1[0]) / SDR_SCEN.S1[0]) * 100).toFixed(2),
        SWY_SCEN[k][7],
        (((SWY_SCEN[k][7] - SWY_SCEN.S1[7]) / SWY_SCEN.S1[7]) * 100).toFixed(2),
      ]),
    }),
  },
  {
    id: "sdr",
    title: "Sediment export by sub-watershed",
    desc: "InVEST SDR sediment export (t/yr) for all four scenarios.",
    file: "sediment_export_by_subwatershed.csv",
    build: () => ({
      head: ["sub_watershed", ...names.map((n) => `${n} (t/yr)`)],
      rows: SW.map((sw, i) => [sw, ...SKEYS.map((k) => SDR_SCEN[k][i])]),
    }),
  },
  {
    id: "sdr-base",
    title: "Baseline SDR outputs",
    desc: "BAU gross erosion, export, deposition and avoided export per sub-watershed.",
    file: "sdr_baseline_outputs.csv",
    build: () => ({
      head: [
        "sub_watershed",
        "gross_erosion_USLE_t_per_yr",
        "sediment_export_t_per_yr",
        "sediment_deposited_t_per_yr",
        "avoided_export_t_per_yr",
      ],
      rows: SW.map((sw, i) => [
        sw,
        SDR_BASE.gross[i],
        SDR_BASE.export[i],
        SDR_BASE.deposit[i],
        SDR_BASE.avoided[i],
      ]),
    }),
  },
  {
    id: "swy",
    title: "Seasonal water yield by watershed",
    desc: "InVEST SWY results for eight nested watersheds and four scenarios.",
    file: "seasonal_water_yield_by_watershed.csv",
    build: () => ({
      head: ["watershed", "area_km2", ...names],
      rows: WS.map((w, i) => [
        w,
        WS_AREA[i],
        ...SKEYS.map((k) => SWY_SCEN[k][i]),
      ]),
    }),
  },
  {
    id: "mhp",
    title: "Mini-hydropower estimates",
    desc: "Estimated generation (GWh) at three MHP stations, with CEB actual 2023 generation.",
    file: "hydropower_estimates.csv",
    build: () => ({
      head: [
        "mhp_station",
        "watershed",
        ...names.map((n) => `${n} uncorrected (GWh)`),
        "CEB actual 2023 (GWh)",
        "S2 · SWC corrected (GWh)",
        "S3 · REST corrected (GWh)",
        "S4 · INTEGRATED corrected (GWh)",
      ],
      rows: MHP.map((m) => [m.name, m.ws, ...m.raw, m.ceb, ...m.cor]),
    }),
  },
];

export const datasetCsv = (d: Dataset) => {
  const { head, rows } = d.build();
  return toCsv(head, rows);
};

/* ---------------- zip helpers (jszip is loaded only when needed) ---------------- */
export async function zipCsvs(): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  DATASETS.forEach((d) => zip.file(d.file, "\ufeff" + datasetCsv(d)));
  return zip.generateAsync({ type: "blob" });
}

/** Bundle the files that make up a shapefile (.shp is required, the rest are optional) */
export async function zipShapefile(base: string): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const stem = fileNameOf(base);
  await Promise.all(
    ["shp", "shx", "dbf", "prj", "cpg"].map(async (ext) => {
      try {
        zip.file(`${stem}.${ext}`, await fetchBlob(`${base}.${ext}`));
      } catch (e) {
        if (ext === "shp") throw e;
      }
    }),
  );
  return zip.generateAsync({ type: "blob" });
}
