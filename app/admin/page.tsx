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
import { getStatusLabel, normalizeStatus } from "@/lib/complaintStatus";
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
    if (sessionUser && sessionUser.role === "SUPER_ADMIN") {
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
        setFormErrorSuccess("பிரதிநிதி வெற்றிகரமாக உருவாக்கப்பட்டார்!");
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
        setEditFormSuccess("விவரங்கள் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டன!");
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

  // Fetch demo entries
  const fetchDemoEntries = async (constituency?: string) => {
    setIsDemoLoading(true);
    try {
      const q = constituency ? `?constituency=${encodeURIComponent(constituency)}` : "";
      const res = await fetch(`/api/admin/demo${q}`);
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
          username: offUsername,
          password: offPassword,
          name: offName,
          phone: offPhone,
          active: offActive,
          constituency: sessionUser?.role === "SUPER_ADMIN" ? offConstituency : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOffSuccess("களப்பணியாளர் வெற்றிகரமாக சேர்க்கப்பட்டார்!");
        setOffUsername("");
        setOffPassword("");
        setOffName("");
        setOffPhone("");
        fetchOfficers();
        setTimeout(() => {
          setIsCreateOfficerModalOpen(false);
          setOffSuccess("");
        }, 1500);
      } else {
        setOffError(data.error || "சேர்ப்பதில் பிழை ஏற்பட்டது");
      }
    } catch {
      setOffError("இணைப்புப் பிழை");
    } finally {
      setIsOffSubmitting(false);
    }
  };

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
          constituency: sessionUser?.role === "SUPER_ADMIN" ? editOffConstituency : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditOffSuccess("விவரங்கள் புதுப்பிக்கப்பட்டன!");
        fetchOfficers();
        setTimeout(() => {
          setIsEditOfficerModalOpen(false);
          setEditingOfficer(null);
          setEditOffSuccess("");
        }, 1500);
      } else {
        setEditOffError(data.error || "புதுப்பிப்பதில் பிழை ஏற்பட்டது");
      }
    } catch {
      setEditOffError("இணைப்புப் பிழை");
    } finally {
      setIsEditOffSubmitting(false);
    }
  };

  // Fetch Pending Admin Approvals
  const fetchPendingApprovals = async () => {
    setIsPendingApprovalsLoading(true);
    try {
      const res = await fetch("/api/complaints");
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(data.filter((c: any) => normalizeStatus(c.status) === "pending_admin_approval"));
      }
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
    } finally {
      setIsPendingApprovalsLoading(false);
    }
  };

  const handleAdminApproval = async (trackingId: string, approve: boolean) => {
    if (!approve && !adminRejectionReason.trim()) {
      alert("தயவுசெய்து நிராகரிப்புக்கான காரணத்தை உள்ளிடவும்.");
      return;
    }
    setIsApproving(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId,
          action: approve ? "admin_approve" : "admin_reject",
          rejectionReason: approve ? undefined : adminRejectionReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(approve ? "மனு வெற்றிகரமாக தீர்க்கப்பட்டது!" : " மனு நிராகரிக்கப்பட்டு மீண்டும் களப்பணிக்கு அனுப்பப்பட்டது.");
        setSelectedApproval(null);
        setAdminRejectionReason("");
        fetchPendingApprovals();
        fetchDashboardData(); // Refresh stats
      } else {
        alert(` பிழை: ${data.error || "புதுப்பிக்க முடியவில்லை"}`);
      }
    } catch {
      alert(" இணைப்புப் பிழை");
    } finally {
      setIsApproving(false);
    }
  };

  useEffect(() => {
    if (sessionUser) {
      const repConst = sessionUser.role === "REPRESENTATIVE" ? sessionUser.constituency : undefined;
      if (sessionUser.role === "REPRESENTATIVE" && repConst) {
        setDemoForm(prev => ({ ...prev, constituency: repConst }));
        setDemoFilterConst(repConst);
      }
      fetchDemoEntries(repConst);
      fetchOfficers();
      if (sessionUser.role === "SUPER_ADMIN") {
        fetchPendingApprovals();
      }
    }
  }, [sessionUser]);

  const handleAddDemoEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoFormError("");
    setDemoFormSuccess("");
    setIsDemoSubmitting(true);
    try {
      const res = await fetch("/api/admin/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...demoForm,
          resolver: demoForm.resolver || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDemoFormSuccess("மாதிரிப் புகார் வெற்றிகரமாகச் சேர்க்கப்பட்டது!");
        setDemoForm(prev => ({ ...prev, title: "", by: "", resolver: "" }));
        fetchDemoEntries(sessionUser?.role === "REPRESENTATIVE" ? sessionUser.constituency : (demoFilterConst || undefined));
        setTimeout(() => setDemoFormSuccess(""), 3000);
      } else {
        setDemoFormError(data.error || "சேர்ப்பதில் பிழை.");
      }
    } catch {
      setDemoFormError("இணைப்புப் பிழை.");
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  const handleDeleteDemoEntry = async (id: string, constituency: string) => {
    if (!confirm("இந்த மாதிரிப் புகாரை நீக்கவா?")) return;
    try {
      const res = await fetch("/api/admin/demo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, constituency }),
      });
      if (res.ok) {
        fetchDemoEntries(sessionUser?.role === "REPRESENTATIVE" ? sessionUser.constituency : (demoFilterConst || undefined));
      }
    } catch {
      alert("நீக்குவதில் பிழை.");
    }
  };

  const SECTORS_LIST = [
    { key: "road", name: "சாலை & போக்குவரத்து" },
    { key: "water", name: "குடிநீர் வழங்கல்" },
    { key: "power", name: "மின் வசதி" },
    { key: "light", name: "தெருவிளக்கு" },
    { key: "drain", name: "கழிவுநீர் & துப்புரவு" },
    { key: "health", name: "மக்கள் நலன் & சுகாதாரம்" },
    { key: "edu", name: "கல்வி" },
    { key: "civic", name: "பொது வசதிகள்" },
  ];

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
    const modalOpen = isCreateModalOpen || isEditModalOpen || isCreateOfficerModalOpen || isEditOfficerModalOpen || !!selectedApproval;
    document.body.classList.toggle("modal-open", modalOpen);
    return () => document.body.classList.remove("modal-open");
  }, [isCreateModalOpen, isEditModalOpen, isCreateOfficerModalOpen, isEditOfficerModalOpen, selectedApproval]);

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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore — clear client state regardless */
    }
    window.location.href = "/login";
  };

  const adminTopBarLinks: TopBarLink[] = [
    ...(sessionUser.role === "SUPER_ADMIN"
      ? [{ href: "#voter-registry", label: "வாக்காளர் பதிவேடு" }]
      : []),
    {
      href: "/admin",
      label: sessionUser.role === "SUPER_ADMIN" ? "நிர்வாகக் கட்டுப்பாடு" : "மாதிரி தரவு",
      active: true,
      highlight: true,
    },
    ...(sessionUser.role === "SUPER_ADMIN"
      ? [{ href: "/complaints", label: "புகார்கள் மேலாண்மை" }]
      : []),
    { href: "/analytics", label: "பகுப்பாய்வு" },
    { href: "/", label: "முகப்பு" },
    { label: "வெளியேறு (Logout)", onClick: handleLogout },
  ];

  return (
    <div className="analytics-body">
      <TvkTopBar
        title="கட்சி நிர்வாகப் பலகை (Admin Panel)"
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
            {sessionUser.role === "SUPER_ADMIN" ? "கண்காணிப்பு & பிரதிநிதி மேலாண்மை தொகுதி (SUPER ADMIN MODULE)" : `மாதிரி தரவு மேலாண்மை — ${sessionUser.constituency} (REPRESENTATIVE MODULE)`}
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
              {sessionUser.role === "SUPER_ADMIN"
                ? `சூப்பர் அட்மின்: ${sessionUser.username} (தலைமைப் பொறுப்பாளர்)`
                : `பிரதிநிதி: ${sessionUser.username} — ${sessionUser.constituency}`}
            </span>
          </div>
          <h1>
            {sessionUser.role === "SUPER_ADMIN"
              ? "தமிழக வெற்றிக் கழகம் தலைமை மேலாண்மைப் பலகை"
              : `${sessionUser.constituency} — மாதிரி தரவு மேலாண்மை`}
          </h1>
          <p style={{ maxWidth: "800px", margin: 0, color: "rgba(255,255,255,0.8)" }}>
            {sessionUser.role === "SUPER_ADMIN"
              ? "நாமக்கல் மேற்கு மாவட்டத்திற்கு உட்பட்ட மூன்று தொகுதிகளின் புகார்களையும், அவற்றைக் கையாள நியமிக்கப்பட்ட மக்கள் தொடர்புப் பிரதிநிதிகளையும் துல்லியமாக நிர்வகிக்கவும் கண்காணிக்கவும் சூப்பர் அட்மினுக்கான பிரத்யேக தளம்."
              : "பகுப்பாய்வு பக்கத்தில் மாதிரி தரவு காட்டும்போது உங்கள் தொகுதிக்கான மாதிரிப் புகார்களை இங்கே சேர்க்கலாம், திருத்தலாம் மற்றும் நீக்கலாம்."}
          </p>
        </div>
      </section>

      {/* DASHBOARD STATISTICS KPI GRID — SUPER ADMIN ONLY */}
      {sessionUser.role === "SUPER_ADMIN" && <section className="section admin-dashboard">
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
      </section>}

      {sessionUser.role === "SUPER_ADMIN" && <section className="section admin-dashboard" style={{ paddingTop: 0 }}>
        <div className="wrap flex flex-col gap-8">
        {/* CONSTITUENCY OVERVIEW TABLE CARD */}
        <div className="card table-card">
          <div className="tc-head">
            <div>
              <h3>தொகுதி வாரியான நிலவரம் (Constituency Overview)</h3>
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
                              <i></i>{item.representative}
                            </span>
                          ) : (
                            <span className="badge warn" style={{ display: "inline-flex" }}>
                              <i></i>பிரதிநிதி இல்லை
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

        {/* FINAL ADMIN APPROVAL QUEUE CARD */}
        <div className="card table-card" style={{ border: "1px dashed var(--ok)" }}>
          <div className="tc-head" style={{ borderBottom: "1px solid var(--line)" }}>
            <div>
              <h3 style={{ color: "var(--ok)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                 இறுதி ஒப்புதல் (Final Admin Approval Queue)
              </h3>
              <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                களப்பணியாளர்கள் முடித்த மற்றும் பிரதிநிதிகள் சரிபார்த்த மனுக்களை இறுதி ஒப்புதல் தந்து தீர்க்கவும்.
              </span>
            </div>
          </div>
          <div className="tbl-scroll">
            <table>
              <thead>
                <tr>
                  <th>மனு எண் (Tracking ID)</th>
                  <th>தொகுதி</th>
                  <th>துறை / வகை</th>
                  <th>சரிபார்த்தவர்</th>
                  <th>களப்பணியாளர்</th>
                  <th style={{ textAlign: "center" }}>விவரம் / ஒப்புதல்</th>
                </tr>
              </thead>
              <tbody>
                {isApprovalsLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.5)" }}>
                      மனுக்கள் ஏற்றப்படுகின்றன...
                    </td>
                  </tr>
                ) : pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--ink-soft)" }}>
                      இறுதி ஒப்புதலுக்காக காத்திருக்கும் மனுக்கள் எதுவும் இல்லை.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((comp) => (
                    <tr key={comp.trackingId}>
                      <td style={{ fontWeight: 800, color: "#A00000" }}>{comp.trackingId}</td>
                      <td style={{ fontWeight: 700 }}>{comp.constituency}</td>
                      <td>
                        <b>{comp.complaintDetails?.category}</b>
                        <span style={{ display: "block", fontSize: "0.78rem", opacity: 0.7 }}>
                          {comp.complaintDetails?.subcategory}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>@{comp.verifiedBy || "பிரதிநிதி"}</td>
                      <td style={{ fontWeight: 600 }}>@{comp.solvedBy || "களப்பணியாளர்"}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="submit-btn"
                          onClick={() => {
                            setSelectedApproval(comp);
                            setAdminRejectionReason("");
                          }}
                          style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem", margin: 0 }}
                        >
                          மதிப்பாய்வு செய் 
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="tbl-foot">
            <span><b>{pendingApprovals.length}</b> மனுக்கள் ஒப்புதலுக்குக் காத்திருக்கின்றன.</span>
          </div>
        </div>

        {/* REPRESENTATIVE USERS MANAGEMENT CARD */}
        <div className="card table-card">
          <div className="tc-head">
            <div>
              <h3>பிரதிநிதிகள் மேலாண்மை (Representative Management)</h3>
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
              புதிய பிரதிநிதியை நியமி
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
                          <i></i>{rep.constituency}
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
                          தொகு / திருத்து
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
      </section>}


      {/* FIELD OFFICER MANAGEMENT SECTION */}
      <section className="section admin-dashboard" style={{ paddingTop: "1rem" }}>
        <div className="wrap flex flex-col gap-6">
          <div className="card table-card">
            <div className="tc-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3> களப்பணி குழு (Field Officer Management)</h3>
                <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                  உங்கள் தொகுதியில் உள்ள களப்பணியாளர்களை உருவாக்கி, திருத்தி, கடவுச்சொற்களை மீட்டமைக்கவும்.
                  {sessionUser.role === "REPRESENTATIVE" && ` தொகுதி: ${sessionUser.constituency}`}
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
                style={{ cursor: "pointer", background: "var(--gold)", color: "var(--m-900)" }}
              >
                + புதிய களப்பணியாளர்
              </button>
            </div>

            <div className="tbl-scroll">
              <table>
                <thead>
                  <tr>
                    <th>பயனர் பெயர் (Username)</th>
                    <th>முழுப்பெயர் (Full Name)</th>
                    <th>தொலைபேசி (Mobile)</th>
                    <th style={{ textAlign: "center" }}>தொகுதி (Constituency)</th>
                    <th style={{ textAlign: "center" }}>கணக்கு நிலை (Status)</th>
                    <th style={{ textAlign: "center" }}>செயல்கள் (Actions)</th>
                  </tr>
                </thead>
                <tbody>
                  {isOfficersLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.5)" }}>
                        தரவுகள் ஏற்றப்படுகின்றன...
                      </td>
                    </tr>
                  ) : officers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.5)" }}>
                        களப்பணியாளர்கள் யாரும் இதுவரை பதிவு செய்யப்படவில்லை.
                      </td>
                    </tr>
                  ) : (
                    officers.map((off) => (
                      <tr key={off._id || off.username}>
                        <td style={{ fontWeight: 800 }}>@{off.username}</td>
                        <td>{off.name || "விவரம் இல்லை"}</td>
                        <td>{off.phone || "விவரம் இல்லை"}</td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>
                          <span className="badge pend" style={{ display: "inline-flex" }}>
                            <i></i>{off.constituency}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {off.active ? (
                            <span className="badge ok" style={{ display: "inline-flex" }}><i></i>செயலில் (Active)</span>
                          ) : (
                            <span className="badge warn" style={{ display: "inline-flex" }}><i></i>முடக்கப்பட்டது</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => {
                              setEditingOfficer(off);
                              setEditOffName(off.name);
                              setEditOffPhone(off.phone);
                              setEditOffActive(off.active);
                              setEditOffConstituency(off.constituency || CONSTITUENCIES[0]);
                              setEditOffPassword("");
                              setEditOffError("");
                              setEditOffSuccess("");
                              setIsEditOfficerModalOpen(true);
                            }}
                            className="tfilt"
                            style={{ cursor: "pointer" }}
                          >
                            தொகு / திருத்து
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="tbl-foot">
              <span><b>{officers.length}</b> களப்பணியாளர்கள்</span>
              <span>மனுக்களை கள ஆய்வுக்கு அனுப்ப இவர்களை ஒதுக்கலாம்.</span>
            </div>
          </div>
        </div>
      </section>

      {sessionUser.role === "SUPER_ADMIN" && <VoterRegistrySection />}

      <TvkAppFooter tagline={sessionUser.role === "SUPER_ADMIN" ? "கட்சி நிர்வாகப் பலகை · SUPER ADMIN" : `மாதிரி தரவு நிர்வாகம் · ${sessionUser.constituency}`} />

      {/* CREATE REPRESENTATIVE MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content admin-modal-content" style={{ maxWidth: "520px" }}>
            <div className="admin-modal-header">
              <img src={TVK_LOGO} alt="" className="admin-modal-whistle" aria-hidden="true" />
              <h3>புதிய தொகுதிப் பிரதிநிதி நியமனம்</h3>
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
              {formError && <div className="admin-form-message error"> {formError}</div>}
              {formSuccess && <div className="admin-form-message success">{formSuccess}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => setIsCreateModalOpen(false)}>ரத்து செய்</button>
                <button type="submit" className="submit-btn" disabled={isFormSubmitting}>
                  {isFormSubmitting ? "பதிவு செய்யப்படுகிறது..." : "பிரதிநிதியை நியமி"}
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
              <h3> பிரதிநிதி கணக்கு திருத்தம் (@{editingRep.username})</h3>
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
                <label htmlFor="edit-password">கடவுச்சொல்லை மீட்டமை (Optional Password Reset)</label>
                <input id="edit-password" type="password" placeholder="புதிய கடவுச்சொல் (மாற்ற விரும்பினால் மட்டும்)" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                <small>கடவுச்சொல்லை மாற்றத் தேவையில்லை எனில் இதைக் காலியாக விடவும்.</small>
              </div>
              <div className="admin-checkbox-row">
                <input type="checkbox" id="editActive" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                <label htmlFor="editActive">கணக்கு செயல்பாட்டில் இருக்கட்டும் (Set account as Active)</label>
              </div>
              {editFormError && <div className="admin-form-message error">{editFormError}</div>}
              {editFormSuccess && <div className="admin-form-message success">{editFormSuccess}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => { setIsEditModalOpen(false); setEditingRep(null); }}>ரத்து செய்</button>
                <button type="submit" className="submit-btn" disabled={isEditFormSubmitting}>
                  {isEditFormSubmitting ? "புதுப்பிக்கப்படுகிறது..." : "மாற்றங்களைச் சேமி "}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FIELD OFFICER MODAL */}
      {isCreateOfficerModalOpen && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content admin-modal-content" style={{ maxWidth: "520px" }}>
            <div className="admin-modal-header">
              <img src={TVK_LOGO} alt="" className="admin-modal-whistle" aria-hidden="true" />
              <h3>புதிய களப்பணியாளர் நியமனம்</h3>
              <button type="button" className="admin-modal-close" onClick={() => setIsCreateOfficerModalOpen(false)} aria-label="மூடு">✕</button>
            </div>
            <form onSubmit={handleCreateOfficer} className="admin-modal-body">
              <div className="admin-modal-field">
                <label htmlFor="off-username">பயனர் பெயர் (Username) *</label>
                <input id="off-username" type="text" placeholder="e.g. field_kumar" value={offUsername} onChange={(e) => setOffUsername(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="off-password">நுழைவு கடவுச்சொல் (Password) *</label>
                <input id="off-password" type="password" placeholder="••••••••" value={offPassword} onChange={(e) => setOffPassword(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="off-name">முழுப்பெயர் (Full Name) *</label>
                <input id="off-name" type="text" placeholder="e.g. குமார்" value={offName} onChange={(e) => setOffName(e.target.value)} required />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="off-phone">தொலைபேசி எண் (Phone Mobile)</label>
                <input id="off-phone" type="tel" placeholder="e.g. 9876543210" value={offPhone} onChange={(e) => setOffPhone(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="off-constituency">ஒதுக்கப்படும் தொகுதி (Constituency)</label>
                {sessionUser?.role === "SUPER_ADMIN" ? (
                  <select id="off-constituency" value={offConstituency} onChange={(e) => setOffConstituency(e.target.value)} title="ஒதுக்கப்படும் தொகுதி" style={{ background: "#FFF", border: "1px solid var(--line)", padding: "0.6rem", borderRadius: "0.5rem", width: "100%", fontWeight: 600 }}>
                    {CONSTITUENCIES.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input id="off-constituency" type="text" value={sessionUser?.constituency || "தலைமை அலுவலகம் (Headquarters)"} disabled style={{ background: "rgba(0,0,0,0.05)" }} title="ஒதுக்கப்படும் தொகுதி" />
                )}
                <small style={{ color: "var(--ink-soft)" }}>
                  {sessionUser?.role === "SUPER_ADMIN" ? "களப்பணியாளருக்கான தொகுதியைத் தேர்ந்தெடுக்கவும்." : "தொகுதி தானாகவே பிரதிநிதியின் தொகுதியிலிருந்து பெறப்படும்."}
                </small>
              </div>
              <div className="admin-checkbox-row">
                <input type="checkbox" id="off-active" checked={offActive} onChange={(e) => setOffActive(e.target.checked)} />
                <label htmlFor="off-active">கணக்கை உடனே செயல்பாட்டுக்கு கொண்டுவரவும்</label>
              </div>
              {offError && <div className="admin-form-message error">{offError}</div>}
              {offSuccess && <div className="admin-form-message success">{offSuccess}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => setIsCreateOfficerModalOpen(false)}>ரத்து செய்</button>
                <button type="submit" className="submit-btn" disabled={isOffSubmitting}>
                  {isOffSubmitting ? "பதிவு செய்யப்படுகிறது..." : "களப்பணியாளரை நியமி"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FIELD OFFICER MODAL */}
      {isEditOfficerModalOpen && editingOfficer && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content admin-modal-content" style={{ maxWidth: "520px" }}>
            <div className="admin-modal-header">
              <img src={TVK_LOGO} alt="" className="admin-modal-whistle" aria-hidden="true" />
              <h3>களப்பணியாளர் கணக்கு திருத்தம் (@{editingOfficer.username})</h3>
              <button type="button" className="admin-modal-close" onClick={() => { setIsEditOfficerModalOpen(false); setEditingOfficer(null); }} aria-label="மூடு">✕</button>
            </div>
            <form onSubmit={handleEditOfficer} className="admin-modal-body">
              <div className="admin-modal-field">
                <label htmlFor="edit-off-name">முழுப்பெயர் (Full Name)</label>
                <input id="edit-off-name" type="text" placeholder="முழுப்பெயர்" value={editOffName} onChange={(e) => setEditOffName(e.target.value)} />
              </div>
              <div className="admin-modal-field">
                <label htmlFor="edit-off-phone">தொலைபேசி எண் (Phone Mobile)</label>
                <input id="edit-off-phone" type="tel" placeholder="தொலைபேசி எண்" value={editOffPhone} onChange={(e) => setEditOffPhone(e.target.value)} />
              </div>
              <div className="admin-password-block admin-modal-field">
                <label htmlFor="edit-off-password">கடவுச்சொல்லை மீட்டமை (Optional Password Reset)</label>
                <input id="edit-off-password" type="password" placeholder="புதிய கடவுச்சொல் (மாற்ற விரும்பினால் மட்டும்)" value={editOffPassword} onChange={(e) => setEditOffPassword(e.target.value)} />
                <small>கடவுச்சொல்லை மாற்றத் தேவையில்லை எனில் இதைக் காலியாக விடவும்.</small>
              </div>
              {sessionUser?.role === "SUPER_ADMIN" && (
                <div className="admin-modal-field">
                  <label htmlFor="edit-off-constituency">தொகுதி மாற்றம் / இடமாற்றம் (Transfer Constituency)</label>
                  <select id="edit-off-constituency" value={editOffConstituency} onChange={(e) => setEditOffConstituency(e.target.value)} title="தொகுதி இடமாற்றம்" style={{ background: "#FFF", border: "1px solid var(--line)", padding: "0.6rem", borderRadius: "0.5rem", width: "100%", fontWeight: 600 }}>
                    {CONSTITUENCIES.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                  <small style={{ color: "var(--ink-soft)" }}>களப்பணியாளரை மற்றொரு தொகுதிக்கு மாற்ற இதைப் பயன்படுத்தவும்.</small>
                </div>
              )}
              <div className="admin-checkbox-row">
                <input type="checkbox" id="editOffActive" checked={editOffActive} onChange={(e) => setEditOffActive(e.target.checked)} />
                <label htmlFor="editOffActive">கணக்கு செயல்பாட்டில் இருக்கட்டும்</label>
              </div>
              {editOffError && <div className="admin-form-message error">{editOffError}</div>}
              {editOffSuccess && <div className="admin-form-message success">{editOffSuccess}</div>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-modal-cancel" onClick={() => { setIsEditOfficerModalOpen(false); setEditingOfficer(null); }}>ரத்து செய்</button>
                <button type="submit" className="submit-btn" disabled={isEditOffSubmitting}>
                  {isEditOffSubmitting ? "புதுப்பிக்கப்படுகிறது..." : "மாற்றங்களைச் சேமி"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN APPROVAL REVIEW MODAL */}
      {selectedApproval && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content detail-modal-content" style={{ maxWidth: "800px" }}>
            <div className="detail-modal-header" style={{ background: "var(--m-900)" }}>
              <img src={TVK_LOGO} alt="" className="detail-modal-whistle" aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85, fontWeight: 700, color: "#FFF1BE" }}>மனு ஆய்வு &amp; இறுதி ஒப்புதல்</span>
                <h3 style={{ color: "white" }}>மனு எண்: {selectedApproval.trackingId}</h3>
              </div>
              <button type="button" className="detail-modal-close" onClick={() => setSelectedApproval(null)} aria-label="மூடு">✕</button>
            </div>

            <div className="detail-modal-body" style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }} className="mobile-one-col">
                <div className="detail-modal-section">
                  <h4 style={{ borderBottom: "2px solid #FECB02", paddingBottom: "0.35rem", marginBottom: "0.75rem", color: "var(--m-900)", fontWeight: 800 }}>குடிமகன் விவரங்கள்</h4>
                  <div className="detail-modal-stack" style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
                    <div><span style={{ opacity: 0.6 }}>பெயர்:</span> <b>{selectedApproval.citizenDetails?.name || "தெரியவில்லை"}</b></div>
                    <div><span style={{ opacity: 0.6 }}>அலைபேசி:</span> <b>{selectedApproval.citizenDetails?.mobile || "இல்லை"}</b></div>
                    <div><span style={{ opacity: 0.6 }}>வாக்காளர் ID:</span> <b>{selectedApproval.voterId}</b></div>
                    <div><span style={{ opacity: 0.6 }}>வகை:</span> <b>{selectedApproval.complaintDetails?.category} - {selectedApproval.complaintDetails?.subcategory}</b></div>
                    <div><span style={{ opacity: 0.6 }}>அவசர நிலை:</span> <b style={{ color: "var(--red)" }}>{selectedApproval.complaintDetails?.urgency || "சாதாரணமானது"}</b></div>
                  </div>
                </div>

                <div className="detail-modal-section">
                  <h4 style={{ borderBottom: "2px solid #FECB02", paddingBottom: "0.35rem", marginBottom: "0.75rem", color: "var(--m-900)", fontWeight: 800 }}>இருப்பிடம் &amp; முகவரி</h4>
                  <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}><b>தொகுதி:</b> {selectedApproval.constituency}, <b>வார்டு:</b> {selectedApproval.ward}</p>
                  {selectedApproval.geolocation?.latitude != null ? (
                    <div>
                      <p style={{ fontSize: "0.8rem", margin: "0 0 0.5rem 0" }}> Lat: <b>{Number(selectedApproval.geolocation.latitude).toFixed(5)}</b>, Lon: <b>{Number(selectedApproval.geolocation.longitude).toFixed(5)}</b></p>
                      <div className="complaint-map-wrap" style={{ height: "120px" }}>
                        <iframe
                          title="GPS map"
                          src={getGoogleMapsEmbedUrl(Number(selectedApproval.geolocation.latitude), Number(selectedApproval.geolocation.longitude))}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "#888", fontStyle: "italic" }}>இருப்பிட விவரம் இல்லை</p>
                  )}
                </div>
              </div>

              <div style={{ background: "#F9FAFB", padding: "1rem", borderRadius: "0.75rem", borderLeft: "4px solid #A00000", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.25rem 0", color: "#A00000", fontSize: "0.9rem", fontWeight: 800 }}>மனு விளக்கம்:</h4>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#111", lineHeight: "1.5", fontWeight: 600 }}>{selectedApproval.complaintDetails?.description || "விளக்கம் இல்லை"}</p>
              </div>

              {/* EVIDENCE SECTION */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "0.75rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#4A080E", fontSize: "0.95rem", borderBottom: "2px solid #FECB02", paddingBottom: "0.35rem", marginBottom: "0.75rem", fontWeight: 800 }}> களப்பணி சான்றுகள் (Field Work Evidence)</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1rem" }} className="mobile-one-col">
                  <div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#666", display: "block", marginBottom: "0.35rem" }}>பணிக்கு முன் (Before Work):</span>
                    {selectedApproval.beforeImages?.length > 0 ? (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {selectedApproval.beforeImages.map((img: string, idx: number) => (
                          <a href={img} target="_blank" rel="noopener noreferrer" key={idx} style={{ width: "80px", height: "80px", borderRadius: "0.4rem", overflow: "hidden", border: "1px solid #EEE" }}>
                            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#999", fontStyle: "italic" }}>புகைப்படங்கள் இல்லை</span>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#666", display: "block", marginBottom: "0.35rem" }}>பணிக்கு பின் (After Work):</span>
                    {selectedApproval.afterImages?.length > 0 ? (
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {selectedApproval.afterImages.map((img: string, idx: number) => (
                          <a href={img} target="_blank" rel="noopener noreferrer" key={idx} style={{ width: "80px", height: "80px", borderRadius: "0.4rem", overflow: "hidden", border: "1px solid #EEE" }}>
                            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#999", fontStyle: "italic" }}>புகைப்படங்கள் இல்லை</span>
                    )}
                  </div>
                </div>

                {selectedApproval.videos?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#666", display: "block", marginBottom: "0.5rem" }}>வீடியோ ஆதாரம் (Video Evidence):</span>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      {selectedApproval.videos.map((vid: string, idx: number) => (
                        <video key={idx} src={vid} controls playsInline style={{ maxWidth: "320px", width: "100%", height: "auto", borderRadius: "0.4rem" }} />
                      ))}
                    </div>
                  </div>
                )}

                {selectedApproval.workNotes && (
                  <div style={{ background: "#F4FDF4", padding: "0.75rem", borderRadius: "0.5rem", borderLeft: "4px solid #5E8C3A", marginTop: "1rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#333", display: "block" }}>களப்பணியாளர் பணி நிறைவு குறிப்பு:</span>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#111", lineHeight: "1.4", fontWeight: 600 }}>{selectedApproval.workNotes}</p>
                  </div>
                )}
              </div>

              {/* TIMELINE */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "0.75rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#4A080E", fontSize: "0.95rem", borderBottom: "2px solid #FECB02", paddingBottom: "0.35rem", marginBottom: "0.75rem", fontWeight: 800 }}> மனுவின் நிலை போக்கு</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {(selectedApproval.timeline || []).map((step: any, sIdx: number) => (
                    <div key={sIdx} style={{ fontSize: "0.78rem", background: "#F3F4F6", padding: "0.35rem 0.6rem", borderRadius: "2rem", border: "1px solid #E5E7EB", display: "inline-flex", gap: "0.25rem" }}>
                      <b>{getStatusLabel(step.status)}</b>
                      <span style={{ opacity: 0.6 }}>({new Date(step.updatedAt).toLocaleDateString("ta-IN")})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION FORM */}
              <div style={{ background: "rgba(94, 140, 58, 0.08)", border: "1px dashed #5E8C3A", borderRadius: "0.75rem", padding: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <h4 style={{ color: "#1B4314", margin: "0 0 0.2rem 0", fontWeight: 800 }}> இறுதி முடிவு (Final Decision)</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>மனுவை முழுமையாகத் தீர்த்து வைக்கவும் அல்லது திருத்தங்களுக்காக மீண்டும் அனுப்பவும்.</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => handleAdminApproval(selectedApproval.trackingId, true)}
                      disabled={isApproving}
                      style={{ background: "#5E8C3A", color: "white", border: "none", padding: "0.5rem 1.2rem", borderRadius: "0.4rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
                    >
                      {isApproving ? "ஒப்புதல் அளிக்கப்படுகிறது..." : "தீர்க்கப்பட்டது (Approve & Resolve)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdminApproval(selectedApproval.trackingId, false)}
                      disabled={isApproving || !adminRejectionReason.trim()}
                      style={{ background: "#A00000", color: "white", border: "none", padding: "0.5rem 1.2rem", borderRadius: "0.4rem", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem", opacity: adminRejectionReason.trim() ? 1 : 0.5 }}
                    >
                      மீண்டும் அனுப்பு (Send Back)
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="admin-rejection-reason" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#333", display: "block", marginBottom: "0.35rem" }}>
                    மறுப்பு / திருத்த விவரங்கள் (Rejection Reason - மீண்டும் அனுப்பும்போது மட்டும் கட்டாயம்):
                  </label>
                  <textarea
                    id="admin-rejection-reason"
                    rows={2}
                    placeholder="மனுவை மீண்டும் அனுப்பத் தேவையான திருத்தங்கள் அல்லது விவரங்களை இங்கே எழுதவும்..."
                    value={adminRejectionReason}
                    onChange={(e) => setAdminRejectionReason(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #CCC", fontSize: "0.85rem" }}
                  />
                </div>
              </div>
            </div>

            <div className="detail-modal-footer">
              <button type="button" className="admin-modal-cancel" onClick={() => setSelectedApproval(null)}>மூடு</button>
            </div>
          </div>
        </div>
      )}

      <WhistleCursor />
    </div>
  );
}
