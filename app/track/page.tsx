"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import "../analytics/analytics.css";
import { TVK_LOGO } from "@/lib/brand";
import TvkAppFooter from "@/components/TvkAppFooter";
import TvkTopBar from "@/components/TvkTopBar";
import { normalizeStatus } from "@/lib/complaintStatus";
import WhistleCursor, { useWhistleCursor } from "@/components/WhistleCursor";

const STATUS_STEPS = [
  { code: "pend", label: "பதிவில்", icon: "" },
  { code: "warn", label: "நடவடிக்கையில்", icon: "" },
  { code: "ok", label: "தீர்க்கப்பட்டது", icon: "✓" },
];

function TrackPageContent() {
  const searchParams = useSearchParams();
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      <WhistleCursor />
      <TvkTopBar
        title="மனு நிலை அறிதல்"
        brandHref="/"
        links={[
          { href: "/analytics", label: "பகுப்பாய்வு" },
          { href: "/", label: "முகப்பு" },
        ]}
      />

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

      <div className="wrap" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
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
                {loading ? "தேடுகிறது..." : "நிலையை அறி "}
              </button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", margin: 1 }}>
              எ.கா. ETT-2026-00001 — மனு சமர்ப்பித்த பின் வழங்கப்பட்ட கண்காணிப்பு எண்ணை உள்ளிடவும்.
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
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>கண்காணிப்பு எண்</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 900, color: "var(--m-800)", letterSpacing: "0.02em" }}>{result.trackingId}</p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>வகை</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 700 }}>{result.category}{result.subcategory ? ` · ${result.subcategory}` : ""}</p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>தொகுதி</small>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 700 }}> {result.constituency}</p>
                </div>
                <div>
                  <small style={{ color: "var(--ink-soft)", fontWeight: 700 }}>தற்போதைய நிலை</small>
                  <p style={{ margin: "0.25rem 0 0" }}>
                    <span className={`badge ${result.status === "resolved" ? "ok" : result.status === "registered" ? "pend" : "warn"}`} style={{ display: "inline-flex" }}>
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

              {/* RESPONSIBILITY DETAILS */}
              {(result.solvedBy || result.verifiedBy || result.approvedBy) && (
                <div style={{ marginTop: "2rem", background: "rgba(254, 203, 2, 0.05)", border: "1px dashed var(--gold)", padding: "1.25rem", borderRadius: "0.75rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "var(--m-800)", marginBottom: "0.75rem" }}>
                     குறைதீர் பொறுப்பாளர்கள் விவரம்
                  </h3>
                  <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    {result.solvedBy && (
                      <div>
                        <small style={{ color: "var(--ink-soft)", fontWeight: 700, display: "block" }}>தீர்வு செய்தவர்:</small>
                        <b style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{result.solvedBy}</b>
                        <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.7 }}>களப்பணியாளர் (Field Officer)</span>
                      </div>
                    )}
                    {result.verifiedBy && (
                      <div>
                        <small style={{ color: "var(--ink-soft)", fontWeight: 700, display: "block" }}>சரிபார்த்தவர்:</small>
                        <b style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{result.verifiedBy}</b>
                        <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.7 }}>தொகுதிப் பிரதிநிதி (Representative)</span>
                      </div>
                    )}
                    {result.approvedBy && (
                      <div>
                        <small style={{ color: "var(--ink-soft)", fontWeight: 700, display: "block" }}>ஒப்புதல் வழங்கியவர்:</small>
                        <b style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{result.approvedBy}</b>
                        <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.7 }}>கட்சித் தலைமை (Super Admin)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* COMPLETED WORK PHOTOS */}
              {((result.afterImages?.length || 0) > 0 || (result.beforeImages?.length || 0) > 0) && (
                <div style={{ marginTop: "2rem", background: "rgba(94, 140, 58, 0.06)", border: "1px solid rgba(94, 140, 58, 0.25)", padding: "1.25rem", borderRadius: "0.75rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "var(--m-800)", marginBottom: "0.85rem" }}>
                    முடிக்கப்பட்ட பணி – புகைப்படங்கள் (Completed Work Photos)
                  </h3>
                  <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                    <div>
                      <small style={{ color: "var(--ink-soft)", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>பணிக்கு முன் (Before)</small>
                      {(result.beforeImages?.length || 0) > 0 ? (
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {result.beforeImages.map((img: string, idx: number) => (
                            <a href={img} target="_blank" rel="noopener noreferrer" key={idx} style={{ display: "block", width: "92px", height: "92px", borderRadius: "0.5rem", overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
                              <img src={img} alt={`Before ${idx + 1}`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontStyle: "italic" }}>புகைப்படம் இல்லை</span>
                      )}
                    </div>
                    <div>
                      <small style={{ color: "var(--ink-soft)", fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>பணிக்கு பின் (After)</small>
                      {(result.afterImages?.length || 0) > 0 ? (
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          {result.afterImages.map((img: string, idx: number) => (
                            <a href={img} target="_blank" rel="noopener noreferrer" key={idx} style={{ display: "block", width: "92px", height: "92px", borderRadius: "0.5rem", overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
                              <img src={img} alt={`After ${idx + 1}`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)", fontStyle: "italic" }}>புகைப்படம் இல்லை</span>
                      )}
                    </div>
                  </div>
                  {result.workNotes && (
                    <p style={{ margin: "0.85rem 0 0 0", fontSize: "0.85rem", color: "var(--ink)", lineHeight: 1.5 }}>
                      <b style={{ color: "var(--m-800)" }}>பணி குறிப்பு:</b> {result.workNotes}
                    </p>
                  )}
                </div>
              )}

              {/* TIMELINE */}
              <div style={{ marginTop: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--m-800)", marginBottom: "1rem" }}>
                   மனு நிலை போக்கு (Timeline)
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
                            <b style={{ fontSize: '0.9rem', color: '#111' }}>{step.label}</b>
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>
                              {step.updatedAt ? new Date(step.updatedAt).toLocaleString("ta-IN") : ""}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#555', lineHeight: '1.4' }}>
                            {step.notes || `மனுவின் நிலை "${step.label}" என புதுப்பிக்கப்பட்டது.`}
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
