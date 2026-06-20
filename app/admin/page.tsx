"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CONSTITUENCIES } from "@/lib/constituencies";
import { TVK_LOGO } from "@/lib/brand";
import TvkAppFooter from "@/components/TvkAppFooter";
import VoterRegistrySection from "@/components/admin/VoterRegistrySection";
import WhistleCursor, { useWhistleCursor } from "@/components/WhistleCursor";
import "../analytics/analytics.css";

export default function AdminPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Stats and overview states
  const [stats, setStats] = useState<any>({
    totalReps: 0,
    activeReps: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
  });
  const [constituencyOverview, setConstituencyOverview] = useState<any[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Representatives states
  const [representatives, setRepresentatives] = useState<any[]>([]);
  const [isRepsLoading, setIsRepsLoading] = useState(true);

  // Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<any | null>(null);

  // Create Form Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [constituency, setConstituency] = useState<string>(CONSTITUENCIES[0]);
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormErrorSuccess] = useState("");
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Edit/Reset Password Fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editConstituency, setEditConstituency] = useState<string>(CONSTITUENCIES[0]);
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState(""); // empty means no password reset
  const [editFormError, setEditFormError] = useState("");
  const [editFormSuccess, setEditFormSuccess] = useState("");
  const [isEditFormSubmitting, setIsEditFormSubmitting] = useState(false);

  // Fetch Session on Mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            if (data.user.role !== "SUPER_ADMIN") {
              // Redirect non-super-admins to analytics
              router.push("/analytics");
            } else {
              setSessionUser(data.user);
            }
          } else {
            router.push("/login?redirect=/admin");
          }
        } else {
          router.push("/login?redirect=/admin");
        }
      } catch (err) {
        console.error("Session fetch error:", err);
        router.push("/login?redirect=/admin");
      } finally {
        setIsSessionLoading(false);
      }
    };
    fetchSession();
  }, [router]);

  // Fetch Dashboard Stats & Overview
  const fetchDashboardData = async () => {
    setIsStatsLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setConstituencyOverview(data.constituencyOverview);
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Fetch All Representatives
  const fetchRepresentatives = async () => {
    setIsRepsLoading(true);
    try {
      const res = await fetch("/api/admin/representatives");
      if (res.ok) {
        const data = await res.json();
        setRepresentatives(data);
      }
    } catch (err) {
      console.error("Error fetching representatives:", err);
    } finally {
      setIsRepsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionUser) {
      fetchDashboardData();
      fetchRepresentatives();
    }
  }, [sessionUser]);

  // Handle Create Representative
  const handleCreateRep = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormErrorSuccess("");
    setIsFormSubmitting(true);

    try {
      const res = await fetch("/api/admin/representatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          name,
          phone,
          constituency,
          active,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFormErrorSuccess("பிரதிநிதி வெற்றிகரமாக உருவாக்கப்பட்டார்! 🎉");
        // Clear fields
        setUsername("");
        setPassword("");
        setName("");
        setPhone("");
        setConstituency(CONSTITUENCIES[0]);
        setActive(true);
        // Refresh tables and stats
        fetchDashboardData();
        fetchRepresentatives();
        // Close modal after brief delay
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setFormErrorSuccess("");
        }, 1500);
      } else {
        setFormError(data.error || "பிரதிநிதி உருவாக்குவதில் பிழை ஏற்பட்டது.");
      }
    } catch (err) {
      console.error("Error creating representative:", err);
      setFormError("சேவையகத்துடன் இணைப்பதில் பிழை ஏற்பட்டது.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Handle Edit Representative Setup
  const openEditModal = (rep: any) => {
    setEditingRep(rep);
    setEditName(rep.name);
    setEditPhone(rep.phone);
    setEditConstituency(rep.constituency || CONSTITUENCIES[0]);
    setEditActive(rep.active);
    setEditPassword("");
    setEditFormError("");
    setEditFormSuccess("");
    setIsEditModalOpen(true);
  };

  // Handle Update Representative
  const handleEditRep = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError("");
    setEditFormSuccess("");
    setIsEditFormSubmitting(true);

    try {
      const res = await fetch("/api/admin/representatives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editingRep.username,
          name: editName,
          phone: editPhone,
          constituency: editConstituency,
          active: editActive,
          password: editPassword !== "" ? editPassword : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditFormSuccess("விவரங்கள் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டன! 🎉");
        fetchDashboardData();
        fetchRepresentatives();
        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditingRep(null);
          setEditFormSuccess("");
        }, 1500);
      } else {
        setEditFormError(data.error || "விவரங்களைப் புதுப்பிப்பதில் பிழை ஏற்பட்டது.");
      }
    } catch (err) {
      console.error("Error updating representative:", err);
      setEditFormError("சேவையகத்துடன் இணைப்பதில் பிழை ஏற்பட்டது.");
    } finally {
      setIsEditFormSubmitting(false);
    }
  };

  const sortedRepresentatives = useMemo(() => {
    return [...representatives]
      .filter((rep) => CONSTITUENCIES.includes(rep.constituency))
      .sort((a, b) => {
      const ai = CONSTITUENCIES.indexOf(a.constituency);
      const bi = CONSTITUENCIES.indexOf(b.constituency);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [representatives]);

  useEffect(() => {
    const modalOpen = isCreateModalOpen || isEditModalOpen;
    document.body.classList.toggle("modal-open", modalOpen);
    return () => document.body.classList.remove("modal-open");
  }, [isCreateModalOpen, isEditModalOpen]);

  useWhistleCursor({ theme: "maroon", enabled: !isSessionLoading && !!sessionUser });

  if (isSessionLoading) {
    return (
      <div className="analytics-body flex flex-col items-center justify-center min-h-screen">
        <img src={TVK_LOGO} alt="" className="dfoot-whistle" style={{ marginBottom: "1.5rem" }} />
        <div className="w-12 h-12 border-4 border-[#FECB02] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-white">பாதுகாப்பான நிர்வாக அமர்வைச் சரிபார்க்கிறது...</p>
      </div>
    );
  }

  if (!sessionUser) {
    return null;
  }

  return (
    <div className="analytics-body">
      {/* TOP NAVIGATION BAR */}
      <header className="topbar admin-topbar">
        <div className="topbar-in">
          <a className="tb-brand" href="#top">
            <img src={TVK_LOGO} alt="" className="tvk-brand-logo admin-topbar-whistle" aria-hidden="true" />
            <span>
              <small>TVK · Namakkal West</small>
              <b style={{ color: "#FECB02" }}>கட்சி நிர்வாகப் பலகை (Admin Panel)</b>
            </span>
          </a>
          <div className="tb-actions">
            <a className="tb-back" href="#voter-registry">
              🗳️ வாக்காளர் பதிவேடு
            </a>
            <a className="tb-back active" href="/admin" style={{ color: "#FECB02", borderColor: "#FECB02" }}>
              ⚙️ நிர்வாகக் கட்டுப்பாடு
            </a>
            <a className="tb-back" href="/complaints">
              📋 புகார்கள் மேலாண்மை
            </a>
            {/* <a className="tb-back" href="/analytics">
              📊 பகுப்பாய்வு
            </a> */}
            <a className="tb-back" href="/">
              முகப்பு
            </a>
          </div>
        </div>
      </header>

      {/* ADMIN HERO BANNER */}
      <section className="phero" id="top" style={{ paddingBottom: "2rem" }}>
        <img className="ph-medal admin-hero-whistle" src={TVK_LOGO} alt="" aria-hidden="true" />
        <div className="wrap flex flex-col items-start gap-4">
          <span className="ph-eyebrow" style={{ background: "rgba(254, 203, 2, 0.15)", color: "#FECB02" }}>
            கண்காணிப்பு & பிரதிநிதி மேலாண்மை தொகுதி (SUPER ADMIN MODULE)
          </span>
          <div
            className="session-user-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "0.4rem 0.9rem",
              borderRadius: "2rem",
              color: "#FECB02",
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            <span>👑 சூப்பர் அட்மின்: {sessionUser.username} (தலைமைப் பொறுப்பாளர்)</span>
          </div>
          <h1>தமிழக வெற்றிக் கழகம் தலைமை மேலாண்மைப் பலகை</h1>
          <p style={{ maxWidth: "800px", margin: 0, color: "rgba(255,255,255,0.8)" }}>
            நாமக்கல் மேற்கு மாவட்டத்திற்கு உட்பட்ட மூன்று தொகுதிகளின் புகார்களையும், அவற்றைக் கையாள நியமிக்கப்பட்ட மக்கள் தொடர்புப் பிரதிநிதிகளையும் துல்லியமாக நிர்வகிக்கவும் கண்காணிக்கவும் சூப்பர் அட்மினுக்கான பிரத்யேக தளம்.
          </p>
        </div>
      </section>

      {/* DASHBOARD STATISTICS KPI GRID */}
      <section className="section admin-dashboard">
        <div className="wrap">
          <div className="kpi-grid">
            <div className="kpi" style={{ '--accent': 'var(--gold)', '--accent-bg': 'rgba(254,203,2,.12)' } as React.CSSProperties}>
              <b>{isStatsLoading ? "..." : stats.totalReps}</b>
              <span>மொத்த பிரதிநிதிகள் (Total Reps)</span>
            </div>
            <div className="kpi" style={{ '--accent': 'var(--ok)', '--accent-bg': 'var(--ok-bg)' } as React.CSSProperties}>
              <b>{isStatsLoading ? "..." : stats.activeReps}</b>
              <span>செயலில் உள்ளவர்கள் (Active Reps)</span>
            </div>
            <div className="kpi" style={{ '--accent': 'var(--red)', '--accent-bg': 'rgba(160,0,0,.1)' } as React.CSSProperties}>
              <b>{isStatsLoading ? "..." : stats.totalComplaints}</b>
              <span>மொத்தப் புகார்கள் (Total Complaints)</span>
            </div>
            <div className="kpi" style={{ '--accent': 'var(--warn)', '--accent-bg': 'var(--warn-bg)' } as React.CSSProperties}>
              <b>{isStatsLoading ? "..." : stats.pendingComplaints}</b>
              <span>நிலுவையில் உள்ளவை (Pending)</span>
            </div>
            <div className="kpi" style={{ '--accent': 'var(--ok)', '--accent-bg': 'var(--ok-bg)' } as React.CSSProperties}>
              <b>{isStatsLoading ? "..." : stats.resolvedComplaints}</b>
              <span>தீர்க்கப்பட்ட புகார்கள் (Resolved)</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section admin-dashboard" style={{ paddingTop: 0 }}>
        <div className="wrap flex flex-col gap-8">
        {/* CONSTITUENCY OVERVIEW TABLE CARD */}
        <div className="card table-card">
          <div className="tc-head">
            <div>
              <h3>📍 தொகுதி வாரியான நிலவரம் (Constituency Overview)</h3>
              <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                ஒவ்வொரு தொகுதிக்கும் பதிவு செய்யப்பட்டுள்ள புகார்கள் மற்றும் அங்கு நியமிக்கப்பட்டுள்ள செயலில் உள்ள பிரதிநிதிகள் பற்றிய கண்ணோட்டம்
              </span>
            </div>
          </div>
          <div className="tbl-scroll">
            <table>
              <thead>
                <tr>
                  <th>தொகுதி (Constituency)</th>
                  <th style={{ textAlign: "center" }}>செயலில் உள்ள பிரதிநிதி (Active Representative)</th>
                  <th style={{ textAlign: "center" }}>மொத்த புகார்கள் (Total)</th>
                  <th style={{ textAlign: "center" }}>நிலுவை (Pending)</th>
                  <th style={{ textAlign: "center" }}>தீர்வு கண்டவை (Resolved)</th>
                  <th style={{ textAlign: "center" }}>தீர்வு விகிதம் (Resolution Rate)</th>
                </tr>
              </thead>
              <tbody>
                {isStatsLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.5)" }}>
                      தகவல்கள் ஏற்றப்படுகின்றன...
                    </td>
                  </tr>
                ) : (
                  constituencyOverview.map((item, idx) => {
                    const rate = item.total > 0 ? ((item.resolved / item.total) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 800 }}>{item.constituency}</td>
                        <td style={{ textAlign: "center" }}>
                          {item.representative && !item.representative.includes("நியமிக்கப்படவில்லை") ? (
                            <span className="badge ok" style={{ display: "inline-flex" }}>
                              <i></i>👤 {item.representative}
                            </span>
                          ) : (
                            <span className="badge warn" style={{ display: "inline-flex" }}>
                              <i></i>⚠️ பிரதிநிதி இல்லை
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{item.total}</td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "var(--warn)" }}>{item.pending}</td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "var(--ok)" }}>{item.resolved}</td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                            <div style={{ width: "60px", background: "rgba(255,255,255,0.1)", height: "8px", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${rate}%`, background: "var(--ok)", height: "100%" }}></div>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* REPRESENTATIVE USERS MANAGEMENT CARD */}
        <div className="card table-card">
          <div className="tc-head">
            <div>
              <h3>👥 பிரதிநிதிகள் மேலாண்மை (Representative Management)</h3>
              <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                மனுக்களைத் தொகுதி வாரியாகக் கையாளும் மக்கள் தொடர்புப் பிரதிநிதிகளின் கணக்கு விவரங்களை உருவாக்கவும், மாற்றியமைக்கவும் மற்றும் முடக்கவும் முடியும்.
              </span>
            </div>
            <button
              className="tb-back"
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                color: "#4A080E",
                background: "#FECB02",
                fontWeight: 900,
                border: "none",
              }}
            >
              ➕ புதிய பிரதிநிதியை நியமி
            </button>
          </div>
          <div className="tbl-scroll">
            <table>
              <thead>
                <tr>
                  <th>பயனர் பெயர் (Username)</th>
                  <th>முழுப்பெயர் (Full Name)</th>
                  <th>தொலைபேசி (Mobile)</th>
                  <th style={{ textAlign: "center" }}>ஒதுக்கப்பட்ட தொகுதி (Assigned Constituency)</th>
                  <th style={{ textAlign: "center" }}>கணக்கு நிலை (Status)</th>
                  <th style={{ textAlign: "center" }}>செயல்கள் (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {isRepsLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.5)" }}>
                      தரவுகள் ஏற்றப்படுகின்றன...
                    </td>
                  </tr>
                ) : sortedRepresentatives.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.5)" }}>
                      பிரதிநிதிகள் யாரும் இதுவரை பதிவு செய்யப்படவில்லை.
                    </td>
                  </tr>
                ) : (
                  sortedRepresentatives.map((rep) => (
                    <tr key={rep._id || rep.username}>
                      <td style={{ fontWeight: 800 }}>@{rep.username}</td>
                      <td>{rep.name || "விவரம் இல்லை"}</td>
                      <td>{rep.phone || "விவரம் இல்லை"}</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>
                        <span className="badge pend" style={{ display: "inline-flex" }}>
                          <i></i>📍 {rep.constituency}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {rep.active ? (
                          <span className="badge ok" style={{ display: "inline-flex" }}><i></i>செயலில் (Active)</span>
                        ) : (
                          <span className="badge warn" style={{ display: "inline-flex" }}><i></i>முடக்கப்பட்டது</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => openEditModal(rep)}
                          className="tfilt"
                          style={{ cursor: "pointer" }}
                        >
                          ✏️ தொகு / திருத்து
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </section>

      <VoterRegistrySection />

      <TvkAppFooter tagline="கட்சி நிர்வாகப் பலகை · SUPER ADMIN" />

      {/* CREATE REPRESENTATIVE MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content admin-modal-content" style={{ maxWidth: "520px" }}>
            <div className="admin-modal-header">
              <img src={TVK_LOGO} alt="" className="admin-modal-whistle" aria-hidden="true" />
              <h3>➕ புதிய தொகுதிப் பிரதிநிதி நியமனம்</h3>
              <button type="button" className="admin-modal-close" onClick={() => setIsCreateModalOpen(false)} aria-label="மூடு">✕</button>
            </div>
            <form onSubmit={handleCreateRep} className="admin-modal-body">
              <div className="admin-modal-field">
                <label htmlFor="rep-username">பயனர் பெயர் (Username) *</label>
                <input id="rep-username" type="text" placeholder="e.g. rep_komarapalayam" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="rep-password">நுழைவு கடவுச்சொல் (Password) *</label>
                <input id="rep-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="rep-name">முழுப்பெயர் (Full Name)</label>
                <input id="rep-name" type="text" placeholder="e.g. கபிலன்" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="rep-phone">தொலைபேசி எண் (Phone Mobile)</label>
                <input id="rep-phone" type="tel" placeholder="e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="rep-constituency">ஒதுக்கப்படும் தொகுதி (Assign Constituency) *</label>
                <select id="rep-constituency" value={constituency} onChange={(e) => setConstituency(e.target.value)} required title="தொகுதி">
                  {CONSTITUENCIES.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="admin-checkbox-row">
                <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} />
                <label htmlFor="active">கணக்கை உடனே செயல்பாட்டுக்கு கொண்டுவரவும் (Set account as Active)</label>
              </div>
              {formError && <div className="admin-form-message error">⚠️ {formError}</div>}
              {formSuccess && <div className="admin-form-message success">✅ {formSuccess}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => setIsCreateModalOpen(false)}>ரத்து செய்</button>
                <button type="submit" className="submit-btn" disabled={isFormSubmitting}>
                  {isFormSubmitting ? "பதிவு செய்யப்படுகிறது..." : "பிரதிநிதியை நியமி 🚩"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REPRESENTATIVE MODAL */}
      {isEditModalOpen && editingRep && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content admin-modal-content" style={{ maxWidth: "520px" }}>
            <div className="admin-modal-header">
              <img src={TVK_LOGO} alt="" className="admin-modal-whistle" aria-hidden="true" />
              <h3>✏️ பிரதிநிதி கணக்கு திருத்தம் (@{editingRep.username})</h3>
              <button type="button" className="admin-modal-close" onClick={() => { setIsEditModalOpen(false); setEditingRep(null); }} aria-label="மூடு">✕</button>
            </div>
            <form onSubmit={handleEditRep} className="admin-modal-body">
              <div className="admin-modal-field">
                <label htmlFor="edit-name">முழுப்பெயர் (Full Name)</label>
                <input id="edit-name" type="text" placeholder="முழுப்பெயர்" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="edit-phone">தொலைபேசி எண் (Phone Mobile)</label>
                <input id="edit-phone" type="tel" placeholder="தொலைபேசி எண்" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="edit-constituency">ஒதுக்கப்படும் தொகுதி (Assign Constituency) *</label>
                <select id="edit-constituency" value={editConstituency} onChange={(e) => setEditConstituency(e.target.value)} required title="தொகுதி">
                  {CONSTITUENCIES.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="admin-password-block admin-modal-field">
                <label htmlFor="edit-password">🔑 கடவுச்சொல்லை மீட்டமை (Optional Password Reset)</label>
                <input id="edit-password" type="password" placeholder="புதிய கடவுச்சொல் (மாற்ற விரும்பினால் மட்டும்)" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                <small>கடவுச்சொல்லை மாற்றத் தேவையில்லை எனில் இதைக் காலியாக விடவும்.</small>
              </div>
              <div className="admin-checkbox-row">
                <input type="checkbox" id="editActive" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                <label htmlFor="editActive">கணக்கு செயல்பாட்டில் இருக்கட்டும் (Set account as Active)</label>
              </div>
              {editFormError && <div className="admin-form-message error">⚠️ {editFormError}</div>}
              {editFormSuccess && <div className="admin-form-message success">✅ {editFormSuccess}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => { setIsEditModalOpen(false); setEditingRep(null); }}>ரத்து செய்</button>
                <button type="submit" className="submit-btn" disabled={isEditFormSubmitting}>
                  {isEditFormSubmitting ? "புதுப்பிக்கப்படுகிறது..." : "மாற்றங்களைச் சேமி 🚩"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <WhistleCursor />
    </div>
  );
}
