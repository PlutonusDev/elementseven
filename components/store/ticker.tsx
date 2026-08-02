"use client";

import { useEffect, useRef } from "react";

const ITEMS = [
  { symbol: "🚚", label: "Free shipping on orders over $195" },
  { symbol: "⚡", label: "Same-day dispatch before 2pm" },
  { symbol: "🧪", label: "Shop bulk disposables" },
  { symbol: "🔒", label: "Secure checkout" },
  { symbol: "🔞", label: "18+ only" },
  { symbol: "🦘", label: "Australian-owned and operated" },
  { symbol: "🔥", label: "Massive puffs, unrivaled flavour" },
];

const STRIP = [...ITEMS, ...ITEMS, ...ITEMS];

function Strip() {
  return (
    <div className="flex shrink-0 items-center">
      {STRIP.map((item, i) => (
        <span
          key={i}
          className="mx-7 inline-flex items-center gap-2.5 whitespace-nowrap text-[13px] font-bold text-paper"
        >
          <span aria-hidden="true" className="text-sm [filter:brightness(0)_invert(1)]">
            {item.symbol}
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function Ticker() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let offset = 0;
    let rafId = 0;
    let lastTime = 0;
    let paused = false;
    const SPEED = 60; // pixels per second

    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);
    track.addEventListener("mouseenter", onEnter);
    track.addEventListener("mouseleave", onLeave);

    const frame = (time: number) => {
      if (!lastTime) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (!paused) {
        const half = track.scrollWidth / 2;
        if (half > 0) {
          offset -= SPEED * dt;
          if (offset <= -half) offset += half;
          track.style.transform = `translate3d(${offset}px, 0, 0)`;
        }
      }
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener("mouseenter", onEnter);
      track.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden border-y-2 border-ink py-2.5"
      style={{ background: "linear-gradient(90deg, #2e45ff 0%, #1a1f6b 50%, #2e45ff 100%)" }}
    >
      <div ref={trackRef} className="flex w-max flex-nowrap will-change-transform">
        <Strip />
        <Strip />
      </div>
    </div>
  );
}
