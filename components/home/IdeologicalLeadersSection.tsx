"use client";

import { useLanguage } from "@/components/LanguageProvider";

/**
 * Home "ideological leaders" (கொள்கை தலைவர்கள்) section. Pure presentational
 * markup extracted verbatim from app/page.tsx; `.rv`/`.spot` classes are animated
 * by DOM-query effects in the parent, so they must stay exactly as written.
 */
export default function IdeologicalLeadersSection() {
  const { t } = useLanguage();

  return (
    <section className="dark sec-pad" data-cursor="gold" data-rail={t("leaders.eyebrow")} id="leaders">
      <div className="wrap">
        <div className="sec-head center">
          <span className="sec-eyebrow">{t("leaders.eyebrow")}</span>
          <h2>{t("leaders.title")}</h2>
          <p>{t("leaders.subtitle")}</p>
        </div>
        <div className="lgrid">
          <div className="lcard spot rv">
            <div className="lphoto">
              <img src="https://www.tvknamakkaleast.com/assets/images/periar.jpg" alt={t("leaders.periyar.name")} data-fb="பெ" />
            </div>
            <h3>{t("leaders.periyar.name")}</h3>
            <p>{t("leaders.periyar.desc")}</p>
          </div>
          <div className="lcard spot rv rv-d1">
            <div className="lphoto">
              <img src="https://www.tvknamakkaleast.com/assets/images/ambedkar.jpeg" alt={t("leaders.ambedkar.name")} data-fb="அ" />
            </div>
            <h3>{t("leaders.ambedkar.name")}</h3>
            <p>{t("leaders.ambedkar.desc")}</p>
          </div>
          <div className="lcard spot rv rv-d2">
            <div className="lphoto">
              <img src="https://www.tvknamakkaleast.com/assets/images/kamarajar.jpeg" alt={t("leaders.kamarajar.name")} data-fb="கா" />
            </div>
            <h3>{t("leaders.kamarajar.name")}</h3>
            <p>{t("leaders.kamarajar.desc")}</p>
          </div>
          <div className="lcard spot rv rv-d3">
            <div className="lphoto">
              <img src="https://www.tvknamakkaleast.com/assets/images/velu.jpg" alt={t("leaders.velunachiyar.name")} data-fb="வே" />
            </div>
            <h3>{t("leaders.velunachiyar.name")}</h3>
            <p>{t("leaders.velunachiyar.desc")}</p>
          </div>
          <div className="lcard spot rv rv-d4">
            <div className="lphoto">
              <img src="https://www.tvknamakkaleast.com/assets/images/anjalai.jpeg" alt={t("leaders.anjalai.name")} data-fb="அ" />
            </div>
            <h3>{t("leaders.anjalai.name")}</h3>
            <p>{t("leaders.anjalai.desc")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
