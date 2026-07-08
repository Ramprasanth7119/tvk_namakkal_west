"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CONSTITUENCIES } from "@/lib/constituencies";
import { TVK_LOGO } from "@/lib/brand";
import TvkAppFooter from "@/components/TvkAppFooter";
import TvkTopBar, { type TopBarLink } from "@/components/TvkTopBar";
import VoterRegistrySection from "@/components/admin/VoterRegistrySection";
import WhistleCursor, { useWhistleCursor } from "@/components/WhistleCursor";
import { getGoogleMapsEmbedUrl, getGoogleMapsOpenUrl } from "@/lib/maps";
import { normalizeStatus } from "@/lib/complaintStatus";
import { useLanguage } from "@/components/LanguageProvider";
import "../analytics/analytics.css";

export default function AdminPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const { lang, t } = useLanguage();

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

  // Demo Data Management state
  const [demoEntries, setDemoEntries] = useState<any[]>([]);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoFilterConst, setDemoFilterConst] = useState("");
  const [demoForm, setDemoForm] = useState<{
    constituency: string;
    sector: string;
    title: string;
    by: string;
    status: "ok" | "warn" | "pend";
    resolver: string;
  }>({
    constituency: CONSTITUENCIES[0],
    sector: "road",
    title: "",
    by: "",
    status: "pend",
    resolver: "",
  });
  const [demoFormError, setDemoFormError] = useState("");
  const [demoFormSuccess, setDemoFormSuccess] = useState("");
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);

  // Edit/Reset Password Fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editConstituency, setEditConstituency] = useState<string>(CONSTITUENCIES[0]);
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState(""); // empty means no password reset
  const [editFormError, setEditFormError] = useState("");
  const [editFormSuccess, setEditFormSuccess] = useState("");
  const [isEditFormSubmitting, setIsEditFormSubmitting] = useState(false);

  // Field Officers state
  const [officers, setOfficers] = useState<any[]>([]);
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
  const [offConstituency, setOffConstituency] = useState<string>(CONSTITUENCIES[0]);
  const [offError, setOffError] = useState("");
  const [offSuccess, setOffSuccess] = useState("");
  const [isOffSubmitting, setIsOffSubmitting] = useState(false);

  // Edit Field Officer Form fields
  const [editOffName, setEditOffName] = useState("");
  const [editOffPhone, setEditOffPhone] = useState("");
  const [editOffPassword, setEditOffPassword] = useState("");
  const [editOffActive, setEditOffActive] = useState(true);
  const [editOffConstituency, setEditOffConstituency] = useState<string>(CONSTITUENCIES[0]);
  const [editOffError, setEditOffError] = useState("");
  const [editOffSuccess, setEditOffSuccess] = useState("");
  const [isEditOffSubmitting, setIsEditOffSubmitting] = useState(false);

  // Super Admin Final Approvals states
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isApprovalsLoading, setIsPendingApprovalsLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [adminRejectionReason, setAdminRejectionReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState("");

  // Fetch Session on Mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            if (data.user.role !== "SUPER_ADMIN") {
              router.push("/complaints");
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

  // Fetch Representatives
  const fetchReps = async () => {
    setIsRepsLoading(true);
    try {
      const res = await fetch("/api/admin/reps");
      if (res.ok) {
        const data = await res.json();
        setRepresentatives(data);
      }
    } catch (err) {
      console.error("Error fetching reps:", err);
    } finally {
      setIsRepsLoading(false);
    }
  };

  // Fetch Field Officers
  const fetchOfficers = async () => {
    setIsOfficersLoading(true);
    try {
      const res = await fetch("/api/admin/officers");
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

  // Fetch HQ approvals list
  const fetchApprovals = async () => {
    setIsPendingApprovalsLoading(true);
    try {
      const res = await fetch("/api/admin/approvals");
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(data);
      }
    } catch (err) {
      console.error("Error fetching hq approvals:", err);
    } finally {
      setIsPendingApprovalsLoading(false);
    }
  };

  // Fetch Demo Entries
  const fetchDemoEntries = async (constituencyFilter?: string) => {
    setIsDemoLoading(true);
    try {
      const query = constituencyFilter ? `?constituency=${encodeURIComponent(constituencyFilter)}` : "";
      const res = await fetch(`/api/admin/demo-data${query}`);
      if (res.ok) {
        const data = await res.json();
        setDemoEntries(data);
      }
    } catch (err) {
      console.error("Error fetching demo entries:", err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  useEffect(() => {
    if (sessionUser && sessionUser.role === "SUPER_ADMIN") {
      fetchDashboardData();
      fetchReps();
      fetchOfficers();
      fetchApprovals();
      fetchDemoEntries(demoFilterConst || undefined);
    }
  }, [sessionUser]);

  // Handle Create Rep Submission
  const handleCreateRep = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormErrorSuccess("");
    setIsFormSubmitting(true);

    try {
      const res = await fetch("/api/admin/reps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
          name: name.trim(),
          phone: phone.trim(),
          constituency,
          active,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setFormErrorSuccess(t("admin.reps.create_success"));
        fetchReps();
        fetchDashboardData();
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setUsername("");
          setPassword("");
          setName("");
          setPhone("");
          setConstituency(CONSTITUENCIES[0]);
          setActive(true);
          setFormErrorSuccess("");
        }, 1500);
      } else {
        setFormError(data.error || t("admin.reps.error_fail"));
      }
    } catch {
      setFormError(t("track.conn_error"));
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Handle Edit Rep Submission
  const handleEditRep = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError("");
    setEditFormSuccess("");
    setIsEditFormSubmitting(true);

    try {
      const res = await fetch("/api/admin/reps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editingRep.username,
          name: editName,
          phone: editPhone,
          constituency: editConstituency,
          active: editActive,
          password: editPassword || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setEditFormSuccess(t("admin.reps.edit_success"));
        fetchReps();
        fetchDashboardData();
        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditingRep(null);
          setEditPassword("");
          setEditFormSuccess("");
        }, 1500);
      } else {
        setEditFormError(data.error || t("admin.reps.error_fail"));
      }
    } catch {
      setEditFormError(t("track.conn_error"));
    } finally {
      setIsEditFormSubmitting(false);
    }
  };

  // Handle Create Officer Submission
  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setOffError("");
    setOffSuccess("");
    setIsOffSubmitting(true);

    try {
      const res = await fetch("/api/admin/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: offUsername.trim().toLowerCase(),
          password: offPassword,
          name: offName.trim(),
          phone: offPhone.trim(),
          constituency: offConstituency,
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
          setOffConstituency(CONSTITUENCIES[0]);
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

  // Handle Edit Officer Submission
  const handleEditOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditOffError("");
    setEditOffSuccess("");
    setIsEditOffSubmitting(true);

    try {
      const res = await fetch("/api/admin/officers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editingOfficer.username,
          name: editOffName,
          phone: editOffPhone,
          constituency: editOffConstituency,
          active: editOffActive,
          password: editOffPassword || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setEditOffSuccess(t("complaints.fo_modal.edit_success"));
        fetchOfficers();
        setTimeout(() => {
          setIsEditOfficerModalOpen(false);
          setEditingOfficer(null);
          setEditOffPassword("");
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

  // Handle HQ Final Approval / Rejection
  const handleHqApproval = async (trackingId: string, approve: boolean) => {
    setIsApproving(true);
    setStatusUpdateMessage("");
    try {
      const action = approve ? "hq_approve" : "hq_reject";
      const res = await fetch("/api/admin/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId,
          action,
          rejectionReason: approve ? undefined : adminRejectionReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusUpdateMessage(approve ? t("admin.approvals.approve_success") : t("admin.approvals.reject_success"));
        setPendingApprovals(prev => prev.filter(a => a.trackingId !== trackingId));
        setSelectedApproval(null);
        setAdminRejectionReason("");
        fetchDashboardData();
      } else {
        setStatusUpdateMessage(`${t("common.error")}: ${data.error || ""}`);
      }
    } catch {
      setStatusUpdateMessage(t("track.conn_error"));
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Demo Data Generation
  const handleCreateDemoGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoFormError("");
    setDemoFormSuccess("");
    setIsDemoSubmitting(true);

    try {
      const res = await fetch("/api/admin/demo-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demoForm),
      });
      const data = await res.json();

      if (res.ok) {
        setDemoFormSuccess(t("admin.demo.create_success"));
        setDemoForm(prev => ({ ...prev, title: "", by: "", resolver: "" }));
        fetchDemoEntries(demoFilterConst || undefined);
        fetchDashboardData();
        fetchApprovals();
        setTimeout(() => setDemoFormSuccess(""), 2000);
      } else {
        setDemoFormError(data.error || t("common.error"));
      }
    } catch {
      setDemoFormError(t("track.conn_error"));
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  // Handle Clear Demo Data
  const handleClearDemoData = async () => {
    const ok = window.confirm(t("admin.demo.clear_confirm"));
    if (!ok) return;

    setIsDemoLoading(true);
    try {
      const query = demoFilterConst ? `?constituency=${encodeURIComponent(demoFilterConst)}` : "";
      const res = await fetch(`/api/admin/demo-data${query}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        alert(t("admin.demo.clear_success"));
        fetchDemoEntries(demoFilterConst || undefined);
        fetchDashboardData();
        fetchApprovals();
      } else {
        alert(`${t("common.error")}: ${data.error || ""}`);
      }
    } catch {
      alert(t("track.conn_error"));
    } finally {
      setIsDemoLoading(false);
    }
  };

  useWhistleCursor({ theme: "maroon", enabled: !isSessionLoading && !!sessionUser });

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#220305] text-white">
        <div className="flex flex-col items-center gap-4">
          <span className="w-12 h-12 border-4 border-[#FECB02] border-t-transparent rounded-full animate-spin"></span>
          <p className="font-bold text-white">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    window.location.href = "/login";
  };

  const adminTopBarLinks: TopBarLink[] = [
    { href: "#voter-registry", label: t("admin.nav.voters") },
    {
      href: "/admin",
      label: t("admin.nav.control"),
      active: true,
      highlight: true,
    },
    { href: "/complaints", label: t("nav.complaint") },
    { href: "/analytics", label: t("nav.analytics") },
    { href: "/", label: t("nav.home") },
    { label: t("common.logout"), onClick: handleLogout },
  ];

  return (
    <div className="analytics-body">
      <TvkTopBar
        title={t("admin.portal_title")}
        brandHref="#top"
        className="admin-topbar"
        logoClassName="tvk-brand-logo admin-topbar-whistle"
        links={adminTopBarLinks}
      />

      {/* ADMIN HERO BANNER */}
      <section className="phero" id="top" style={{ paddingBottom: "2rem" }}>
        <img className="ph-medal admin-hero-whistle" src={TVK_LOGO} alt="" aria-hidden="true" />
        <div className="wrap flex flex-col items-start gap-4">
          <span className="ph-eyebrow" style={{ background: "rgba(254, 203, 2, 0.15)", color: "#FECB02" }}>
            {t("admin.eyebrow")}
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
            <span>
              {t("admin.user_badge", { username: sessionUser.username, role: t("common.super_admin") })}
            </span>
          </div>
          <h1>{t("admin.title")}</h1>
          <p style={{ maxWidth: "800px", margin: 0, color: "rgba(255,255,255,0.8)" }}>
            {t("admin.desc")}
          </p>
        </div>
      </section>

      {/* DASHBOARD STATISTICS KPI GRID — SUPER ADMIN ONLY */}
      <section className="section admin-dashboard">
        <div className="wrap">
          <div className="kpi-grid">
            <div className="kpi" style={{ '--accent': 'var(--gold)', '--accent-bg': 'rgba(254,203,2,.12)' } as React.CSSProperties}>
              <b>{isStatsLoading ? "..." : stats.totalReps}</b>
              <span>{t("admin.stats.total_reps")}</span>
            </div>
            <div className="kpi" style={{ '--accent': 'var(--ok)', '--accent-bg': 'var(--ok-bg)' } as React.CSSProperties}>
              <b>{isStatsLoading ? "..." : stats.activeReps}</b>
              <span>{t("admin.stats.active_reps")}</span>
            </div>
            <div className="kpi" style={{ '--accent': 'var(--red)', '--accent-bg': 'rgba(160,0,0,.1)' } as React.CSSProperties}>
              <b>{isStatsLoading ? "..." : stats.totalComplaints}</b>
              <span>{t("admin.stats.total_complaints")}</span>
            </div>
            <div className="kpi" style={{ '--accent': 'var(--warn)', '--accent-bg': 'var(--warn-bg)' } as React.CSSProperties}>
              <b>{isStatsLoading ? "..." : stats.pendingComplaints}</b>
              <span>{t("admin.stats.pending")}</span>
            </div>
            <div className="kpi" style={{ '--accent': 'var(--ok)', '--accent-bg': 'var(--ok-bg)' } as React.CSSProperties}>
              <b>{isStatsLoading ? "..." : stats.resolvedComplaints}</b>
              <span>{t("admin.stats.resolved")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CONSTITUENCY ANALYSIS OVERVIEW */}
      <section className="section admin-dashboard" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="card table-card">
            <div className="tc-head">
              <h3>{t("admin.overview.title")}</h3>
            </div>
            <div className="tbl-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("common.constituency")}</th>
                    <th>{t("admin.overview.rep")}</th>
                    <th style={{ textAlign: "center" }}>{t("admin.overview.total")}</th>
                    <th style={{ textAlign: "center" }}>{t("admin.overview.pending")}</th>
                    <th style={{ textAlign: "center" }}>{t("admin.overview.resolved")}</th>
                    <th style={{ textAlign: "center" }}>{t("admin.overview.rate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {isStatsLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>{t("common.loading")}</td>
                    </tr>
                  ) : (
                    constituencyOverview.map((item) => (
                      <tr key={item.constituency}>
                        <td style={{ fontWeight: 800 }}>{t(item.constituency)}</td>
                        <td>{item.repName ? `${item.repName} (@${item.repUsername})` : <i style={{ color: "var(--red)" }}>{t("admin.overview.none")}</i>}</td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{item.total}</td>
                        <td style={{ textAlign: "center", color: "var(--red)", fontWeight: 700 }}>{item.pending}</td>
                        <td style={{ textAlign: "center", color: "var(--ok)", fontWeight: 700 }}>{item.resolved}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge ok" style={{ fontWeight: "bold" }}>
                            {item.resolvedRate}%
                          </span>
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

      {/* HEADQUARTERS APPROVALS QUEUE */}
      <section className="section admin-dashboard" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="card table-card">
            <div className="tc-head">
              <h3>{t("admin.approvals.title")}</h3>
            </div>
            <div className="tbl-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("complaints.table.id")}</th>
                    <th>{t("common.constituency")}</th>
                    <th>{t("complaints.table.category")}</th>
                    <th>{t("common.field_officer")}</th>
                    <th>{t("admin.approvals.resolved_date")}</th>
                    <th style={{ textAlign: "center" }}>{t("common.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {isApprovalsLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>{t("common.loading")}</td>
                    </tr>
                  ) : pendingApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                        {t("admin.approvals.empty")}
                      </td>
                    </tr>
                  ) : (
                    pendingApprovals.map((app) => (
                      <tr key={app.trackingId}>
                        <td style={{ fontWeight: 800, color: "var(--red)" }}>{app.trackingId}</td>
                        <td>{t(app.constituency)}</td>
                        <td>{t(app.complaintDetails?.category)}</td>
                        <td>{app.assignedToName || app.assignedTo}</td>
                        <td>{new Date(app.updatedAt || Date.now()).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN")}</td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApproval(app);
                              setStatusUpdateMessage("");
                            }}
                            className="tfilt"
                            style={{ background: "var(--gold)", border: "none", color: "var(--m-900)", cursor: "pointer", fontWeight: "bold", padding: "0.3rem 0.75rem", borderRadius: "0.4rem" }}
                          >
                            {t("admin.approvals.btn_review")}
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

      {/* REPRESENTATIVES MANAGEMENT SECTION */}
      <section className="section admin-dashboard" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="card table-card">
            <div className="tc-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3>{t("admin.reps.title")}</h3>
                <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                  {t("admin.reps.subtitle")}
                </span>
              </div>
              <button
                type="button"
                className="submit-btn"
                onClick={() => {
                  setUsername("");
                  setPassword("");
                  setName("");
                  setPhone("");
                  setConstituency(CONSTITUENCIES[0]);
                  setActive(true);
                  setFormError("");
                  setFormErrorSuccess("");
                  setIsCreateModalOpen(true);
                }}
                style={{ cursor: "pointer", background: "var(--gold)", color: "var(--m-900)", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              >
                {t("admin.reps.btn_new")}
              </button>
            </div>

            <div className="tbl-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("complaints.fo.table.username")}</th>
                    <th>{t("complaints.fo.table.name")}</th>
                    <th>{t("complaints.fo.table.phone")}</th>
                    <th>{t("common.constituency")}</th>
                    <th style={{ textAlign: "center" }}>{t("complaints.fo.table.status")}</th>
                    <th style={{ textAlign: "center" }}>{t("common.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {isRepsLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem" }}>{t("common.loading")}</td>
                    </tr>
                  ) : representatives.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#777" }}>
                        {t("admin.rep.empty")}
                      </td>
                    </tr>
                  ) : (
                    representatives.map((rep) => (
                      <tr key={rep.username}>
                        <td style={{ fontWeight: 800 }}>@{rep.username}</td>
                        <td>{rep.name}</td>
                        <td>{rep.phone || "—"}</td>
                        <td><b>{t(rep.constituency)}</b></td>
                        <td style={{ textAlign: "center" }}>
                          {rep.active ? (
                            <span className="badge ok" style={{ display: "inline-flex" }}><i></i>{t("complaints.fo.table.active")}</span>
                          ) : (
                            <span className="badge warn" style={{ display: "inline-flex" }}><i></i>{t("complaints.fo.table.inactive")}</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRep(rep);
                              setEditName(rep.name);
                              setEditPhone(rep.phone || "");
                              setEditConstituency(rep.constituency);
                              setEditActive(rep.active);
                              setEditPassword("");
                              setEditFormError("");
                              setEditFormSuccess("");
                              setIsEditModalOpen(true);
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
          </div>
        </div>
      </section>

      {/* FIELD OFFICERS MANAGEMENT SECTION */}
      <section className="section admin-dashboard" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="card table-card">
            <div className="tc-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3> {t("complaints.fo.title")} ({t("common.super_admin")})</h3>
                <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                  {t("complaints.fo.desc")}
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
                  setOffConstituency(CONSTITUENCIES[0]);
                  setOffActive(true);
                  setOffError("");
                  setOffSuccess("");
                  setIsCreateOfficerModalOpen(true);
                }}
                style={{ cursor: "pointer", background: "var(--gold)", color: "var(--m-900)", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
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
                    <th>{t("common.constituency")}</th>
                    <th style={{ textAlign: "center" }}>{t("complaints.fo.table.status")}</th>
                    <th style={{ textAlign: "center" }}>{t("common.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {isOfficersLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem" }}>{t("common.loading")}</td>
                    </tr>
                  ) : officers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#777" }}>
                        {t("admin.rep.empty")}
                      </td>
                    </tr>
                  ) : (
                    officers.map((off) => (
                      <tr key={off.username}>
                        <td style={{ fontWeight: 800 }}>@{off.username}</td>
                        <td>{off.name}</td>
                        <td>{off.phone || "—"}</td>
                        <td><b>{t(off.constituency)}</b></td>
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
                              setEditOffPhone(off.phone || "");
                              setEditOffConstituency(off.constituency);
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
          </div>
        </div>
      </section>

      {/* VOTER REGISTRY IMPORT SECTION */}
      <VoterRegistrySection />

      {/* CREATE REPRESENTATIVE MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content admin-modal-content">
            <div className="admin-modal-header">
              <img src={TVK_LOGO} alt="" className="detail-modal-whistle" aria-hidden="true" />
              <h3>{t("admin.reps.create_title")}</h3>
              <button type="button" className="admin-modal-close" onClick={() => setIsCreateModalOpen(false)} aria-label={t("common.close")}>✕</button>
            </div>
            <form onSubmit={handleCreateRep} className="admin-modal-body">
              <div className="admin-modal-field">
                <label htmlFor="rep-username">{t("complaints.fo_modal.username")}</label>
                <input id="rep-username" type="text" placeholder="e.g. rep_kumarapalayam" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="rep-password">{t("complaints.fo_modal.password_new")}</label>
                <input id="rep-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="rep-name">{t("complaints.fo_modal.name")}</label>
                <input id="rep-name" type="text" placeholder="e.g. Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="rep-phone">{t("complaints.fo_modal.phone")}</label>
                <input id="rep-phone" type="tel" placeholder="e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="rep-constituency">{t("common.constituency")}</label>
                <select id="rep-constituency" value={constituency} onChange={(e) => setConstituency(e.target.value)}>
                  {CONSTITUENCIES.map((c) => (
                    <option key={c} value={c}>{t(c)}</option>
                  ))}
                </select>
              </div>
              <div className="admin-checkbox-row">
                <input type="checkbox" id="rep-active" checked={active} onChange={(e) => setActive(e.target.checked)} />
                <label htmlFor="rep-active">{t("complaints.fo_modal.status_active")}</label>
              </div>
              {formError && <div className="admin-form-message error">{formError}</div>}
              {formSuccess && <div className="admin-form-message success">{formSuccess}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => setIsCreateModalOpen(false)}>{t("common.cancel")}</button>
                <button type="submit" className="submit-btn" disabled={isFormSubmitting}>
                  {isFormSubmitting ? t("common.loading") : t("admin.reps.btn_create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REPRESENTATIVE MODAL */}
      {isEditModalOpen && editingRep && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content admin-modal-content">
            <div className="admin-modal-header">
              <img src={TVK_LOGO} alt="" className="detail-modal-whistle" aria-hidden="true" />
              <h3>{t("admin.reps.edit_title")} (@{editingRep.username})</h3>
              <button type="button" className="admin-modal-close" onClick={() => { setIsEditModalOpen(false); setEditingRep(null); }} aria-label={t("common.close")}>✕</button>
            </div>
            <form onSubmit={handleEditRep} className="admin-modal-body">
              <div className="admin-modal-field">
                <label htmlFor="edit-name">{t("complaints.fo_modal.name")}</label>
                <input id="edit-name" type="text" placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="edit-phone">{t("complaints.fo_modal.phone")}</label>
                <input id="edit-phone" type="tel" placeholder="Mobile" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="edit-constituency">{t("common.constituency")}</label>
                <select id="edit-constituency" value={editConstituency} onChange={(e) => setEditConstituency(e.target.value)}>
                  {CONSTITUENCIES.map((c) => (
                    <option key={c} value={c}>{t(c)}</option>
                  ))}
                </select>
              </div>
              <div className="admin-modal-field">
                <label htmlFor="edit-password">{t("complaints.fo_modal.password_edit")}</label>
                <input id="edit-password" type="password" placeholder="••••••••" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
              </div>
              <div className="admin-checkbox-row">
                <input type="checkbox" id="edit-active" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                <label htmlFor="edit-active">{t("complaints.fo_modal.status_active")}</label>
              </div>
              {editFormError && <div className="admin-form-message error">{editFormError}</div>}
              {editFormSuccess && <div className="admin-form-message success">{editFormSuccess}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => { setIsEditModalOpen(false); setEditingRep(null); }}>{t("common.cancel")}</button>
                <button type="submit" className="submit-btn" disabled={isEditFormSubmitting}>
                  {isEditFormSubmitting ? t("common.loading") : t("complaints.fo_modal.btn_save")}
                </button>
              </div>
            </form>
          </div>
        </div>
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
                <select id="off-constituency" value={offConstituency} onChange={(e) => setOffConstituency(e.target.value)}>
                  {CONSTITUENCIES.map((c) => (
                    <option key={c} value={c}>{t(c)}</option>
                  ))}
                </select>
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
                <input id="edit-off-name" type="text" placeholder="Name" value={editOffName} onChange={(e) => setEditOffName(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="edit-off-phone">{t("complaints.fo_modal.phone")}</label>
                <input id="edit-off-phone" type="tel" placeholder="Mobile" value={editOffPhone} onChange={(e) => setEditOffPhone(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="edit-off-constituency">{t("common.constituency")}</label>
                <select id="edit-off-constituency" value={editOffConstituency} onChange={(e) => setEditOffConstituency(e.target.value)}>
                  {CONSTITUENCIES.map((c) => (
                    <option key={c} value={c}>{t(c)}</option>
                  ))}
                </select>
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

      {/* HEADQUARTERS REVIEW MODAL */}
      {selectedApproval && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content detail-modal-content">
            <div className="detail-modal-header" style={{ background: "var(--m-900)" }}>
              <img src={TVK_LOGO} alt="" className="detail-modal-whistle" aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85, fontWeight: 700, color: "#FFF1BE" }}>{t("admin.approvals.modal_title")}</span>
                <h3>{t("complaints.modal.id", { id: selectedApproval.trackingId })}</h3>
              </div>
              <button type="button" className="detail-modal-close" onClick={() => setSelectedApproval(null)} aria-label={t("common.close")}>✕</button>
            </div>

            <div className="detail-modal-body">
              <div className="detail-modal-grid">
                <div className="detail-modal-section">
                  <h4>{t("complaints.modal.citizen_sec")}</h4>
                  <div className="detail-modal-stack">
                    <div><span style={{ opacity: 0.6 }}>{t("tasks.modal.citizen_name")}</span> <b>{selectedApproval.citizenDetails?.name || t("home.receipt.none")}</b></div>
                    <div><span style={{ opacity: 0.6 }}>{t("tasks.modal.citizen_phone")}</span> <b>{selectedApproval.citizenDetails?.mobile || t("home.receipt.none")}</b></div>
                    <div><span style={{ opacity: 0.6 }}>{t("complaints.modal.address")}</span> <b>{selectedApproval.citizenDetails?.address || t("home.receipt.none")}</b></div>
                  </div>
                </div>

                <div className="detail-modal-section">
                  <h4>{t("complaints.modal.desc_title")}</h4>
                  <div className="detail-modal-stack">
                    <div><span style={{ opacity: 0.6 }}>{t("common.constituency")}</span> <b>{t(selectedApproval.constituency)}</b></div>
                    <div><span style={{ opacity: 0.6 }}>{t("complaints.modal.desc_category")}</span> <b>{t(selectedApproval.complaintDetails?.category)}</b></div>
                    <div><span style={{ opacity: 0.6 }}>{t("complaints.modal.desc_sub")}</span> <b>{t(selectedApproval.complaintDetails?.subcategory) || t("home.receipt.none")}</b></div>
                  </div>
                </div>
              </div>

              {/* BEFORE/AFTER IMAGES EVIDENCE */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "0.75rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
                <h4 style={{ color: "var(--m-900)", borderBottom: "2px solid var(--gold)", paddingBottom: "0.35rem", marginBottom: "0.75rem", fontWeight: 800 }}>{t("tasks.modal.submit_sec_title")}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="mobile-one-col">
                  <div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#666", display: "block", marginBottom: "0.5rem" }}>{t("tasks.modal.submitted_before")}</span>
                    <div className="complaint-media-grid">
                      {(selectedApproval.beforeImages || []).map((img: string, idx: number) => (
                        <a href={img} target="_blank" rel="noopener noreferrer" key={idx} className="complaint-media-thumb">
                          <img src={img} alt={`Before ${idx + 1}`} loading="lazy" />
                        </a>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#666", display: "block", marginBottom: "0.5rem" }}>{t("tasks.modal.submitted_after")}</span>
                    <div className="complaint-media-grid">
                      {(selectedApproval.afterImages || []).map((img: string, idx: number) => (
                        <a href={img} target="_blank" rel="noopener noreferrer" key={idx} className="complaint-media-thumb">
                          <img src={img} alt={`After ${idx + 1}`} loading="lazy" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedApproval.workNotes && (
                  <div style={{ background: "#F9FAFB", padding: "1rem", borderRadius: "0.5rem", borderLeft: "4px solid #5E8C3A", marginTop: "1rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#666", display: "block", marginBottom: "0.35rem" }}>{t("tasks.modal.submitted_notes")}</span>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#111", lineHeight: "1.5", whiteSpace: "pre-wrap", fontWeight: 600 }}>{selectedApproval.workNotes}</p>
                  </div>
                )}
              </div>

              {/* HQ ACTIONS */}
              <div style={{ background: "rgba(94, 140, 58, 0.08)", border: "1px dashed #5E8C3A", borderRadius: "0.75rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <h4 style={{ color: "#1B4314", margin: "0 0 0.2rem 0", fontWeight: 800 }}>{t("admin.approvals.btn_review")}</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>{t("admin.approvals.modal_desc")}</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => handleHqApproval(selectedApproval.trackingId, true)}
                      disabled={isApproving}
                      style={{ background: "#5E8C3A", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "0.4rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      {t("complaints.modal.review_approve_btn")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHqApproval(selectedApproval.trackingId, false)}
                      disabled={isApproving || !adminRejectionReason.trim()}
                      style={{ background: "#A00000", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "0.4rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem", opacity: adminRejectionReason.trim() ? 1 : 0.5 }}
                    >
                      {t("complaints.modal.review_reject_btn")}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="hq-rejection-reason" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333", display: "block", marginBottom: "0.35rem" }}>
                    {t("complaints.modal.review_reject_reason")}
                  </label>
                  <textarea
                    id="hq-rejection-reason"
                    rows={2}
                    placeholder={t("complaints.modal.review_reject_ph")}
                    value={adminRejectionReason}
                    onChange={(e) => setAdminRejectionReason(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #CCC", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

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
              <button type="button" className="admin-modal-cancel" onClick={() => setSelectedApproval(null)}>{t("common.close")}</button>
            </div>
          </div>
        </div>
      )}

      <WhistleCursor />
      <TvkAppFooter tagline={t("admin.portal_title")} />
    </div>
  );
}
