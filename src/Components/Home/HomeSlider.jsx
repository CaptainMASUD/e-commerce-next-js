"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * HomeSlider.jsx (Next.js App Router - FINAL UPDATED)
 * ✅ Dots: WHITE only
 * ✅ Mobile: dots a bit smaller + inactive ("minus") a bit longer (slightly)
 * ✅ MD/LG: active dot length slightly longer (not too much)
 * ✅ Keep dot height small across breakpoints
 * ✅ No arrows on mobile (sm and up only)
 * ✅ Arrow buttons fully rounded (rounded-full)
 * ✅ Swipe / drag to change slides (touch + pointer)
 * ✅ Autoplay + dots + prev/next
 * ✅ Uses <img> for external URLs
 */

const cn = (...classes) => classes.filter(Boolean).join(" ");

const DEFAULT_BANNERS = [
  "https://cdn.dribbble.com/userupload/43263232/file/original-81cb7a482018c8065c630ccea98acbdd.jpg?resize=1024x480&vertical=center",
  "https://cdn.dribbble.com/userupload/43263234/file/original-fe2787e968dec92650fce0218a1ca7dc.jpg?resize=1024x480&vertical=center",
  "https://cdn.dribbble.com/userupload/43263233/file/original-4730578c357cbb9df4bb12ee38e0c437.jpg?resize=1024x480&vertical=center",
];


export default function HomeSlider({
  images = DEFAULT_BANNERS,
  autoPlay = true,
  interval = 5000,
  showArrows = true,
  showDots = true,
}) {
  const safeImages = useMemo(
    () => (Array.isArray(images) && images.length ? images : DEFAULT_BANNERS),
    [images]
  );

  const [i, setI] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  // Swipe / drag refs
  const trackRef = useRef(null);
  const startXRef = useRef(0);
  const deltaXRef = useRef(0);
  const draggingRef = useRef(false);

  // Autoplay (pause while interacting)
  useEffect(() => {
    if (!autoPlay) return;
    if (safeImages.length <= 1) return;
    if (isInteracting) return;

    const t = setInterval(() => {
      setI((p) => (p + 1) % safeImages.length);
    }, interval);

    return () => clearInterval(t);
  }, [autoPlay, interval, safeImages.length, isInteracting]);

  useEffect(() => {
    if (i >= safeImages.length) setI(0);
  }, [safeImages.length, i]);

  const prev = useCallback(() => {
    setI((p) => (p - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const next = useCallback(() => {
    setI((p) => (p + 1) % safeImages.length);
  }, [safeImages.length]);

  // Helpers for swipe
  const getClientX = (e) => {
    if (e.touches?.length) return e.touches[0].clientX;
    if (typeof e.clientX === "number") return e.clientX;
    return 0;
  };

  const snapThresholdPx = () => {
    const el = trackRef.current;
    const w = el?.clientWidth || 0;
    return Math.max(40, Math.round(w * 0.12));
  };

  const setTransformForDrag = (dx) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transform = `translateX(calc(-${i * 100}% + ${dx}px))`;
  };

  const resetTransform = () => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transform = `translateX(-${i * 100}%)`;
  };

  const onStart = (e) => {
    if (safeImages.length <= 1) return;

    draggingRef.current = true;
    setIsInteracting(true);

    startXRef.current = getClientX(e);
    deltaXRef.current = 0;

    if (trackRef.current) {
      trackRef.current.style.transition = "none";
      trackRef.current.style.willChange = "transform";
    }
  };

  const onMove = (e) => {
    if (!draggingRef.current) return;

    const x = getClientX(e);
    const dx = x - startXRef.current;
    deltaXRef.current = dx;

    // edge resistance
    const atFirst = i === 0;
    const atLast = i === safeImages.length - 1;
    const resistance =
      (atFirst && dx > 0) || (atLast && dx < 0) ? 0.45 : 1;

    setTransformForDrag(dx * resistance);
  };

  const onEnd = () => {
    if (!draggingRef.current) return;

    draggingRef.current = false;

    const dx = deltaXRef.current;
    const threshold = snapThresholdPx();

    if (trackRef.current) {
      trackRef.current.style.transition =
        "transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    }

    if (dx <= -threshold) {
      next();
    } else if (dx >= threshold) {
      prev();
    } else {
      resetTransform();
    }

    window.setTimeout(() => setIsInteracting(false), 700);
  };

  // Keep transform in sync when index changes (and not dragging)
  useEffect(() => {
    if (!trackRef.current) return;
    if (draggingRef.current) return;

    trackRef.current.style.transition =
      "transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    trackRef.current.style.transform = `translateX(-${i * 100}%)`;
  }, [i]);

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-sm">
      <div
        className={cn(
          "relative aspect-[16/8] w-full sm:aspect-[16/6]",
          "touch-pan-y"
        )}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
        onPointerDown={onStart}
        onPointerMove={onMove}
        onPointerUp={onEnd}
        onPointerCancel={onEnd}
        onPointerLeave={onEnd}
      >
        <div
          ref={trackRef}
          className="absolute inset-0 flex will-change-transform"
          style={{
            transform: `translateX(-${i * 100}%)`,
            transition: "transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {safeImages.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="relative h-full w-full flex-none select-none"
            >
              <img
                src={src}
                alt={`Banner ${idx + 1}`}
                className="h-full w-full select-none object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
            </div>
          ))}
        </div>

        {/* Arrows (hidden on mobile; show from sm and up) */}
        {showArrows && safeImages.length > 1 ? (
          <>
            <button
              onClick={prev}
              className={cn(
                "hidden sm:flex",
                "cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 z-10",
                "items-center justify-center",
                "rounded-full p-3 shadow-md backdrop-blur",
                "bg-white/95 hover:bg-white",
                "ring-1 ring-black/20",
                "active:scale-[0.98] transition motion-reduce:transition-none"
              )}
              aria-label="Previous banner"
              type="button"
            >
              <FiChevronLeft className="h-5 w-5 text-slate-900" />
            </button>

            <button
              onClick={next}
              className={cn(
                "hidden sm:flex",
                "cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 z-10",
                "items-center justify-center",
                "rounded-full p-3 shadow-md backdrop-blur",
                "bg-white/95 hover:bg-white",
                "ring-1 ring-black/20",
                "active:scale-[0.98] transition motion-reduce:transition-none"
              )}
              aria-label="Next banner"
              type="button"
            >
              <FiChevronRight className="h-5 w-5 text-slate-900" />
            </button>
          </>
        ) : null}

        {/* Dots (WHITE only; mobile slightly smaller; mobile inactive slightly longer) */}
        {showDots && safeImages.length > 1 ? (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 sm:gap-2.5">
            {safeImages.map((_, idx) => {
              const isActive = idx === i;

              return (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  aria-label={`Go to banner ${idx + 1}`}
                  type="button"
                  className={cn(
                    "cursor-pointer rounded-full transition-all motion-reduce:transition-none",
                    // ✅ a bit smaller on mobile; keep small on all breakpoints
                    "h-[7px] sm:h-2",
                    isActive
                      ? // Active: normal on mobile, slightly longer on md/lg (not too much)
                        "w-6 sm:w-8 md:w-10 lg:w-11"
                      : // Inactive ("minus"): mobile a bit longer than before, but still subtle
                        "w-[10px] sm:w-2 md:w-2 lg:w-2"
                  )}
                  style={{
                    backgroundColor: "white",
                    opacity: isActive ? 1 : 0.55,
                    boxShadow: "0 0 0 1px rgba(0,0,0,.12)",
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}