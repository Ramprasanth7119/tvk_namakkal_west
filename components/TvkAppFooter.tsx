"use client";

import { TVK_LOGO } from "@/lib/brand";
import { useLanguage } from "@/components/LanguageProvider";

type TvkAppFooterProps = {
  tagline?: string;
};

export default function TvkAppFooter({
  tagline,
}: TvkAppFooterProps) {
  const { t } = useLanguage();
  const displayTagline = tagline || t("footer.tagline");

  return (
    <footer className="dfoot">
      <img src={TVK_LOGO} alt="" className="dfoot-whistle" aria-hidden="true" />
      <p>
        {t("footer.copyright")} · <b>{t("footer.motto")}</b>
      </p>
      <span className="demo">{displayTagline}</span>
    </footer>
  );
}

