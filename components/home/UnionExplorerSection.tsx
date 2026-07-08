"use client";

import { useLanguage } from "@/components/LanguageProvider";

interface UnionExplorerSectionProps {
  unions: (string | number)[][];
  selectedUnion: number;
  unionWards: number;
  unionBooths: number;
  unionVols: number;
  onPick: (index: number) => void;
}

export default function UnionExplorerSection({
  unions,
  selectedUnion,
  unionWards,
  unionBooths,
  unionVols,
  onPick,
}: UnionExplorerSectionProps) {
  const { t } = useLanguage();

  return (
    <section className="dark sec-pad" data-cursor="gold" data-rail={t("explorer.eyebrow")} id="plan">
      <div className="wrap">
        <div className="sec-head center">
          <span className="sec-eyebrow">{t("explorer.eyebrow")}</span>
          <h2>{t("explorer.title")}</h2>
          <p>{t("explorer.subtitle")}</p>
        </div>
        <div className="uchips" id="uchips">
          {unions.map((u, i) => (
            <button
              key={i}
              className={`uchip ${selectedUnion === i ? 'active' : ''}`}
              onClick={() => onPick(i)}
            >
              {t(String(u[0]))}
            </button>
          ))}
        </div>
        <div className="upanel rv" id="upanel">
          <div className="ubox"><b id="uWards">{unionWards}</b><span>{t("explorer.wards")}</span></div>
          <div className="ubox"><b id="uBooths">{unionBooths}</b><span>{t("explorer.booths")}</span></div>
          <div className="ubox"><b id="uVols">{unionVols}</b><span>{t("explorer.volunteers")}</span></div>
        </div>
        <p className="unote">{t("explorer.note")}</p>
      </div>
    </section>
  );
}

