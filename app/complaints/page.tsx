"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import "../analytics/analytics.css";
import { CONSTITUENCIES } from "@/lib/constituencies";
import { TVK_LOGO } from "@/lib/brand";
import TvkAppFooter from "@/components/TvkAppFooter";
import TvkTopBar, { type TopBarLink } from "@/components/TvkTopBar";
import { getComplaintPhotos, getComplaintVideo } from "@/lib/complaintMedia";
import { getGoogleMapsEmbedUrl, getGoogleMapsOpenUrl } from "@/lib/maps";
import { normalizeStatus } from "@/lib/complaintStatus";
import { useLanguage } from "@/components/LanguageProvider";

const CATEGORIES: Record<string, string[]> = {
  "மின்சாரம்": ["மின்கம்பம் பழுது", "அடிக்கடி மின்தடை", "தொங்கும் மின் கம்பிகள்", "பிற"],
  "சாலை": ["சாலை சேதம்", "புதிய சாலை தேவை", "வேகத்தடை தேவை", "பிற"],
  "குடிநீர்": ["குடிநீர் குழாய் உடைப்பு", "குடிநீர் வராமை", "அசுத்தமான குடிநீர்", "பிற"],
  "கழிவுநீர்": ["சாக்கடை அடைப்பு", "கழிவுநீர் தேக்கம்", "பிற"],
  "சுகாதாரம்": ["குப்பை அள்ளப்படவில்லை", "கொசு மருந்து தெளிக்க வேண்டும்", "பிற"],
  "போக்குவரத்து": ["பேருந்து வசதி குறைபாடு", "போக்குவரத்து நெரிசல்", "பிற"],
  "தெருவிளக்கு": ["தெருவிளக்கு எரியவில்லை", "புதிய தெருவிளக்கு கம்பம் தேவை", "பிற"],
  "கல்வி": ["பள்ளி கட்டிட பழுது", "பள்ளி கழிப்பறை வசதி", "பிற"],
  "மருத்துவம்": ["ஆரம்ப சுகாதார நிலையம்", "மருந்து தட்டுப்பாடு", "பிற"],
  "அரசு நலத்திட்டம்": ["முதியோர் உதவித்தொகை", "ரேஷன் கடை குறைபாடு", "பிற"],
  "வருவாய் துறை": ["பட்டா மாறுதல்", "சான்றிதழ் கோரிக்கை", "பிற"],
  "காவல்துறை": ["பாதுகாப்பு குறைபாடு", "புகார் மனு மீது நடவடிக்கை", "பிற"],
  "சுற்றுச்சூழல்": ["நீர்நிலை மாசுபடுதல்", "காற்று மாசுபடுதல்", "பிற"],
  "பிற": ["பிற குறைபாடுகள்"]
};

