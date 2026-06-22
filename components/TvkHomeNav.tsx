"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { TVK_LOGO } from "@/lib/brand";
import { useMobileNav } from "@/components/useMobileNav";

type TvkHomeNavProps = {
  onOpenComplaint: () => void;
};

export default function TvkHomeNav({ onOpenComplaint }: TvkHomeNavProps) {
  const [navOpen, setNavOpen] = useState(false);
  const { close, toggle } = useMobileNav(navOpen, setNavOpen, "nav-menu-open", 1480);

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
              <small>TVK · Namakkal West</small>
              <b>தமிழக வெற்றிக் கழகம்</b>
            </span>
          </Link>

          <button
            type="button"
            className="nav-toggle"
            id="navToggle"
            aria-label={navOpen ? "மெனுவை மூடு" : "வழிசெலுத்தல் மெனு"}
            aria-expanded={navOpen ? "true" : "false"}
            aria-controls="navLinks"
            onClick={toggle}
          >
            {navOpen ? "✕" : "☰"}
          </button>

          <div className={`nav-links ${navOpen ? "open" : ""}`} id="navLinks">
            <a href="#ideology" onClick={close}>
              கொடி &amp; கொள்கை
            </a>
            <a href="#leaders" onClick={close}>
              தலைவர்கள்
            </a>
            <a href="#plan" onClick={close}>
              என் தெரு, என் திட்டம்
            </a>
            <a href="#events" onClick={close}>
              நிகழ்வுகள்
            </a>
            <a
              href="#complaint"
              onClick={(event) => {
                event.preventDefault();
                close();
                onOpenComplaint();
              }}
            >
              குறைதீர் மனு
            </a>
            <Link href="/track" onClick={close}>
              மனு நிலை அறிதல்
            </Link>
            <a href="#contact" onClick={close}>
              தொடர்பு
            </a>
            <a href="#join" className="cta" onClick={close}>
              இணையுங்கள்
            </a>
          </div>
      </div>
    </nav>
  );
}
