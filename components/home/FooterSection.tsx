"use client";

import Image from 'next/image';
import { TVK_LOGO } from '@/lib/brand';
import { CONSTITUENCIES } from '@/lib/constituencies';
import { useLanguage } from "@/components/LanguageProvider";

interface FooterSectionProps {
  onComplaintClick: () => void;
}

export default function FooterSection({ onComplaintClick }: FooterSectionProps) {
  const { t } = useLanguage();

  return (
    <footer id="contact">
      <div className="fstripe"></div>
      <div className="f-word">{t("nav.brand")}</div>
      <div className="f-inner">
        <div className="f-brand">
          <a className="brand" href="#top">
            <Image src={TVK_LOGO} alt="TVK" width={36} height={36} style={{ objectFit: 'contain' }} />
            <span>
              <small>TVK · Namakkal West</small>
              <b style={{ color: 'var(--gold-3)' }}>{t("nav.brand")}</b>
            </span>
          </a>
          <p>{t("footer.desc")}</p>
        </div>
        <div>
          <h4>{t("footer.quick_links")}</h4>
          <a href="#top">{t("nav.home")}</a>
          <a href="#events">{t("nav.events")}</a>
          <a href="#complaint" onClick={(e) => { e.preventDefault(); onComplaintClick(); }}>{t("nav.complaint")}</a>
          <a href="#plan">{t("nav.plan")}</a>
          <a href="#join">{t("nav.join")}</a>
        </div>
        <div>
          <h4>{t("footer.contact_grievance")}</h4>
          {CONSTITUENCIES.map((c, idx) => (
            <a key={idx} href="#contact"> {t(c)}</a>
          ))}
        </div>
      </div>
      <div className="f-bottom">
        {t("footer.copyright")} · <b>{t("footer.motto")}</b> · {t("footer.demo_build")}
      </div>
    </footer>
  );
}

