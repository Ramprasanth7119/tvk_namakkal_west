"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { TVK_LOGO } from "@/lib/brand";

/**
 * Slim, self-contained teaser banner introducing the "Upcoming Citizen
 * Services" page (/upcoming-services). Purely additive — does not alter
 * any existing section; reuses the home page's existing eyebrow/heading/
 * button design language (see app/home.css .btn / .sec-eyebrow).
 */
export default function UpcomingServicesTeaser() {
  const { t } = useLanguage();

  return (
    <section
      className="sec-pad upcoming-teaser-sec"
      data-cursor="gold"
      data-rail={t("home.rail.upcoming")}
      id="upcoming-teaser"
    >
      <div className="wrap">
        <div className="upcoming-teaser-box rv spot">
          <img className="upcoming-teaser-whistle" src={TVK_LOGO} alt="" aria-hidden="true" />
          <div className="upcoming-teaser-copy">
            <span className="sec-eyebrow">{t("home.upcoming_teaser.eyebrow")}</span>
            <h2>{t("home.upcoming_teaser.title")}</h2>
            <p>{t("home.upcoming_teaser.desc")}</p>
          </div>
          <Link className="btn btn-gold magnetic upcoming-teaser-btn" href="/upcoming-services">
            {t("home.upcoming_teaser.btn")} <i>→</i>
          </Link>
        </div>
      </div>
    </section>
  );
}
