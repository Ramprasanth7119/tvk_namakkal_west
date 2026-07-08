"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TVK_LOGO } from "@/lib/brand";
import TvkAppFooter from "@/components/TvkAppFooter";
import TvkTopBar from "@/components/TvkTopBar";
import WhistleCursor, { useWhistleCursor } from "@/components/WhistleCursor";
import { getGoogleMapsEmbedUrl, getGoogleMapsOpenUrl } from "@/lib/maps";
import { normalizeStatus } from "@/lib/complaintStatus";
import { useLanguage } from "@/components/LanguageProvider";
import "../analytics/analytics.css";

export default function MyTasksPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const { lang, t } = useLanguage();

  // Selected Task Modal state
  const [selectedTask, setSelectedComplaint] = useState<any | null>(null);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [workNotes, setWorkNotes] = useState("");
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [submitMessage, setSubmitMessage] = useState("");

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Load draft from sessionStorage when selectedTask changes
  useEffect(() => {
    if (selectedTask) {
      setIsDraftLoaded(false);
      try {
        const saved = sessionStorage.getItem(`tvk_field_work_draft_${selectedTask.trackingId}`);
        if (saved) {
          const data = JSON.parse(saved);
          setWorkNotes(data.workNotes !== undefined ? data.workNotes : (selectedTask.workNotes || ""));
          setBeforeImages(data.beforeImages !== undefined ? data.beforeImages : (selectedTask.beforeImages || []));
          setAfterImages(data.afterImages !== undefined ? data.afterImages : (selectedTask.afterImages || []));
          setVideos(data.videos !== undefined ? data.videos : (selectedTask.videos || []));
        } else {
          setWorkNotes(selectedTask.workNotes || "");
          setBeforeImages(selectedTask.beforeImages || []);
          setAfterImages(selectedTask.afterImages || []);
          setVideos(selectedTask.videos || []);
        }
      } catch (e) {
        console.error("Error loading draft from sessionStorage:", e);
      } finally {
        setIsDraftLoaded(true);
      }
    } else {
      setWorkNotes("");
      setBeforeImages([]);
      setAfterImages([]);
      setVideos([]);
      setIsDraftLoaded(false);
    }
  }, [selectedTask]);

  // Save draft to sessionStorage on any change
  useEffect(() => {
    if (!selectedTask || !isDraftLoaded) return;
    try {
      const data = { workNotes, beforeImages, afterImages, videos };
      sessionStorage.setItem(`tvk_field_work_draft_${selectedTask.trackingId}`, JSON.stringify(data));
    } catch (e) {
      console.warn("Error saving draft to sessionStorage:", e);
    }
  }, [selectedTask, isDraftLoaded, workNotes, beforeImages, afterImages, videos]);

  // Camera capture states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<"before" | "after" | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const beforeInputRef = useRef<HTMLInputElement | null>(null);
  const afterInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Manage modal-open body class for cursor overrides
  useEffect(() => {
    const modalOpen = !!selectedTask || isCameraActive;
    document.body.classList.toggle("modal-open", modalOpen);
    return () => document.body.classList.remove("modal-open");
  }, [selectedTask, isCameraActive]);

  // Fetch Session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            if (data.user.role !== "FIELD_OFFICER") {
              router.push("/login?redirect=/my-tasks");
            } else {
              setSessionUser(data.user);
            }
          } else {
            router.push("/login?redirect=/my-tasks");
          }
        } else {
          router.push("/login?redirect=/my-tasks");
        }
      } catch (err) {
        console.error("Session fetch error:", err);
        router.push("/login?redirect=/my-tasks");
      } finally {
        setIsSessionLoading(false);
      }
    };
    fetchSession();
  }, [router]);

  // Fetch Tasks
  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const res = await fetch("/api/complaints");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (sessionUser) {
      fetchTasks();
    }
  }, [sessionUser]);

  useWhistleCursor({ theme: "maroon", enabled: !isSessionLoading && !!sessionUser });

  const handleStartWork = async (trackingId: string) => {
    setIsSubmittingWork(true);
    setSubmitMessage("");
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId, action: "start_work" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitMessage(t("tasks.modal.start_success"));
        setTasks(prev => prev.map(t => t.trackingId === trackingId ? { ...t, status: "work_in_progress" } : t));
        setSelectedComplaint((prev: any) => prev ? { ...prev, status: "work_in_progress" } : null);
        fetchTasks();
      } else {
        setSubmitMessage(`${t("common.error")}: ${data.error || t("tasks.modal.start_fail", { error: "" })}`);
      }
    } catch {
      setSubmitMessage(t("track.conn_error"));
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === "before") {
          setBeforeImages(prev => [...prev, base64]);
        } else if (type === "after") {
          setAfterImages(prev => [...prev, base64]);
        } else if (type === "video") {
          setVideos(prev => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFinishWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (beforeImages.length === 0 || afterImages.length === 0) {
      alert(t("tasks.modal.submit_alert_empty"));
      return;
    }
    setIsSubmittingWork(true);
    setSubmitMessage("");
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: selectedTask.trackingId,
          action: "submit_solution",
          beforeImages,
          afterImages,
          videos,
          workNotes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitMessage(t("tasks.modal.submit_success"));
        try {
          sessionStorage.removeItem(`tvk_field_work_draft_${selectedTask.trackingId}`);
        } catch (e) {
          console.error("Error clearing draft from sessionStorage:", e);
        }
        setTimeout(() => {
          setSelectedComplaint(null);
          setBeforeImages([]);
          setAfterImages([]);
          setVideos([]);
          setWorkNotes("");
          setSubmitMessage("");
          fetchTasks();
        }, 3500);
      } else {
        setSubmitMessage(`${t("common.error")}: ${data.error || ""}`);
      }
    } catch {
      setSubmitMessage(t("track.conn_error"));
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const startCamera = async (target: "before" | "after") => {
    setCameraTarget(target);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert(t("home.form.camera.error"));
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      if (cameraTarget === "before") {
        setBeforeImages(prev => [...prev, dataUrl]);
      } else if (cameraTarget === "after") {
        setAfterImages(prev => [...prev, dataUrl]);
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
    setCameraTarget(null);
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#220305] text-white">
        <div className="flex flex-col items-center gap-4">
          <span className="w-12 h-12 border-4 border-[#FECB02] border-t-transparent rounded-full animate-spin"></span>
          <p className="font-bold">{t("tasks.auth_checking")}</p>
        </div>
      </div>
    );
  }

  const selectedCoords = selectedTask?.geolocation?.latitude != null
    ? { lat: Number(selectedTask.geolocation.latitude), lon: Number(selectedTask.geolocation.longitude) }
    : null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore — clear client state regardless */
    }
    window.location.href = "/login";
  };

  return (
    <div className="analytics-body min-h-screen">
      <TvkTopBar
        title={t("tasks.portal_title")}
        brandHref="/my-tasks"
        links={[
          {
            label: `@${sessionUser?.username} (${t("common.field_officer")})`,
            static: true,
            active: true,
          },
          { label: t("common.logout"), onClick: handleLogout },
        ]}
      />

      <section className="phero" style={{ paddingBottom: "2rem" }}>
        <img className="ph-medal-whistle" src={TVK_LOGO} alt="" aria-hidden="true" />
        <div className="wrap flex flex-col items-start gap-4">
          <span className="ph-eyebrow" style={{ color: "#FECB02" }}>{t("tasks.eyebrow")}</span>
          <h1>{t("tasks.title")}</h1>
          <p style={{ maxWidth: "700px", margin: 0, color: "rgba(255,255,255,0.8)" }}>
            {t("tasks.desc")}
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: "4rem", paddingTop: "2rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--m-900)", marginBottom: "1.5rem" }}>
            {t("tasks.assigned_count", { count: tasks.length })}
          </h2>

          {isLoadingTasks ? (
            <p style={{ textAlign: "center", padding: "3rem", color: "var(--ink-soft)", fontWeight: 700 }}>{t("tasks.loading")}</p>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#F9FAFB", borderRadius: "1rem" }}>
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🎉</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)" }}>{t("tasks.empty_title")}</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginTop: "0.25rem" }}>{t("tasks.empty_desc")}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
              {tasks.map((task) => {
                const norm = normalizeStatus(task.status);
                const label = t(`status.${norm}`);
                const assignedDate = task.assignedAt 
                  ? new Date(task.assignedAt).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN") 
                  : new Date(task.createdAt).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN");
                
                return (
                  <div 
                    key={task.trackingId} 
                    className="card hover:shadow-lg transition-all" 
                    style={{ border: "1px solid var(--line)", cursor: "pointer" }}
                    onClick={() => {
                      setSelectedComplaint(task);
                      setSubmitMessage("");
                    }}
                  >
                    <div style={{ padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <span style={{ fontWeight: 900, color: "#A00000", fontSize: "1.05rem" }}>{task.trackingId}</span>
                        <span className={`badge ${norm === "resolved" ? "ok" : norm === "registered" ? "pend" : "warn"}`} style={{ fontSize: "0.75rem" }}>
                          <i></i>{label}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--ink)", marginBottom: "0.5rem", minHeight: "2.4rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {t(task.complaintDetails?.category)} - {t(task.complaintDetails?.subcategory) || t("home.receipt.none")}
                      </h3>

                      <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.82rem", color: "var(--ink-soft)", borderTop: "1px solid var(--line)", paddingTop: "0.75rem" }}>
                        <div> {t("common.constituency")}: <b style={{ color: "var(--ink)" }}>{t(task.constituency)}</b>, {t("common.ward")}: <b style={{ color: "var(--ink)" }}>{task.ward}</b></div>
                        <div>{t("tasks.card.citizen")} <b style={{ color: "var(--ink)" }}>{task.citizenDetails?.name || t("home.receipt.none")}</b></div>
                        <div>📅 {t("tasks.card.assigned_date")} <b style={{ color: "var(--ink)" }}>{assignedDate}</b></div>
                      </div>

                      {norm === "work_in_progress" && task.rejectionReason && (
                        <div style={{ color: "var(--red-2)", background: "rgba(160,0,0,0.05)", border: "1px solid rgba(160,0,0,0.15)", padding: "0.6rem", borderRadius: "0.4rem", fontSize: "0.75rem", fontWeight: "bold", marginTop: "0.75rem", lineHeight: "1.4" }}>
                          {t("tasks.card.rejected_notice", { reason: task.rejectionReason })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TASK DETAILS & WORK COMPLETION MODAL */}
      {selectedTask && (
        <div className="modal-overlay admin-modal-overlay">
          <div className="modal-content detail-modal-content" style={{ maxWidth: "800px" }}>
            <div className="detail-modal-header" style={{ background: "var(--m-900)" }}>
              <img src={TVK_LOGO} alt="" className="detail-modal-whistle" aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85, fontWeight: 700, color: "#FFF1BE" }}>{t("tasks.modal.title")}</span>
                <h3 style={{ color: "white" }}>{t("tasks.modal.id", { id: selectedTask.trackingId })}</h3>
              </div>
              <button type="button" className="detail-modal-close" onClick={() => setSelectedComplaint(null)} aria-label={t("common.close")}>✕</button>
            </div>

            <div className="detail-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div className="detail-modal-section">
                  <h4 style={{ borderBottom: "2px solid #FECB02", paddingBottom: "0.35rem", marginBottom: "0.75rem", color: "var(--m-900)", fontWeight: 800 }}>{t("tasks.modal.details_sec")}</h4>
                  <div className="detail-modal-stack" style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
                    <div><span style={{ opacity: 0.6 }}>{t("tasks.modal.citizen_name")}</span> <b>{selectedTask.citizenDetails?.name || t("home.receipt.none")}</b></div>
                    <div><span style={{ opacity: 0.6 }}>{t("tasks.modal.citizen_phone")}</span> <b>{selectedTask.citizenDetails?.mobile || t("home.receipt.none")}</b></div>
                    <div><span style={{ opacity: 0.6 }}>{t("tasks.modal.citizen_address")}</span> <b>{selectedTask.citizenDetails?.address || t("home.receipt.none")}</b></div>
                    <div><span style={{ opacity: 0.6 }}>{t("tasks.modal.citizen_category")}</span> <b>{t(selectedTask.complaintDetails?.category)}</b></div>
                    <div><span style={{ opacity: 0.6 }}>{t("tasks.modal.citizen_urgency")}</span> <b style={{ color: "var(--red)" }}>{t(`home.form.grievance.urgency.${selectedTask.complaintDetails?.urgency || "normal"}`)}</b></div>
                  </div>
                </div>

                <div className="detail-modal-section">
                  <h4 style={{ borderBottom: "2px solid #FECB02", paddingBottom: "0.35rem", marginBottom: "0.75rem", color: "var(--m-900)", fontWeight: 800 }}>{t("tasks.modal.maps_sec")}</h4>
                  {selectedCoords ? (
                    <div>
                      <p style={{ fontSize: "0.8rem", margin: "0 0 0.5rem 0" }}> Lat: <b>{selectedCoords.lat.toFixed(5)}</b>, Lon: <b>{selectedCoords.lon.toFixed(5)}</b></p>
                      <div className="complaint-map-wrap" style={{ height: "140px" }}>
                        <iframe
                          title="Complaint GPS location map"
                          src={getGoogleMapsEmbedUrl(selectedCoords.lat, selectedCoords.lon)}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                      </div>
                      <a href={getGoogleMapsOpenUrl(selectedCoords.lat, selectedCoords.lon)} target="_blank" rel="noopener noreferrer" className="complaint-map-link" style={{ fontSize: "0.8rem", display: "block", marginTop: "0.25rem" }}>{t("tasks.modal.maps_open")}</a>
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "#888", fontStyle: "italic" }}>{t("complaints.modal.maps_none")}</p>
                  )}
                </div>
              </div>

              <div style={{ background: "#F9FAFB", padding: "1.2rem", borderRadius: "0.75rem", borderLeft: "4px solid #A00000", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", color: "#A00000", fontSize: "0.95rem", fontWeight: 800 }}>{t("tasks.modal.description")}</h4>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#111", lineHeight: "1.5", fontWeight: 600 }}>{selectedTask.complaintDetails?.description || t("home.receipt.none")}</p>
              </div>

              {/* TIMELINE VISUALIZATION */}
              <div style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "0.75rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#4A080E", fontSize: "0.95rem", borderBottom: "2px solid #FECB02", paddingBottom: "0.35rem", marginBottom: "0.75rem", fontWeight: 800 }}>{t("tasks.modal.timeline")}</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {(selectedTask.timeline || []).map((step: any, sIdx: number) => {
                    const statusVal = normalizeStatus(step.status);
                    return (
                      <div key={sIdx} style={{ fontSize: "0.78rem", background: "#F3F4F6", padding: "0.35rem 0.6rem", borderRadius: "2rem", border: "1px solid #E5E7EB", display: "inline-flex", gap: "0.25rem" }}>
                        <b>{t(`status.${statusVal}`)}</b>
                        <span style={{ opacity: 0.6 }}>({new Date(step.updatedAt).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN")})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* REJECTION REASON NOTIFICATION IF REJECTED BY REPRESENTATIVE */}
              {normalizeStatus(selectedTask.status) === "work_in_progress" && selectedTask.rejectionReason && (
                <div style={{ background: "rgba(160,0,0,0.06)", border: "1px solid rgba(160,0,0,0.15)", borderRadius: "0.75rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
                  <h4 style={{ margin: "0 0 0.4rem 0", color: "#A00000", fontSize: "0.95rem", fontWeight: 800 }}>{t("tasks.modal.rejected_details")}</h4>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "var(--ink-soft)" }}>{t("tasks.modal.rejected_desc")}</p>
                  <div style={{ background: "white", padding: "0.75rem", borderRadius: "0.5rem", borderLeft: "4px solid #A00000" }}>
                    <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: 700, display: "block", marginBottom: "0.2rem" }}>{t("tasks.modal.rejected_reason_lbl")}</span>
                    <p style={{ margin: 0, fontSize: "0.88rem", color: "#111", fontWeight: "bold" }}>{selectedTask.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* WORKFLOW TRANSITION ACTION BUTTON */}
              {normalizeStatus(selectedTask.status) === "assigned" && (
                <div style={{ background: "rgba(254, 203, 2, 0.1)", border: "1px dashed var(--gold)", padding: "1.5rem", borderRadius: "0.75rem", textAlign: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--m-900)", marginBottom: "0.5rem" }}>{t("tasks.modal.start_sec_title")}</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: "1rem" }}>{t("tasks.modal.start_sec_desc")}</p>
                  <button
                    type="button"
                    onClick={() => handleStartWork(selectedTask.trackingId)}
                    disabled={isSubmittingWork}
                    className="verify-btn"
                    style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}
                  >
                    {isSubmittingWork ? t("tasks.modal.start_btn_loading") : t("tasks.modal.start_btn")}
                  </button>
                </div>
              )}

              {/* SUBMIT SOLUTION EVIDENCE UPLOAD FORM */}
              {normalizeStatus(selectedTask.status) === "work_in_progress" && (
                <form onSubmit={handleFinishWork} style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "0.75rem", padding: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--m-900)", borderBottom: "2px solid var(--gold)", paddingBottom: "0.5rem", marginBottom: "1.2rem" }}>
                    {t("tasks.modal.submit_sec_title")}
                  </h3>

                  {/* CAMERA VIEW (IF ACTIVE) */}
                  {isCameraActive && (
                    <div style={{ background: "#000", borderRadius: "0.75rem", padding: "1rem", position: "relative", marginBottom: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: "280px", background: "#000", borderRadius: "0.5rem" }} />
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                        <button type="button" onClick={capturePhoto} style={{ background: "var(--ok)", color: "white", border: "none", padding: "0.5rem 1.5rem", borderRadius: "2rem", fontWeight: "bold", cursor: "pointer" }}>{t("tasks.modal.camera_capture")}</button>
                        <button type="button" onClick={stopCamera} style={{ background: "#A00000", color: "white", border: "none", padding: "0.5rem 1.5rem", borderRadius: "2rem", fontWeight: "bold", cursor: "pointer" }}>{t("common.cancel")}</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }} className="mobile-one-col">
                    {/* Before Images */}
                    <div>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#333", display: "block", marginBottom: "0.5rem" }}>{t("tasks.modal.submit_before")}</span>
                      <div className="complaint-media-grid" style={{ marginBottom: "0.5rem" }}>
                        {beforeImages.map((img, idx) => (
                          <div key={idx} className="complaint-media-thumb" style={{ position: "relative" }}>
                            <img src={img} alt="" />
                            <button type="button" onClick={() => setBeforeImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(160,0,0,0.85)", color: "white", border: "none", width: 18, height: 18, borderRadius: "50%", cursor: "pointer", fontSize: "0.6rem" }}>✕</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button type="button" onClick={() => startCamera("before")} style={{ flex: 1, padding: "0.45rem", fontSize: "0.75rem", border: "1px solid #CCC", borderRadius: "0.4rem", background: "#FFF", fontWeight: "bold", cursor: "pointer" }}>{t("tasks.modal.camera_btn")}</button>
                        <button type="button" onClick={() => beforeInputRef.current?.click()} style={{ flex: 1, padding: "0.45rem", fontSize: "0.75rem", border: "1px solid #CCC", borderRadius: "0.4rem", background: "#FFF", fontWeight: "bold", cursor: "pointer" }}>{t("tasks.modal.file_btn")}</button>
                      </div>
                      <input type="file" accept="image/*" multiple ref={beforeInputRef} onChange={(e) => handleFileChange(e, "before")} style={{ display: "none" }} title={t("tasks.modal.submit_before")} />
                    </div>

                    {/* After Images */}
                    <div>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#333", display: "block", marginBottom: "0.5rem" }}>{t("tasks.modal.submit_after")}</span>
                      <div className="complaint-media-grid" style={{ marginBottom: "0.5rem" }}>
                        {afterImages.map((img, idx) => (
                          <div key={idx} className="complaint-media-thumb" style={{ position: "relative" }}>
                            <img src={img} alt="" />
                            <button type="button" onClick={() => setAfterImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(160,0,0,0.85)", color: "white", border: "none", width: 18, height: 18, borderRadius: "50%", cursor: "pointer", fontSize: "0.6rem" }}>✕</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button type="button" onClick={() => startCamera("after")} style={{ flex: 1, padding: "0.45rem", fontSize: "0.75rem", border: "1px solid #CCC", borderRadius: "0.4rem", background: "#FFF", fontWeight: "bold", cursor: "pointer" }}>{t("tasks.modal.camera_btn")}</button>
                        <button type="button" onClick={() => afterInputRef.current?.click()} style={{ flex: 1, padding: "0.45rem", fontSize: "0.75rem", border: "1px solid #CCC", borderRadius: "0.4rem", background: "#FFF", fontWeight: "bold", cursor: "pointer" }}>{t("tasks.modal.file_btn")}</button>
                      </div>
                      <input type="file" accept="image/*" multiple ref={afterInputRef} onChange={(e) => handleFileChange(e, "after")} style={{ display: "none" }} title={t("tasks.modal.submit_after")} />
                    </div>
                  </div>

                  {/* Video Upload (Optional) */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#333", display: "block", marginBottom: "0.5rem" }}>{t("tasks.modal.submit_video")}</span>
                    {videos.length > 0 && (
                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                        {videos.map((vid, idx) => (
                          <div key={idx} style={{ position: "relative" }}>
                            <video src={vid} controls style={{ width: "160px", height: "auto", borderRadius: "0.4rem" }} />
                            <button type="button" onClick={() => setVideos(prev => prev.filter((_, i) => i !== idx))} style={{ position: "absolute", top: 2, right: 2, background: "rgba(160,0,0,0.85)", color: "white", border: "none", width: 18, height: 18, borderRadius: "50%", cursor: "pointer", fontSize: "0.6rem", zIndex: 5 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={() => videoInputRef.current?.click()} style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", border: "1px solid #CCC", borderRadius: "0.4rem", background: "#FFF", fontWeight: "bold", cursor: "pointer" }}>{t("tasks.modal.video_btn")}</button>
                    <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => handleFileChange(e, "video")} style={{ display: "none" }} title={t("tasks.modal.submit_video")} />
                  </div>

                  {/* Work Notes */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="work-notes" style={{ fontSize: "0.88rem", fontWeight: 700, color: "#333", display: "block", marginBottom: "0.5rem" }}>{t("tasks.modal.submit_notes_lbl")}</label>
                    <textarea
                      id="work-notes"
                      rows={4}
                      placeholder={t("tasks.modal.submit_notes_ph")}
                      value={workNotes}
                      onChange={(e) => setWorkNotes(e.target.value)}
                      required
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #CCC", fontSize: "0.9rem", fontWeight: 600 }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      disabled={isSubmittingWork || beforeImages.length === 0 || afterImages.length === 0 || !workNotes.trim()}
                      className="submit-btn"
                      style={{ margin: 0, padding: "0.75rem 2rem", fontSize: "0.95rem" }}
                    >
                      {isSubmittingWork ? t("tasks.modal.submit_btn_loading") : t("tasks.modal.submit_btn")}
                    </button>
                  </div>
                </form>
              )}

              {/* READ-ONLY RE-SUBMITTED SOLUTION DISPLAY IF ALREADY SUBMITTED */}
              {normalizeStatus(selectedTask.status) === "solution_submitted" && (
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "0.75rem", padding: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "2px solid #4ade80", paddingBottom: "0.75rem" }}>
                    <span style={{ fontSize: "1.75rem" }}>✅</span>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#166534", margin: 0 }}>{t("tasks.modal.submitted_title")}</h3>
                      <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.82rem", color: "#15803d", fontWeight: "bold" }}>{t("tasks.modal.submitted_desc")}</p>
                    </div>
                  </div>

                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--m-900)", marginBottom: "1rem" }}>{t("tasks.modal.submitted_evidence")}</h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }} className="mobile-one-col">
                    <div>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#666", display: "block", marginBottom: "0.5rem" }}>{t("tasks.modal.submitted_before")}</span>
                      <div className="complaint-media-grid">
                        {selectedTask.beforeImages && selectedTask.beforeImages.map((img: string, idx: number) => (
                          <a href={img} target="_blank" rel="noopener noreferrer" key={idx} className="complaint-media-thumb">
                            <img src={img} alt={`Before ${idx + 1}`} loading="lazy" />
                          </a>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#666", display: "block", marginBottom: "0.5rem" }}>{t("tasks.modal.submitted_after")}</span>
                      <div className="complaint-media-grid">
                        {selectedTask.afterImages && selectedTask.afterImages.map((img: string, idx: number) => (
                          <a href={img} target="_blank" rel="noopener noreferrer" key={idx} className="complaint-media-thumb">
                            <img src={img} alt={`After ${idx + 1}`} loading="lazy" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedTask.videos && selectedTask.videos.length > 0 && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#666", display: "block", marginBottom: "0.5rem" }}>{t("tasks.modal.submitted_video")}</span>
                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        {selectedTask.videos.map((vid: string, idx: number) => (
                          <video key={idx} src={vid} controls playsInline style={{ maxWidth: "280px", height: "auto", borderRadius: "0.4rem" }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTask.workNotes && (
                    <div style={{ background: "white", padding: "1rem", borderRadius: "0.5rem", borderLeft: "4px solid #4ade80", border: "1px solid #E5E7EB" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#666", display: "block", marginBottom: "0.35rem" }}>{t("tasks.modal.submitted_notes")}</span>
                      <p style={{ margin: 0, fontSize: "0.88rem", color: "#111", lineHeight: "1.5", whiteSpace: "pre-wrap", fontWeight: 600 }}>{selectedTask.workNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {submitMessage && (
                <div style={{ 
                  marginTop: "1.25rem", 
                  padding: "0.75rem", 
                  borderRadius: "0.5rem", 
                  // success vs error styling
                  background: submitMessage.includes(t("common.error")) || submitMessage.includes("பிழை") ? "#FEE2E2" : "#DCFCE7",
                  color: submitMessage.includes(t("common.error")) || submitMessage.includes("பிழை") ? "#991B1B" : "#166534",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  textAlign: "center"
                }}>
                  {submitMessage}
                </div>
              )}
            </div>

            <div className="detail-modal-footer">
              <button type="button" className="admin-modal-cancel" onClick={() => setSelectedComplaint(null)}>{t("common.close")}</button>
            </div>
          </div>
        </div>
      )}

      <WhistleCursor />
      <TvkAppFooter tagline={t("tasks.title")} />
    </div>
  );
}
