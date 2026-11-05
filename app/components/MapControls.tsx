"use client";

import { useCallback, useState } from "react";
import { Layers3, Map as MapIcon } from "lucide-react";
import { SCEN, type ScenarioKey } from "../data";
import {
  LULC_BY_CODE,
  LULC_LEGEND_CODES,
  RAMP_CSS,
  SDR_BINS,
} from "../mapConfig";

export type MapMode = "home" | "sdr" | "swy";
export type OverlayId = "ws" | "main" | "lulc" | "gn" | "weirs";
export type BaseId = "google" | "osm";
export type Side = "left" | "right";

export const BASES: {
  id: BaseId;
  label: string;
  desc: string;
  swatch: string;
}[] = [
  {
    id: "google",
    label: "Google Satellite Hybrid",
    desc: "Satellite imagery with labels",
    swatch:
      "linear-gradient(135deg, #284737 0%, #536847 35%, #334a52 36%, #22343a 48%, #6c725a 49%, #394d37 100%)",
  },
  {
    id: "osm",
    label: "OpenStreetMap",
    desc: "Detailed streets and places",
    swatch:
      "linear-gradient(135deg, #dce8c9 0%, #f2ead7 42%, #b7d9e8 43%, #b7d9e8 55%, #e7dfc9 56%, #d6e3c4 100%)",
  },
];

export interface OverlayDef {
  id: OverlayId;
  label: string;
  sub: string;
  color: string;
}

const WS: OverlayDef = {
  id: "ws",
  label: "Catchment outline",
  sub: "Outer boundary of the study area",
  color: "#ffffff",
};
const GN: OverlayDef = {
  id: "gn",
  label: "GN boundaries",
  sub: "Grama Niladhari divisions",
  color: "#f2a900",
};
const WEIRS: OverlayDef = {
  id: "weirs",
  label: "Hydro weirs",
  sub: "Mini-hydropower intake points",
  color: "#e53935",
};

export const OVERLAYS: Record<MapMode, OverlayDef[]> = {
  home: [
    WS,
    GN,
    {
      id: "lulc",
      label: "Land use / land cover",
      sub: "LULC · BAU classified layer",
      color: "#22c55e",
    },
    WEIRS,
  ],
  sdr: [
    {
      id: "main",
      label: "Sediment export",
      sub: "InVEST SDR model output",
      color: "#ec7014",
    },
    {
      id: "lulc",
      label: "LULC reference",
      sub: "Classified land-use layer",
      color: "#22c55e",
    },
    GN,
    WEIRS,
  ],
  swy: [
    {
      id: "main",
      label: "Seasonal water yield",
      sub: "InVEST SWY model output",
      color: "#3182bd",
    },
    {
      id: "lulc",
      label: "LULC reference",
      sub: "Classified land-use layer",
      color: "#22c55e",
    },
    GN,
    WEIRS,
  ],
};

const DEFAULT_ON: Record<MapMode, Partial<Record<OverlayId, boolean>>> = {
  home: { ws: true, gn: true, weirs: true },
  sdr: { main: true, weirs: true },
  swy: { main: true, weirs: true },
};

/** Layer state shared by the side panel (controls + legend) and the map */
export interface MapState {
  mode: MapMode;
  base: BaseId;
  setBase: (b: BaseId) => void;
  on: Partial<Record<OverlayId, boolean>>;
  /** order in which raster layers were switched on (last = drawn on top) */
  order: OverlayId[];
  toggle: (id: OverlayId, value: boolean) => void;
  opacity: number;
  setOpacity: (v: number) => void;
  missing: Partial<Record<OverlayId, boolean>>;
  markMissing: (id: OverlayId) => void;
  swyRange: [number, number] | null;
  setSwyRange: (r: [number, number]) => void;
  legendSide: Side;
  setLegendSide: (s: Side) => void;
}

export function useMapState(mode: MapMode): MapState {
  const [base, setBase] = useState<BaseId>("google");
  const [on, setOn] = useState<Partial<Record<OverlayId, boolean>>>(
    DEFAULT_ON[mode],
  );
  const [order, setOrder] = useState<OverlayId[]>(["lulc", "main"]);
  const [opacity, setOpacity] = useState(mode === "home" ? 0.8 : 0.9);
  const [missing, setMissing] = useState<Partial<Record<OverlayId, boolean>>>(
    {},
  );
  const [swyRange, setSwyRange] = useState<[number, number] | null>(null);
  const [legendSide, setLegendSide] = useState<Side>("left");

  const toggle = useCallback((id: OverlayId, value: boolean) => {
    setOn((o) => ({ ...o, [id]: value }));
    if (id === "main" || id === "lulc") {
      setOrder((ord) => (value ? [...ord.filter((x) => x !== id), id] : ord));
    }
  }, []);
  const markMissing = useCallback((id: OverlayId) => {
    setMissing((m) => ({ ...m, [id]: true }));
    setOn((o) => ({ ...o, [id]: false }));
  }, []);

  return {
    mode,
    base,
    setBase,
    on,
    order,
    toggle,
    opacity,
    setOpacity,
    missing,
    markMissing,
    swyRange,
    setSwyRange,
    legendSide,
    setLegendSide,
  };
}

/* ====================================================================== *
 * Sidebar sections (left panel): base map, layers, legend
 * ====================================================================== */
