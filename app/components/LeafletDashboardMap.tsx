"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { SCEN, SKEYS, type ScenarioKey } from "../data";
import {
  LULC_FILES,
  MAP_CENTER,
  MAP_ZOOM,
  PROJ_DEFS,
  RASTER_AVAILABILITY,
  SDR_FILES,
  SWY_FILES,
  VECTORS,
  rasterColorFn,
  type VectorId,
} from "../mapConfig";
import type { MapMode, MapState, OverlayId } from "./MapControls";

export type { MapMode };

interface Props {
  mode: MapMode;
  left: ScenarioKey;
  right: ScenarioKey;
  onLeftChange: (s: ScenarioKey) => void;
  onRightChange: (s: ScenarioKey) => void;
  /** layer state, owned by the page and edited in the left panel */
  state: MapState;
}

/* ---------------- data loading (cached, shared by both maps) ---------------- */
const vectorCache = new Map<string, Promise<any>>();
function loadVector(base: string) {
  if (!vectorCache.has(base)) {
    const p = import("shpjs")
      // shpjs needs an absolute URL (it builds "<url>.shp", "<url>.dbf" and "<url>.prj" from it)
      .then((m) => m.default(new URL(base, window.location.href).href))
      .then((gj) => (Array.isArray(gj) ? gj[0] : gj));
    p.catch(() => vectorCache.delete(base));
    vectorCache.set(base, p);
  }
  return vectorCache.get(base)!;
}

const rasterCache = new Map<string, Promise<any>>();
function loadRaster(url: string) {
  if (!rasterCache.has(url)) {
    const p = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const parseGeoraster = (await import("georaster")).default;
      return parseGeoraster(buf);
    })();
    p.catch(() => rasterCache.delete(url));
    rasterCache.set(url, p);
  }
  return rasterCache.get(url)!;
}

const fileName = (url: string) =>
  decodeURIComponent(url.split("/").pop() || url);

function rasterUrl(
  id: OverlayId,
  mode: MapMode,
  sc: ScenarioKey,
): string | null {
  if (id === "lulc")
    return RASTER_AVAILABILITY.lulc[sc] ? LULC_FILES[sc] : null;
  if (id === "main") {
    if (mode === "sdr")
      return RASTER_AVAILABILITY.sdr[sc] ? SDR_FILES[sc] : null;
    if (mode === "swy")
      return RASTER_AVAILABILITY.swy[sc] ? SWY_FILES[sc] : null;
  }
  return null;
}

