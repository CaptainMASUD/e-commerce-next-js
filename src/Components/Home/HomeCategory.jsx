"use client";

// HomeCategory.jsx (NEXT UPDATED - public assets + next/image)
import React, { useMemo, useState } from "react";
import Image from "next/image";

/**
 * ✅ HomeCategory.jsx (Next.js)
 * - ✅ Ordered: Phones -> Tablets -> Macbook -> Laptop -> Wearables -> Audio -> Power/Charging
 * - ✅ Mobile: show ONLY 3 rows (3 cols = 9 items), then "See more" to reveal the rest
 * - ✅ sm/md/lg+: show all categories (no "See more")
 * - ✅ lg and up: 7 per row (bigger cards)
 * - ✅ Category names: standard font (not too bold)
 *
 * ✅ IMPORTANT:
 * Images are in /public/assets/... so we use string paths like "/assets/..."
 */

/* -------------------- IMAGE PATHS (PUBLIC FOLDER) -------------------- */
// If filenames have spaces, use %20
const iphone = "/assets/Categories/iPhone.png";
const IPAD = "/assets/Categories/IPAD.png";
const android = "/assets/Categories/android.png";
const chargincable = "/assets/Categories/Charging%20Cables.png";
const macbook = "/assets/Categories/MACBOOK%20Pro.png";
const neckband = "/assets/Categories/Neckband%20Earphones.png";
const powerbank = "/assets/Categories/POWERBANK.png";
const portablespeaker = "/assets/Categories/Portable%20Speakers%20JBL.png";
const wirelessearbuds = "/assets/Categories/Wireless%20Earbuds.png";
const smartwatch = "/assets/Categories/SMART%20WATCH.png";
const headphone = "/assets/Categories/Headphones%20JBL.png";
const fastcharger = "/assets/Categories/Fast%20Chargers.png";
const laptop = "/assets/Categories/LAPTOP.png";
const wirelesscharger = "/assets/Categories/WIRELESS%20CHARGER.png";

/* -------------------- UI CONSTANTS -------------------- */
const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  gold: "#eab308",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

