"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import "../analytics/analytics.css";
import { CONSTITUENCIES, ALL_AREAS } from "@/lib/constituencies";
import { TVK_LOGO } from "@/lib/brand";
import TvkAppFooter from "@/components/TvkAppFooter";
import { getComplaintPhotos, getComplaintVideo } from "@/lib/complaintMedia";
import { getGoogleMapsEmbedUrl, getGoogleMapsOpenUrl } from "@/lib/maps";

const STATUS_LABELS: Record<string, string> = {
  all: "அனைத்தும்",
  ok: "தீர்க்கப்பட்டது",
  warn: "நடவடிக்கையில்",
  pend: "பதிவில்",
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
      const cStatus = c.status || "pend";
      if (curStatus !== "all" && cStatus !== curStatus) return false;
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
        setStatusUpdateMessage("✅ நிலை புதுப்பிக்கப்பட்டது!");
        
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

  return (
    <div className="analytics-body">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="topbar-in">
          <a className="tb-brand" href="/complaints">
            <img src={TVK_LOGO} alt="TVK" className="tvk-brand-logo" />
            <span>
              <small>TVK · Namakkal West</small>
              <b>மக்கள் குரல் மையம்</b>
            </span>
          </a>
          <div className="tb-actions">
            {sessionUser?.role === "SUPER_ADMIN" && (
              <a className="tb-back" href="/admin" style={{ color: '#FECB02', borderColor: '#FECB02' }}>
                ⚙️ நிர்வாகக் கட்டுப்பாடு
              </a>
            )}
            <a className="tb-back" href="/analytics">
              📊 பகுப்பாய்வு
            </a>
            <a className="tb-back active" href="/complaints" style={{ background: 'rgba(255,255,255,0.1)' }}>
              📋 புகார்கள் மேலாண்மை
            </a>
            <a className="tb-back" href="/">
              <svg viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              முகப்புக்குத் திரும்பு
            </a>
          </div>
        </div>
      </header>

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
                  <option value="pend">பதிவில் (Pending)</option>
                  <option value="warn">நடவடிக்கையில் (In Progress)</option>
                  <option value="ok">தீர்க்கப்பட்டது (Resolved)</option>
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
                🔄 {isLoadingComplaints ? "புதுப்பிக்கிறது..." : "புதுப்பி"}
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
                            {cStatus === "ok" && <span className="badge ok"><i></i>தீர்க்கப்பட்டது</span>}
                            {cStatus === "warn" && <span className="badge warn"><i></i>நடவடிக்கையில்</span>}
                            {cStatus === "pend" && <span className="badge pend"><i></i>பதிவில்</span>}
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

              {/* ACTION: UPDATE STATUS */}
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
                    onClick={() => handleUpdateStatus(selectedComplaint.trackingId, "pend")}
                    disabled={isUpdatingStatus || selectedComplaint.status === "pend"}
                    style={{
                      background: selectedComplaint.status === "pend" || !selectedComplaint.status ? '#FECB02' : '#FFF',
                      color: '#4A080E',
                      border: '1px solid #FECB02',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.4rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      opacity: selectedComplaint.status === "pend" ? 1 : 0.8
                    }}
                  >
                    📝 பதிவில் (Pending)
                  </button>

                  <button 
                    onClick={() => handleUpdateStatus(selectedComplaint.trackingId, "warn")}
                    disabled={isUpdatingStatus || selectedComplaint.status === "warn"}
                    style={{
                      background: selectedComplaint.status === "warn" ? '#E08600' : '#FFF',
                      color: selectedComplaint.status === "warn" ? '#FFF' : '#333',
                      border: '1px solid #E08600',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.4rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      opacity: selectedComplaint.status === "warn" ? 1 : 0.8
                    }}
                  >
                    ⚙️ நடவடிக்கையில்
                  </button>

                  <button 
                    onClick={() => handleUpdateStatus(selectedComplaint.trackingId, "ok")}
                    disabled={isUpdatingStatus || selectedComplaint.status === "ok"}
                    style={{
                      background: selectedComplaint.status === "ok" ? '#5E8C3A' : '#FFF',
                      color: selectedComplaint.status === "ok" ? '#FFF' : '#333',
                      border: '1px solid #5E8C3A',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.4rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      opacity: selectedComplaint.status === "ok" ? 1 : 0.8
                    }}
                  >
                    ✅ தீர்க்கப்பட்டது
                  </button>
                </div>
              </div>

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