/* ---------------- vector layer helpers ---------------- */
const NAME_KEYS = [
  "GN_NAME",
  "GND_N",
  "GN_Name",
  "GND_NAME",
  "Name",
  "NAME",
  "name",
  "GN",
  "ws_name",
  "id",
];
const tipText = (props: any) => {
  if (!props) return "";
  for (const k of NAME_KEYS)
    if (props[k] !== undefined && props[k] !== null && props[k] !== "")
      return String(props[k]);
  return "";
};
const esc = (s: unknown) =>
  String(s).replace(
    /[&<>"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );

function buildVector(L: any, id: VectorId, gj: any, map: any) {
  if (!map.getPane("vec")) map.createPane("vec").style.zIndex = "450";
  const style =
    id === "gn"
      ? { color: "#f2a900", weight: 2, fill: false }
      : id === "ws"
        ? { color: "#ffffff", weight: 2.5, fill: false }
        : {};
  return L.geoJSON(gj, {
    pane: "vec",
    style,
    pointToLayer: (_f: any, latlng: any) =>
      L.circleMarker(latlng, {
        pane: "vec",
        radius: 6,
        color: "#ffffff",
        weight: 1.5,
        fillColor: "#e53935",
        fillOpacity: 1,
      }),
    onEachFeature: (f: any, layer: any) => {
      const props = f.properties || {};
      if (id === "weirs") {
        const rows = Object.entries(props)
          .map(
            ([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`,
          )
          .join("");
        layer.bindPopup(`<table class="popup-tbl">${rows}</table>`);
      } else {
        const t = tipText(props);
        if (t) layer.bindTooltip(t, { sticky: true });
      }
    },
  });
}

function useVector(
  id: VectorId,
  enabled: boolean,
  ready: boolean,
  h: React.MutableRefObject<any>,
  onFail: (id: VectorId) => void,
) {
  const store = useRef(new Map<any, any>());
  useEffect(() => {
    if (!ready) return;
    const { L, A, B } = h.current;
    const maps = [A, B].filter(Boolean);
    if (!enabled) {
      store.current.forEach((lyr, m) => m.removeLayer(lyr));
      store.current.clear();
      return;
    }
    let cancelled = false;
    loadVector(VECTORS[id].base)
      .then((gj) => {
        if (cancelled) return;
        maps.forEach((m) => {
          if (store.current.has(m)) return;
          const lyr = buildVector(L, id, gj, m);
          lyr.addTo(m);
          store.current.set(m, lyr);
        });
      })
      .catch(() => {
        if (!cancelled) onFail(id);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, enabled, id]);
}

function NorthArrow({ className }: { className: string }) {
  return (
    <div
      className={`north ${className}`}
      title="North"
      aria-label="North arrow">
      <svg viewBox="0 0 40 52" width="34" height="44" aria-hidden="true">
        <polygon
          points="20,2 32,42 20,34 8,42"
          fill="#1d2b26"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon
          points="20,2 32,42 20,34"
          fill="#ffffff"
          stroke="#1d2b26"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <text
          x="20"
          y="51"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#1d2b26"
          stroke="#fff"
          strokeWidth="2.5"
          paintOrder="stroke">
          N
        </text>
      </svg>
    </div>
  );
}

/* ====================================================================== */
export default function LeafletDashboardMap({
  mode,
  left,
  right,
  onLeftChange,
  onRightChange,
  state,
}: Props) {
  const compare = mode !== "home";
  const { base, on, order, opacity, markMissing, setSwyRange } = state;

  const refA = useRef<HTMLDivElement>(null);
  const refB = useRef<HTMLDivElement>(null);
  const h = useRef<any>({}); // { L, A, B }
  const tiles = useRef(new Map<any, any>());
  const rasterLayers = useRef<any[]>([]);

  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState(50);
  const [notices, setNotices] = useState<string[]>([]);
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;

  const notify = useCallback(
    (m: string) => setNotices((n) => (n.includes(m) ? n : [...n, m])),
    [],
  );

  /* ---- 1. create the map(s) once ---- */
  useEffect(() => {
    let cancelled = false;
    const created: any[] = [];
    (async () => {
      const L = (await import("leaflet")).default;
      const proj4 = (await import("proj4")).default;
      PROJ_DEFS.forEach(([code, def]) => proj4.defs(code, def));
      (window as any).proj4 = proj4;
      if (cancelled || !refA.current) return;

      const opts = {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        minZoom: 8,
        maxZoom: 19,
        zoomAnimation: false,
        fadeAnimation: false,
        zoomControl: false,
      };
      const A = L.map(refA.current, { ...opts, attributionControl: !compare });
      created.push(A);
      L.control.zoom({ position: compare ? "bottomleft" : "topleft" }).addTo(A);
      let B: any;
      if (compare && refB.current) {
        B = L.map(refB.current, opts);
        created.push(B);
        L.control.scale({ position: "bottomright", imperial: false }).addTo(B);
        // keep both maps on the same view
        let lock = false;
        const sync = (src: any, dst: any) =>
          src.on("move zoom", () => {
            if (lock) return;
            lock = true;
            dst.setView(src.getCenter(), src.getZoom(), { animate: false });
            lock = false;
          });
        sync(A, B);
        sync(B, A);
      } else {
        L.control.scale({ position: "bottomright", imperial: false }).addTo(A);
      }
      h.current = { L, A, B };
      setReady(true);
    })();
    return () => {
      cancelled = true;
      created.forEach((m) => m.remove());
      tiles.current.clear();
      rasterLayers.current = [];
      h.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- 2. base map ---- */
  useEffect(() => {
    if (!ready) return;
    const { L, A, B } = h.current;
    [A, B].filter(Boolean).forEach((m: any) => {
      tiles.current.get(m)?.remove();
      const t =
        base === "osm"
          ? L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
              maxZoom: 19,
              attribution: "© OpenStreetMap contributors",
            })
          : L.tileLayer(
              "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
              {
                subdomains: "0123",
                maxZoom: 20,
                attribution: "Map data © Google",
              },
            );
      t.addTo(m);
      t.bringToBack();
      tiles.current.set(m, t);
    });
  }, [ready, base]);

  /* ---- 3. vector overlays ---- */
  const failVector = useCallback(
    (id: VectorId) => {
      markMissing(id as OverlayId);
      notify(
        `Could not load "${VECTORS[id].label}" (public/Hulu Ganga/${fileName(VECTORS[id].base)}.shp not found or unreadable).`,
      );
    },
    [markMissing, notify],
  );
  useVector("gn", !!on.gn, ready, h, failVector);
  useVector("weirs", !!on.weirs, ready, h, failVector);
  useVector("ws", !!on.ws, ready, h, failVector);

  /* ---- 4. raster overlays (GeoTIFF) ---- */
  useEffect(() => {
    if (!ready) return;
    const { A, B } = h.current;
    let cancelled = false;
    const sides: [any, ScenarioKey][] = compare
      ? [
          [A, left],
          [B, right],
        ]
      : [[A, "S1"]];
    const ids = order.filter(
      (id) =>
        on[id] &&
        (id === "main" || id === "lulc") &&
        (mode !== "home" || id === "lulc"),
    );

    ids.forEach((id, i) => {
      sides.forEach(async ([map, sc]) => {
        const url = rasterUrl(id, mode, sc);
        if (!map) return;
        if (!url) {
          const layerName =
            id === "lulc"
              ? "land-use"
              : mode === "sdr"
                ? "sediment-export"
                : "seasonal-water-yield";
          notify(
            `Missing spatial file: ${SCEN[sc].name} ${layerName} GeoTIFF is not included in public/Hulu Ganga. Add the raster file to enable this map overlay.`,
          );
          return;
        }
        try {
          const gr = await loadRaster(url);
          if (cancelled) return;
          const GeoRasterLayer = (await import("georaster-layer-for-leaflet"))
            .default;
          if (cancelled) return;
          const kind = id === "lulc" ? "lulc" : mode === "sdr" ? "sdr" : "swy";
          const layer = new GeoRasterLayer({
            georaster: gr,
            opacity: opacityRef.current,
            pixelValuesToColorFn: rasterColorFn(kind, gr),
            resolution: 256,
            zIndex: 10 + i,
          });
          // The library keeps one tile cache shared by every layer; give each layer its own,
          // otherwise tiles of one raster (e.g. LULC) are re-used for another (e.g. sediment).
          layer.cache = {};
          layer.addTo(map);
          rasterLayers.current.push(layer);
          if (kind === "swy") setSwyRange([gr.mins[0], gr.maxs[0]]);
        } catch (e: any) {
          if (cancelled) return;
          const msg = String(e?.message || e);
          notify(
            msg.startsWith("HTTP")
              ? `File not found: public/Hulu Ganga/${fileName(url)}`
              : `Could not draw ${fileName(url)}: ${msg}`,
          );
        }
      });
    });
    return () => {
      cancelled = true;
      rasterLayers.current.forEach((l) => l.remove());
      rasterLayers.current = [];
    };
  }, [
    ready,
    mode,
    compare,
    left,
    right,
    order,
    on.main,
    on.lulc,
    notify,
    setSwyRange,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    rasterLayers.current.forEach((l) => l.setOpacity(opacity));
  }, [opacity]);

  /* ---- slider ---- */
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const movePos = (clientX: number) => {
    const r = wrapRef.current!.getBoundingClientRect();
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };
  const setDrag = (v: boolean) => {
    dragging.current = v;
    const { A, B } = h.current;
    [A, B]
      .filter(Boolean)
      .forEach((m: any) => (v ? m.dragging.disable() : m.dragging.enable()));
  };

  return (
    <div ref={wrapRef} className={`mapbox ${compare ? "cmp" : ""}`}>
      <div ref={refA} className="map-a" />
      {compare && (
        <div
          ref={refB}
          className="map-b"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        />
      )}

      {compare && (
        <div
          className="handle"
          style={{ left: `${pos}%` }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDrag(true);
          }}
          onPointerMove={(e) => dragging.current && movePos(e.clientX)}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}
          role="slider"
          aria-label="Comparison divider"
          aria-valuenow={Math.round(pos)}>
          <span />
        </div>
      )}

      {compare && (
        <>
          <div className="sel l">
            <select
              value={left}
              onChange={(e) => onLeftChange(e.target.value as ScenarioKey)}
              aria-label="Left scenario">
              {SKEYS.map((k) => (
                <option key={k} value={k}>
                  {SCEN[k].name}
                </option>
              ))}
            </select>
          </div>
          <div className="sel r">
            <select
              value={right}
              onChange={(e) => onRightChange(e.target.value as ScenarioKey)}
              aria-label="Right scenario">
              {SKEYS.map((k) => (
                <option key={k} value={k}>
                  {SCEN[k].name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <NorthArrow className={compare ? "cmp" : "home"} />

      {notices.length > 0 && (
        <div className="notice" role="status">
          {notices.map((n) => (
            <div key={n}>{n}</div>
          ))}
          <button onClick={() => setNotices([])}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
