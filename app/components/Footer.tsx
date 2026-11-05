"use client";

import { SITE } from "../siteConfig";
import type { PageId } from "./Header";

export default function Footer({ go }: { go: (p: PageId) => void }) {
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="logo"
            src={SITE.logo}
            alt={SITE.title}
            width={40}
            height={40}
          />
          <div>
            <b>{SITE.title}</b>
            <p>Hydrological and sediment modelling prototype</p>
          </div>
        </div>
        <nav className="foot-links" aria-label="Footer">
          <button onClick={() => go("home")}>Home</button>
          <button onClick={() => go("sdr")}>Sediment Export</button>
          <button onClick={() => go("swy")}>Seasonal Water Yield</button>
          <button onClick={() => go("about")}>About</button>
          <button onClick={() => go("contact")}>Contact</button>
          <button onClick={() => go("download")}>Download</button>
        </nav>
        <p className="foot-note">
          Decision support for sustainable mini-hydropower planning · Sri Lanka
        </p>
      </div>
      <div className="foot-base">
        Base maps © Google and © OpenStreetMap contributors · results from the
        project presentation
      </div>
    </footer>
  );
}
