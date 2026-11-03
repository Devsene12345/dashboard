"use client";

import { useCallback, useState } from "react";
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

export const BASES: { id: BaseId; label: string }[] = [
  { id: "google", label: "Google Satellite Hybrid" },
  { id: "osm", label: "OpenStreetMap" },
];

export const OVERLAYS: Record<MapMode, { id: OverlayId; label: string }[]> = {
  home: [
    { id: "lulc", label: "LULC (BAU)" },
    { id: "gn", label: "GN boundary" },
    { id: "weirs", label: "Hydro weirs" },
  ],
  sdr: [
    { id: "main", label: "Sediment export" },
    { id: "lulc", label: "LULC" },
    { id: "gn", label: "GN boundary" },
    { id: "weirs", label: "Hydro weirs" },
  ],
  swy: [
    { id: "main", label: "Seasonal water yield" },
    { id: "lulc", label: "LULC" },
    { id: "gn", label: "GN boundary" },
    { id: "weirs", label: "Hydro weirs" },
  ],
};

const DEFAULT_ON: Record<MapMode, Partial<Record<OverlayId, boolean>>> = {
  home: { gn: true, weirs: true },
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
 * Layers section (left panel)
 * ====================================================================== */
export function LayerPanel({ state }: { state: MapState }) {
  const { mode, base, setBase, on, toggle, opacity, setOpacity, missing } =
    state;
  return (
    <details className="sec" open>
      <summary>Layers</summary>
      <div className="lp">
        <div className="lp-g">Base map</div>
        {BASES.map((b) => (
          <label key={b.id}>
            <input
              type="radio"
              name={`base-${mode}`}
              checked={base === b.id}
              onChange={() => setBase(b.id)}
            />
            {b.label}
          </label>
        ))}
        <div className="lp-g">Overlays</div>
        {OVERLAYS[mode].map((o) => (
          <label key={o.id} className={missing[o.id] ? "dis" : ""}>
            <input
              type="checkbox"
              checked={!!on[o.id]}
              disabled={!!missing[o.id]}
              onChange={(e) => toggle(o.id, e.target.checked)}
            />
            <span>
              {o.label}
              {missing[o.id] && <small> (file missing)</small>}
            </span>
          </label>
        ))}
        <label className="lp-o">
          Opacity
          <input
            type="range"
            min={20}
            max={100}
            value={Math.round(opacity * 100)}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          />
        </label>
      </div>
    </details>
  );
}

/* ====================================================================== *
 * Legend section (left panel). One legend; on the comparison pages a switch
 * picks whether it describes the left or the right scenario.
 * ====================================================================== */
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
    <details className="sec" open>
      <summary>Legend</summary>
      <div className="legend">
        {compare && (
          <div className="seg" role="group" aria-label="Legend side">
            <button
              className={legendSide === "left" ? "on" : ""}
              onClick={() => setLegendSide("left")}>
              Left · {SCEN[left].short}
            </button>
            <button
              className={legendSide === "right" ? "on" : ""}
              onClick={() => setLegendSide("right")}>
              Right · {SCEN[right].short}
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
                <div className="lg-t">
                  Seasonal water yield · {SCEN[sc].name}
                </div>
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
                Watersheds
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
      </div>
    </details>
  );
}
