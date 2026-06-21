"use client";

/**
 * LaunchReveal — site inauguration overlay for the TVK Namakkal West launch.
 *
 * A ribbon-cut + confetti opening sequence, then an auto-slow-scrolling
 * commemorative letter over a blurred backdrop. Tapping outside, pressing the
 * ✕, or hitting Escape closes it and reveals the site.
 *
 * Campaign-gated: shows once per browser, and only inside the launch window.
 * The site renders fully underneath — this overlay is purely additive, so if it
 * never mounts (out of window / already seen / JS off) the site is just visible.
 *
 * To retire after the campaign: delete this file, components/LaunchReveal.css,
 * and the <LaunchReveal/> mount in app/page.tsx.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import "./LaunchReveal.css";

// Launch window: shows from now until the end of Thursday 25 Jun 2026 (IST).
// Edit this single constant to change how long the reveal runs.
const CAMPAIGN_END = new Date("2026-06-26T00:00:00+05:30").getTime();
const STORAGE_KEY = "tvk_launch_reveal_v1_seen";

// Confetti palette — mirrors the site's existing burst colours (home page).
const CONFETTI_COLORS = ["#FECB02", "#FFDD55", "#A00000", "#FFF1BE", "#C01515"];

const TITLE = "நன்றி, தமிழகம்!";
const OCCASION = "வெற்றி நன்றி உரை · புதிய இணையதள தொடக்க விழா";
const SALUTATION = "என் அன்பு மக்களே,";

const LETTER: string[] = [
  "என் நெஞ்சில் குடியிருக்கும் தமிழ்நாட்டு மக்கள் அனைவருக்கும் எனது மனமார்ந்த நன்றிகள். ஆரம்பத்தில் நம்மை பலரும் குறை கூறியபோதும், என் மீது நீங்கள் வைத்த அசைக்க முடியாத நம்பிக்கையால்தான் இந்த மாபெரும் மாற்றத்தை நம்மால் சாத்தியமாக்க முடிந்தது!",
  "இது ஒருவரின் வெற்றியல்ல, இது ஒவ்வொரு வீட்டிலும் எரிந்த நம்பிக்கை விளக்கின் வெற்றி. வறுமையில் வாடியவரும், எதிர்காலத்தில் கனவு கண்டவரும், மாற்றத்திற்காக காத்திருந்த ஒவ்வொரு மனமும் இன்று இந்த வெற்றியில் பங்காளி.",
  "இந்த வெற்றியை ஒரு மக்கள் இயக்கமாக மாற்றிய நமது இளைஞர்களுக்கும், தாய்மார்களுக்கும், உழைத்த ஒவ்வொரு தொண்டருக்கும் என் வாழ்நாள் முழுவதும் நான் கடமைப்பட்டுள்ளேன்.",
  "ஆனால் நண்பர்களே, இது முடிவல்ல — இது ஒரு புதிய பயணத்தின் தொடக்கம். உங்கள் நம்பிக்கையை நான் பொறுப்பாக ஏற்றுக்கொள்கிறேன், ஒவ்வொரு நாளும் அதை நிரூபிக்க உழைப்பேன் என உறுதி அளிக்கிறேன். இனி வரும் நாட்களில் இந்த அரசு உங்களுடையதாகவே இருக்கும் — உங்கள் குரலாக, உங்கள் கையாக, உங்கள் பாதுகாவலனாக.",
  "தமிழகத்தின் ஒவ்வொரு மூலையிலும் வளர்ச்சி சென்றடைய, ஒவ்வொரு குடும்பமும் கண்ணியமாக வாழ, நான் உங்களுடன் இருப்பேன். இந்த பயணத்தில் நீங்கள் என் கையை விடாமல் பிடித்திருங்கள் — ஒன்றாக, நாம் இன்னும் பெரிய தமிழ்நாட்டைக் கட்டியெழுப்புவோம்!",
];

type Phase = "ribbon" | "letter" | "closing";

interface Part {
  x: number; y: number; vx: number; vy: number; g: number;
  s: number; c: string; r: number; vr: number; l: number;
}

export default function LaunchReveal() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<Phase>("ribbon");
  const reducedRef = useRef(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const timers = useRef<number[]>([]);
  const confettiRaf = useRef<number | null>(null);
  const confettiParts = useRef<Part[]>([]);
  const scrollRaf = useRef<number | null>(null);
  const pauseUntil = useRef<number>(0);

  const addTimer = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  /* ---------- confetti (self-contained, same physics as the site) ---------- */
  const drawConfetti = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    if (cv.width !== window.innerWidth) cv.width = window.innerWidth;
    if (cv.height !== window.innerHeight) cv.height = window.innerHeight;

    ctx.clearRect(0, 0, cv.width, cv.height);
    confettiParts.current = confettiParts.current.filter((p) => p.l > 0);
    confettiParts.current.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.r += p.vr; p.l -= 0.012;
      ctx.save();
      ctx.globalAlpha = Math.max(p.l, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
      ctx.restore();
    });
    confettiRaf.current = confettiParts.current.length
      ? requestAnimationFrame(drawConfetti)
      : null;
  }, []);

  const burst = useCallback((x: number, y: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 4 + Math.random() * 9;
      confettiParts.current.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 4,
        g: 0.22,
        s: 4 + Math.random() * 6,
        c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        l: 1,
      });
    }
    if (!confettiRaf.current) confettiRaf.current = requestAnimationFrame(drawConfetti);
  }, [drawConfetti]);

  /* ---------- gentle auto-scroll that yields to the reader ---------- */
  const startAutoScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    let last = performance.now();
    const SPEED = 26; // px per second
    const step = (now: number) => {
      const el2 = bodyRef.current;
      if (!el2) return;
      const dt = (now - last) / 1000;
      last = now;
      if (now >= pauseUntil.current) {
        el2.scrollTop += SPEED * dt;
      }
      const atEnd = el2.scrollTop + el2.clientHeight >= el2.scrollHeight - 1;
      scrollRaf.current = atEnd ? null : requestAnimationFrame(step);
    };
    scrollRaf.current = requestAnimationFrame(step);
  }, []);

  // Pause auto-scroll briefly whenever the reader interacts, then resume.
  const nudgePause = useCallback(() => {
    pauseUntil.current = performance.now() + 2800;
  }, []);

  /* ---------- decide whether to show (client-only → no hydration flash) ---------- */
  useEffect(() => {
    try {
      if (Date.now() > CAMPAIGN_END) return;
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* localStorage unavailable (private mode) — still show once this load */
    }
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setActive(true);
  }, []);

  /* ---------- run the sequence once shown ---------- */
  useEffect(() => {
    if (!active) return;

    // Use the site's modal convention while the overlay is up. body.modal-open
    // (1) locks background scroll, (2) restores the native cursor, and (3) hides
    // the whistle cursor — which otherwise sits behind the blurred backdrop and
    // makes it flicker on every mouse move.
    document.body.classList.add("modal-open");

    if (reducedRef.current) {
      // reduced motion: straight to the letter, no ribbon / confetti / auto-scroll
      setPhase("letter");
    } else {
      setPhase("ribbon");
      // hold the whole ribbon longer, then cut: confetti burst, ribbon parts, letter rises
      addTimer(() => {
        burst(window.innerWidth / 2, window.innerHeight / 2, 90);
        addTimer(() => burst(window.innerWidth / 2, window.innerHeight / 2, 60), 180);
        setPhase("letter");
      }, 1500);
      // begin the slow auto-scroll after the (now longer) cut sequence settles
      addTimer(() => startAutoScroll(), 3200);
    }

    // move focus to the close control for keyboard users
    addTimer(() => closeBtnRef.current?.focus(), 250);

    const localTimers = timers.current;
    return () => {
      document.body.classList.remove("modal-open");
      localTimers.forEach((t) => clearTimeout(t));
      timers.current = [];
      if (confettiRaf.current) cancelAnimationFrame(confettiRaf.current);
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    };
  }, [active, burst, startAutoScroll]);

  const handleClose = useCallback(() => {
    if (phase === "closing") return;
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    setPhase("closing");
    // unmount after the fade-out finishes
    window.setTimeout(() => setActive(false), 600);
  }, [phase]);

  // Escape closes
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, handleClose]);

  if (!active) return null;

  return (
    <div
      className={`lr-overlay${phase === "closing" ? " lr-closing" : ""}`}
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label="தமிழக வெற்றிக் கழகம் — தொடக்க விழா செய்தி"
      onMouseDown={(e) => {
        // tap on the backdrop (not the letter) closes
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <canvas ref={canvasRef} className="lr-confetti" aria-hidden="true" />

      {/* ceremonial ribbon */}
      <div className="lr-ribbon" aria-hidden="true">
        <div className="lr-ribbon-half left" />
        <div className="lr-ribbon-half right" />
        <span className="lr-gleam" />
        <div className="lr-rosette">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tvk-logo.png" alt="" />
        </div>
      </div>

      {/* commemorative letter */}
      <article className="lr-letter" onMouseDown={(e) => e.stopPropagation()}>
        <header className="lr-letter-head">
          <button
            ref={closeBtnRef}
            type="button"
            className="lr-close"
            onClick={handleClose}
            aria-label="மூடு (Close)"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lr-seal" src="/tvk-logo.png" alt="தமிழக வெற்றிக் கழகம்" />
          <h2 className="lr-title">{TITLE}</h2>
          <p className="lr-occasion">{OCCASION}</p>
        </header>

        <div
          className="lr-letter-body"
          ref={bodyRef}
          onWheel={nudgePause}
          onTouchStart={nudgePause}
          onPointerDown={nudgePause}
          onKeyDown={nudgePause}
          tabIndex={0}
        >
          <p className="lr-salutation">{SALUTATION}</p>
          {LETTER.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <div className="lr-sign">
            <p className="lr-sign-from">அன்புடன்,</p>
            <p className="lr-sign-name">உங்கள் விஜய்</p>
            <p className="lr-sign-role">தலைவர், தமிழக வெற்றிக் கழகம்</p>
          </div>
        </div>

        <footer className="lr-foot">
          வெளியில் தட்டவும் அல்லது ✕ அழுத்தி இணையதளத்தைப் பார்க்கவும்
          (Tap outside or press ✕ to enter the site)
        </footer>
      </article>
    </div>
  );
}
