"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * HomeSlider.jsx (Next.js App Router - UPDATED)
 * ✅ Arrows clearly visible
 * ✅ Removed overlay texts
 * ✅ Added cursor-pointer on clickable elements
 * ✅ Keeps autoplay + dots + prev/next
 * ✅ Uses <img> for external URLs
 */

const cn = (...classes) => classes.filter(Boolean).join(" ");

const DEFAULT_BANNERS = [
  "https://cdn.dribbble.com/userupload/43263232/file/original-81cb7a482018c8065c630ccea98acbdd.jpg?resize=752x&vertical=center",
  "https://cdn.dribbble.com/userupload/43263235/file/original-7300dd46c40ef30d1e3a5d4ad2f49bf9.jpg?resize=752x&vertical=center",
  "https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/2bd94e190696671.65bf5f3b1f264.jpg",
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

  useEffect(() => {
    if (!autoPlay) return;
    if (safeImages.length <= 1) return;

    const t = setInterval(() => {
      setI((p) => (p + 1) % safeImages.length);
    }, interval);

    return () => clearInterval(t);
  }, [autoPlay, interval, safeImages.length]);

  useEffect(() => {
    if (i >= safeImages.length) setI(0);
  }, [safeImages.length, i]);

  const prev = useCallback(() => {
    setI((p) => (p - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const next = useCallback(() => {
    setI((p) => (p + 1) % safeImages.length);
  }, [safeImages.length]);

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-sm">
      <div className="relative aspect-[16/8] w-full sm:aspect-[16/6]">
        <div
          className="absolute inset-0 flex transition-transform duration-500 ease-out will-change-transform motion-reduce:transition-none"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {safeImages.map((src, idx) => (
            <div key={`${src}-${idx}`} className="relative h-full w-full flex-none">
              <img
                src={src}
                alt={`Banner ${idx + 1}`}
                className="h-full w-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
              />

              {/* subtle bottom fade to help dots/arrows visibility */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
            </div>
          ))}
        </div>

        {/* Arrows */}
        {showArrows && safeImages.length > 1 ? (
          <>
            <button
              onClick={prev}
              className={cn(
                "cursor-pointer absolute left-3 top-1/2 -translate-y-1/2 z-10",
                "rounded-2xl p-2.5 shadow-md backdrop-blur",
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
                "cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 z-10",
                "rounded-2xl p-2.5 shadow-md backdrop-blur",
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

        {/* Dots */}
        {showDots && safeImages.length > 1 ? (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {safeImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className="cursor-pointer h-2.5 rounded-full transition-all motion-reduce:transition-none ring-1 ring-black/10"
                style={{
                  width: idx === i ? 30 : 10,
                  backgroundColor: idx === i ? "white" : "rgba(255,255,255,.6)",
                }}
                aria-label={`Go to banner ${idx + 1}`}
                type="button"
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
