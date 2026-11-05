"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  FileCode2,
  FileSpreadsheet,
  Layers3,
  Mountain,
  Package,
  Sprout,
  Waves,
} from "lucide-react";
import { SCEN, SKEYS } from "../data";
import {
  DATASETS,
  csvBlob,
  datasetCsv,
  fetchBlob,
  fileNameOf,
  saveBlob,
  zipCsvs,
  zipShapefile,
} from "../downloads";
import { LULC_FILES, SDR_FILES, SWY_FILES, VECTORS } from "../mapConfig";

type Status = "busy" | "done" | "missing";

function Card({
  icon: Icon,
  title,
  desc,
  meta,
  children,
}: {
  icon: typeof Layers3;
  title: string;
  desc: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <article className="dcard">
      <div className="dcard-ic">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <span className="dcard-meta">{meta}</span>
      {children}
    </article>
  );
}

export default function DownloadPage() {
  const [status, setStatus] = useState<Record<string, Status>>({});
  const set = (key: string, s?: Status) =>
    setStatus((prev) => {
      const n = { ...prev };
      if (s) n[key] = s;
      else delete n[key];
      return n;
    });

  async function run(key: string, job: () => Promise<void>) {
    set(key, "busy");
    try {
      await job();
      set(key, "done");
      setTimeout(
        () =>
          setStatus((p) =>
            p[key] === "done" ? (({ [key]: _omit, ...rest }) => rest)(p) : p,
          ),
        2500,
      );
    } catch {
      set(key, "missing");
    }
  }

  const label = (key: string, idle: string) =>
    status[key] === "busy"
      ? "Preparing…"
      : status[key] === "done"
        ? "Saved ✓"
        : status[key] === "missing"
          ? "File not found"
          : idle;

  const btn = (k: string, idle: string, onClick: () => void, kind = "") => (
    <button
      key={k}
      className={`dl-btn ${kind} ${status[k] ?? ""}`}
      disabled={status[k] === "busy"}
      onClick={onClick}
      title={
        status[k] === "missing"
          ? "Add this file to public/Hulu Ganga/"
          : undefined
      }>
      {kind !== "sm" && <ArrowDownToLine size={16} />}
      {label(k, idle)}
    </button>
  );

  const rasterGroups = [
    {
      title: "Land use / land cover",
      desc: "Classified LULC raster for each land-use scenario.",
      icon: Sprout,
      files: LULC_FILES,
    },
    {
      title: "Sediment export",
      desc: "InVEST SDR sediment export raster for each scenario.",
      icon: Mountain,
      files: SDR_FILES,
    },
    {
      title: "Seasonal water yield",
      desc: "InVEST SWY raster for each scenario.",
      icon: Waves,
      files: SWY_FILES,
    },
  ];

  return (
    <div className="info dl">
      <div className="info-in">
        <div className="info-head">
          <span className="eyebrow">Open research outputs</span>
          <h1>Download data &amp; maps</h1>
          <p>
            Export the scenario tables as CSV, and the map layers as GeoTIFF
            rasters and zipped shapefiles that open directly in QGIS or ArcGIS.
          </p>
        </div>

        <h2 className="dl-h">Tables (CSV)</h2>
        <div className="dgrid">
          {DATASETS.map((d) => (
            <Card
              key={d.id}
              icon={FileSpreadsheet}
              title={d.title}
              desc={d.desc}
              meta={`CSV · ${d.file}`}>
              {btn(d.id, "Download CSV", () =>
                run(d.id, async () => saveBlob(csvBlob(datasetCsv(d)), d.file)),
              )}
            </Card>
          ))}
          <Card
            icon={Package}
            title="All tables"
            desc="All five CSV tables bundled in a single zip file."
            meta="ZIP · 5 CSV files">
            {btn("all-csv", "Download all (.zip)", () =>
              run("all-csv", async () =>
                saveBlob(await zipCsvs(), "hulu_ganga_tables.zip"),
              ),
            )}
          </Card>
        </div>

        <h2 className="dl-h">Map layers (GeoTIFF)</h2>
        <div className="dgrid">
          {rasterGroups.map((g) => (
            <Card
              key={g.title}
              icon={g.icon}
              title={g.title}
              desc={g.desc}
              meta="GeoTIFF · one file per scenario">
              <div className="dl-sc">
                {SKEYS.map((k) => {
                  const url = g.files[k];
                  return btn(
                    url,
                    SCEN[k].short,
                    () =>
                      run(url, async () =>
                        saveBlob(await fetchBlob(url), fileNameOf(url)),
                      ),
                    "sm",
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        <h2 className="dl-h">Vector layers (Shapefile / GeoJSON)</h2>
        <div className="dgrid">
          {(Object.keys(VECTORS) as (keyof typeof VECTORS)[]).map((id) => {
            const v = VECTORS[id];
            const key = `vec-${id}`;
            if (v.inline) {
              return (
                <Card
                  key={id}
                  icon={FileCode2}
                  title={v.label}
                  desc="Catchment outline traced from the valid area of the sediment export raster, as a GeoJSON file."
                  meta="GeoJSON · Catchment_outline.geojson">
                  {btn(key, "Download GeoJSON", () =>
                    run(key, async () =>
                      saveBlob(
                        new Blob([JSON.stringify(v.inline)], {
                          type: "application/geo+json",
                        }),
                        "Catchment_outline.geojson",
                      ),
                    ),
                  )}
                </Card>
              );
            }
            return (
              <Card
                key={id}
                icon={FileCode2}
                title={v.label}
                desc=".shp, .shx, .dbf and .prj bundled in one zip file."
                meta={`ZIP · ${fileNameOf(v.base!)}.zip`}>
                {btn(key, "Download ZIP", () =>
                  run(key, async () =>
                    saveBlob(
                      await zipShapefile(v.base!),
                      `${fileNameOf(v.base!)}.zip`,
                    ),
                  ),
                )}
              </Card>
            );
          })}
        </div>

        <div className="amber">
          <b>Source data note</b>
          <p>
            Rasters and shapefiles are served from{" "}
            <code>public/Hulu Ganga/</code>. A button shows “File not found”
            until that scenario’s file has been added to the folder.
          </p>
        </div>
      </div>
    </div>
  );
}
