"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { TVK_LOGO } from "@/lib/brand";
import { useMobileNav } from "@/components/useMobileNav";
import { useLanguage } from "@/components/LanguageProvider";

type TvkHomeNavProps = {
  onOpenComplaint: () => void;
};

export default function TvkHomeNav({ onOpenComplaint }: TvkHomeNavProps) {
  const [navOpen, setNavOpen] = useState(false);
  const { close, toggle } = useMobileNav(navOpen, setNavOpen, "nav-menu-open", 1480);
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="nav" id="nav">
      <div
        className={`nav-backdrop ${navOpen ? "open" : ""}`}
        aria-hidden={navOpen ? "true" : "false"}
        onClick={close}
      />
      <div className="nav-inner">
          <Link className="brand" href="#top" onClick={close}>
            <Image src={TVK_LOGO} alt="TVK" width={36} height={36} style={{ objectFit: "contain" }} />
            <span className="brand-text">
              <small>{t("nav.subtitle")}</small>
              <b>{t("nav.brand")}</b>
            </span>
          </Link>

          {/* Always-visible language switcher (navbar header row) */}
          <button
            type="button"
            className="nav-lang-btn"
            onClick={() => setLang(lang === "ta" ? "en" : "ta")}
            aria-label={lang === "ta" ? "Switch to English" : "தமிழுக்கு மாற்று"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            {lang === "ta" ? "English" : "தமிழ்"}
          </button>

          <button
            type="button"
            className="nav-toggle"
            id="navToggle"
            aria-label={navOpen ? t("nav.menu_close") : t("nav.menu_toggle")}
            aria-expanded={navOpen ? "true" : "false"}
            aria-controls="navLinks"
            onClick={toggle}
          >
            {navOpen ? "✕" : "☰"}
          </button>

          <div className={`nav-links ${navOpen ? "open" : ""}`} id="navLinks">
            <a href="#ideology" onClick={close}>
              {t("nav.ideology")}
            </a>
            <a href="#leaders" onClick={close}>
              {t("nav.leaders")}
            </a>
            <a href="#plan" onClick={close}>
              {t("nav.plan")}
            </a>
            <a href="#events" onClick={close}>
              {t("nav.events")}
            </a>
            <a
              href="#complaint"
              onClick={(event) => {
                event.preventDefault();
                close();
                onOpenComplaint();
              }}
            >
              {t("nav.complaint")}
            </a>
            <Link href="/track" onClick={close}>
              {t("nav.track")}
            </Link>
            <a href="#contact" onClick={close}>
              {t("nav.contact")}
            </a>
            
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => {
                setLang(lang === "ta" ? "en" : "ta");
                close();
              }}
              className="lang-toggle-btn"
              aria-label={lang === "ta" ? "Switch to English" : "தமிழுக்கு மாற்று"}
              style={{
                color: "var(--gold)",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "transparent",
                border: "none",
                padding: 0
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              {lang === "ta" ? "English" : "தமிழ்"}
            </button>

            <a href="#join" className="cta" onClick={close}>
              {t("nav.join")}
            </a>
          </div>
      </div>
    </nav>
  );
}

