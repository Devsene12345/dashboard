"use client";

import { SCEN, SKEYS, STATIONS, WS, WS_AREA } from "../data";
import { SITE } from "../siteConfig";
import type { PageId } from "./Header";

const TOOLS = [
  "Next.js",
  "React",
  "TypeScript",
  "Leaflet.js",
  "Chart.js",
  "georaster",
  "shpjs",
  "proj4",
  "InVEST SDR",
  "InVEST SWY",
  "QGIS",
];

export default function AboutPage({ go }: { go: (p: PageId) => void }) {
  const facts = [
    { n: String(WS.length), l: "nested watersheds" },
    { n: String(SKEYS.length), l: "land-use scenarios" },
    { n: String(STATIONS.length), l: "mini-hydropower stations" },
    {
      n: `${WS_AREA[WS_AREA.length - 1].toFixed(0)} km²`,
      l: "catchment area at the outlet (WS 8)",
    },
  ];
  const steps = [
    [
      "Prepare inputs",
      "A 10 m DEM, land-use maps for each scenario, soil and rainfall data are prepared and aligned in GIS.",
    ],
    [
      "Run the models",
      "The InVEST Sediment Delivery Ratio (SDR) and Seasonal Water Yield (SWY) models are run for the eight watersheds.",
    ],
    [
      "Compare scenarios",
      "Baseline (BAU) results are compared with soil and water conservation, restoration and integrated scenarios.",
    ],
    [
      "Assess hydropower",
      "Water yield results are translated into estimated generation at three mini-hydropower stations and checked against CEB 2023 figures.",
    ],
  ];

  return (
    <div className="doc">
      <section className="about-hero">
        <span className="eyebrow">About the project</span>
        <h2>{SITE.projectTitle}</h2>
        <p>
          This prototype dashboard lets you explore how different land-use
          choices change sediment export and seasonal water yield in the Hulu
          Ganga catchment, and what that means for the mini-hydropower plants
          that depend on the river.
        </p>
        <div className="about-actions">
          <button className="btn primary" onClick={() => go("sdr")}>
            Open the maps
          </button>
          <button className="btn" onClick={() => go("download")}>
            Download data
          </button>
        </div>
      </section>

      <div className="facts">
        {facts.map((f) => (
          <div key={f.l} className="fact">
            <b>{f.n}</b>
            <span>{f.l}</span>
          </div>
        ))}
      </div>

      <div className="doc-grid">
        <section className="card">
          <h3>Objectives</h3>
          <ul className="bul">
            <li>
              Quantify sediment export and seasonal water yield for the Hulu
              Ganga catchment under a baseline condition.
            </li>
            <li>
              Test how soil and water conservation, restoration and agroforestry
              change those results.
            </li>
            <li>
              Show the consequences for the performance of three mini-hydropower
              stations.
            </li>
            <li>
              Present the results in an interactive web map that planners and
              stakeholders can use.
            </li>
          </ul>
        </section>

        <section className="card">
          <h3>Land-use scenarios</h3>
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
      </div>

      <section className="card wide">
        <h3>Method</h3>
        <ol className="steps">
          {steps.map(([t, d], i) => (
            <li key={t}>
              <span className="num">{i + 1}</span>
              <div>
                <b>{t}</b>
                <p>{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="doc-grid">
        <section className="card">
          <h3>How to use the dashboard</h3>
          <ul className="bul">
            <li>
              <b>Home</b> shows the catchment with watershed, GN boundary, land
              use and weir layers.
            </li>
            <li>
              <b>Maps</b> opens Sediment Export and Seasonal Water Yield. Drag
              the divider to compare two scenarios.
            </li>
            <li>
              Switch layers, base map and opacity from the left-hand panel. The
              legend follows the layers you switch on.
            </li>
            <li>
              <b>Download</b> gives you the tables as CSV and the map layers as
              GeoTIFF and shapefile.
            </li>
          </ul>
        </section>

        <section className="card">
          <h3>Built with</h3>
          <div className="chips">
            {TOOLS.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
          <p className="note">
            Base maps © Google and © OpenStreetMap contributors. Model results
            are taken from the project presentation. This is a prototype and the
            figures should not be used for design decisions.
          </p>
        </section>
      </div>
    </div>
  );
}
