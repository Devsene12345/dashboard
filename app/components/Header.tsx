"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "../siteConfig";

export type PageId = "home" | "sdr" | "swy" | "about" | "contact" | "download";

export const MAP_PAGES: { id: PageId; label: string; desc: string }[] = [
  {
    id: "sdr",
    label: "Sediment Export",
    desc: "InVEST SDR · compare scenarios",
  },
  {
    id: "swy",
    label: "Seasonal Water Yield",
    desc: "InVEST SWY · compare scenarios",
  },
];

const Icon = {
  down: (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14" />
    </svg>
  ),
  chev: (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
};

export default function Header({
  page,
  go,
}: {
  page: PageId;
  go: (p: PageId) => void;
}) {
  const [menu, setMenu] = useState(false); // "Maps" dropdown
  const [mobile, setMobile] = useState(false); // hamburger menu on small screens
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node))
        setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setMobile(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const nav = (p: PageId) => {
    go(p);
    setMenu(false);
    setMobile(false);
  };
  const cls = (on: boolean) => `nav-btn${on ? " active" : ""}`;
  const mapsActive = page === "sdr" || page === "swy";

  return (
    <header className="top">
      <div className="top-in">
        <button
          className="brand"
          onClick={() => nav("home")}
          aria-label="Go to Home page">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src={SITE.logo} alt="" width={44} height={44} />
          <span className="brand-text">
            <span className="brand-title">{SITE.title}</span>
            <span className="brand-sub">{SITE.subtitle}</span>
          </span>
        </button>

        <button
          className="burger"
          aria-label="Toggle menu"
          aria-expanded={mobile}
          onClick={() => setMobile((m) => !m)}>
          <span />
          <span />
          <span />
        </button>

        <nav
          ref={navRef}
          className={`nav${mobile ? " open" : ""}`}
          aria-label="Main">
          <button
            className={cls(page === "home")}
            aria-current={page === "home" ? "page" : undefined}
            onClick={() => nav("home")}>
            Home
          </button>

          <div className="dd">
            <button
              className={cls(mapsActive || menu)}
              aria-haspopup="menu"
              aria-expanded={menu}
              onClick={() => setMenu((m) => !m)}>
              Maps{" "}
              <span className={`chev${menu ? " up" : ""}`}>{Icon.chev}</span>
            </button>
            {menu && (
              <div className="dd-menu" role="menu">
                {MAP_PAGES.map((m) => (
                  <button
                    key={m.id}
                    role="menuitem"
                    className={page === m.id ? "on" : ""}
                    onClick={() => nav(m.id)}>
                    <b>{m.label}</b>
                    <small>{m.desc}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className={cls(page === "about")}
            aria-current={page === "about" ? "page" : undefined}
            onClick={() => nav("about")}>
            About
          </button>
          <button
            className={cls(page === "contact")}
            aria-current={page === "contact" ? "page" : undefined}
            onClick={() => nav("contact")}>
            Contact
          </button>
          <button
            className={`nav-btn cta${page === "download" ? " active" : ""}`}
            aria-current={page === "download" ? "page" : undefined}
            onClick={() => nav("download")}>
            {Icon.down} Download
          </button>
        </nav>
      </div>
    </header>
  );
}
