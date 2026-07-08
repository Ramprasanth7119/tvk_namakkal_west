"use client";

import React from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function PrinciplesSection() {
  const { t } = useLanguage();

  return (
    <section className="pr-sec sec-pad" data-cursor="maroon" data-rail={t("principles.title").replace("\n", " ")} id="principles">
      <div className="wrap">
        <div className="sec-head">
          <span className="sec-eyebrow">{t("principles.eyebrow")}</span>
          <h2>
            {t("principles.title").split("\n").map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx === 0 && <br />}
              </React.Fragment>
            ))}
          </h2>
        </div>
        <div className="pgrid">
          <div className="pcard rv">
            <div className="pemblem">⚖️</div>
            <div>
              <h3>{t("principles.social_justice.title")}</h3>
              <p>{t("principles.social_justice.desc")}</p>
            </div>
          </div>
          <div className="pcard rv rv-d1">
            <div className="pemblem">🤝</div>
            <div>
              <h3>{t("principles.equality.title")}</h3>
              <p>{t("principles.equality.desc")}</p>
            </div>
          </div>
          <div className="pcard rv rv-d2">
            <div className="pemblem">💎</div>
            <div>
              <h3>{t("principles.corruption_free.title")}</h3>
              <p>{t("principles.corruption_free.desc")}</p>
            </div>
          </div>
          <div className="pcard rv rv-d3">
            <div className="pemblem">🌱</div>
            <div>
              <h3>{t("principles.humanism.title")}</h3>
              <p>{t("principles.humanism.desc")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

