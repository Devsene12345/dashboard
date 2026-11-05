"use client";

import { useState } from "react";
import {
  ChevronDown,
  Download,
  Home,
  Info,
  Mail,
  Map as MapIcon,
  Menu,
  Mountain,
  Waves,
  X,
} from "lucide-react";
import { SITE } from "../siteConfig";

export type PageId = "home" | "sdr" | "swy" | "about" | "contact" | "download";

export const MAP_PAGES = [
  {
    id: "sdr" as PageId,
    label: "Sediment Export",
    desc: "Compare erosion scenarios",
    icon: Mountain,
    tone: "orange",
  },
  {
    id: "swy" as PageId,
    label: "Seasonal Water Yield",
    desc: "Compare hydrological response",
    icon: Waves,
    tone: "blue",
  },
];

const LINKS: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: "about", label: "About", icon: Info },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "download", label: "Download", icon: Download },
];

export default function Header({
  page,
  go,
}: {
  page: PageId;
  go: (p: PageId) => void;
}) {
  const [mapsOpen, setMapsOpen] = useState(false); // "Maps" dropdown (desktop)
  const [mobile, setMobile] = useState(false); // slide-down menu (small screens)
  const mapsActive = page === "sdr" || page === "swy";

  const nav = (p: PageId) => {
    go(p);
    setMapsOpen(false);
    setMobile(false);
  };
  const cls = (on: boolean) => `nav-btn${on ? " active" : ""}`;

  return (
    <header className="top">
      <div className="top-in">
        <button
          className="brand"
          onClick={() => nav("home")}
          aria-label="Go to Home page">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src={SITE.logo} alt="" width={48} height={48} />
          <span className="brand-text">
            <span className="brand-title">{SITE.title}</span>
            <span className="brand-sub">{SITE.subtitle}</span>
          </span>
        </button>

        <nav className="nav" aria-label="Primary navigation">
          <button
            className={cls(page === "home")}
            aria-current={page === "home" ? "page" : undefined}
            onClick={() => nav("home")}>
            <Home size={16} /> Home
          </button>

          <div
            className="dd"
            onMouseEnter={() => setMapsOpen(true)}
            onMouseLeave={() => setMapsOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMapsOpen(false)}>
            <button
              className={cls(mapsActive)}
              aria-haspopup="menu"
              aria-expanded={mapsOpen}
              onClick={() => setMapsOpen((o) => !o)}>
              <MapIcon size={16} /> Maps{" "}
              <ChevronDown
                size={14}
                className={`chev${mapsOpen ? " up" : ""}`}
              />
            </button>
            {mapsOpen && (
              <div className="dd-wrap">
                <div className="dd-menu" role="menu">
                  {MAP_PAGES.map(({ id, label, desc, icon: Icon, tone }) => (
                    <button
                      key={id}
                      role="menuitem"
                      className={page === id ? "on" : ""}
                      onClick={() => nav(id)}>
                      <Icon size={16} className={`tone-${tone}`} />
                      <span>
                        <b>{label}</b>
                        <small>{desc}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {LINKS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={cls(page === id)}
              aria-current={page === id ? "page" : undefined}
              onClick={() => nav(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <button
          className="burger"
          aria-label="Toggle navigation"
          aria-expanded={mobile}
          onClick={() => setMobile((m) => !m)}>
          {mobile ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobile && (
        <nav className="mnav" aria-label="Mobile navigation">
          <p className="mnav-t">Navigate</p>
          <button className={cls(page === "home")} onClick={() => nav("home")}>
            <Home size={16} /> Home
          </button>
          <div className="mnav-group">
            <p className="mnav-t">
              <MapIcon size={14} /> Maps
            </p>
            {MAP_PAGES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={cls(page === id)}
                onClick={() => nav(id)}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
          {LINKS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={cls(page === id)}
              onClick={() => nav(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