/* -------------------- HEADER UI -------------------- */
function CurvedUnderline({ color = PALETTE.coral, center = false }) {
  return (
    <div className={cn("mt-2", center ? "flex justify-center" : "")}>
      <svg width="210" height="18" viewBox="0 0 210 18" fill="none" aria-hidden="true">
        <path
          d="M8 12 C58 2, 152 2, 202 12"
          stroke="rgba(0,31,63,0.10)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M10 12 C60 3, 150 3, 200 12"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M40 12 C75 6, 110 6, 145 12"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function SectionHeader({ title, accent = "coral", center = false }) {
  const accentColor = accent === "gold" ? PALETTE.gold : PALETTE.coral;

  return (
    <div className={cn("flex flex-col gap-3", center ? "items-center text-center" : "")}>
      <div className={cn(center ? "mx-auto" : "")}>
        <div
          className={cn("text-2xl font-black tracking-tight sm:text-[30px]", center ? "text-center" : "")}
          style={{ color: PALETTE.navy }}
        >
          {title}
        </div>
        <CurvedUnderline color={accentColor} center={center} />
      </div>
    </div>
  );
}

/* -------------------- CATEGORY DATA (ORDERED) -------------------- */
const QUICK_CATEGORIES = [
  // Phones
  { label: "iPhone", img: iphone },
  { label: "Android", img: android },

  // Tablets
  { label: "iPad", img: IPAD },

  // Laptops
  { label: "Macbook", img: macbook },
  { label: "Laptop", img: laptop },

  // Wearables
  { label: "Smart Watch", img: smartwatch },

  // Audio
  { label: "Wireless Earbuds", img: wirelessearbuds },
  { label: "Headphones", img: headphone },
  { label: "Neckband", img: neckband },
  { label: "Portable Speaker", img: portablespeaker },

  // Power / Charging
  { label: "Power Bank", img: powerbank },
  { label: "Charging Cables", img: chargincable },
  { label: "Wireless Charger", img: wirelesscharger },
  { label: "Fast Charger", img: fastcharger },
];

/* -------------------- COMPONENT -------------------- */
export default function HomeCategory({ onSelect }) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  // Mobile grid is 3 columns, 3 rows => 9 items
  const MOBILE_INITIAL_COUNT = 9;

  const mobileInitial = useMemo(
    () => QUICK_CATEGORIES.slice(0, MOBILE_INITIAL_COUNT),
    []
  );
  const mobileRest = useMemo(
    () => QUICK_CATEGORIES.slice(MOBILE_INITIAL_COUNT),
    []
  );

  const hasMore = mobileRest.length > 0;

  return (
    <section className="mt-10">
      <SectionHeader title="Categories" accent="coral" center />

      {/* ✅ MOBILE (base): show 3 rows, then See more */}
      <div className="mt-6 sm:hidden">
        <div className="grid grid-cols-3 gap-2">
          {mobileInitial.map(({ label, img }) => (
            <CategoryCard key={label} label={label} img={img} onSelect={onSelect} />
          ))}

          {mobileExpanded &&
            mobileRest.map(({ label, img }) => (
              <CategoryCard key={label} label={label} img={img} onSelect={onSelect} />
            ))}
        </div>

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setMobileExpanded((v) => !v)}
              className={cn(
                "rounded-full px-5 py-2 text-[13px] font-semibold",
                "ring-1 ring-black/10 bg-white",
                "transition hover:shadow-md active:scale-[0.99]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              )}
              style={{
                color: PALETTE.navy,
                outlineColor: PALETTE.coral,
                boxShadow: "0 10px 25px rgba(0,31,63,.08)",
              }}
              aria-expanded={mobileExpanded}
            >
              {mobileExpanded ? "See less" : "See more"}
            </button>
          </div>
        )}
      </div>

      {/* ✅ SM+ (tablet/desktop): show all */}
      <div className="mt-6 hidden sm:grid sm:grid-cols-4 sm:gap-3 md:grid-cols-6 md:gap-3 lg:grid-cols-7 lg:gap-4">
        {QUICK_CATEGORIES.map(({ label, img }) => (
          <CategoryCard key={label} label={label} img={img} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

/* -------------------- CARD -------------------- */
function CategoryCard({ label, img, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(label)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.(label);
      }}
      className={cn(
        "group relative overflow-hidden bg-white ring-1 ring-black/5",
        "rounded-3xl p-3 sm:p-4 lg:p-4",
        "cursor-pointer",
        "transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]",
        "motion-reduce:transition-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      )}
      style={{
        boxShadow: "0 12px 30px rgba(0,31,63,.06)",
        outlineColor: PALETTE.coral,
      }}
    >
      {/* Title */}
      <div
        className="cursor-pointer text-center text-[12px] font-semibold leading-tight sm:text-[13px] lg:text-[13.5px]"
        style={{ color: PALETTE.navy }}
      >
        {label}
      </div>

      {/* Image */}
      <div className="mt-3 flex cursor-pointer items-center justify-center">
        <div
          className={cn(
            "relative flex cursor-pointer items-center justify-center ring-1 ring-black/5",
            "h-16 w-16 rounded-[1.25rem]",
            "sm:h-[72px] sm:w-[72px] sm:rounded-[1.5rem]",
            "lg:h-[78px] lg:w-[78px] lg:rounded-[1.65rem]"
          )}
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.16), rgba(0,31,63,0.05) 60%), #fff",
          }}
        >
          <Image
            src={img}
            alt={label}
            width={52}
            height={52}
            className="pointer-events-none h-11 w-11 object-contain sm:h-12 sm:w-12 lg:h-[52px] lg:w-[52px]"
            priority={false}
          />

          <span
            className={cn(
              "pointer-events-none absolute -right-1 -top-1 rounded-full ring-2 ring-white",
              "h-2.5 w-2.5",
              "sm:h-3 sm:w-3"
            )}
            style={{ backgroundColor: PALETTE.gold }}
          />
        </div>
      </div>

      {/* Bottom progress line */}
      <div className="mt-3 flex cursor-pointer justify-center">
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-black/5 sm:w-14 lg:w-16">
          <div
            className="h-full w-0 rounded-full transition-all duration-300 group-hover:w-full motion-reduce:transition-none"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.gold})`,
            }}
          />
        </div>
      </div>
    </button>
  );
}
