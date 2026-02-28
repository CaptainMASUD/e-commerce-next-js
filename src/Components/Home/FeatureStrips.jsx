"use client";

import React from "react";
import { FiShield, FiTruck, FiRefreshCcw, FiAward } from "react-icons/fi";

/**
 * FeatureStrips.jsx (Next.js App Router)
 * ✅ No outer wrapper card (removed)
 * ✅ Super tiny on mobile
 * ✅ No dots
 */

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const TOP_FEATURES = [
  { label: "Secure Payment", Icon: FiShield, tint: "rgba(0,31,63,.06)" },
  { label: "Faster Delivery", Icon: FiTruck, tint: "rgba(255,126,105,.10)" },
  { label: "Easy Returns", Icon: FiRefreshCcw, tint: "rgba(234,179,8,.10)" },
  { label: "Premium Support", Icon: FiAward, tint: "rgba(0,31,63,.06)" },
];

export default function FeatureStrips() {
  return (
    <section className="mt-2">
      {/* Outer wrapper card removed */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-3">
        {TOP_FEATURES.map(({ label, Icon, tint }) => (
          <div
            key={label}
            className={cn(
              "flex items-center border border-black/5 bg-white",
              "gap-1.5 rounded-xl px-1.5 py-1",
              "sm:gap-3 sm:rounded-3xl sm:px-3 sm:py-3",
              "shadow-[0_4px_10px_rgba(0,31,63,.03)] sm:shadow-sm",
              "transition sm:hover:-translate-y-0.5 sm:hover:shadow-md motion-reduce:transition-none"
            )}
          >
            <div
              className={cn(
                "relative flex items-center justify-center ring-1 ring-black/5",
                "h-7 w-7 rounded-lg",
                "sm:h-11 sm:w-11 sm:rounded-2xl"
              )}
              style={{ background: tint }}
            >
              <Icon className="h-3 w-3 sm:h-5 sm:w-5" style={{ color: PALETTE.navy }} />
            </div>

            <div className="min-w-0">
              <div
                className="truncate text-[9.5px] font-black leading-tight sm:text-[12px]"
                style={{ color: PALETTE.navy }}
              >
                {label}
              </div>
              <div className="mt-0.5 truncate text-[8px] font-semibold leading-tight text-slate-500 sm:text-[11px]">
                Trusted &amp; premium
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}