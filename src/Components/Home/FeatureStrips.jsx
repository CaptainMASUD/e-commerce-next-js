"use client";

import React from "react";
import { FiShield, FiTruck, FiRefreshCcw, FiAward } from "react-icons/fi";

/**
 * FeatureStrips.jsx (UPDATED - more standard & professional + changed Fast Delivery icon color)
 * ✅ Cleaner layout & spacing
 * ✅ Consistent typography
 * ✅ Subtle hover + focus states
 * ✅ Better icon chips
 * ✅ Fast Delivery icon now uses a fresh "success" green (more meaningful than coral)
 */

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  gold: "#eab308",
  success: "#16a34a", 
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const FEATURES = [
  { label: "Secure Payment", desc: "Protected checkout", Icon: FiShield, tone: "navy" },
  { label: "Fast Delivery", desc: "Quick dispatch", Icon: FiTruck, tone: "success" }, // ✅ changed
  { label: "Easy Returns", desc: "Hassle-free policy", Icon: FiRefreshCcw, tone: "gold" },
  { label: "Premium Support", desc: "24/7 assistance", Icon: FiAward, tone: "navy" },
];

function toneStyles(tone) {
  if (tone === "coral") {
    return {
      chipBg: "rgba(255,126,105,.12)",
      chipRing: "rgba(255,126,105,.22)",
      icon: PALETTE.coral,
      dot: PALETTE.coral,
    };
  }

  if (tone === "gold") {
    return {
      chipBg: "rgba(234,179,8,.14)",
      chipRing: "rgba(234,179,8,.22)",
      icon: PALETTE.gold,
      dot: PALETTE.gold,
    };
  }

  if (tone === "success") {
    return {
      chipBg: "rgba(22,163,74,.12)",
      chipRing: "rgba(22,163,74,.22)",
      icon: PALETTE.success,
      dot: PALETTE.success,
    };
  }

  // default: navy
  return {
    chipBg: "rgba(0,31,63,.07)",
    chipRing: "rgba(0,31,63,.12)",
    icon: PALETTE.navy,
    dot: PALETTE.navy,
  };
}

export default function FeatureStrips() {
  return (
    <section className="mt-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {FEATURES.map(({ label, desc, Icon, tone }) => {
          const t = toneStyles(tone);

          return (
            <div
              key={label}
              role="note"
              aria-label={label}
              className={cn(
                "group flex items-center gap-2.5",
                "rounded-2xl bg-white px-3 py-2.5",
                "ring-1 ring-black/5",
                "shadow-[0_10px_25px_rgba(0,31,63,.05)]",
                "transition-transform duration-200",
                "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,31,63,.08)]",
                "focus-within:ring-2 focus-within:ring-offset-2"
              )}
              style={{ outlineColor: PALETTE.coral }}
            >
              {/* Icon chip */}
              <div
                className={cn("flex items-center justify-center", "h-9 w-9 rounded-xl")}
                style={{
                  background: t.chipBg,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,.03)",
                  border: `1px solid ${t.chipRing}`,
                }}
              >
                <Icon className="h-4 w-4" style={{ color: t.icon }} />
              </div>

              {/* Text */}
              <div className="min-w-0">
                <div
                  className="truncate text-[12px] font-semibold sm:text-[13px]"
                  style={{ color: PALETTE.navy }}
                >
                  {label}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-slate-500">{desc}</div>
              </div>

              {/* subtle indicator */}
              <div className="ml-auto hidden sm:block">
                <span
                  className="inline-block h-2 w-2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: t.dot }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}