"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import "../analytics/analytics.css";
import { CONSTITUENCIES, ALL_AREAS } from "@/lib/constituencies";
import { TVK_LOGO } from "@/lib/brand";
import TvkAppFooter from "@/components/TvkAppFooter";
import TvkTopBar, { type TopBarLink } from "@/components/TvkTopBar";
import { getComplaintPhotos, getComplaintVideo } from "@/lib/complaintMedia";
import { getGoogleMapsEmbedUrl, getGoogleMapsOpenUrl } from "@/lib/maps";
import { getStatusLabel, normalizeStatus } from "@/lib/complaintStatus";

const STATUS_FILTER_LABELS: Record<string, string> = {
  all: "அனைத்தும்",
  registered: "பதிவு செய்யப்பட்டது",
  under_review: "பிரதிநிதி ஆய்வில்",
  assigned: "களப்பணியாளருக்கு ஒதுக்கப்பட்டது",
  work_in_progress: "களப்பணி நடைபெறுகிறது",
  solution_submitted: "தீர்வு சமர்ப்பிக்கப்பட்டது",
  pending_rep_approval: "பிரதிநிதி ஒப்புதல் நிலுவையில்",
  pending_admin_approval: "நிர்வாக ஒப்புதல் நிலுவையில்",
  resolved: "தீர்க்கப்பட்டது",
};

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

  // Manage modal-open body class for cursor overrides
  useEffect(() => {
    const modalOpen = !!selectedComplaint || isCreateOfficerModalOpen || isEditOfficerModalOpen;
    document.body.classList.toggle("modal-open", modalOpen);
    return () => document.body.classList.remove("modal-open");
  }, [selectedComplaint, isCreateOfficerModalOpen, isEditOfficerModalOpen]);

  const activeOfficers = useMemo(() => officers.filter(o => o.active), [officers]);

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

  // Allowed areas for filtering
  const allowedAreas = useMemo(() => {
    if (sessionUser && sessionUser.role === "REPRESENTATIVE") {
      return ALL_AREAS.filter((a) => a === sessionUser.constituency);
    }
    return ALL_AREAS;
  }, [sessionUser]);

  // Filtered complaints calculation
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Area filter
      if (curArea !== "அனைத்தும்" && c.constituency !== curArea) return false;
      // Status filter
      const cStatus = normalizeStatus(c.status);
      if (curStatus !== "all") {
        if (curStatus === "pend") {
          if (cStatus !== "registered" && cStatus !== "under_review") return false;
        } else if (curStatus === "warn") {
          if (cStatus === "registered" || cStatus === "under_review" || cStatus === "resolved") return false;
        } else if (curStatus === "ok") {
          if (cStatus !== "resolved") return false;
        } else {
          if (cStatus !== curStatus) return false;
        }
      }
      // Category filter
      if (curCategory !== "அனைத்தும்" && c.complaintDetails?.category !== curCategory) return false;
      // Search filter (ID, citizen name, description, phone)
      if (curSearch.trim() !== "") {
        const searchLower = curSearch.toLowerCase();
        const trackingId = (c.trackingId || "").toLowerCase();
        const citizenName = (c.citizenDetails?.name || "").toLowerCase();
        const description = (c.complaintDetails?.description || "").toLowerCase();
        const phone = (c.citizenDetails?.mobile || "").toLowerCase();
        const voterId = (c.voterId || "").toLowerCase();

        return (
          trackingId.includes(searchLower) ||
          citizenName.includes(searchLower) ||
          description.includes(searchLower) ||
          phone.includes(searchLower) ||
          voterId.includes(searchLower)
        );
      }
      return true;
    });
  }, [complaints, curArea, curStatus, curCategory, curSearch]);

  // Handle Status Update
  const handleUpdateStatus = async (trackingId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    setStatusUpdateMessage("");
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusUpdateMessage("நிலை புதுப்பிக்கப்பட்டது!");
        
        // Update local state instantly
        setComplaints((prev) =>
          prev.map((c) => (c.trackingId === trackingId ? { ...c, status: newStatus } : c))
        );
        // Also update selected complaint in modal
        setSelectedComplaint((prev: any) => (prev ? { ...prev, status: newStatus } : null));

        // Refresh database data in background
        fetchComplaints();
      } else {
        setStatusUpdateMessage(`❌ பிழை: ${data.error || "புதுப்பிக்க முடியவில்லை"}`);
      }
    } catch (err) {
      console.error(err);
      setStatusUpdateMessage("❌ இணைப்புப் பிழை");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignOfficer = async (trackingId: string) => {
    if (!selectedOfficerUsername) {
      alert("தயவுசெய்து ஒரு களப்பணியாளரைத் தேர்ந்தெடுக்கவும்");
      return;
    }
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
        setStatusUpdateMessage("களப்பணியாளர் வெற்றிகரமாக ஒதுக்கப்பட்டார்!");
        const assignedOfficer = officers.find(o => o.username === selectedOfficerUsername);
        const nameToUse = assignedOfficer?.name || selectedOfficerUsername;
        setComplaints((prev) =>
          prev.map((c) => (c.trackingId === trackingId ? { ...c, status: "assigned", assignedTo: selectedOfficerUsername, assignedToName: nameToUse } : c))
        );
        setSelectedComplaint((prev: any) =>
          prev ? { ...prev, status: "assigned", assignedTo: selectedOfficerUsername, assignedToName: nameToUse } : null
        );
        setSelectedOfficerUsername("");
        fetchComplaints();
      } else {
        setStatusUpdateMessage(`❌ பிழை: ${data.error || "ஒதுக்க முடியவில்லை"}`);
      }
    } catch {
      setStatusUpdateMessage("❌ இணைப்புப் பிழை");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRepReview = async (trackingId: string, approve: boolean) => {
    if (!approve && !rejectionReason.trim()) {
      alert("நிராகரிப்பதற்கான காரணத்தை உள்ளிடவும்.");
      return;
    }
    setIsUpdatingStatus(true);
    setStatusUpdateMessage("");
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId,
          action: approve ? "rep_approve" : "rep_reject",
          rejectionReason: approve ? undefined : rejectionReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextStatus = approve ? "pending_admin_approval" : "work_in_progress";
        setStatusUpdateMessage(approve ? "மனு வெற்றிகரமாக அங்கீகரிக்கப்பட்டது!" : "❌ மனு நிராகரிக்கப்பட்டு மீண்டும் களப்பணிக்கு அனுப்பப்பட்டது.");
        setComplaints((prev) =>
          prev.map((c) => (c.trackingId === trackingId ? { ...c, status: nextStatus } : c))
        );
        setSelectedComplaint((prev: any) =>
          prev ? { ...prev, status: nextStatus } : null
        );
        setRejectionReason("");
        fetchComplaints();
      } else {
        setStatusUpdateMessage(`❌ பிழை: ${data.error || "புதுப்பிக்க முடியவில்லை"}`);
      }
    } catch {
      setStatusUpdateMessage("❌ இணைப்புப் பிழை");
    } finally {
      setIsUpdatingStatus(false);
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

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#220305] text-white">
        <div className="flex flex-col items-center gap-4">
          <span className="w-12 h-12 border-4 border-[#FECB02] border-t-transparent rounded-full animate-spin"></span>
          <p className="font-bold">ஏற்றப்படுகிறது... (Loading...)</p>
        </div>
      </div>
    );
  }

  const topBarLinks: TopBarLink[] = [
    ...(sessionUser?.role === "SUPER_ADMIN"
      ? [{ href: "/admin", label: "⚙️ நிர்வாகக் கட்டுப்பாடு", highlight: true }]
      : []),
    { href: "/analytics", label: "பகுப்பாய்வு" },
    { href: "/complaints", label: "புகார்கள் மேலாண்மை", active: true },
    { href: "/", label: "முகப்புக்குத் திரும்பு" },
  ];

  return (
    <div className="analytics-body">
      <TvkTopBar title="மக்கள் குரல் மையம்" brandHref="/complaints" links={topBarLinks} />

      {/* PAGE HERO */}
      <section className="phero" style={{ background: 'linear-gradient(135deg, #3C060B 0%, #150102 100%)', padding: '2.5rem 1rem 2.5rem 1rem' }}>
        <img className="ph-medal-whistle" src={TVK_LOGO} alt="" aria-hidden="true" />
        <div className="wrap flex flex-col items-start gap-4">
          <span className="ph-eyebrow" style={{ color: '#FECB02' }}>பிரதிநிதி மேலாண்மை அமைப்பு</span>
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
              <span>உள்நுழைந்துள்ளவர்: {sessionUser.username} ({sessionUser.role === "SUPER_ADMIN" ? "நிர்வாகி" : `பிரதிநிதி - ${sessionUser.constituency}`})</span>
            </div>
          )}
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>புகார்கள் மேலாண்மைப் பக்கம்</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '800px', margin: 0 }}>
            மக்களால் பதிவு செய்யப்பட்ட அனைத்துப் புகார்களின் விவரங்களையும் இங்கே கண்காணிக்கலாம், சரிபார்க்கலாம், மற்றும் அவற்றின் தீர்வு நிலைகளை உடனுக்குடன் மேம்படுத்தலாம்.
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
                <span className="fb-label">ஒன்றியம்/பகுதி:</span>
                <div className="area-chips">
                  {allowedAreas.map((a, i) => (
                    <button
                      key={i}
                      className={`achip ${curArea === a ? 'active' : ''}`}
                      onClick={() => setCurArea(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="complaints-filter-controls">
              <div className="complaints-filter-item">
                <span className="fb-label">நிலை (Status):</span>
                <select
                  value={curStatus}
                  onChange={(e) => setCurStatus(e.target.value)}
                  title="மனுக்களின் நிலை"
                >
                  <option value="all">அனைத்து நிலைகளும்</option>
                  <option value="registered">பதிவு செய்யப்பட்டது (Registered)</option>
                  <option value="under_review">பிரதிநிதி ஆய்வில் (Under Review)</option>
                  <option value="assigned">களப்பணியாளருக்கு ஒதுக்கப்பட்டது (Assigned)</option>
                  <option value="work_in_progress">களப்பணி நடைபெறுகிறது (Work In Progress)</option>
                  <option value="solution_submitted">தீர்வு சமர்ப்பிக்கப்பட்டது (Solution Submitted)</option>
                  <option value="pending_rep_approval">பிரதிநிதி ஒப்புதல் நிலுவையில் (Pending Rep Approval)</option>
                  <option value="pending_admin_approval">நிர்வாக ஒப்புதல் நிலுவையில் (Pending Admin Approval)</option>
                  <option value="resolved">தீர்க்கப்பட்டது (Resolved)</option>
                  <option value="pend">பதிவில் (Legacy Pending)</option>
                  <option value="warn">நடவடிக்கையில் (Legacy In Progress)</option>
                  <option value="ok">தீர்க்கப்பட்டது (Legacy Resolved)</option>
                </select>
              </div>

              <div className="complaints-filter-item">
                <span className="fb-label">துறை:</span>
                <select
                  value={curCategory}
                  onChange={(e) => setCurCategory(e.target.value)}
                  title="துறை வாரித் தேர்வு"
                >
                  <option value="அனைத்தும்">அனைத்து துறைகளும்</option>
                  {Object.keys(CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
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
                      placeholder="தேடு (பெயர், ID, மொபைல், விளக்கம்)..."
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
              <h3>புகார்கள் மற்றும் விண்ணப்பங்கள் பட்டியல்</h3>
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
                 {isLoadingComplaints ? "புதுப்பிக்கிறது..." : "புதுப்பி"}
              </button>
            </div>

            <div className="tbl-scroll">
              <table>
                <thead>
                  <tr>
                    <th>விண்ணப்ப எண் (ID)</th>
                    <th>குடிமகன் பெயர்</th>
                    <th>ஒன்றியம் (Constituency)</th>
                    <th>வகை (Category)</th>
                    <th>நிலை (Status)</th>
                    <th>பதிவு செய்யப்பட்ட தேதி</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingComplaints ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                        <span className="w-8 h-8 border-4 border-[#A00000] border-t-transparent rounded-full animate-spin inline-block"></span>
                        <p style={{ marginTop: '0.5rem', fontWeight: 700 }}>தரவுகள் ஏற்றப்படுகின்றன...</p>
                      </td>
                    </tr>
                  ) : filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="t-empty" style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
                        இங்கு காட்டப்பட எந்தப் புகார்களும் கண்டறியப்படவில்லை.
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((c) => {
                      const createdDate = new Date(c.createdAt || Date.now());
                      const dateStr = `${String(createdDate.getDate()).padStart(2, "0")}/${String(
                        createdDate.getMonth() + 1
                      ).padStart(2, "0")}/${String(createdDate.getFullYear()).slice(-2)}`;
                      
                      const cStatus = c.status || "pend";

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
                            {c.citizenDetails?.name || "தெரியவில்லை"}
                          </td>
                          <td className="t-meta">{c.constituency}</td>
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
                              <b>{c.complaintDetails?.category || "பிற"}</b>
                              {c.complaintDetails?.subcategory && <span style={{ opacity: 0.6, fontSize: '0.85em' }}> - {c.complaintDetails.subcategory}</span>}
                            </span>
                          </td>
                          <td>
                            {(() => {
                              const norm = normalizeStatus(c.status);
                              const label = getStatusLabel(c.status);
                              if (norm === "resolved") {
                                return <span className="badge ok"><i></i>{label}</span>;
                              }
                              if (norm === "registered") {
                                return <span className="badge pend"><i></i>{label}</span>;
                              }
                              return <span className="badge warn"><i></i>{label}</span>;
                            })()}
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
              <span>மொத்தம் <b>{filteredComplaints.length}</b> புகார்கள் கண்டறியப்பட்டுள்ளன.</span>
              <span>மனுவின் வரிசையைக் கிளிக் செய்வதன் மூலம் அதன் முழுவிவரங்களைக் காணவும், நிலையை மாற்றவும் முடியும்.</span>
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
                  <h3> களப்பணி குழு (Field Officer Management)</h3>
                  <span className="sub" style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                    உங்கள் தொகுதியில் உள்ள களப்பணியாளர்களை உருவாக்கி, திருத்தி, மற்றும் கடவுச்சொற்களை மீட்டமைக்கவும்.
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
                  style={{ cursor: "pointer", background: "var(--gold)", color: "var(--m-900)", padding: '0.5rem 1rem', fontSize: '0.85rem' }}
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
                      <th style={{ textAlign: "center" }}>கணக்கு நிலை (Status)</th>
                      <th style={{ textAlign: "center" }}>செயல்கள் (Actions)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isOfficersLoading ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "3rem" }}>
                          <span className="w-8 h-8 border-4 border-[#A00000] border-t-transparent rounded-full animate-spin inline-block"></span>
                          <p style={{ marginTop: '0.5rem', fontWeight: 700 }}>தரவுகள் ஏற்றப்படுகின்றன...</p>
                        </td>
                      </tr>
                    ) : officers.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#777" }}>
                          களப்பணியாளர்கள் யாரும் இதுவரை நியமிக்கப்படவில்லை.
                        </td>
                      </tr>
                    ) : (
                      officers.map((off) => (
                        <tr key={off._id || off.username}>
                          <td style={{ fontWeight: 800 }}>@{off.username}</td>
                          <td>{off.name || "விவரம் இல்லை"}</td>
                          <td>{off.phone || "விவரம் இல்லை"}</td>
                          <td style={{ textAlign: "center" }}>
                            {off.active ? (
                              <span className="badge ok" style={{ display: "inline-flex" }}><i></i>செயலில் (Active)</span>
                            ) : (
                              <span className="badge warn" style={{ display: "inline-flex" }}><i></i>முடக்கப்பட்டது</span>
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
                <span>மொத்தம் <b>{officers.length}</b> களப்பணியாளர்கள் உள்ளனர்.</span>
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
              <h3> புதிய களப்பணியாளர் நியமனம்</h3>
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
                <input id="off-constituency" type="text" value={sessionUser.constituency || "தலைமை அலுவலகம் (Headquarters)"} disabled style={{ background: "rgba(0,0,0,0.05)" }} title="ஒதுக்கப்படும் தொகுதி" />
                <small style={{ color: "var(--ink-soft)" }}>தொகுதி தானாகவே பிரதிநிதியின் தொகுதியிலிருந்து பெறப்படும்.</small>
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
        <div className="modal-overlay admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content admin-modal-content" style={{ maxWidth: "520px" }}>
            <div className="admin-modal-header">
              <img src={TVK_LOGO} alt="" className="detail-modal-whistle" aria-hidden="true" />
              <h3> களப்பணியாளர் கணக்கு திருத்தம் (@{editingOfficer.username})</h3>
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
              <div className="admin-modal-field">
                <label htmlFor="edit-off-password">கடவுச்சொல்லை மீட்டமை (Optional Password Reset)</label>
                <input id="edit-off-password" type="password" placeholder="புதிய கடவுச்சொல் (மாற்ற விரும்பினால் மட்டும்)" value={editOffPassword} onChange={(e) => setEditOffPassword(e.target.value)} />
                <small style={{ color: "var(--ink-soft)" }}>கடவுச்சொல்லை மாற்றத் தேவையில்லை எனில் இதைக் காலியாக விடவும்.</small>
              </div>
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

      {/* COMPLAINT DETAILS MODAL */}
      {selectedComplaint && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content detail-modal-content">
            <div className="detail-modal-header">
              <img src={TVK_LOGO} alt="" className="detail-modal-whistle" aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, fontWeight: 700, color: '#FFF1BE' }}>விண்ணப்ப விவரங்கள்</span>
                <h3>மனு எண்: {selectedComplaint.trackingId}</h3>
              </div>
              <button type="button" className="detail-modal-close" onClick={() => setSelectedComplaint(null)} aria-label="மூடு">✕</button>
            </div>

            <div className="detail-modal-body">
              <div className="detail-modal-grid">
                
                {/* citizen info */}
                <div className="detail-modal-section">
                  <h4>குடிமகன் விவரங்கள் (Citizen Details)</h4>
                  <div className="detail-modal-stack">
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>பெயர்:</span> <b style={{ color: '#111' }}>{selectedComplaint.citizenDetails?.name || "தெரியவில்லை"}</b></div>
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>வாக்காளர் ID (Voter ID):</span> <b style={{ color: '#111' }}>{selectedComplaint.voterId}</b></div>
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>தொலைபேசி:</span> <b style={{ color: '#A00000' }}>{selectedComplaint.citizenDetails?.mobile || "இல்லை"}</b></div>
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>வார்டு எண்:</span> <b>{selectedComplaint.ward}</b></div>
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>தொகுதி:</span> <b>{selectedComplaint.constituency}</b></div>
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>முகவரி (Address):</span> <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, color: '#333', lineHeight: '1.4' }}>{selectedComplaint.citizenDetails?.address || "இல்லை"}</p></div>
                  </div>
                </div>

                {/* complaint details info */}
                <div className="detail-modal-section">
                  <h4>புகார் விவரங்கள்</h4>
                  <div className="detail-modal-stack">
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>துறை (Category):</span> <b style={{ color: '#111' }}>{selectedComplaint.complaintDetails?.category}</b></div>
                    {selectedComplaint.complaintDetails?.subcategory && (
                      <div><span style={{ opacity: 0.6, fontWeight: 600 }}>துணைப்பிரிவு:</span> <b>{selectedComplaint.complaintDetails?.subcategory}</b></div>
                    )}
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>அவசர நிலை:</span> <span style={{
                      background: selectedComplaint.complaintDetails?.urgency === "அதி அவசரம்" ? "#FEE2E2" : "#FFF7ED",
                      color: selectedComplaint.complaintDetails?.urgency === "அதி அவசரம்" ? "#991B1B" : "#C2410C",
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}>{selectedComplaint.complaintDetails?.urgency || "சாதாரணமானது"}</span></div>
                    
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>பதிவு நாள்:</span> <b>{new Date(selectedComplaint.createdAt).toLocaleString("ta-IN")}</b></div>
                    
                    <div><span style={{ opacity: 0.6, fontWeight: 600 }}>GPS இருப்பிடம்:</span> 
                      {selectedCoords ? (
                        <div className="complaint-location-block">
                          <p style={{ margin: '0.2rem 0 0.5rem 0', fontSize: '0.85rem' }}>
                            📍 Lat: <b>{selectedCoords.lat.toFixed(5)}</b>, Lon: <b>{selectedCoords.lon.toFixed(5)}</b>
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
                            Google Maps-இல் திற →
                          </a>
                        </div>
                      ) : (
                        <b style={{ color: '#777' }}> வழங்கப்படவில்லை</b>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* DESCRIPTION */}
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem', padding: '1.2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h4 style={{ color: '#4A080E', fontSize: '1rem', borderBottom: '2px solid #FECB02', paddingBottom: '0.4rem', marginBottom: '0.8rem', fontWeight: 800 }}>விளக்கம் (Complaint Description)</h4>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#222', whiteSpace: 'pre-wrap', fontWeight: 600 }}>
                  {selectedComplaint.complaintDetails?.description || "விளக்கம் இல்லை"}
                </p>
              </div>

              {/* MEDIA SECTION */}
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem', padding: '1.2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h4 style={{ color: '#4A080E', fontSize: '1rem', borderBottom: '2px solid #FECB02', paddingBottom: '0.4rem', marginBottom: '0.8rem', fontWeight: 800 }}>கோப்புகள் & புகைப்படங்கள் (Media Files)</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="mobile-one-col">
                  
                  {/* Photos */}
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', display: 'block', marginBottom: '0.5rem' }}>புகைப்படங்கள் (Photos):</span>
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
                      <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>புகைப்படங்கள் எதுவும் பதிவேற்றப்படவில்லை</p>
                    )}
                  </div>

                  {/* Video */}
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', display: 'block', marginBottom: '0.5rem' }}>வீடியோ (Video):</span>
                    {selectedVideo ? (
                      <video 
                        src={selectedVideo} 
                        controls 
                        playsInline
                        className="complaint-media-video"
                      />
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>வீடியோ எதுவும் பதிவேற்றப்படவில்லை</p>
                    )}
                  </div>

                </div>
              </div>

              {/* FIELD WORK EVIDENCE SECTION (If available) */}
              {(selectedComplaint.beforeImages?.length > 0 || selectedComplaint.afterImages?.length > 0 || selectedComplaint.workNotes) && (
                <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem', padding: '1.2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ color: '#4A080E', fontSize: '1rem', borderBottom: '2px solid #FECB02', paddingBottom: '0.4rem', marginBottom: '0.8rem', fontWeight: 800 }}> களப்பணி சான்றுகள் (Field Work Evidence)</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }} className="mobile-one-col">
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', display: 'block', marginBottom: '0.5rem' }}>பணிக்கு முன் (Before Work):</span>
                      {selectedComplaint.beforeImages?.length > 0 ? (
                        <div className="complaint-media-grid">
                          {selectedComplaint.beforeImages.map((photo: string, idx: number) => (
                            <a href={photo} target="_blank" rel="noopener noreferrer" key={idx} className="complaint-media-thumb">
                              <img src={photo} alt={`Before ${idx + 1}`} loading="lazy" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>புகைப்படங்கள் இல்லை</p>
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', display: 'block', marginBottom: '0.5rem' }}>பணிக்கு பின் (After Work):</span>
                      {selectedComplaint.afterImages?.length > 0 ? (
                        <div className="complaint-media-grid">
                          {selectedComplaint.afterImages.map((photo: string, idx: number) => (
                            <a href={photo} target="_blank" rel="noopener noreferrer" key={idx} className="complaint-media-thumb">
                              <img src={photo} alt={`After ${idx + 1}`} loading="lazy" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>புகைப்படங்கள் இல்லை</p>
                      )}
                    </div>
                  </div>

                  {selectedComplaint.videos?.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', display: 'block', marginBottom: '0.5rem' }}>வீடியோ ஆதாரம் (Video Evidence):</span>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {selectedComplaint.videos.map((vid: string, idx: number) => (
                          <video key={idx} src={vid} controls playsInline className="complaint-media-video" style={{ maxWidth: '320px', height: 'auto' }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedComplaint.workNotes && (
                    <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem', borderLeft: '4px solid #5E8C3A' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#333', display: 'block', marginBottom: '0.35rem' }}>பணி நிறைவு குறிப்பு (Work Notes):</span>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#111', lineHeight: '1.5', whiteSpace: 'pre-wrap', fontWeight: 600 }}>{selectedComplaint.workNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TIMELINE SECTION */}
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.75rem', padding: '1.2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h4 style={{ color: '#4A080E', fontSize: '1rem', borderBottom: '2px solid #FECB02', paddingBottom: '0.4rem', marginBottom: '0.8rem', fontWeight: 800 }}> மனு நிலை போக்கு (Tracking Timeline)</h4>
                <div className="activity-timeline" style={{ padding: '0.5rem 0' }}>
                  {(() => {
                    const steps = selectedComplaint.timeline || [{ status: "registered", updatedAt: selectedComplaint.createdAt, updatedBy: "system", notes: "மனு வெற்றிகரமாக பதிவு செய்யப்பட்டது." }];
                    return steps.map((step: any, idx: number) => {
                      const label = getStatusLabel(step.status);
                      const isLast = idx === steps.length - 1;
                      return (
                        <div key={idx} className="timeline-item" style={{ display: 'flex', gap: '1rem', marginBottom: isLast ? 0 : '1.5rem', position: 'relative' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="timeline-badge" style={{ 
                              background: normalizeStatus(step.status) === 'resolved' ? '#5E8C3A' : normalizeStatus(step.status) === 'registered' ? '#FECB02' : '#E08600', 
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
                              <span style={{ fontSize: '0.75rem', color: '#666' }}>{new Date(step.updatedAt).toLocaleString("ta-IN")}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#555', lineHeight: '1.4' }}>
                              {step.notes || `மனுவின் நிலை "${label}" என புதுப்பிக்கப்பட்டது.`}
                              {step.updatedBy && <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8, color: '#888' }}>செய்தவர்: @{step.updatedBy}</span>}
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
                    <h4 style={{ color: '#4A080E', margin: '0 0 0.2rem 0', fontWeight: 800 }}>களப்பணியாளருக்கு ஒதுக்கு (Assign Field Officer)</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                      {selectedComplaint.assignedTo 
                        ? `மனு தற்போது களப்பணியாளர் ${selectedComplaint.assignedToName || selectedComplaint.assignedTo} (@${selectedComplaint.assignedTo}) வசம் ஒதுக்கப்பட்டுள்ளது.`
                        : "மனுவை கள ஆய்விற்கும் தீர்வுக்கும் உங்கள் களப்பணி குழுவில் உள்ள ஒருவரிடம் ஒப்படைக்கவும்."}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                      value={selectedOfficerUsername}
                      onChange={(e) => setSelectedOfficerUsername(e.target.value)}
                      title="களப்பணியாளர் தேர்வு"
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.4rem',
                        border: '1px solid #FECB02',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        background: 'white'
                      }}
                    >
                      <option value="">-- களப்பணியாளர் தேர்வு --</option>
                      {activeOfficers.map(off => (
                        <option key={off.username} value={off.username}>{off.name} (@{off.username})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAssignOfficer(selectedComplaint.trackingId)}
                      disabled={isAssigning || !selectedOfficerUsername}
                      className="submit-btn"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', margin: 0 }}
                    >
                      {isAssigning ? "ஒதுக்கப்படுகிறது..." : "ஒதுக்கு"}
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
                      <h4 style={{ color: '#1B4314', margin: '0 0 0.2rem 0', fontWeight: 800 }}> தீர்வு மதிப்பாய்வு (Representative Review Queue)</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>களப்பணியாளர் சமர்ப்பித்த தீர்வை ஆய்வு செய்து ஒப்புதல் அல்லது நிராகரிப்பு வழங்கவும்.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleRepReview(selectedComplaint.trackingId, true)}
                        disabled={isUpdatingStatus}
                        style={{ background: '#5E8C3A', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        ஒப்புதல் (Approve)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRepReview(selectedComplaint.trackingId, false)}
                        disabled={isUpdatingStatus || !rejectionReason.trim()}
                        style={{ background: '#A00000', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', opacity: rejectionReason.trim() ? 1 : 0.5 }}
                      >
                        நிராகரி (Reject)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="rejection-reason" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#333', display: 'block', marginBottom: '0.35rem' }}>
                      நிராகரிப்பு காரணம் (Rejection Reason - நிராகரிக்கும் போது மட்டும் கட்டாயம்):
                    </label>
                    <textarea
                      id="rejection-reason"
                      rows={2}
                      placeholder="தீர்வு திருப்திகரமாக இல்லை எனில் அதற்கான காரணத்தை இங்கே எழுதவும்..."
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
                    <h4 style={{ color: '#4A080E', margin: '0 0 0.2rem 0', fontWeight: 800 }}>தீர்க்கும் நிலை மாற்றம் (Update Action Status)</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>தகவலின் நிலையை மாற்றுவதுடன், தமிழக வெற்றிக் கழகத்தின் மக்கள் சேவையைப் பதிவு செய்யவும்.</p>
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
                       பதிவில் (Pending)
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
                      ⚙️ நடவடிக்கையில்
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
                      தீர்க்கப்பட்டது
                    </button>
                  </div>
                </div>
              )}

              {statusUpdateMessage && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  background: statusUpdateMessage.includes("✅") ? '#DCFCE7' : '#FEE2E2',
                  color: statusUpdateMessage.includes("✅") ? '#166534' : '#991B1B',
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
                மூடு (Close)
              </button>
            </div>

          </div>
        </div>
      )}

      <TvkAppFooter tagline="மக்கள் குரல் பிரதிநிதி தளம்" />
    </div>
  );
}
