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
import { LayerPanel, MapLegend, useMapState } from "./components/MapControls";
import { SPATIAL_DATA_STATUS } from "./mapConfig";
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

function SpatialCoverageNotice({ mode }: { mode: "sdr" | "swy" }) {
  const title =
    mode === "sdr"
      ? "Sediment Export map data"
      : "Seasonal Water Yield map data";
  return (
    <div className="spatial-notice" role="note">
      <span className="spatial-notice-icon" aria-hidden="true">
        i
      </span>
      <div>
        <strong>{title} · spatial file coverage</strong>
        <p>
          Included: {SPATIAL_DATA_STATUS.vectors.join(" and ")}, plus the BAU
          land-use and sediment-export GeoTIFFs. {SPATIAL_DATA_STATUS.missing}{" "}
          Scenario charts use the supplied model summary values; a map overlay
          is drawn only when its actual spatial file is available.
        </p>
      </div>
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
            go={go}
          />
        )}
        {page === "swy" && (
          <SwyPage
            left={left}
            right={right}
            setLeft={setLeft}
            setRight={setRight}
            go={go}
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

/* Title strip shown above the two comparison pages */
function PageHead({
  eyebrow,
  title,
  sub,
  go,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  go: (p: PageId) => void;
}) {
  return (
    <div className="pagehead">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      <button className="btn" onClick={() => go("download")}>
        Download data
      </button>
    </div>
  );
}

/* ============================ HOME ============================ */
function HomePage() {
  const ms = useMapState("home");
  return (
    <div className="grid fit">
      <aside className="panel">
        <details className="sec" open>
          <summary>Project description</summary>
          <p>
            A prototype GIS dashboard that assesses how land-use scenarios
            change <b>sediment export</b> and <b>seasonal water yield</b> in the
            Hulu Ganga catchment, and what that means for three{" "}
            <b>mini-hydropower (MHP)</b> stations.
          </p>
          <p>
            Models: <b>InVEST Sediment Delivery Ratio (SDR)</b> and{" "}
            <b>Seasonal Water Yield (SWY)</b>, run on a 10 m DEM for 8
            watersheds and 4 land-use scenarios.
          </p>
        </details>

        <LayerPanel state={ms} />
        <MapLegend state={ms} left="S1" right="S1" />

        <details className="sec">
          <summary>Scenarios</summary>
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
        </details>
      </aside>

      <section className="mapwrap">
        <LeafletDashboardMap
          key="home"
          mode="home"
          left="S1"
          right="S1"
          onLeftChange={() => {}}
          onRightChange={() => {}}
          state={ms}
        />
      </section>
    </div>
  );
}

/* ============================ SEDIMENT EXPORT ============================ */
interface PageProps {
  left: ScenarioKey;
  right: ScenarioKey;
  setLeft: (s: ScenarioKey) => void;
  setRight: (s: ScenarioKey) => void;
  go: (p: PageId) => void;
}

function SdrPage({ left, right, setLeft, setRight, go }: PageProps) {
  const ms = useMapState("sdr");
  const bau = SDR_SCEN.S1[0];
  const red = (k: ScenarioKey) => ((bau - SDR_SCEN[k][0]) / bau) * 100;

  return (
    <>
      <PageHead
        eyebrow="Maps"
        title="Sediment Export"
        sub="InVEST Sediment Delivery Ratio results. Drag the divider to compare two land-use scenarios."
        go={go}
      />
      <SpatialCoverageNotice mode="sdr" />
      <div className="grid">
        <aside className="panel">
          <details className="sec" open>
            <summary>Scenario stats</summary>
            <div className="stat-pair">
              {(
                [
                  ["Left", left],
                  ["Right", right],
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
          </details>

          <LayerPanel state={ms} />
          <MapLegend state={ms} left={left} right={right} />
        </aside>
        <section className="mapwrap">
          <LeafletDashboardMap
            key="sdr"
            mode="sdr"
            left={left}
            right={right}
            onLeftChange={setLeft}
            onRightChange={setRight}
            state={ms}
          />
        </section>
      </div>

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
                scales: { y: { max: 100, title: axisTitle("% reduction", x) } },
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
            `Left · ${SCEN[left].name}`,
            `Right · ${SCEN[right].name}`,
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
  );
}

/* ============================ SEASONAL WATER YIELD ============================ */
function SwyPage({ left, right, setLeft, setRight, go }: PageProps) {
  const ms = useMapState("swy");
  const last = 7; // WS 8 = catchment outlet
  const chg = (k: ScenarioKey) =>
    ((SWY_SCEN[k][last] - SWY_SCEN.S1[last]) / SWY_SCEN.S1[last]) * 100;
  const [station, setStation] = useState("upper");
  const [flow, setFlow] = useState<"qf" | "bf">("qf");
  const [imgFailed, setImgFailed] = useState(false);
  const stationLabel = STATIONS.find((st) => st.id === station)?.label;

  return (
    <>
      <PageHead
        eyebrow="Maps"
        title="Seasonal Water Yield"
        sub="InVEST Seasonal Water Yield results. Drag the divider to compare two land-use scenarios."
        go={go}
      />
      <SpatialCoverageNotice mode="swy" />
      <div className="grid">
        <aside className="panel">
          <details className="sec" open>
            <summary>Scenario stats</summary>
            <div className="stat-pair">
              {(
                [
                  ["Left", left],
                  ["Right", right],
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
          </details>

          <LayerPanel state={ms} />
          <MapLegend state={ms} left={left} right={right} />
        </aside>
        <section className="mapwrap">
          <LeafletDashboardMap
            key="swy"
            mode="swy"
            left={left}
            right={right}
            onLeftChange={setLeft}
            onRightChange={setRight}
            state={ms}
          />
        </section>
      </div>

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
            `Left · ${SCEN[left].name}`,
            `Right · ${SCEN[right].name}`,
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
  );
}
