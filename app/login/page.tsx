"use client";

import React, { useState, useEffect } from "react";
import { TVK_LOGO } from "@/lib/brand";
import { useRouter } from "next/navigation";
import WhistleCursor, { useWhistleCursor } from "@/components/WhistleCursor";
import TvkTopBar from "@/components/TvkTopBar";
import { useLanguage } from "@/components/LanguageProvider";
import "../analytics/analytics.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  // Reset any leftover modal locks from previous page sessions
  useEffect(() => {
    document.body.classList.remove("modal-open");
  }, []);

  useWhistleCursor({ theme: "gold", enabled: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const params = new URLSearchParams(window.location.search);
        const requestedRedirect = params.get("redirect");
        const redirectPath =
          data.user?.role === "FIELD_OFFICER"
            ? "/my-tasks"
            : requestedRedirect || "/analytics";
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(data.error || t("login.error_fail"));
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(t("login.error_conn"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-body login-page-shell min-h-screen">
      <TvkTopBar
        title={t("login.title")}
        brandHref="/"
        links={[
          { href: "/", label: t("nav.home") },
          { href: "/track", label: t("nav.track") },
          { href: "/analytics", label: t("nav.analytics") },
        ]}
      />

      <div className="login-page-main">
      <div className="login-card font-sans">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          <img 
            src={TVK_LOGO} 
            alt="TVK Logo" 
            style={{ width: "90px", height: "90px", objectFit: "contain", marginBottom: "1rem", filter: "drop-shadow(0 4px 10px rgba(254,203,2,0.3))" }}
          />
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#FECB02", textAlign: "center", letterSpacing: "0.05em" }}>
            {t("nav.brand")}
          </h1>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {t("login.subtitle")}
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}
        >
          {/* Username Field Group */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
            <label 
              htmlFor="username" 
              style={{
                display: "block",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "0.85rem",
                fontWeight: "bold",
                margin: 0,
                textAlign: "left"
              }}
            >
              {t("login.username")}
            </label>
            <input
              id="username"
              type="text"
              placeholder="e.g. rep_namakkal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#FFF",
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "0.6rem",
                boxSizing: "border-box",
                fontSize: "1rem",
                fontWeight: "bold",
                textAlign: "center",
                outline: "none",
                transition: "all 0.2s"
              }}
              onFocus={(e) => { e.target.style.border = "1px solid #FECB02"; e.target.style.boxShadow = "0 0 0 2px rgba(254, 203, 2, 0.2)"; }}
              onBlur={(e) => { e.target.style.border = "1px solid rgba(255, 255, 255, 0.12)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Password Field Group */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
            <label 
              htmlFor="password" 
              style={{
                display: "block",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "0.85rem",
                fontWeight: "bold",
                margin: 0,
                textAlign: "left"
              }}
            >
              {t("login.password")}
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#FFF",
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "0.6rem",
                boxSizing: "border-box",
                fontSize: "1.1rem",
                letterSpacing: "0.15em",
                textAlign: "center",
                outline: "none",
                transition: "all 0.2s"
              }}
              onFocus={(e) => { e.target.style.border = "1px solid #FECB02"; e.target.style.boxShadow = "0 0 0 2px rgba(254, 203, 2, 0.2)"; }}
              onBlur={(e) => { e.target.style.border = "1px solid rgba(255, 255, 255, 0.12)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {error && (
            <div style={{ padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "0.5rem", color: "#FECB02", fontSize: "0.85rem", textAlign: "center", fontWeight: "bold" }}>
               {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: "linear-gradient(to right, #FECB02, #FFDD55)",
              color: "#4A080E",
              fontWeight: 900,
              border: "none",
              borderRadius: "0.6rem",
              cursor: "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "0.5rem",
              boxShadow: "0 4px 15px rgba(254, 203, 2, 0.25)",
              transition: "transform 0.1s, box-shadow 0.1s"
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(254, 203, 2, 0.35)"; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(254, 203, 2, 0.25)"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
          >
            {loading ? t("login.btn_loading") : t("login.btn")}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", padding: "0.85rem 1rem", background: "rgba(254,203,2,0.06)", border: "1px solid rgba(254,203,2,0.18)", borderRadius: "0.6rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.85)", fontWeight: "bold", lineHeight: 1.5 }}>
            {t("login.fo_note")}
            <br />
            {t("login.fo_manage")}
            <a href="/my-tasks" style={{ color: "#FECB02", fontWeight: 900, textDecoration: "underline" }}>
              {t("login.fo_tasks")}
            </a>
          </p>
        </div>

        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: "bold", letterSpacing: "0.05em" }}>
            {t("footer.copyright")}
          </p>
        </div>
      </div>
      </div>

      <WhistleCursor />
    </div>
  );
}

