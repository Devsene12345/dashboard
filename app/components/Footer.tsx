"use client";

import { SITE } from "../siteConfig";
import type { PageId } from "./Header";

export default function Footer({ go }: { go: (p: PageId) => void }) {
  const link = (p: PageId, label: string) => (
    <li>
      <button onClick={() => go(p)}>{label}</button>
    </li>
  );
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src={SITE.logo} alt="" width={40} height={40} />
          <div>
            <b>{SITE.title}</b>
            <p>
              Prototype GIS dashboard comparing land-use scenarios for sediment
              export, seasonal water yield and mini-hydropower performance.
            </p>
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            {link("home", "Home")}
            {link("sdr", "Sediment Export")}
            {link("swy", "Seasonal Water Yield")}
          </ul>
        </div>
        <div>
          <h4>More</h4>
          <ul>
            {link("about", "About")}
            {link("contact", "Contact")}
            {link("download", "Download data")}
          </ul>
        </div>
      </div>
      <div className="foot-base">
        Prototype · base maps © Google and © OpenStreetMap contributors ·
        results from the project presentation
      </div>
    </footer>
  );
}