function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof Layers3;
  children: string;
}) {
  return (
    <div className="sb-title">
      <Icon size={17} />
      <h2>{children}</h2>
    </div>
  );
}

export function BaseMapPanel({ state }: { state: MapState }) {
  const { mode, base, setBase } = state;
  return (
    <section className="sb-sec">
      <SectionTitle icon={MapIcon}>Basemap</SectionTitle>
      <div className="cards">
        {BASES.map((b) => (
          <label key={b.id} className={`opt${base === b.id ? " sel" : ""}`}>
            <input
              type="radio"
              name={`base-${mode}`}
              checked={base === b.id}
              onChange={() => setBase(b.id)}
            />
            <span className="swatch" style={{ background: b.swatch }} />
            <span className="opt-t">
              <b>{b.label}</b>
              <small>{b.desc}</small>
            </span>
            <span className={`radio${base === b.id ? " on" : ""}`} />
          </label>
        ))}
      </div>
    </section>
  );
}

export function LayerPanel({ state }: { state: MapState }) {
  const { mode, on, toggle, opacity, setOpacity, missing } = state;
  return (
    <section className="sb-sec">
      <SectionTitle icon={Layers3}>Map layers</SectionTitle>
      <div className="cards">
        {OVERLAYS[mode].map((o) => (
          <label key={o.id} className={`opt chk${missing[o.id] ? " dis" : ""}`}>
            <input
              type="checkbox"
              checked={!!on[o.id]}
              disabled={!!missing[o.id]}
              onChange={(e) => toggle(o.id, e.target.checked)}
            />
            <span className="chip" style={{ background: o.color }} />
            <span className="opt-t">
              <b>{o.label}</b>
              <small>
                {missing[o.id] ? "File not found in public/Hulu Ganga" : o.sub}
              </small>
            </span>
          </label>
        ))}
      </div>
      <label className="opacity">
        <span>Layer opacity</span>
        <input
          type="range"
          min={20}
          max={100}
          value={Math.round(opacity * 100)}
          onChange={(e) => setOpacity(Number(e.target.value) / 100)}
        />
        <em>{Math.round(opacity * 100)}%</em>
      </label>
    </section>
  );
}

/* One legend. On the comparison pages a switch picks whether it describes the Map A or the Map B scenario. */
export function MapLegend({
  state,
  left,
  right,
}: {
  state: MapState;
  left: ScenarioKey;
  right: ScenarioKey;
}) {
  const { mode, on, order, swyRange, legendSide, setLegendSide } = state;
  const compare = mode !== "home";
  const sc: ScenarioKey =
    mode === "home" ? "S1" : legendSide === "left" ? left : right;

  const rasters = order
    .filter(
      (id) =>
        on[id] &&
        (id === "main" || id === "lulc") &&
        (mode !== "home" || id === "lulc"),
    )
    .reverse(); // top layer first
  const hasVec = on.gn || on.weirs || on.ws;

  return (
    <section className="sb-sec legend-sec">
      <h2 className="lg-h">Legend</h2>
      {compare && (
        <div className="seg" role="group" aria-label="Legend side">
          <button
            className={legendSide === "left" ? "on" : ""}
            onClick={() => setLegendSide("left")}>
            Map A · {SCEN[left].short}
          </button>
          <button
            className={legendSide === "right" ? "on" : ""}
            onClick={() => setLegendSide("right")}>
            Map B · {SCEN[right].short}
          </button>
        </div>
      )}

      {rasters.map((id) => (
        <div key={id} className="lg-block">
          {id === "lulc" && (
            <>
              <div className="lg-t">LULC · {SCEN[sc].name}</div>
              {LULC_LEGEND_CODES[sc].map((code) => {
                const c = LULC_BY_CODE.get(code)!;
                return (
                  <div key={code} className="lg-row">
                    <i style={{ background: c.color }} />
                    {c.name}
                  </div>
                );
              })}
            </>
          )}
          {id === "main" && mode === "sdr" && (
            <>
              <div className="lg-t">
                Sediment export (t/ha) · {SCEN[sc].name}
              </div>
              {SDR_BINS.map((b) => (
                <div key={b.label} className="lg-row">
                  <i style={{ background: b.color }} />
                  {b.label}
                </div>
              ))}
            </>
          )}
          {id === "main" && mode === "swy" && (
            <>
              <div className="lg-t">Seasonal water yield · {SCEN[sc].name}</div>
              <div className="lg-ramp" style={{ background: RAMP_CSS }} />
              <div className="lg-minmax">
                <span>{swyRange ? swyRange[0].toFixed(1) : "low"}</span>
                <span>{swyRange ? swyRange[1].toFixed(1) : "high"}</span>
              </div>
            </>
          )}
        </div>
      ))}

      {hasVec && (
        <div className="lg-block">
          <div className="lg-t">Features</div>
          {on.ws && (
            <div className="lg-row">
              <u style={{ borderColor: "#fff", background: "#4b5a52" }} />
              Catchment outline
            </div>
          )}
          {on.gn && (
            <div className="lg-row">
              <u style={{ borderColor: "#f2a900" }} />
              GN boundary
            </div>
          )}
          {on.weirs && (
            <div className="lg-row">
              <i className="dot" style={{ background: "#e53935" }} />
              Hydro weir
            </div>
          )}
        </div>
      )}
      {!rasters.length && !hasVec && (
        <div className="note">No layer is switched on.</div>
      )}
    </section>
  );
}
