"use client";

import { useState } from "react";
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

  const Btn = ({
    k,
    idle,
    onClick,
    kind = "",
  }: {
    k: string;
    idle: string;
    onClick: () => void;
    kind?: string;
  }) => (
    <button
      className={`dl-btn ${kind} ${status[k] ?? ""}`}
      disabled={status[k] === "busy"}
      onClick={onClick}
      title={
        status[k] === "missing"
          ? "Add this file to public/Hulu Ganga/"
          : undefined
      }>
      {label(k, idle)}
    </button>
  );

  const rasterGroups = [
    { title: "Land use / land cover (LULC)", files: LULC_FILES },
    { title: "Sediment export (SDR)", files: SDR_FILES },
    { title: "Seasonal water yield (SWY)", files: SWY_FILES },
  ];

  return (
    <div className="dl">
      <section className="dl-hero">
        <h2>Download data</h2>
        <p>
          Tables as CSV (opens in Excel or any GIS tool) and the map layers as
          GeoTIFF rasters and zipped shapefiles, ready for QGIS or ArcGIS.
        </p>
        <Btn
          k="all-csv"
          idle="Download all CSV tables (.zip)"
          kind="primary"
          onClick={() =>
            run("all-csv", async () =>
              saveBlob(await zipCsvs(), "hulu_ganga_tables.zip"),
            )
          }
        />
      </section>

      <section className="card wide">
        <h3>Tables (CSV)</h3>
        <div className="dl-grid">
          {DATASETS.map((d) => (
            <div key={d.id} className="dl-item">
              <div>
                <b>{d.title}</b>
                <p>{d.desc}</p>
                <code>{d.file}</code>
              </div>
              <Btn
                k={d.id}
                idle="Download CSV"
                onClick={() =>
                  run(d.id, async () =>
                    saveBlob(csvBlob(datasetCsv(d)), d.file),
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card wide">
        <h3>Map layers (GeoTIFF)</h3>
        <p className="note top0">
          Rasters are served from <code>public/Hulu Ganga/</code>. A button
          shows “File not found” until that scenario’s file has been added.
        </p>
        <div className="tbl-wrap">
          <table className="tbl dl-tbl">
            <thead>
              <tr>
                <th>Layer</th>
                {SKEYS.map((k) => (
                  <th key={k}>{SCEN[k].name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rasterGroups.map((g) => (
                <tr key={g.title}>
                  <td>
                    <b>{g.title}</b>
                  </td>
                  {SKEYS.map((k) => {
                    const url = g.files[k];
                    return (
                      <td key={k}>
                        <Btn
                          k={url}
                          idle="GeoTIFF"
                          kind="sm"
                          onClick={() =>
                            run(url, async () =>
                              saveBlob(await fetchBlob(url), fileNameOf(url)),
                            )
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card wide">
        <h3>Vector layers (Shapefile, zipped)</h3>
        <div className="dl-grid">
          {(Object.keys(VECTORS) as (keyof typeof VECTORS)[]).map((id) => {
            const v = VECTORS[id];
            const key = `vec-${id}`;
            return (
              <div key={id} className="dl-item">
                <div>
                  <b>{v.label}</b>
                  <p>.shp .shx .dbf .prj bundled in one zip.</p>
                  <code>{fileNameOf(v.base)}.zip</code>
                </div>
                <Btn
                  k={key}
                  idle="Download ZIP"
                  onClick={() =>
                    run(key, async () =>
                      saveBlob(
                        await zipShapefile(v.base),
                        `${fileNameOf(v.base)}.zip`,
                      ),
                    )
                  }
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
