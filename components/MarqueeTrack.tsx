"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type MarqueeTrackProps = {
  speed?: number;
  children: ReactNode;
};

export default function MarqueeTrack({ speed = 1, children }: MarqueeTrackProps) {
  const { lang } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const track = trackRef.current;
    if (!track) return;

    offsetRef.current = 0;
    track.style.transform = "translateX(0)";

    if (reduced) return;

    const tick = () => {
      const el = trackRef.current;
      if (!el) return;

      const segment = el.querySelector(".mq-segment") as HTMLElement | null;
      const segmentWidth = segment?.offsetWidth ?? el.scrollWidth / 3;
      const step = Math.max(segmentWidth, 1);

      offsetRef.current -= speed * 0.6;
      if (offsetRef.current <= -step) offsetRef.current += step;
      if (offsetRef.current > 0) offsetRef.current -= step;

      el.style.transform = `translateX(${offsetRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [lang, speed]);

  return (
    <div className="mq-track" ref={trackRef} data-speed={speed}>
      <span className="mq-segment">{children}</span>
      <span className="mq-segment" aria-hidden="true">
        {children}
      </span>
      <span className="mq-segment" aria-hidden="true">
        {children}
      </span>
    </div>
  );
}
