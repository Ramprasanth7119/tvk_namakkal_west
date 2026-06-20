"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import "../analytics/analytics.css";
import { TVK_LOGO } from "@/lib/brand";
import TvkAppFooter from "@/components/TvkAppFooter";

const STATUS_STEPS = [
  { code: "pend", label: "பதிவில்", icon: "📝" },
  { code: "warn", label: "நடவடிக்கையில்", icon: "⏳" },
  { code: "ok", label: "தீர்க்கப்பட்டது", icon: "✓" },
];

function TrackPageContent() {
  const searchParams = useSearchParams();
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        setError(data.error || "மனு கண்டறியப்படவில்லை");
      }
    } catch (err) {
      setError("இணைப்புப் பிழை. மீண்டும் முயற்சிக்கவும்.");
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

  const getStepIndex = (code: string) => STATUS_STEPS.findIndex((s) => s.code === code);

  return (
    <div className="analytics-body min-h-screen">
      <header className="topbar">
        <div className="topbar-in">
          <Link className="tb-brand" href="/">
            <img src={TVK_LOGO} alt="TVK" className="tvk-brand-logo" />
            <span>
              <small>TVK · Namakkal West</small>
              <b>மனு நிலை அறிதல்</b>
            </span>
          </Link>
          <div className="tb-actions">
            <Link className="tb-back" href="/analytics">📊 பகுப்பாய்வு</Link>
            <Link className="tb-back" href="/">முகப்பு</Link>
          </div>
        </div>
      </header>

      <section className="phero" style={{ paddingBottom: "2rem" }}>
        <img className="ph-medal-whistle" src={TVK_LOGO} alt="" aria-hidden="true" />
        <div className="wrap flex flex-col items-start gap-4">
          <span className="ph-eyebrow">பொது வெளிப்படைத்தன்மை · Public Transparency</span>
          <h1>மனு நிலை அறிதல்</h1>
          <p style={{ maxWidth: "700px", margin: 0, color: "rgba(255,255,255,0.8)" }}>
            உங்கள் குறைதீர் மனுவின் கண்காணிப்பு எண்ணை உள்ளிட்டு, அதன் தற்போதைய நிலை மற்றும் தீர்வு போக்கை அறிந்து கொள்ளுங்கள்.
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: "4rem" }}>
        <div className="card" style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem" }}>
          <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label htmlFor="trackingId" style={{ fontWeight: 800, color: "var(--m-800)" }}>
              கண்காணிப்பு எண் (Tracking ID)
            </label>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input
                id="trackingId"
                type="text"
                placeholder="ETT-2026-00001"
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
                {loading ? "தேடுகிறது..." : "நிலையை அறி 🔍"}
              </button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: 1 }}>
              எ.கா. ETT-2026-00001 — மனு சமர்ப்பித்த பின் வழங்கப்பட்ட கண்காணிப்பு எண்ணை உள்ளிடவும்.
            </p>
          </form>

          {error && (
            <div className="status-badge error" style={{ marginTop: "1.5rem" }}>
              <span>❌ {error}</span>
            </div>
          )}

          {result && (
            <div style={{ marginTop: "2rem", borderTop: "1px solid var(--line)", paddingTop: "1.5rem" }}>
              <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>கண்காணிப்பு எண்</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 900, color: "var(--m-800)" }}>{result.trackingId}</p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>வகை</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 700 }}>{result.category}{result.subcategory ? ` · ${result.subcategory}` : ""}</p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>தொகுதி</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 700 }}>📍 {result.constituency}</p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>தற்போதைய நிலை</small>
                  <p style={{ margin: "0.25rem 0 0" }}>
                    <span className={`badge ${result.status}`} style={{ display: "inline-flex" }}>
                      <i></i>{result.statusLabel}
                    </span>
                  </p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>பதிவு தேதி</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 600 }}>
                    {result.createdAt ? new Date(result.createdAt).toLocaleDateString("ta-IN") : "-"}
                  </p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>கடைசி புதுப்பிப்பு</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 600 }}>
                    {result.updatedAt ? new Date(result.updatedAt).toLocaleDateString("ta-IN") : "-"}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--m-800)", marginBottom: "1rem" }}>
                  மனு நிலை போக்கு (Timeline)
                </h3>
                <div className="activity-timeline">
                  {(result.timeline || []).map((step: any, idx: number) => {
                    const stepIdx = getStepIndex(step.status);
                    const stepMeta = STATUS_STEPS[stepIdx] || STATUS_STEPS[0];
                    return (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-badge" style={{ background: stepIdx === 2 ? "var(--ok)" : stepIdx === 1 ? "var(--warn)" : "var(--pend)" }}>
                          {stepMeta.icon}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-id">{stepMeta.label}</span>
                            <span className="timeline-date">
                              {step.updatedAt ? new Date(step.updatedAt).toLocaleDateString("ta-IN") : ""}
                            </span>
                          </div>
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

      <TvkAppFooter tagline="மனு நிலை அறிதல் · பொது வெளிப்படைத்தன்மை" />
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="analytics-body min-h-screen flex items-center justify-center">
        <p style={{ fontWeight: 700 }}>ஏற்றப்படுகிறது...</p>
      </div>
    }>
      <TrackPageContent />
    </Suspense>
  );
}
