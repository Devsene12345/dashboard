"use client";

import { Check, Map as MapIcon, Mountain, Sprout, Waves } from "lucide-react";
import { SCEN, SKEYS, STATIONS, WS, WS_AREA } from "../data";
import { SITE } from "../siteConfig";
import type { PageId } from "./Header";

const PRINCIPLES = [
  {
    icon: Waves,
    title: "Hydrological response",
    text: "Understand seasonal water availability under changing land-use conditions.",
  },
  {
    icon: Mountain,
    title: "Sediment dynamics",
    text: "Explore erosion and sediment-export pressure across catchment sub-zones.",
  },
  {
    icon: Sprout,
    title: "Scenario planning",
    text: "Compare conservation, restoration and integrated management strategies.",
  },
];

const STEPS = [
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

  return (
    <div className="about">
      <section className="a-hero">
        <div className="a-hero-in">
          <div>
            <span className="eyebrow cyan">About the project</span>
            <h1>Better land-use decisions for resilient mini-hydropower</h1>
            <p>
              {SITE.title} is a prototype decision-support dashboard connecting
              hydrological and sediment modelling with practical land-use
              scenario assessment in Sri Lanka&apos;s Central Highlands.
            </p>
            <button className="btn light" onClick={() => go("sdr")}>
              <MapIcon size={16} /> Explore the maps
            </button>
          </div>
          <div className="a-logo">
            <span />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITE.logo} alt={`${SITE.title} logo`} />
          </div>
        </div>
      </section>

      <section className="info-in">
        <div className="pgrid">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="pcard">
              <div className="dcard-ic">
                <Icon size={20} />
              </div>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="facts">
          {facts.map((f) => (
            <div key={f.l} className="fact">
              <b>{f.n}</b>
              <span>{f.l}</span>
            </div>
          ))}
        </div>

        <div className="study">
          <div>
            <span className="eyebrow">Study area</span>
            <h2>Hulu Ganga Catchment</h2>
            <p>{SITE.projectTitle}.</p>
            <p>
              The catchment supports communities, agriculture, natural
              ecosystems and mini-hydropower infrastructure. Its steep terrain
              and changing land cover make integrated water and sediment
              planning essential.
            </p>
          </div>
          <div className="checks">
            {[
              "Google Hybrid basemap",
              "LULC classification",
              "GN administrative context",
              "Four land-use scenarios",
            ].map((item) => (
              <div key={item}>
                <span>
                  <Check size={14} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="doc-grid">
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
          <section className="card">
            <h3>Method</h3>
            <ol className="steps">
              {STEPS.map(([t, d], i) => (
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
        </div>
      </section>
    </div>
  );
}
