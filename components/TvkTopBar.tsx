"use client";

import Link from "next/link";
import { useState } from "react";
import { TVK_LOGO } from "@/lib/brand";
import { useMobileNav } from "@/components/useMobileNav";
import { useLanguage } from "@/components/LanguageProvider";

export type TopBarLink = {
  href?: string;
  label: string;
  active?: boolean;
  highlight?: boolean;
  onClick?: () => void;
  static?: boolean;
};

type TvkTopBarProps = {
  title: string;
  brandHref?: string;
  links: TopBarLink[];
  className?: string;
  logoClassName?: string;
  menuLabel?: string;
};

function LangSwitchButton({
  className,
  onSwitch,
}: {
  className: string;
  onSwitch?: () => void;
}) {
  const { lang, setLang, t } = useLanguage();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        setLang(lang === "ta" ? "en" : "ta");
        onSwitch?.();
      }}
      aria-label={lang === "ta" ? t("nav.lang_switch_en") : t("nav.lang_switch_ta")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span>{lang === "ta" ? t("nav.lang_label_en") : t("nav.lang_label_ta")}</span>
    </button>
  );
}

export default function TvkTopBar({
  title,
  brandHref = "/",
  links,
  className = "",
  logoClassName = "tvk-brand-logo",
  menuLabel,
}: TvkTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { close, toggle } = useMobileNav(menuOpen, setMenuOpen, "topbar-menu-open", 992);
  const { t } = useLanguage();

  const activeMenuLabel = menuLabel || t("nav.menu_toggle");

  return (
    <header className={`topbar ${className}`.trim()}>
      <div
        className={`topbar-backdrop ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
        onClick={close}
      />
      <div className="topbar-in">
          <Link className="tb-brand" href={brandHref} onClick={close}>
            <img src={TVK_LOGO} alt="TVK" className={logoClassName} />
            <span>
              <small>{t("nav.subtitle")}</small>
              <b>{title}</b>
            </span>
          </Link>

          <nav
            id="topbar-mobile-menu"
            className={`tb-actions ${menuOpen ? "open" : ""}`}
            aria-label={activeMenuLabel}
          >
            {links.map((link) => {
              const linkClassName = `tb-back${link.active ? " active" : ""}`;
              const style = link.highlight
                ? { color: "#FECB02", borderColor: "#FECB02" }
                : undefined;

              if (link.static) {
                return (
                  <span
                    key={`static-${link.label}`}
                    className={linkClassName}
                    style={style}
                    aria-current={link.active ? "page" : undefined}
                  >
                    {link.label}
                  </span>
                );
              }

              if (link.onClick) {
                return (
                  <button
                    key={`${link.href}-${link.label}`}
                    type="button"
                    className={linkClassName}
                    style={style}
                    onClick={() => {
                      link.onClick?.();
                      close();
                    }}
                  >
                    {link.label}
                  </button>
                );
              }

              return (
                <Link
                  key={`${link.href || link.label}-${link.label}`}
                  className={linkClassName}
                  href={link.href || "/"}
                  style={style}
                  onClick={close}
                  aria-current={link.active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="topbar-actions">
            <LangSwitchButton className="topbar-lang-btn" />
            <button
              type="button"
              className="topbar-menu-toggle"
              aria-label={menuOpen ? t("nav.menu_close") : activeMenuLabel}
              aria-expanded={menuOpen}
              aria-controls="topbar-mobile-menu"
              onClick={toggle}
            >
              <span className="topbar-menu-icon" aria-hidden="true">
                {menuOpen ? "✕" : "☰"}
              </span>
            </button>
          </div>
      </div>
    </header>
  );
}
