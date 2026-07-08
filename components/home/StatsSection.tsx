"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function StatsSection() {
  const { t } = useLanguage();

  return (
    <section className="stats sec-pad" data-cursor="maroon" data-rail={t("stats.eyebrow")} id="stats" style={{ paddingBottom: 0 }}>
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-eyebrow">{t("stats.eyebrow")}</span>
          <h2>
            {t("stats.title").split("\n").map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx === 0 && <br />}
              </React.Fragment>
            ))}
          </h2>
        </div>
      </div>
      <div className="wrap grid">
        <div className="stat rv">
          <b data-count="2024">0</b>
          <span>{t("stats.start_lbl")}</span>
        </div>
        <div className="stat rv rv-d1">
          <b>
            <span className="num" data-count="1.5" data-dec="1">0</span>
            <span className="unit">{t("stats.members_unit")}</span>
          </b>
          <span>{t("stats.members_lbl")}</span>
        </div>
        <div className="stat rv rv-d2">
          <b data-count="234">0</b>
          <span>{t("stats.constituencies_lbl")}</span>
        </div>
        <div className="stat rv rv-d3">
          <b data-count="2026">0</b>
          <span>{t("stats.governance_lbl")}</span>
        </div>
      </div>
    </section>
  );
}

import React from "react";

