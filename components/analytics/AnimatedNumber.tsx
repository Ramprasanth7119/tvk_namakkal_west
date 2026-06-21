"use client";

import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  dec?: number;
  className?: string;
  suffix?: string;
}

export default function AnimatedNumber({
  value,
  dec = 0,
  className = "kpi-val",
  suffix = "",
}: AnimatedNumberProps) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const id = requestAnimationFrame(() => setDisplayVal(value));
      return () => cancelAnimationFrame(id);
    }

    let active = true;
    const start = performance.now();
    const duration = 900;
    const from = displayVal;

    const step = (now: number) => {
      if (!active) return;
      const progress = Math.max(0, Math.min(1, (now - start) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(from + (value - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
      else setDisplayVal(value);
    };

    requestAnimationFrame(step);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from last rendered value
  }, [value]);

  return (
    <span className={className} aria-live="polite">
      {displayVal.toFixed(dec)}
      {suffix}
    </span>
  );
}
