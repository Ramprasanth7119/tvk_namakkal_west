"use client";

import { WHISTLE_CURSOR_GOLD } from '@/lib/whistleCursorAssets';
import { useLanguage } from "@/components/LanguageProvider";
import React from "react";

export default function JoinSection() {
  const { t } = useLanguage();

  return (
    <section className="dark sec-pad" data-cursor="gold" data-rail={t("join.eyebrow")} id="join">
      <div className="wrap join-grid">
        <div className="rv">
          <span className="sec-eyebrow">{t("join.eyebrow")}</span>
          <h2>
            {t("join.title").split("\n").map((line, idx) => (
              <React.Fragment key={idx}>
                {idx === 1 ? <em>{line}</em> : line}
                {idx === 0 && <br />}
              </React.Fragment>
            ))}
          </h2>
          <p>{t("join.desc")}</p>
        </div>
        <div className="join-card rv rv-d1" id="joinCard">
          <div className="join-ok" id="joinOk" style={{ display: 'block' }}>
            <img src={WHISTLE_CURSOR_GOLD} alt="" aria-hidden="true" />
            <a
              href="https://tvk.family/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold magnetic"
            >
              {t("join.btn")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

