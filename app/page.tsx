"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import AboutPage from "./components/AboutPage";
import ContactPage from "./components/ContactPage";
import DownloadPage from "./components/DownloadPage";
import ExpandableChart from "./components/ExpandableChart";
import Footer from "./components/Footer";
import Header, { type PageId } from "./components/Header";
import { useFileAvailability } from "./components/useFileAvailability";
import { SDR_FILES, SWY_FILES } from "./mapConfig";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  BaseMapPanel,
  LayerPanel,
  MapLegend,
  useMapState,
  type MapState,
} from "./components/MapControls";
import {
  MHP,
  SCEN,
  SDR_BASE,
  SDR_SCEN,
  SKEYS,
  STATIONS,
  SW,
  SWY_SCEN,
  WS,
  WS_AREA,
  type ScenarioKey,
} from "./data";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* Leaflet needs the browser, so the map is loaded on the client only */
const LeafletDashboardMap = dynamic(
  () => import("./components/LeafletDashboardMap"),
  {
    ssr: false,
    loading: () => <div className="map-loading">Loading map…</div>,
  },
);

const PAGE_IDS: PageId[] = [
  "home",
  "sdr",
  "swy",
  "about",
  "contact",
  "download",
];

/* ---------- small helpers ---------- */
const fmt = (n: number, d = 0) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

function chartOpts(
  expanded: boolean,
  extra: ChartOptions<"bar"> = {},
): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { boxWidth: 12, font: { size: expanded ? 14 : 11 } },
      },
    },
    ...extra,
  };
}
const axisTitle = (text: string, expanded: boolean) => ({
  display: true,
  text,
  font: { size: expanded ? 14 : 11 },
});

