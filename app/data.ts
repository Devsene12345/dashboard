// All numbers below come from Hulu_ganga-Results_final_v3.pptx

export type ScenarioKey = "S1" | "S2" | "S3" | "S4";
export const SKEYS: ScenarioKey[] = ["S1", "S2", "S3", "S4"];

export const SCEN: Record<
  ScenarioKey,
  { short: string; name: string; color: string; desc: string }
> = {
  S1: {
    short: "BAU",
    name: "S1 · BAU",
    color: "#7c8794",
    desc: "Baseline condition (business as usual)",
  },
  S2: {
    short: "SWC",
    name: "S2 · SWC",
    color: "#e69f00",
    desc: "Structural and biological soil & water conservation",
  },
  S3: {
    short: "REST",
    name: "S3 · REST",
    color: "#2e9e5b",
    desc: "Restoration and agroforestry",
  },
  S4: {
    short: "INTEGRATED",
    name: "S4 · INTEGRATED",
    color: "#2563eb",
    desc: "SWC + restoration + agroforestry",
  },
};

/* ---- Sediment Delivery Ratio (slide 11) ---- */
export const SW = [
  "SW-1",
  "SW-2",
  "SW-3",
  "SW-4",
  "SW-5",
  "SW-6",
  "SW-7",
  "SW-8",
];

export const SDR_BASE = {
  gross: [181308, 106849, 58047, 39758, 29318, 26266, 22696, 5081],
  export: [19840, 11992, 6326, 4571, 3067, 3085, 2329, 445],
  deposit: [161257, 94767, 51628, 35123, 26187, 23196, 20276, 4650],
  avoided: [443085, 244355, 128980, 95559, 64930, 65801, 51639, 25938],
};

export const SDR_SCEN: Record<ScenarioKey, number[]> = {
  S1: [19840, 11992, 6326, 4571, 3067, 3085, 2329, 445],
  S2: [18517, 11657, 6161, 4440, 3011, 3003, 2285, 389],
  S3: [8005, 4146, 2189, 1601, 1098, 1070, 867, 310],
  S4: [6826, 2822, 1428, 1118, 657, 742, 507, 219],
};

/* ---- Seasonal Water Yield (slides 15-16). The deck does not state units. ---- */
export const WS = [
  "WS 1",
  "WS 2",
  "WS 3",
  "WS 4",
  "WS 5",
  "WS 6",
  "WS 7",
  "WS 8",
];
export const WS_AREA = [
  18.04, 20.45, 34.83, 20.16, 26.16, 64.21, 11.02, 118.43,
];

export const SWY_SCEN: Record<ScenarioKey, number[]> = {
  S1: [30.24, 34.36, 59.2, 42.22, 54.9, 120.25, 18.75, 206.34],
  S2: [30.25, 34.39, 59.42, 42.26, 55.02, 120.38, 18.75, 208.32],
  S3: [30.47, 34.53, 59.2, 42.29, 55.07, 120.3, 19.16, 207.28],
  S4: [31.03, 35.14, 60.21, 43.68, 56.41, 122.75, 19.44, 210.59],
};

/* ---- Hydropower (slides 23-24), GWh ---- */
export const MHP = [
  {
    name: "Giddawa MHP",
    ws: "WS 8",
    raw: [12.739, 12.88, 12.884, 13.101],
    ceb: 5.466,
    cor: [5.526, 5.528, 5.621],
    chg: 2.84,
  },
  {
    name: "Moragaha Oya MHP",
    ws: "WS 5",
    raw: [9.85, 9.878, 9.992, 10.242],
    ceb: 5.217,
    cor: [5.232, 5.292, 5.424],
    chg: 3.98,
  },
  {
    name: "Upper Hulu Ganga MHP",
    ws: "WS 3",
    raw: [8.749, 8.78, 8.748, 8.898],
    ceb: 5.288,
    cor: [5.307, 5.288, 5.378],
    chg: 1.71,
  },
];

/* Station flow charts: copy the images into public/stations/ (qf_upper.png, bf_upper.png, ...) */
export const STATIONS = [
  { id: "upper", label: "Upper Hulu Ganga" },
  { id: "morag", label: "Moragaha Oya" },
  { id: "gidd", label: "Giddawa" },
];
