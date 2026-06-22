"use client";

import Link from "next/link";
import { useState } from "react";
import { TVK_LOGO } from "@/lib/brand";
import { useMobileNav } from "@/components/useMobileNav";

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

export default function TvkTopBar({
  title,
  brandHref = "/",
  links,
  className = "",
  logoClassName = "tvk-brand-logo",
  menuLabel = "வழிசெலுத்தல் மெனு",
}: TvkTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { close, toggle } = useMobileNav(menuOpen, setMenuOpen, "topbar-menu-open", 992);

  return (
    <header className={`topbar ${className}`.trim()}>
      <div
        className={`topbar-backdrop ${menuOpen ? "open" : ""}`}
        aria-hidden={menuOpen ? "true" : "false"}
        onClick={close}
      />
      <div className="topbar-in">
          <Link className="tb-brand" href={brandHref} onClick={close}>
            <img src={TVK_LOGO} alt="TVK" className={logoClassName} />
            <span>
              <small>TVK · Namakkal West</small>
              <b>{title}</b>
            </span>
          </Link>

          <button
            type="button"
            className="topbar-menu-toggle"
            aria-label={menuOpen ? "மெனுவை மூடு" : menuLabel}
            aria-expanded={menuOpen ? "true" : "false"}
            aria-controls="topbar-mobile-menu"
            onClick={toggle}
          >
            <span className="topbar-menu-icon" aria-hidden="true">
              {menuOpen ? "✕" : "☰"}
            </span>
          </button>

          <nav
            id="topbar-mobile-menu"
            className={`tb-actions ${menuOpen ? "open" : ""}`}
            aria-label={menuLabel}
          >
            {links.map((link) => {
              const className = `tb-back${link.active ? " active" : ""}`;
              const style = link.highlight
                ? { color: "#FECB02", borderColor: "#FECB02" }
                : undefined;

              if (link.static) {
                return (
                  <span
                    key={`static-${link.label}`}
                    className={className}
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
                    className={className}
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
                  className={className}
                  href={link.href || "/"}
                  style={style}
                  onClick={close}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
      </div>
    </header>
  );
}