function DataTable({
  head,
  rows,
  right = [],
  className = "",
}: {
  head: string[];
  rows: (string | number)[][];
  right?: number[];
  className?: string;
}) {
  return (
    <div className="tbl-wrap">
      <table className={`tbl ${className}`}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h + i} className={right.includes(i) ? "r" : ""}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={right.includes(j) ? "r" : ""}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({
  k,
  title,
  big,
  sub,
}: {
  k: ScenarioKey;
  title: string;
  big: string;
  sub: ReactNode;
}) {
  return (
    <div className="stat" style={{ borderColor: SCEN[k].color }}>
      <div className="nm">{title}</div>
      <div className="big">{big}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}

/* ====================================================================== */
export default function App() {
  const [page, setPage] = useState<PageId>("home");
  const [left, setLeft] = useState<ScenarioKey>("S1");
  const [right, setRight] = useState<ScenarioKey>("S4");

  /* the address bar (#sdr, #about ...) decides the page, so links and the back button work */
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1) as PageId;
      setPage(PAGE_IDS.includes(h) ? h : "home");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const go = (p: PageId) => {
    window.location.hash = p;
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <Header page={page} go={go} />

      <main className="page">
        {page === "home" && <HomePage />}
        {page === "sdr" && (
          <SdrPage
            left={left}
            right={right}
            setLeft={setLeft}
            setRight={setRight}
          />
        )}
        {page === "swy" && (
          <SwyPage
            left={left}
            right={right}
            setLeft={setLeft}
            setRight={setRight}
          />
        )}
        {page === "about" && <AboutPage go={go} />}
        {page === "contact" && <ContactPage />}
        {page === "download" && <DownloadPage />}
      </main>

      <Footer go={go} />
    </>
  );
}

/* Common layout of the three map pages: title strip, left sidebar (basemap, layers, legend), map, and optional content below */
function MapShell({
  eyebrow,
  title,
  description,
  sidebar,
  below,
  fit = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sidebar: ReactNode;
  below?: ReactNode;
  fit?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <div className="mhead">
        <div className="mhead-in">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <button
            className="tgl"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}>
            {open ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            <span>{open ? "Hide layers" : "Layers & legend"}</span>
          </button>
        </div>
      </div>
      <div className={`ws${fit ? " fit" : ""}`}>
        {open && (
          <aside className="side">
            <div className="side-scroll">{sidebar}</div>
          </aside>
        )}
        <div className="mapcol">{children}</div>
      </div>
      {below && <div className="below">{below}</div>}
    </>
  );
}

function StudyExtent({ children }: { children?: ReactNode }) {
  return (
    <div className="extent">
      <span>Study extent</span>
      <b>Hulu Ganga Catchment</b>
      <p>Central Highlands, Sri Lanka</p>
      {children}
    </div>
  );
}

/* Left-sidebar sections shared by the three map pages */
function MapSidebar({
  ms,
  left,
  right,
}: {
  ms: MapState;
  left: ScenarioKey;
  right: ScenarioKey;
}) {
  return (
    <>
      <BaseMapPanel state={ms} />
      <LayerPanel state={ms} />
      <MapLegend state={ms} left={left} right={right} />
    </>
  );
}

/* Scenario pickers for the swipe comparison, shown above the map */
const SCEN_LABEL: Record<ScenarioKey, string> = {
  S1: "BAU — Business as usual",
  S2: "SWC — Soil & water conservation",
  S3: "REST — Restoration & agroforestry",
  S4: "INTEGRATED — Integrated management",
};

function ScenarioBar({
  left,
  right,
  setLeft,
  setRight,
  have,
}: {
  left: ScenarioKey;
  right: ScenarioKey;
  setLeft: (s: ScenarioKey) => void;
  setRight: (s: ScenarioKey) => void;
  /** which scenarios have a map file in public/Hulu Ganga (undefined = still checking) */
  have: Partial<Record<ScenarioKey, boolean>>;
}) {
  const pick = (
    label: string,
    value: ScenarioKey,
    set: (s: ScenarioKey) => void,
  ) => (
    <label className="sb-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => set(e.target.value as ScenarioKey)}
        aria-label={label}>
        {SKEYS.map((k) => (
          <option key={k} value={k}>
            {SCEN_LABEL[k]}
            {have[k] === false ? "  (no map file yet)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="scenbar">
      {pick("Map A scenario", left, setLeft)}
      <span className="sb-vs">Compare</span>
      {pick("Map B scenario", right, setRight)}
    </div>
  );
}

/* ============================ HOME ============================ */
function HomePage() {
  const ms = useMapState("home");
  return (
    <MapShell
      fit
      eyebrow="Catchment overview"
      title="Hulu Ganga Watersheds"
      description="Explore watershed, administrative and land-use layers across the catchment."
      sidebar={
        <>
          <StudyExtent>
            <p>
              Prototype GIS dashboard comparing how land-use scenarios change
              sediment export and seasonal water yield, and what that means for
              three mini-hydropower (MHP) stations. Models: InVEST SDR and SWY
              on a 10 m DEM, 8 watersheds, 4 scenarios.
            </p>
          </StudyExtent>
          <MapSidebar ms={ms} left="S1" right="S1" />
          <section className="sb-sec">
            <h2 className="lg-h">Scenarios</h2>
            <ul className="scen-list">
              {SKEYS.map((k) => (
                <li key={k}>
                  <i className="dot" style={{ background: SCEN[k].color }} />
                  <div>
                    <b>{SCEN[k].name}</b>
                    <br />
                    {SCEN[k].desc}.
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      }>
      <section className="mapwrap">
        <LeafletDashboardMap
          key="home"
          mode="home"
          left="S1"
          right="S1"
          state={ms}
        />
      </section>
    </MapShell>
  );
}

/* ============================ SEDIMENT EXPORT ============================ */
interface PageProps {
  left: ScenarioKey;
  right: ScenarioKey;
  setLeft: (s: ScenarioKey) => void;
  setRight: (s: ScenarioKey) => void;
}

function SdrPage({ left, right, setLeft, setRight }: PageProps) {
  const ms = useMapState("sdr");
  const have = useFileAvailability(SDR_FILES);
  const bau = SDR_SCEN.S1[0];
  const red = (k: ScenarioKey) => ((bau - SDR_SCEN[k][0]) / bau) * 100;

  return (
    <MapShell
      eyebrow="Model scenario comparison"
      title="Sediment Export"
      description="Compare estimated annual sediment export under alternative land-use scenarios."
      sidebar={
        <>
          <StudyExtent />
          <section className="sb-sec">
            <h2 className="lg-h">Scenario stats</h2>
            <div className="stat-pair">
              {(
                [
                  ["Map A", left],
                  ["Map B", right],
                ] as const
              ).map(([side, k]) => (
                <StatCard
                  key={side}
                  k={k}
                  title={`${side} · ${SCEN[k].name}`}
                  big={`${fmt(SDR_SCEN[k][0])} t/yr`}
                  sub={
                    k === "S1" ? (
                      "Catchment outlet sediment export (baseline)"
                    ) : (
                      <>
                        Outlet export ·{" "}
                        <span className="good">
                          {red(k).toFixed(1)}% lower than BAU
                        </span>
                      </>
                    )
                  }
                />
              ))}
            </div>
          </section>
          <MapSidebar ms={ms} left={left} right={right} />
        </>
      }
      below={
        <>
          <div className="charts two">
            <ExpandableChart
              title="Sediment export by sub-watershed and scenario (t/yr)"
              render={(x) => (
                <Bar
                  data={{
                    labels: SW,
                    datasets: SKEYS.map((k) => ({
                      label: SCEN[k].name,
                      data: SDR_SCEN[k],
                      backgroundColor: SCEN[k].color,
                    })),
                  }}
                  options={chartOpts(x, {
                    scales: { y: { title: axisTitle("t/yr", x) } },
                  })}
                />
              )}
            />
            <ExpandableChart
              title="Reduction vs BAU at the catchment outlet (%)"
              render={(x) => (
                <Bar
                  data={{
                    labels: ["S2 SWC", "S3 REST", "S4 INTEGRATED"],
                    datasets: [
                      {
                        data: (["S2", "S3", "S4"] as const).map(
                          (k) => +red(k).toFixed(1),
                        ),
                        backgroundColor: (["S2", "S3", "S4"] as const).map(
                          (k) => SCEN[k].color,
                        ),
                      },
                    ],
                  }}
                  options={chartOpts(x, {
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { max: 100, title: axisTitle("% reduction", x) },
                    },
                  })}
                />
              )}
            />
          </div>

          <div className="card wide">
            <h3>Sediment export by sub-watershed, selected scenarios (t/yr)</h3>
            <DataTable
              head={[
                "Sub-watershed",
                `Map A · ${SCEN[left].name}`,
                `Map B · ${SCEN[right].name}`,
              ]}
              right={[1, 2]}
              rows={SW.map((sw, i) => [
                sw,
                fmt(SDR_SCEN[left][i]),
                fmt(SDR_SCEN[right][i]),
              ])}
            />
            <p className="note">
              Labels SW-1 … SW-8 follow the presentation. SW-1 is the catchment
              outlet.
            </p>
          </div>

          <div className="card wide">
            <h3>Baseline (S1 BAU) SDR outputs by sub-watershed</h3>
            <DataTable
              head={[
                "Sub-watershed",
                "Gross erosion USLE (t/yr)",
                "Sediment export (t/yr)",
                "Sediment deposited (t/yr)",
                "Avoided export (t/yr)",
              ]}
              right={[1, 2, 3, 4]}
              rows={SW.map((sw, i) => [
                sw,
                fmt(SDR_BASE.gross[i]),
                fmt(SDR_BASE.export[i]),
                fmt(SDR_BASE.deposit[i]),
                fmt(SDR_BASE.avoided[i]),
              ])}
            />
          </div>
        </>
      }>
      <ScenarioBar
        left={left}
        right={right}
        setLeft={setLeft}
        setRight={setRight}
        have={have}
      />
      <section className="mapwrap">
        <LeafletDashboardMap
          key="sdr"
          mode="sdr"
          left={left}
          right={right}
          state={ms}
        />
      </section>
    </MapShell>
  );
}

/* ============================ SEASONAL WATER YIELD ============================ */
function SwyPage({ left, right, setLeft, setRight }: PageProps) {
  const ms = useMapState("swy");
  const have = useFileAvailability(SWY_FILES);
  const last = 7; // WS 8 = catchment outlet
  const chg = (k: ScenarioKey) =>
    ((SWY_SCEN[k][last] - SWY_SCEN.S1[last]) / SWY_SCEN.S1[last]) * 100;
  const [station, setStation] = useState("upper");
  const [flow, setFlow] = useState<"qf" | "bf">("qf");
  const [imgFailed, setImgFailed] = useState(false);
  const stationLabel = STATIONS.find((st) => st.id === station)?.label;

  return (
    <MapShell
      eyebrow="Model scenario comparison"
      title="Seasonal Water Yield"
      description="Compare seasonal water-yield response under alternative land-use scenarios."
      sidebar={
        <>
          <StudyExtent />
          <section className="sb-sec">
            <h2 className="lg-h">Scenario stats</h2>
            <div className="stat-pair">
              {(
                [
                  ["Map A", left],
                  ["Map B", right],
                ] as const
              ).map(([side, k]) => (
                <StatCard
                  key={side}
                  k={k}
                  title={`${side} · ${SCEN[k].name}`}
                  big={fmt(SWY_SCEN[k][last], 2)}
                  sub={
                    k === "S1" ? (
                      "Water yield at the catchment outlet (WS 8, baseline)"
                    ) : (
                      <>
                        WS 8 outlet ·{" "}
                        <span className="good">
                          {chg(k) >= 0 ? "+" : ""}
                          {chg(k).toFixed(2)}% vs BAU
                        </span>
                      </>
                    )
                  }
                />
              ))}
            </div>
          </section>
          <MapSidebar ms={ms} left={left} right={right} />
        </>
      }
      below={
        <>
          <div className="charts two">
            <ExpandableChart
              title="Water yield by watershed and scenario"
              render={(x) => (
                <Bar
                  data={{
                    labels: WS,
                    datasets: SKEYS.map((k) => ({
                      label: SCEN[k].name,
                      data: SWY_SCEN[k],
                      backgroundColor: SCEN[k].color,
                    })),
                  }}
                  options={chartOpts(x, {
                    scales: {
                      y: { title: axisTitle("Water yield (deck units)", x) },
                    },
                  })}
                />
              )}
            />
            <ExpandableChart
              title={`Station flow chart · ${stationLabel} · ${flow === "qf" ? "quick flow" : "base flow"}`}
              render={(x) => (
                <div className="station">
                  <div className="row">
                    <select
                      value={station}
                      onChange={(e) => {
                        setStation(e.target.value);
                        setImgFailed(false);
                      }}
                      aria-label="Station">
                      {STATIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={flow}
                      onChange={(e) => {
                        setFlow(e.target.value as "qf" | "bf");
                        setImgFailed(false);
                      }}
                      aria-label="Flow type">
                      <option value="qf">Quick flow</option>
                      <option value="bf">Base flow</option>
                    </select>
                  </div>
                  {imgFailed ? (
                    <p className="note">
                      Image not found: public/stations/{flow}_{station}.png
                    </p>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className={x ? "stimg big" : "stimg"}
                      src={`/stations/${flow}_${station}.png`}
                      alt={`${flow === "qf" ? "Quick flow" : "Base flow"} chart, ${stationLabel}`}
                      onError={() => setImgFailed(true)}
                    />
                  )}
                  <p className="note">
                    Wet and dry season, by scenario (slides 17–22).
                  </p>
                </div>
              )}
            />
          </div>

          <div className="card wide">
            <h3>Water yield by watershed, selected scenarios</h3>
            <DataTable
              head={[
                "Watershed",
                "Area (km²)",
                `Map A · ${SCEN[left].name}`,
                `Map B · ${SCEN[right].name}`,
              ]}
              right={[1, 2, 3]}
              rows={WS.map((w, i) => [
                w,
                WS_AREA[i].toFixed(2),
                SWY_SCEN[left][i].toFixed(2),
                SWY_SCEN[right][i].toFixed(2),
              ])}
            />
            <p className="note">
              Values as given in the presentation (slides 15–16). Watersheds are
              nested; WS 8 is the catchment outlet.
            </p>
          </div>

          <div className="card wide">
            <h3>Hydropower estimates by MHP station (GWh, uncorrected)</h3>
            <DataTable
              head={[
                "MHP station",
                "Watershed",
                "BAU",
                "S2 SWC",
                "S3 REST",
                "S4 INTEGRATED",
                "CEB actual 2023",
              ]}
              right={[2, 3, 4, 5, 6]}
              rows={MHP.map((m) => [
                m.name,
                m.ws,
                ...m.raw.map((v) => v.toFixed(3)),
                m.ceb.toFixed(3),
              ])}
            />
            <p className="note">
              Uncorrected model output overshoots CEB actual 2023 generation, so
              treat these as relative comparisons between scenarios.
            </p>
          </div>
        </>
      }>
      <ScenarioBar
        left={left}
        right={right}
        setLeft={setLeft}
        setRight={setRight}
        have={have}
      />
      <section className="mapwrap">
        <LeafletDashboardMap
          key="swy"
          mode="swy"
          left={left}
          right={right}
          state={ms}
        />
      </section>
    </MapShell>
  );
}
