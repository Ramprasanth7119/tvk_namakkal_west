"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import "../analytics/analytics.css";
import { TVK_LOGO } from "@/lib/brand";
import TvkAppFooter from "@/components/TvkAppFooter";
import TvkTopBar from "@/components/TvkTopBar";
import { normalizeStatus } from "@/lib/complaintStatus";
import WhistleCursor, { useWhistleCursor } from "@/components/WhistleCursor";
import { useLanguage } from "@/components/LanguageProvider";
import { labelComplaintCategory } from "@/lib/complaintCategories";
import { SolutionEvidencePanel } from "@/components/ComplaintMediaPanels";

function timelineNote(
  status: string,
  rawNotes: string | undefined,
  t: (key: string, vars?: Record<string, string>) => string,
  lang: string
): string {
  const norm = normalizeStatus(status);
  const key = `track.timeline.note.${norm}`;
  const translated = t(key);
  if (translated !== key) return translated;
  if (lang === "ta" && rawNotes) return rawNotes;
  return t("track.timeline.default_note", { label: t(`status.${norm}`) });
}

function TrackPageContent() {
  const searchParams = useSearchParams();
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { lang, t } = useLanguage();

  // Enable whistle cursor
  useWhistleCursor({ theme: "gold" });

  const lookupTracking = async (id: string) => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const cleanId = id.trim().toUpperCase();
      const res = await fetch(`/api/track?trackingId=${encodeURIComponent(cleanId)}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || t("track.not_found"));
      }
    } catch (err) {
      setError(t("track.conn_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramId = searchParams.get("trackingId");
    if (paramId) {
      setTrackingId(paramId);
      lookupTracking(paramId);
    }
  }, [searchParams]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await lookupTracking(trackingId);
  };

  return (
    <div className="analytics-body min-h-screen">
      <WhistleCursor />
      <TvkTopBar
        title={t("track.title")}
        brandHref="/"
        links={[
          { href: "/analytics", label: t("nav.analytics") },
          { href: "/", label: t("nav.home") },
        ]}
      />

      <section className="phero" style={{ paddingBottom: "2rem" }}>
        <img className="ph-medal-whistle" src={TVK_LOGO} alt="" aria-hidden="true" />
        <div className="wrap flex flex-col items-start gap-4">
          <span className="ph-eyebrow">{t("track.eyebrow")}</span>
          <h1>{t("track.title")}</h1>
          <p style={{ maxWidth: "700px", margin: 0, color: "rgba(255,255,255,0.8)" }}>
            {t("track.desc")}
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
        <div className="card" style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem" }}>
          <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label htmlFor="trackingId" style={{ fontWeight: 800, color: "var(--m-800)" }}>
              {t("track.label")}
            </label>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input
                id="trackingId"
                type="text"
                placeholder={t("track.placeholder")}
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                required
                style={{
                  flex: "1 1 240px",
                  padding: "0.85rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid var(--line)",
                  fontSize: "1rem",
                  fontWeight: 700,
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="verify-btn"
                style={{ padding: "0.85rem 1.5rem", fontSize: "1rem", whiteSpace: "nowrap" }}
              >
                {loading ? t("track.btn_loading") : t("track.btn")}
              </button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: 1 }}>
              {t("track.hint")}
            </p>
          </form>

          {error && (
            <div className="status-badge error" style={{ marginTop: "1.5rem" }}>
              <span> {error}</span>
            </div>
          )}

          {result && (
            <div style={{ marginTop: "2rem", borderTop: "1px solid var(--line)", paddingTop: "1.5rem" }}>
              <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", textAlign: "center" }}>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{t("track.meta.id")}</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 900, color: "var(--m-800)", letterSpacing: "0.02em" }}>{result.trackingId}</p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{t("track.meta.category")}</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 700 }}>{labelComplaintCategory(result.category, t)}{result.subcategory ? ` · ${labelComplaintCategory(result.subcategory, t)}` : ""}</p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{t("track.meta.constituency")}</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 700 }}>{t(result.constituency)}</p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{t("track.meta.status")}</small>
                  <p style={{ margin: "0.25rem 0 0" }}>
                    <span className={`badge ${normalizeStatus(result.status) === "resolved" ? "ok" : normalizeStatus(result.status) === "registered" ? "pend" : "warn"}`} style={{ display: "inline-flex" }}>
                      <i></i>{t(`status.${normalizeStatus(result.status)}`)}
                    </span>
                  </p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{t("track.meta.created")}</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 600 }}>
                    {result.createdAt ? new Date(result.createdAt).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN") : "-"}
                  </p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{t("track.meta.updated")}</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 600 }}>
                    {result.updatedAt ? new Date(result.updatedAt).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN") : "-"}
                  </p>
                </div>
              </div>

              {/* RESPONSIBILITY DETAILS */}
              {(result.solvedBy || result.verifiedBy || result.approvedBy) && (
                <div style={{ marginTop: "2rem", background: "rgba(254, 203, 2, 0.05)", border: "1px dashed var(--gold)", padding: "1.25rem", borderRadius: "0.75rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "var(--m-800)", marginBottom: "0.75rem" }}>
                    {t("track.officers.title")}
                  </h3>
                  <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    {result.solvedBy && (
                      <div>
                        <small style={{ color: "var(--ink-soft)", fontWeight: 700, display: "block" }}>{t("track.officers.solver")}</small>
                        <b style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{result.solvedBy}</b>
                        <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.7 }}>{t("common.field_officer")}</span>
                      </div>
                    )}
                    {result.verifiedBy && (
                      <div>
                        <small style={{ color: "var(--ink-soft)", fontWeight: 700, display: "block" }}>{t("track.officers.verifier")}</small>
                        <b style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{result.verifiedBy}</b>
                        <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.7 }}>{t("common.representative")}</span>
                      </div>
                    )}
                    {result.approvedBy && (
                      <div>
                        <small style={{ color: "var(--ink-soft)", fontWeight: 700, display: "block" }}>{t("track.officers.approver")}</small>
                        <b style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{result.approvedBy}</b>
                        <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.7 }}>{t("common.super_admin")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(result.beforeImages?.length || result.afterImages?.length || result.videos?.length || result.audios?.length || result.workNotes) ? (
                <div style={{ marginTop: "2rem" }}>
                  <SolutionEvidencePanel
                    beforeImages={result.beforeImages}
                    afterImages={result.afterImages}
                    videos={result.videos}
                    audios={result.audios}
                    workNotes={result.workNotes}
                    title={t("track.evidence.title")}
                  />
                </div>
              ) : null}

              {/* TIMELINE */}
              <div style={{ marginTop: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--m-800)", marginBottom: "1rem" }}>
                  {t("track.timeline.title")}
                </h3>
                <div className="activity-timeline" style={{ padding: '0.5rem 0' }}>
                  {(result.timeline || []).map((step: any, idx: number) => {
                    const norm = normalizeStatus(step.status);
                    const isLast = idx === result.timeline.length - 1;
                    return (
                      <div key={idx} className="timeline-item" style={{ display: 'flex', gap: '1rem', marginBottom: isLast ? 0 : '1.5rem', position: 'relative' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div className="timeline-badge" style={{ 
                            background: norm === 'resolved' ? '#5E8C3A' : norm === 'registered' ? '#FECB02' : '#E08600', 
                            color: 'white',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            zIndex: 2
                          }}>
                            {idx + 1}
                          </div>
                          {!isLast && <div style={{ width: '2px', flex: 1, background: '#E5E7EB', minHeight: '20px', zIndex: 1, marginTop: '4px' }}></div>}
                        </div>
                        <div style={{ flex: 1, background: '#F9FAFB', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <b style={{ fontSize: '0.9rem', color: '#111' }}>{t(`status.${norm}`)}</b>
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>
                              {step.updatedAt ? new Date(step.updatedAt).toLocaleString(lang === "ta" ? "ta-IN" : "en-IN") : ""}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#555', lineHeight: '1.4' }}>
                            {timelineNote(step.status, step.notes, t, lang)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <TvkAppFooter tagline={`${t("track.title")} · ${t("track.eyebrow")}`} />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="analytics-body min-h-screen flex items-center justify-center">
        <p style={{ fontWeight: 700 }}>Loading...</p>
      </div>
    }>
      <TrackPageContent />
    </Suspense>
  );
}
