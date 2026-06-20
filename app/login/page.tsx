"use client";

import React, { useState } from "react";
import { TVK_LOGO } from "@/lib/brand";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        // Redirect to the intended page (defaults to /analytics)
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect") || "/analytics";
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(data.error || "தவறான கடவுச்சொல். மீண்டும் முயற்சிக்கவும்.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("இணைப்புப் பிழை. மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#220305] via-[#4A080E] to-[#110102] p-4 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#FECB02] opacity-10 blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#A00000] opacity-20 blur-3xl"></div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <img 
            src={TVK_LOGO} 
            alt="TVK Logo" 
            className="w-24 h-24 object-contain mb-4 drop-shadow-[0_4px_10px_rgba(254,203,2,0.3)]"
          />
          <h1 className="text-2xl font-black text-[#FECB02] text-center tracking-wide">
            தமிழக வெற்றிக் கழகம்
          </h1>
          <p className="text-xs text-white/60 mt-1 font-bold tracking-widest uppercase">
            Namakkal West · மக்கள் குரல்
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-bold text-white/80 mb-2"
            >
              பயனர் பெயர் (Username)
            </label>
            <input
              id="username"
              type="text"
              placeholder="e.g. rep_namakkal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#FECB02] focus:ring-2 focus:ring-[#FECB02]/20 transition-all text-center text-lg font-semibold"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-bold text-white/80 mb-2"
            >
              நுழைவு கடவுச்சொல் (Enter Password)
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#FECB02] focus:ring-2 focus:ring-[#FECB02]/20 transition-all text-center text-lg tracking-widest"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm text-center font-semibold">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#FECB02] to-[#FFDD55] hover:from-[#FFDD55] hover:to-[#FECB02] text-[#4A080E] font-black rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-[#4A080E] border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                உள்நுழைய (Login) 🚩
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/40 font-semibold tracking-wider">
            © 2026 நாமக்கல் மேற்கு — தமிழக வெற்றிக் கழகம்
          </p>
        </div>
      </div>
    </div>
  );
}