export default function ComplaintsManagementPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const { lang, t } = useLanguage();

  // Filter states
  const [curArea, setCurArea] = useState("அனைத்தும்");
  const [curStatus, setCurStatus] = useState("all");
  const [curCategory, setCurCategory] = useState("அனைத்தும்");
  const [curSearch, setCurSearch] = useState("");

  // Modal detail states
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState("");

  // Field Officers / Assignment / Review states
  const [officers, setOfficers] = useState<any[]>([]);
  const [selectedOfficerUsername, setSelectedOfficerUsername] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Create / Edit Field Officer states
  const [isOfficersLoading, setIsOfficersLoading] = useState(false);
  const [isCreateOfficerModalOpen, setIsCreateOfficerModalOpen] = useState(false);
  const [isEditOfficerModalOpen, setIsEditOfficerModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<any | null>(null);

  // Field Officer Form fields
  const [offUsername, setOffUsername] = useState("");
  const [offPassword, setOffPassword] = useState("");
  const [offName, setOffName] = useState("");
  const [offPhone, setOffPhone] = useState("");
  const [offActive, setOffActive] = useState(true);
  const [offError, setOffError] = useState("");
  const [offSuccess, setOffSuccess] = useState("");
  const [isOffSubmitting, setIsOffSubmitting] = useState(false);

  // Edit Field Officer Form fields
  const [editOffName, setEditOffName] = useState("");
  const [editOffPhone, setEditOffPhone] = useState("");
  const [editOffPassword, setEditOffPassword] = useState("");
  const [editOffActive, setEditOffActive] = useState(true);
  const [editOffError, setEditOffError] = useState("");
  const [editOffSuccess, setEditOffSuccess] = useState("");
  const [isEditOffSubmitting, setIsEditOffSubmitting] = useState(false);

  const selectedPhotos = useMemo(
    () => (selectedComplaint ? getComplaintPhotos(selectedComplaint) : []),
    [selectedComplaint]
  );
  const selectedVideo = useMemo(
    () => (selectedComplaint ? getComplaintVideo(selectedComplaint) : null),
    [selectedComplaint]
  );
  const selectedCoords = selectedComplaint?.geolocation?.latitude != null
    ? {
        lat: Number(selectedComplaint.geolocation.latitude),
        lon: Number(selectedComplaint.geolocation.longitude),
      }
    : null;

  // Fetch Session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setSessionUser(data.user);
            if (data.user.role === "REPRESENTATIVE") {
              setCurArea(data.user.constituency);
            }
          } else {
            router.push("/login?redirect=/complaints");
          }
        } else {
          router.push("/login?redirect=/complaints");
        }
      } catch (err) {
        console.error("Session fetch error:", err);
        router.push("/login?redirect=/complaints");
      } finally {
        setIsSessionLoading(false);
      }
    };
    fetchSession();
  }, [router]);

  // Fetch Field Officers
  const fetchOfficers = async () => {
    setIsOfficersLoading(true);
    try {
      const res = await fetch("/api/representative/officers");
      if (res.ok) {
        const data = await res.json();
        setOfficers(data);
      }
    } catch (err) {
      console.error("Error fetching field officers:", err);
    } finally {
      setIsOfficersLoading(false);
    }
  };

  useEffect(() => {
    if (sessionUser && (sessionUser.role === "REPRESENTATIVE" || sessionUser.role === "SUPER_ADMIN")) {
      fetchOfficers();
    }
  }, [sessionUser]);

  // Fetch Complaints
  const fetchComplaints = async () => {
    setIsLoadingComplaints(true);
    try {
      const res = await fetch("/api/complaints");
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  useEffect(() => {
    if (sessionUser) {
      fetchComplaints();
    }
  }, [sessionUser]);

  // Auto load assignedTo field officer when modal opens
  useEffect(() => {
    if (selectedComplaint) {
      setSelectedOfficerUsername(selectedComplaint.assignedTo || "");
      setRejectionReason("");
    } else {
      setSelectedOfficerUsername("");
      setRejectionReason("");
    }
  }, [selectedComplaint]);

  // Allowed areas for filter chips
  const allowedAreas = useMemo(() => {
    if (!sessionUser) return ["அனைத்தும்"];
    if (sessionUser.role === "SUPER_ADMIN") {
      return ["அனைத்தும்", ...CONSTITUENCIES];
    }
    return [sessionUser.constituency];
  }, [sessionUser]);

  // Filter logic
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const norm = normalizeStatus(c.status);

      // Area Filter
      if (curArea !== "அனைத்தும்" && c.constituency !== curArea) return false;

      // Status Filter
      if (curStatus !== "all") {
        if (curStatus === "pend" || curStatus === "registered") {
          if (norm !== "registered") return false;
        } else if (curStatus === "warn" || curStatus === "under_review") {
          if (norm !== "under_review") return false;
        } else if (curStatus === "ok" || curStatus === "resolved") {
          if (norm !== "resolved") return false;
        } else {
          if (norm !== curStatus) return false;
        }
      }

      // Category Filter
      if (curCategory !== "அனைத்தும்" && c.complaintDetails?.category !== curCategory) return false;

      // Search Filter
      if (curSearch.trim()) {
        const s = curSearch.toLowerCase();
        const tracking = (c.trackingId || "").toLowerCase();
        const citizen = (c.citizenDetails?.name || "").toLowerCase();
        const mobile = (c.citizenDetails?.mobile || "").toLowerCase();
        const desc = (c.complaintDetails?.description || "").toLowerCase();
        if (
          !tracking.includes(s) &&
          !citizen.includes(s) &&
          !mobile.includes(s) &&
          !desc.includes(s)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, curArea, curStatus, curCategory, curSearch]);

  // Active officers for assignment dropdown
  const activeOfficers = useMemo(() => {
    return officers.filter(o => o.active);
  }, [officers]);

  // Assign Officer handler
  const handleAssignOfficer = async (trackingId: string) => {
    if (!selectedOfficerUsername) return;
    setIsAssigning(true);
    setStatusUpdateMessage("");
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId,
          action: "assign",
          assignedTo: selectedOfficerUsername,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusUpdateMessage(t("complaints.modal.assign_success"));
        // Update local state
        setComplaints(prev =>
          prev.map(c =>
            c.trackingId === trackingId
              ? {
                  ...c,
                  status: "assigned",
                  assignedTo: selectedOfficerUsername,
                  assignedToName: officers.find(o => o.username === selectedOfficerUsername)?.name || selectedOfficerUsername
                }
              : c
          )
        );
        setSelectedComplaint((prev: any) =>
          prev
            ? {
                ...prev,
                status: "assigned",
                assignedTo: selectedOfficerUsername,
                assignedToName: officers.find(o => o.username === selectedOfficerUsername)?.name || selectedOfficerUsername
              }
            : null
        );
        fetchComplaints();
      } else {
        setStatusUpdateMessage(t("complaints.modal.assign_fail", { error: data.error || "" }));
      }
    } catch {
      setStatusUpdateMessage(t("track.conn_error"));
    } finally {
      setIsAssigning(false);
    }
  };

  // Review (Approve/Reject) handler
  const handleRepReview = async (trackingId: string, approve: boolean) => {
    setIsUpdatingStatus(true);
    setStatusUpdateMessage("");
    try {
      const action = approve ? "rep_approve" : "rep_reject";
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId,
          action,
          rejectionReason: approve ? undefined : rejectionReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextStatus = approve ? "pending_admin_approval" : "work_in_progress";
        setStatusUpdateMessage(approve ? t("complaints.modal.review_approve_success") : t("complaints.modal.review_reject_success"));
        setComplaints(prev =>
          prev.map(c =>
            c.trackingId === trackingId
              ? { ...c, status: nextStatus, rejectionReason: approve ? undefined : rejectionReason }
              : c
          )
        );
        setSelectedComplaint((prev: any) =>
          prev
            ? { ...prev, status: nextStatus, rejectionReason: approve ? undefined : rejectionReason }
            : null
        );
        setRejectionReason("");
        fetchComplaints();
      } else {
        setStatusUpdateMessage(`${t("common.error")}: ${data.error || ""}`);
      }
    } catch {
      setStatusUpdateMessage(t("track.conn_error"));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Update Status directly (Legacy/Admin override)
  const handleUpdateStatus = async (trackingId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    setStatusUpdateMessage("");
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId,
          action: "status_override",
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusUpdateMessage(t("complaints.modal.review_approve_success"));
        setComplaints((prev) =>
          prev.map((c) => (c.trackingId === trackingId ? { ...c, status: newStatus } : c))
        );
        setSelectedComplaint((prev: any) => (prev ? { ...prev, status: newStatus } : null));
        fetchComplaints();
      } else {
        setStatusUpdateMessage(`${t("common.error")}: ${data.error || ""}`);
      }
    } catch (err) {
      console.error(err);
      setStatusUpdateMessage(t("track.conn_error"));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Create Field Officer
  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setOffError("");
    setOffSuccess("");
    setIsOffSubmitting(true);
    try {
      const res = await fetch("/api/representative/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: offUsername.trim().toLowerCase(),
          password: offPassword,
          name: offName.trim(),
          phone: offPhone.trim(),
          active: offActive,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOffSuccess(t("complaints.fo_modal.create_success"));
        fetchOfficers();
        setTimeout(() => {
          setIsCreateOfficerModalOpen(false);
          setOffUsername("");
          setOffPassword("");
          setOffName("");
          setOffPhone("");
          setOffActive(true);
          setOffSuccess("");
        }, 1500);
      } else {
        setOffError(data.error || t("complaints.fo_modal.error_fail"));
      }
    } catch {
      setOffError(t("track.conn_error"));
    } finally {
      setIsOffSubmitting(false);
    }
  };

  // Edit Field Officer
  const handleEditOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditOffError("");
    setEditOffSuccess("");
    setIsEditOffSubmitting(true);
    try {
      const res = await fetch("/api/representative/officers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editingOfficer.username,
          name: editOffName,
          phone: editOffPhone,
          password: editOffPassword || undefined,
          active: editOffActive,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditOffSuccess(t("complaints.fo_modal.edit_success"));
        fetchOfficers();
        setTimeout(() => {
          setIsEditOfficerModalOpen(false);
          setEditingOfficer(null);
          setEditOffSuccess("");
        }, 1500);
      } else {
        setEditOffError(data.error || t("complaints.fo_modal.error_fail"));
      }
    } catch {
      setEditOffError(t("track.conn_error"));
    } finally {
      setIsEditOffSubmitting(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#220305] text-white">
        <div className="flex flex-col items-center gap-4">
          <span className="w-12 h-12 border-4 border-[#FECB02] border-t-transparent rounded-full animate-spin"></span>
          <p className="font-bold">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore — clear client state regardless */
    }
    window.location.href = "/login";
  };

  const topBarLinks: TopBarLink[] = [
    ...(sessionUser?.role === "SUPER_ADMIN"
      ? [{ href: "/admin", label: t("common.super_admin"), highlight: true }]
      : []),
    { href: "/analytics", label: t("nav.analytics") },
    { href: "/complaints", label: t("nav.complaint"), active: true },
    { href: "/", label: t("nav.home") },
    { label: t("common.logout"), onClick: handleLogout },
  ];

  return (
    <div className="analytics-body">
      <TvkTopBar title={t("complaints.portal_title")} brandHref="/complaints" links={topBarLinks} />

      {/* PAGE HERO */}
      <section className="phero" style={{ background: 'linear-gradient(135deg, #3C060B 0%, #150102 100%)', padding: '2.5rem 1rem' }}>
        <img className="ph-medal-whistle" src={TVK_LOGO} alt="" aria-hidden="true" />
        <div className="wrap flex flex-col items-start gap-4">
          <span className="ph-eyebrow" style={{ color: '#FECB02' }}>{t("complaints.eyebrow")}</span>
          {sessionUser && (
            <div className="session-user-badge" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '0.4rem 0.9rem',
              borderRadius: '2rem',
              color: '#FECB02',
              fontSize: '0.85rem',
              fontWeight: 700,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              maxWidth: '100%'
            }}>
              <span>👤</span>
              <span>
                {sessionUser.role === "SUPER_ADMIN" 
                  ? t("complaints.user_badge", { username: sessionUser.username, role: t("common.super_admin") })
                  : t("complaints.user_badge", { username: sessionUser.username, role: t("complaints.role_rep", { constituency: t(sessionUser.constituency) }) })}
              </span>
            </div>
          )}
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{t("complaints.title")}</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '800px', margin: 0 }}>
            {t("complaints.desc")}
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <div className="filterbar">
        <div className="wrap">
          <div className="fb-row">
            {/* Area filter */}
            {(!sessionUser || sessionUser.role !== "REPRESENTATIVE") && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
                <span className="fb-label">{t("complaints.filter.area")}</span>
                <div className="area-chips">
                  {allowedAreas.map((a, i) => (
                    <button
                      key={i}
                      className={`achip ${curArea === a ? 'active' : ''}`}
                      onClick={() => setCurArea(a)}
                    >
                      {t(a)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="complaints-filter-controls">
              <div className="complaints-filter-item">
                <span className="fb-label">{t("complaints.filter.status")}</span>
                <select
                  value={curStatus}
                  onChange={(e) => setCurStatus(e.target.value)}
                  title="Filter by status"
                >
                  <option value="all">{t("status.all")}</option>
                  <option value="registered">{t("status.registered")}</option>
                  <option value="under_review">{t("status.under_review")}</option>
                  <option value="assigned">{t("status.assigned")}</option>
                  <option value="work_in_progress">{t("status.work_in_progress")}</option>
                  <option value="solution_submitted">{t("status.solution_submitted")}</option>
                  <option value="pending_rep_approval">{t("status.pending_rep_approval")}</option>
                  <option value="pending_admin_approval">{t("status.pending_admin_approval")}</option>
                  <option value="resolved">{t("status.resolved")}</option>
                </select>
              </div>

              <div className="complaints-filter-item">
                <span className="fb-label">{t("complaints.filter.category")}</span>
                <select
                  value={curCategory}
                  onChange={(e) => setCurCategory(e.target.value)}
                  title="Filter by category"
                >
                  <option value="அனைத்தும்">{t("status.all")}</option>
                  {Object.keys(CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>{t(cat)}</option>
                  ))}
                </select>
              </div>

              <div className="complaints-filter-item complaints-filter-search">
                <div className="fb-search">
                  <div className="fb-search-input-wrapper">
                    <svg viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.3-4.3" />
                    </svg>
                    <input
                      type="text"
                      placeholder={t("complaints.filter.search_ph")}
                      value={curSearch}
                      onChange={(e) => setCurSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLAINTS TABLE CONTAINER */}
      <section className="section" style={{ padding: '2rem 1rem' }}>
        <div className="wrap">
          <div className="card table-card">
            <div className="tc-head">
              <h3>{t("complaints.list_title")}</h3>
              <button 
                onClick={fetchComplaints} 
                disabled={isLoadingComplaints}
                style={{
                  background: 'rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                 {isLoadingComplaints ? t("common.loading") : t("common.refresh")}
              </button>
            </div>

            <div className="tbl-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("complaints.table.id")}</th>
                    <th>{t("complaints.table.name")}</th>
                    <th>{t("complaints.table.constituency")}</th>
                    <th>{t("complaints.table.category")}</th>
                    <th>{t("complaints.table.status")}</th>
                    <th>{t("complaints.table.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingComplaints ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                        <span className="w-8 h-8 border-4 border-[#A00000] border-t-transparent rounded-full animate-spin inline-block"></span>
                        <p style={{ marginTop: '0.5rem', fontWeight: 700 }}>{t("complaints.table.loading")}</p>
                      </td>
                    </tr>
                  ) : filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="t-empty" style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
                        {t("complaints.table.empty")}
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((c) => {
                      const createdDate = new Date(c.createdAt || Date.now());
                      const dateStr = createdDate.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN");
                      const norm = normalizeStatus(c.status);
                      const label = t(`status.${norm}`);

                      return (
                        <tr 
                          key={c._id || c.trackingId} 
                          onClick={() => {
                            setSelectedComplaint(c);
                            setStatusUpdateMessage("");
                          }}
                          style={{ cursor: 'pointer' }}
                          className="hover:bg-black/5"
                        >
                          <td className="t-id" style={{ fontWeight: 'bold', color: '#A00000' }}>
                            {c.trackingId}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {c.citizenDetails?.name || t("home.receipt.none")}
                          </td>
                          <td className="t-meta">{t(c.constituency)}</td>
                          <td>
                            <span className="t-sector" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              <i style={{ 
                                background: 
                                  c.complaintDetails?.category === "மின்சாரம்" ? "#E08600" :
                                  c.complaintDetails?.category === "சாலை" ? "#A00000" :
                                  c.complaintDetails?.category === "குடிநீர்" ? "#1F7A8C" :
                                  c.complaintDetails?.category === "கழிவுநீர்" ? "#5E8C3A" :
                                  c.complaintDetails?.category === "தெருவிளக்கு" ? "#C7A008" : "#7A5BA6",
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%'
                              }}></i>
                              <b>{t(c.complaintDetails?.category) || t("home.receipt.none")}</b>
                              {c.complaintDetails?.subcategory && <span style={{ opacity: 0.6, fontSize: '0.85em' }}> - {t(c.complaintDetails.subcategory)}</span>}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${norm === "resolved" ? "ok" : norm === "registered" ? "pend" : "warn"}`}>
                              <i></i>{label}
                            </span>
                          </td>
                          <td className="t-meta">{dateStr}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="tbl-foot" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <span dangerouslySetInnerHTML={{ __html: t("complaints.stats_summary", { count: String(filteredComplaints.length) }) }} />
              <span>{t("complaints.stats_desc")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FIELD OFFICER MANAGEMENT SECTION */}
      {sessionUser && (sessionUser.role === "REPRESENTATIVE" || sessionUser.role === "SUPER_ADMIN") && (
        <section className="section" style={{ padding: '0 1rem 2rem 1rem' }}>
          <div className="wrap">
            <div className="card table-card">
              <div className="tc-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3> {t("complaints.fo.title")}</h3>
                  <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                    {t("complaints.fo.desc")}
                    {sessionUser.role === "REPRESENTATIVE" && ` ${t("common.constituency")}: ${t(sessionUser.constituency)}`}
                  </span>
                </div>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => {
                    setOffUsername("");
                    setOffPassword("");
                    setOffName("");
                    setOffPhone("");
                    setOffActive(true);
                    setOffError("");
                    setOffSuccess("");
                    setIsCreateOfficerModalOpen(true);
                  }}
                  style={{ cursor: "pointer", background: "var(--gold)", color: "var(--m-900)", padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  {t("complaints.fo.btn_new")}
                </button>
              </div>

              <div className="tbl-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t("complaints.fo.table.username")}</th>
                      <th>{t("complaints.fo.table.name")}</th>
                      <th>{t("complaints.fo.table.phone")}</th>
                      <th style={{ textAlign: "center" }}>{t("complaints.fo.table.status")}</th>
                      <th style={{ textAlign: "center" }}>{t("common.action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isOfficersLoading ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "3rem" }}>
                          <span className="w-8 h-8 border-4 border-[#A00000] border-t-transparent rounded-full animate-spin inline-block"></span>
                          <p style={{ marginTop: '0.5rem', fontWeight: 700 }}>{t("common.loading")}</p>
                        </td>
                      </tr>
                    ) : officers.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#777" }}>
                          {t("admin.rep.empty")}
                        </td>
                      </tr>
                    ) : (
                      officers.map((off) => (
                        <tr key={off._id || off.username}>
                          <td style={{ fontWeight: 800 }}>@{off.username}</td>
                          <td>{off.name || t("home.receipt.none")}</td>
                          <td>{off.phone || t("home.receipt.none")}</td>
                          <td style={{ textAlign: "center" }}>
                            {off.active ? (
                              <span className="badge ok" style={{ display: "inline-flex" }}><i></i>{t("complaints.fo.table.active")}</span>
                            ) : (
                              <span className="badge warn" style={{ display: "inline-flex" }}><i></i>{t("complaints.fo.table.inactive")}</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOfficer(off);
                                setEditOffName(off.name);
                                setEditOffPhone(off.phone);
                                setEditOffActive(off.active);
                                setEditOffPassword("");
                                setEditOffError("");
                                setEditOffSuccess("");
                                setIsEditOfficerModalOpen(true);
                              }}
                              className="tfilt"
                              style={{ cursor: "pointer", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", padding: "0.3rem 0.6rem", borderRadius: "0.3rem", fontWeight: "bold" }}
                            >
                              {t("common.edit")}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="tbl-foot">
                <span dangerouslySetInnerHTML={{ __html: t("complaints.fo.total", { count: String(officers.length) }) }} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CREATE FIELD OFFICER MODAL */}
      {isCreateOfficerModalOpen && (
        <div className="modal-overlay admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content admin-modal-content" style={{ maxWidth: "520px" }}>
            <div className="admin-modal-header">
              <img src={TVK_LOGO} alt="" className="detail-modal-whistle" aria-hidden="true" />
              <h3>{t("complaints.fo_modal.create_title")}</h3>
              <button type="button" className="admin-modal-close" onClick={() => setIsCreateOfficerModalOpen(false)} aria-label={t("common.close")}>✕</button>
            </div>
            <form onSubmit={handleCreateOfficer} className="admin-modal-body">
              <div className="admin-modal-field">
                <label htmlFor="off-username">{t("complaints.fo_modal.username")}</label>
                <input id="off-username" type="text" placeholder="e.g. field_kumar" value={offUsername} onChange={(e) => setOffUsername(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="off-password">{t("complaints.fo_modal.password_new")}</label>
                <input id="off-password" type="password" placeholder="••••••••" value={offPassword} onChange={(e) => setOffPassword(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="off-name">{t("complaints.fo_modal.name")}</label>
                <input id="off-name" type="text" placeholder="e.g. Kumar" value={offName} onChange={(e) => setOffName(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="off-phone">{t("complaints.fo_modal.phone")}</label>
                <input id="off-phone" type="tel" placeholder="e.g. 9876543210" value={offPhone} onChange={(e) => setOffPhone(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="off-constituency">{t("common.constituency")}</label>
                <input id="off-constituency" type="text" value={t(sessionUser.constituency) || "Headquarters"} disabled style={{ background: "rgba(0,0,0,0.05)" }} title="Constituency assignment" />
              </div>
              <div className="admin-checkbox-row">
                <input type="checkbox" id="off-active" checked={offActive} onChange={(e) => setOffActive(e.target.checked)} />
                <label htmlFor="off-active">{t("complaints.fo_modal.status_active")}</label>
              </div>
              {offError && <div className="admin-form-message error">{offError}</div>}
              {offSuccess && <div className="admin-form-message success">{offSuccess}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => setIsCreateOfficerModalOpen(false)}>{t("common.cancel")}</button>
                <button type="submit" className="submit-btn" disabled={isOffSubmitting}>
                  {isOffSubmitting ? t("common.loading") : t("complaints.fo_modal.btn_create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FIELD OFFICER MODAL */}
      {isEditOfficerModalOpen && editingOfficer && (
        <div className="modal-overlay admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content admin-modal-content" style={{ maxWidth: "520px" }}>
            <div className="admin-modal-header">
              <img src={TVK_LOGO} alt="" className="detail-modal-whistle" aria-hidden="true" />
              <h3>{t("complaints.fo_modal.edit_title")} (@{editingOfficer.username})</h3>
              <button type="button" className="admin-modal-close" onClick={() => { setIsEditOfficerModalOpen(false); setEditingOfficer(null); }} aria-label={t("common.close")}>✕</button>
            </div>
            <form onSubmit={handleEditOfficer} className="admin-modal-body">
              <div className="admin-modal-field">
                <label htmlFor="edit-off-name">{t("complaints.fo_modal.name")}</label>
                <input id="edit-off-name" type="text" placeholder="Name" value={editOffName} onChange={(e) => setEditOffName(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="edit-off-phone">{t("complaints.fo_modal.phone")}</label>
                <input id="edit-off-phone" type="tel" placeholder="Mobile" value={editOffPhone} onChange={(e) => setEditOffPhone(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="edit-off-password">{t("complaints.fo_modal.password_edit")}</label>
                <input id="edit-off-password" type="password" placeholder="••••••••" value={editOffPassword} onChange={(e) => setEditOffPassword(e.target.value)} />
              </div>
              <div className="admin-checkbox-row">
                <input type="checkbox" id="editOffActive" checked={editOffActive} onChange={(e) => setEditOffActive(e.target.checked)} />
                <label htmlFor="editOffActive">{t("complaints.fo_modal.status_active")}</label>
              </div>
              {editOffError && <div className="admin-form-message error">{editOffError}</div>}
              {editOffSuccess && <div className="admin-form-message success">{editOffSuccess}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => { setIsEditOfficerModalOpen(false); setEditingOfficer(null); }}>{t("common.cancel")}</button>
                <button type="submit" className="submit-btn" disabled={isEditOffSubmitting}>
                  {isEditOffSubmitting ? t("common.loading") : t("complaints.fo_modal.btn_save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLAINT DETAILS MODAL */}
      {selectedComplaint && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content detail-modal-content">
            <div className="detail-modal-header">
              <img src={TVK_LOGO} alt="" className="detail-modal-whistle" aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, fontWeight: 700, color: '#FFF1BE' }}>{t("complaints.modal.title")}</span>
                <h3>{t("complaints.modal.id", { id: selectedComplaint.trackingId })}</h3>
              </div>
              <button type="button" className="detail-modal-close" onClick={() => setSelectedComplaint(null)} aria-label={t("common.close")}>✕</button>
            </div>

            <div className="detail-modal-body">
              <div className="detail-modal-grid">
                
                {/* citizen info */}
                <div className="detail-modal-section">
                  <h4>{t("complaints.modal.citizen_sec")}</h4>
                  <div className="detail-modal-stack">
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("tasks.modal.citizen_name")}</span> <b style={{ color: '#111' }}>{selectedComplaint.citizenDetails?.name || t("home.receipt.none")}</b></div>
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("complaints.modal.voter_id")}</span> <b style={{ color: '#111' }}>{selectedComplaint.voterId}</b></div>
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("tasks.modal.citizen_phone")}</span> <b style={{ color: '#A00000' }}>{selectedComplaint.citizenDetails?.mobile || t("home.receipt.none")}</b></div>
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("complaints.modal.ward_no")}</span> <b>{selectedComplaint.ward}</b></div>
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("common.constituency")}</span> <b>{t(selectedComplaint.constituency)}</b></div>
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("complaints.modal.address")}</span> <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, color: '#333', lineHeight: '1.4' }}>{selectedComplaint.citizenDetails?.address || t("home.receipt.none")}</p></div>
                  </div>
                </div>

                {/* complaint details info */}
                <div className="detail-modal-section">
                  <h4>{t("complaints.modal.desc_title")}</h4>
                  <div className="detail-modal-stack">
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("complaints.modal.desc_category")}</span> <b style={{ color: '#111' }}>{t(selectedComplaint.complaintDetails?.category)}</b></div>
                    {selectedComplaint.complaintDetails?.subcategory && (
                      <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("complaints.modal.desc_sub")}</span> <b>{t(selectedComplaint.complaintDetails?.subcategory)}</b></div>
                    )}
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("complaints.modal.desc_urgency")}</span> <span style={{
                      background: selectedComplaint.complaintDetails?.urgency === "அதி அவசரம்" || selectedComplaint.complaintDetails?.urgency === "urgent" ? "#FEE2E2" : "#FFF7ED",
                      color: selectedComplaint.complaintDetails?.urgency === "அதி அவசரம்" || selectedComplaint.complaintDetails?.urgency === "urgent" ? "#991B1B" : "#C2410C",
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}>{t(`home.form.grievance.urgency.${selectedComplaint.complaintDetails?.urgency || "normal"}`)}</span></div>
                    
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("track.meta.created")}:</span> <b>{new Date(selectedComplaint.createdAt).toLocaleString(lang === "ta" ? "ta-IN" : "en-IN")}</b></div>
                    
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>{t("complaints.modal.maps")}:</span> 
                      {selectedCoords ? (
                        <div className="complaint-location-block">
                          <p style={{ margin: '0.2rem 0 0.5rem 0', fontSize: '0.85rem' }}>
                             Lat: <b>{selectedCoords.lat.toFixed(5)}</b>, Lon: <b>{selectedCoords.lon.toFixed(5)}</b>
                            {selectedComplaint.geolocation.address && (
                              <span style={{ display: 'block', marginTop: '0.1rem', opacity: 0.8 }}>
                                ({selectedComplaint.geolocation.address})
                              </span>
                            )}
                          </p>
                          <div className="complaint-map-wrap">
                            <iframe
                              title="Complaint location map"
                              src={getGoogleMapsEmbedUrl(selectedCoords.lat, selectedCoords.lon)}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              allowFullScreen
                            />
                          </div>
                          <a
                            href={getGoogleMapsOpenUrl(selectedCoords.lat, selectedCoords.lon)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="complaint-map-link"
                          >
                            {t("tasks.modal.maps_open")}
                          </a>
                        </div>
                      ) : (
                        <b style={{ color: '#777' }}> {t("complaints.modal.maps_none")}</b>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* DESCRIPTION */}
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem', padding: '1.2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h4 style={{ color: '#4A080E', fontSize: '1rem', borderBottom: '2px solid #FECB02', paddingBottom: '0.4rem', marginBottom: '0.8rem', fontWeight: 800 }}>{t("tasks.modal.description")}</h4>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#222', whiteSpace: 'pre-wrap', fontWeight: 600 }}>
                  {selectedComplaint.complaintDetails?.description || t("home.receipt.none")}
                </p>
              </div>

              {/* MEDIA SECTION */}
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem', padding: '1.2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h4 style={{ color: '#4A080E', fontSize: '1rem', borderBottom: '2px solid #FECB02', paddingBottom: '0.4rem', marginBottom: '0.8rem', fontWeight: 800 }}>{t("complaints.modal.photos_sec")}</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="mobile-one-col">
                  
                  {/* Photos */}
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', display: 'block', marginBottom: '0.5rem' }}>{t("tasks.modal.submit_before")}:</span>
                    {selectedPhotos.length > 0 ? (
                      <div className="complaint-media-grid">
                        {selectedPhotos.map((photo: string, idx: number) => (
                          <a href={photo} target="_blank" rel="noopener noreferrer" key={idx} className="complaint-media-thumb">
                            <img 
                              src={photo} 
                              alt={`Complaint photo ${idx + 1}`} 
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>{t("complaints.modal.photos_none")}</p>
                    )}
                  </div>

                  {/* Video */}
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', display: 'block', marginBottom: '0.5rem' }}>{t("tasks.modal.submit_video")}:</span>
                    {selectedVideo ? (
                      <video 
                        src={selectedVideo} 
                        controls 
                        playsInline
                        className="complaint-media-video"
                      />
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>{t("complaints.modal.video_none")}</p>
                    )}
                  </div>

                </div>
              </div>

              {/* FIELD WORK EVIDENCE SECTION */}
              {(selectedComplaint.beforeImages?.length > 0 || selectedComplaint.afterImages?.length > 0 || selectedComplaint.workNotes) && (
                <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem', padding: '1.2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ color: '#4A080E', fontSize: '1rem', borderBottom: '2px solid #FECB02', paddingBottom: '0.4rem', marginBottom: '0.8rem', fontWeight: 800 }}>{t("tasks.modal.submit_sec_title")}</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }} className="mobile-one-col">
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', display: 'block', marginBottom: '0.5rem' }}>{t("tasks.modal.submitted_before")}</span>
                      {selectedComplaint.beforeImages?.length > 0 ? (
                        <div className="complaint-media-grid">
                          {selectedComplaint.beforeImages.map((photo: string, idx: number) => (
                            <a href={photo} target="_blank" rel="noopener noreferrer" key={idx} className="complaint-media-thumb">
                              <img src={photo} alt={`Before ${idx + 1}`} loading="lazy" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>{t("complaints.modal.photos_none")}</p>
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', display: 'block', marginBottom: '0.5rem' }}>{t("tasks.modal.submitted_after")}</span>
                      {selectedComplaint.afterImages?.length > 0 ? (
                        <div className="complaint-media-grid">
                          {selectedComplaint.afterImages.map((photo: string, idx: number) => (
                            <a href={photo} target="_blank" rel="noopener noreferrer" key={idx} className="complaint-media-thumb">
                              <img src={photo} alt={`After ${idx + 1}`} loading="lazy" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>{t("complaints.modal.photos_none")}</p>
                      )}
                    </div>
                  </div>

                  {selectedComplaint.videos?.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', display: 'block', marginBottom: '0.5rem' }}>{t("tasks.modal.submitted_video")}</span>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {selectedComplaint.videos.map((vid: string, idx: number) => (
                          <video key={idx} src={vid} controls playsInline className="complaint-media-video" style={{ maxWidth: '320px', height: 'auto' }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedComplaint.workNotes && (
                    <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem', borderLeft: '4px solid #5E8C3A' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#333', display: 'block', marginBottom: '0.35rem' }}>{t("tasks.modal.submitted_notes")}</span>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#111', lineHeight: '1.5', whiteSpace: 'pre-wrap', fontWeight: 600 }}>{selectedComplaint.workNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TIMELINE SECTION */}
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem', padding: '1.2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h4 style={{ color: '#4A080E', fontSize: '1rem', borderBottom: '2px solid #FECB02', paddingBottom: '0.4rem', marginBottom: '0.8rem', fontWeight: 800 }}>{t("track.timeline.title")}</h4>
                <div className="activity-timeline" style={{ padding: '0.5rem 0' }}>
                  {(() => {
                    const steps = selectedComplaint.timeline || [{ status: "registered", updatedAt: selectedComplaint.createdAt, updatedBy: "system", notes: "மனு வெற்றிகரமாக பதிவு செய்யப்பட்டது." }];
                    return steps.map((step: any, idx: number) => {
                      const norm = normalizeStatus(step.status);
                      const label = t(`status.${norm}`);
                      const isLast = idx === steps.length - 1;
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
                              <b style={{ fontSize: '0.9rem', color: '#111' }}>{label}</b>
                              <span style={{ fontSize: '0.75rem', color: '#666' }}>{new Date(step.updatedAt).toLocaleString(lang === "ta" ? "ta-IN" : "en-IN")}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#555', lineHeight: '1.4' }}>
                              {step.notes || t("track.timeline.default_note", { label })}
                              {step.updatedBy && <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8, color: '#888' }}>{t("common.field_officer")}: @{step.updatedBy}</span>}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* FIELD OFFICER ASSIGNMENT WORKFLOW */}
              {(sessionUser.role === "REPRESENTATIVE" || sessionUser.role === "SUPER_ADMIN") && normalizeStatus(selectedComplaint.status) !== "resolved" && (
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(254,203,2,0.08) 0%, rgba(254,203,2,0.15) 100%)', 
                  border: '1px dashed #FECB02', 
                  borderRadius: '0.75rem', 
                  padding: '1.2rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <h4 style={{ color: '#4A080E', margin: '0 0 0.2rem 0', fontWeight: 800 }}>{t("complaints.modal.assign_sec")}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                      {selectedComplaint.assignedTo 
                        ? t("tasks.card.rejected_notice", { reason: `${selectedComplaint.assignedToName || selectedComplaint.assignedTo} (@${selectedComplaint.assignedTo})` })
                        : t("tasks.modal.start_sec_desc")}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                      value={selectedOfficerUsername}
                      onChange={(e) => setSelectedOfficerUsername(e.target.value)}
                      title="Field Officer Selection"
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.4rem',
                        border: '1px solid #FECB02',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        background: 'white'
                      }}
                    >
                      <option value="">{t("complaints.modal.assign_select")}</option>
                      {activeOfficers.map(off => (
                        <option key={off.username} value={off.username}>{off.name} (@{off.username})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAssignOfficer(selectedComplaint.trackingId)}
                      disabled={isAssigning || !selectedOfficerUsername || selectedOfficerUsername === (selectedComplaint.assignedTo || "")}
                      className="submit-btn"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', margin: 0 }}
                    >
                      {isAssigning ? t("tasks.modal.submit_btn_loading") : selectedComplaint.assignedTo ? t("tasks.modal.start_btn") : t("complaints.modal.assign_btn")}
                    </button>
                  </div>
                </div>
              )}

              {/* REPRESENTATIVE REVIEW ACTIONS */}
              {(sessionUser.role === "REPRESENTATIVE" || sessionUser.role === "SUPER_ADMIN") && 
                normalizeStatus(selectedComplaint.status) === "solution_submitted" && (
                <div style={{ 
                  background: 'rgba(94, 140, 58, 0.08)', 
                  border: '1px dashed #5E8C3A', 
                  borderRadius: '0.75rem', 
                  padding: '1.2rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ color: '#1B4314', margin: '0 0 0.2rem 0', fontWeight: 800 }}> {t("complaints.modal.review_sec")}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>{t("tasks.modal.rejected_desc")}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleRepReview(selectedComplaint.trackingId, true)}
                        disabled={isUpdatingStatus}
                        style={{ background: '#5E8C3A', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        {t("complaints.modal.review_approve_btn")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRepReview(selectedComplaint.trackingId, false)}
                        disabled={isUpdatingStatus || !rejectionReason.trim()}
                        style={{ background: '#A00000', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', opacity: rejectionReason.trim() ? 1 : 0.5 }}
                      >
                        {t("complaints.modal.review_reject_btn")}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="rejection-reason" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#333', display: 'block', marginBottom: '0.35rem' }}>
                      {t("complaints.modal.review_reject_reason")}
                    </label>
                    <textarea
                      id="rejection-reason"
                      rows={2}
                      placeholder={t("complaints.modal.review_reject_ph")}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', border: '1px solid #CCC', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              )}

              {/* ACTION: UPDATE STATUS (SUPER_ADMIN ONLY FOR LEGACY OVERRIDES) */}
              {sessionUser.role === "SUPER_ADMIN" && (
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(254,203,2,0.08) 0%, rgba(254,203,2,0.15) 100%)', 
                  border: '1px dashed #FECB02', 
                  borderRadius: '0.75rem', 
                  padding: '1.2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <h4 style={{ color: '#4A080E', margin: '0 0 0.2rem 0', fontWeight: 800 }}>{t("complaints.modal.status_change_sec")}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>{t("admin.demo.desc")}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      onClick={() => handleUpdateStatus(selectedComplaint.trackingId, "registered")}
                      disabled={isUpdatingStatus || normalizeStatus(selectedComplaint.status) === "registered"}
                      style={{
                        background: normalizeStatus(selectedComplaint.status) === "registered" ? '#FECB02' : '#FFF',
                        color: '#4A080E',
                        border: '1px solid #FECB02',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.4rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        opacity: normalizeStatus(selectedComplaint.status) === "registered" ? 1 : 0.8
                      }}
                    >
                       {t("status.registered")}
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleUpdateStatus(selectedComplaint.trackingId, "under_review")}
                      disabled={isUpdatingStatus || normalizeStatus(selectedComplaint.status) === "under_review"}
                      style={{
                        background: normalizeStatus(selectedComplaint.status) === "under_review" ? '#E08600' : '#FFF',
                        color: normalizeStatus(selectedComplaint.status) === "under_review" ? '#FFF' : '#333',
                        border: '1px solid #E08600',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.4rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        opacity: normalizeStatus(selectedComplaint.status) === "under_review" ? 1 : 0.8
                      }}
                    >
                      {t("status.under_review")}
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleUpdateStatus(selectedComplaint.trackingId, "resolved")}
                      disabled={isUpdatingStatus || normalizeStatus(selectedComplaint.status) === "resolved"}
                      style={{
                        background: normalizeStatus(selectedComplaint.status) === "resolved" ? '#5E8C3A' : '#FFF',
                        color: normalizeStatus(selectedComplaint.status) === "resolved" ? '#FFF' : '#333',
                        border: '1px solid #5E8C3A',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.4rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        opacity: normalizeStatus(selectedComplaint.status) === "resolved" ? 1 : 0.8
                      }}
                    >
                      {t("status.resolved")}
                    </button>
                  </div>
                </div>
              )}

              {statusUpdateMessage && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  background: statusUpdateMessage.includes(t("common.error")) || statusUpdateMessage.includes("பிழை") ? '#FEE2E2' : '#DCFCE7',
                  color: statusUpdateMessage.includes(t("common.error")) || statusUpdateMessage.includes("பிழை") ? '#991B1B' : '#166534',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}>
                  {statusUpdateMessage}
                </div>
              )}

            </div>

            <div className="detail-modal-footer">
              <button type="button" className="admin-modal-cancel" onClick={() => setSelectedComplaint(null)}>
                {t("common.close")}
              </button>
            </div>

          </div>
        </div>
      )}

      <TvkAppFooter tagline={t("complaints.title")} />
    </div>
  );
}
