"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../analytics/analytics.css";
import "./upcoming.css";
import TvkTopBar from "@/components/TvkTopBar";
import TvkAppFooter from "@/components/TvkAppFooter";
import WhistleCursor, { useWhistleCursor } from "@/components/WhistleCursor";
import { useLanguage } from "@/components/LanguageProvider";
import { TVK_LOGO } from "@/lib/brand";
import { UPCOMING_FEATURES, UPCOMING_WORKFLOW_STEPS } from "@/constants/upcomingFeatures";

function FeatureIcon({ paths }: { paths: string[] }) {
  return (
    <svg viewBox="0 0 24 24">
      {paths.map((d, idx) => (
        <path key={idx} d={d} />
      ))}
    </svg>
  );
}

function FeatureCard({
  id,
  paths,
  expandedByDefault,
}: {
  id: string;
  paths: string[];
  expandedByDefault: boolean;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(expandedByDefault);
  const detailId = `uf-detail-${id}`;
  useEffect(() => {
    setOpen(expandedByDefault);
  }, [expandedByDefault]);

  return (
    <div className={`uf-card spot ${open ? "open" : ""}`}>
      <div className="uf-card-top">
        <div className="uf-ic">
          <FeatureIcon paths={paths} />
        </div>
        <span className="uf-badge">{t("upcoming.card.status_badge")}</span>
      </div>
      <h3>{t(`upcoming.feature.${id}.title`)}</h3>
      <p className="uf-tagline">{t(`upcoming.feature.${id}.tagline`)}</p>

      {/* Always visible summary so citizens understand each service at a glance */}
      <div className="uf-preview">
        <div className="uf-preview-block">
          <h4>{t("upcoming.detail.what")}</h4>
          <p>{t(`upcoming.feature.${id}.what`)}</p>
        </div>
        <div className="uf-preview-block">
          <h4>{t("upcoming.detail.how_help")}</h4>
          <p>{t(`upcoming.feature.${id}.how`)}</p>
        </div>
      </div>

      <button
        type="button"
        className="uf-toggle"
        aria-controls={detailId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? t("upcoming.card.show_less") : t("upcoming.card.learn_more")}
        <i className={`uf-chevron ${open ? "up" : ""}`} aria-hidden="true">
          ▾
        </i>
      </button>

      <div id={detailId} className="uf-detail" role="region">
        <div className="uf-detail-inner">
          <div className="uf-detail-block">
            <h4>{t("upcoming.detail.how_work")}</h4>
            <div className="uf-workflow" role="list">
              {UPCOMING_WORKFLOW_STEPS.map((stepKey, i) => (
                <div className="uf-workflow-step" role="listitem" key={stepKey}>
                  <div className="uf-workflow-row">
                    <span className="uf-workflow-num">{i + 1}</span>
                    <span className="uf-workflow-label">{t(stepKey)}</span>
                  </div>
                  {i < UPCOMING_WORKFLOW_STEPS.length - 1 && (
                    <span className="uf-workflow-arrow" aria-hidden="true">
                      ↓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="uf-detail-block">
            <h4>{t("upcoming.detail.why")}</h4>
            <p>{t(`upcoming.feature.${id}.why`)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpcomingServicesPage() {
  const { t } = useLanguage();
  const [expandAll, setExpandAll] = useState(false);
  useWhistleCursor({ theme: "gold" });

  return (
    <div className="analytics-body min-h-screen upcoming-body">
      <WhistleCursor />
      <TvkTopBar
        title={t("upcoming.page.title")}
        brandHref="/"
        links={[
          { href: "/", label: t("nav.home") },
          { href: "/track", label: t("nav.track_short") },
          { href: "/analytics", label: t("nav.analytics") },
        ]}
      />

      {/* HERO */}
      <section className="uf-hero">
        <img className="uf-hero-whistle" src={TVK_LOGO} alt="" aria-hidden="true" />
        <div className="wrap">
          <span className="uf-hero-badge">{t("upcoming.hero.badge")}</span>
          <span className="ph-eyebrow">{t("upcoming.hero.eyebrow")}</span>
          <h1>{t("upcoming.hero.title")}</h1>
          <p className="uf-hero-subtitle">{t("upcoming.hero.subtitle")}</p>
          <div className="uf-hero-stats">
            <div className="uf-hero-stat">
              <b>{UPCOMING_FEATURES.length}</b>
              <span>{t("upcoming.hero.stat_services")}</span>
            </div>
            <div className="uf-hero-stat">
              <b>∞</b>
              <span>{t("upcoming.hero.stat_status_val")}</span>
            </div>
          </div>
          <div className="uf-hero-illustration" aria-hidden="true">
            <svg viewBox="0 0 200 140" className="uf-hero-svg">
              <circle cx="100" cy="70" r="58" className="uf-hero-ring" />
              <circle cx="100" cy="70" r="40" className="uf-hero-ring uf-hero-ring-2" />
              <path d="M78 70l14 14 30-30" className="uf-hero-check" />
            </svg>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="sec-pad uf-grid-sec">
        <div className="wrap">
          <div className="sec-head center">
            <span className="sec-eyebrow">{t("upcoming.grid.eyebrow")}</span>
            <h2>{t("upcoming.grid.title")}</h2>
            <p>{t("upcoming.grid.desc")}</p>
            <button
              type="button"
              className="uf-expand-all"
              onClick={() => setExpandAll((v) => !v)}
            >
              {expandAll ? t("upcoming.card.collapse_all") : t("upcoming.card.expand_all")}
            </button>
          </div>
          <div className="uf-grid">
            {UPCOMING_FEATURES.map((feature) => (
              <FeatureCard
                key={feature.id}
                id={feature.id}
                paths={feature.icon}
                expandedByDefault={expandAll}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="uf-cta">
        <div className="wrap">
          <div className="uf-cta-box">
            <h2>{t("upcoming.cta.title")}</h2>
            <p>{t("upcoming.cta.desc")}</p>
            <div className="uf-cta-actions">
              <Link className="btn btn-gold magnetic" href="/">
                {t("upcoming.cta.btn_home")}
              </Link>
              <Link className="btn btn-ghost magnetic" href="/track">
                {t("upcoming.cta.btn_track")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TvkAppFooter />
    </div>
  );
}
