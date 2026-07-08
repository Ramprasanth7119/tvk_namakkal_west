"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function LeadershipSection() {
  const { t } = useLanguage();

  return (
    <section className="sec-pad" data-cursor="maroon" data-rail={t("leadership.role.head")} id="org">
      <div className="wrap">
        <div className="sec-head center">
          <span className="sec-eyebrow">{t("leadership.eyebrow")}</span>
          <h2>{t("leadership.title")}</h2>
          <p>{t("leadership.subtitle")}</p>
        </div>
        <div className="org-grid">
          <div className="ocard spot rv">
            <div className="ophoto">
              <span className="obadge">{t("leadership.role.head")}</span>
              <img src="/vijaycm.jpg" alt={t("leadership.name.president")} data-fb="வி" width="100%" />
            </div>
            <div className="obody">
              <h3>{t("leadership.name.president")}</h3>
              <span>{t("leadership.role.president")}</span>
            </div>
          </div>
          <div className="ocard spot rv rv-d1">
            <div className="ophoto">
              <span className="obadge">{t("leadership.role.state")}</span>
              <img src="https://www.tvknamakkaleast.com/assets/images/anand.png" alt={t("leadership.name.gen_sec")} data-fb="ஆ" />
            </div>
            <div className="obody">
              <h3>{t("leadership.name.gen_sec")}</h3>
              <span>{t("leadership.role.gen_sec")}</span>
            </div>
          </div>
          <div className="ocard spot rv rv-d2">
            <div className="ophoto">
              <span className="obadge">{t("leadership.role.district")}</span>
              <img src="/sathish.jpeg" alt={t("leadership.name.dist_sec")} data-fb="ந" />
            </div>
            <div className="obody">
              <h3>{t("leadership.name.dist_sec")}</h3>
              <span>{t("leadership.role.dist_sec")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

