"use client";

import React, { useDeferredValue, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Smartphone,
  Tv,
  Laptop,
  Headphones,
  Camera,
  Gamepad2,
  Watch,
  Router,
  Tablet,
  Speaker,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Palette (NO pink usage on UI)
const COLORS = {
  navy: "#001f3f",
  accent: "#eab308",
};

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "mobile", label: "Mobile" },
  { key: "tv", label: "TV" },
  { key: "laptop", label: "Laptop" },
  { key: "audio", label: "Audio" },
  { key: "camera", label: "Camera" },
  { key: "gaming", label: "Gaming" },
  { key: "wearables", label: "Wearables" },
  { key: "network", label: "Networking" },
  { key: "tablet", label: "Tablet" },
];

const BRANDS = [
  { name: "Apple", category: "mobile", icon: Smartphone },
  { name: "Samsung", category: "mobile", icon: Smartphone },
  { name: "Google", category: "mobile", icon: Smartphone },
  { name: "Xiaomi", category: "mobile", icon: Smartphone },
  { name: "OnePlus", category: "mobile", icon: Smartphone },
  { name: "Motorola", category: "mobile", icon: Smartphone },

  { name: "Sony", category: "tv", icon: Tv },
  { name: "LG", category: "tv", icon: Tv },
  { name: "TCL", category: "tv", icon: Tv },
  { name: "Panasonic", category: "tv", icon: Tv },

  { name: "Dell", category: "laptop", icon: Laptop },
  { name: "HP", category: "laptop", icon: Laptop },
  { name: "Lenovo", category: "laptop", icon: Laptop },
  { name: "ASUS", category: "laptop", icon: Laptop },
  { name: "Acer", category: "laptop", icon: Laptop },
  { name: "MSI", category: "laptop", icon: Laptop },

  { name: "Bose", category: "audio", icon: Headphones },
  { name: "JBL", category: "audio", icon: Speaker },
  { name: "Sennheiser", category: "audio", icon: Headphones },
  { name: "Beats", category: "audio", icon: Headphones },

  { name: "Canon", category: "camera", icon: Camera },
  { name: "Nikon", category: "camera", icon: Camera },
  { name: "GoPro", category: "camera", icon: Camera },

  { name: "PlayStation", category: "gaming", icon: Gamepad2 },
  { name: "Xbox", category: "gaming", icon: Gamepad2 },
  { name: "Razer", category: "gaming", icon: Gamepad2 },

  { name: "Garmin", category: "wearables", icon: Watch },
  { name: "Fitbit", category: "wearables", icon: Watch },

  { name: "Apple iPad", category: "tablet", icon: Tablet },
  { name: "Samsung Galaxy Tab", category: "tablet", icon: Tablet },

  { name: "TP-Link", category: "network", icon: Router },
  { name: "Netgear", category: "network", icon: Router },
];

const GRID = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
};

const CARD = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, y: 8, scale: 0.985, transition: { duration: 0.12, ease: "easeIn" } },
};

function useScrollRevealMotionProps() {
  const reduce = useReducedMotion();
  return useMemo(() => {
    if (reduce) return { initial: false };
    return {
      initial: { opacity: 0, y: 12 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, amount: 0.2 },
      transition: { duration: 0.22, ease: "easeOut" },
    };
  }, [reduce]);
}

const CategoryPill = React.memo(function CategoryPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "cursor-pointer select-none rounded-full px-4 py-2 text-sm font-medium transition",
        "ring-1 ring-slate-900/10 hover:ring-slate-900/20",
        active ? "text-white" : "text-slate-700 bg-white",
      ].join(" ")}
      style={active ? { background: COLORS.navy } : undefined}
    >
      {children}
    </button>
  );
});

const BrandCard = React.memo(function BrandCard({ brand, onSelect }) {
  const Icon = brand.icon;

  return (
    <motion.button
      type="button"
      variants={CARD}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect?.(brand)}
      className={[
        "cursor-pointer group w-full text-left rounded-2xl bg-white",
        "p-4 sm:p-5 shadow-sm",
        "ring-1 ring-slate-900/10 hover:ring-slate-900/20",
        "transition active:translate-y-[1px]",
      ].join(" ")}
    >
      <div
        className="grid h-14 w-14 place-items-center rounded-2xl"
        style={{
          background: "rgba(234,179,8,0.14)",
          border: "1px solid rgba(234,179,8,0.35)",
        }}
      >
        <Icon className="h-7 w-7" style={{ color: COLORS.navy }} />
      </div>

      <div className="mt-3">
        <p className="text-base font-semibold tracking-tight" style={{ color: COLORS.navy }}>
          {brand.name}
        </p>
        <p className="mt-1 text-sm text-slate-500">{brand.category.toUpperCase()}</p>
      </div>

      <div className="mt-4 h-px w-full bg-slate-100" />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-slate-600">View products</span>
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: COLORS.accent }}
          aria-hidden="true"
        />
      </div>
    </motion.button>
  );
});

export default function BrandsSection({ onBrandSelect }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const deferredSearch = useDeferredValue(search);
  const deferredCategory = useDeferredValue(activeCategory);

  useEffect(() => {
    setShowAll(false);
  }, [deferredSearch, deferredCategory]);

  const filteredBrands = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const cat = deferredCategory;

    if (!q && cat === "all") return BRANDS;

    return BRANDS.filter((b) => {
      if (cat !== "all" && b.category !== cat) return false;
      if (q && !b.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [deferredSearch, deferredCategory]);

  const visibleBrands = useMemo(
    () => (showAll ? filteredBrands : filteredBrands.slice(0, 8)),
    [filteredBrands, showAll]
  );

  const canToggle = filteredBrands.length > 8;
  const revealProps = useScrollRevealMotionProps();

  return (
    <motion.section className="relative mx-auto w-full max-w-6xl px-4 py-10" {...revealProps}>
      {/* subtle background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-[720px] -translate-x-1/2 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(234,179,8,0.18), rgba(0,31,63,0.06), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: COLORS.navy }}>
            Shop by Brand
          </h2>
          <p className="mt-2 text-sm md:text-base text-slate-600">
            Browse popular gadget brands (icons are placeholders for logos).
          </p>
        </div>

        <div className="w-full md:w-[360px]">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands..."
              className={[
                "w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none",
                "ring-1 ring-slate-900/10 focus:ring-2 transition",
              ].join(" ")}
              style={{ "--tw-ring-color": COLORS.accent }}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <span
                className="rounded-full px-2 py-1 text-xs font-semibold"
                style={{ background: "rgba(0,31,63,0.08)", color: COLORS.navy }}
              >
                {filteredBrands.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <motion.div
            key={c.key}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="cursor-default"
          >
            <CategoryPill active={activeCategory === c.key} onClick={() => setActiveCategory(c.key)}>
              {c.label}
            </CategoryPill>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={GRID}
        initial="hidden"
        animate="show"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <AnimatePresence initial={false} mode="sync">
          {visibleBrands.map((b) => (
            <motion.div
              key={`${b.name}-${b.category}`}
              variants={CARD}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{ willChange: "transform, opacity" }}
              className="cursor-default"
            >
              <BrandCard brand={b} onSelect={onBrandSelect} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {canToggle && (
        <div className="mt-6 flex justify-center">
          <motion.button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.12 }}
            className={[
              "cursor-pointer select-none inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold",
              "bg-white ring-1 ring-slate-900/10 hover:ring-slate-900/20 transition",
            ].join(" ")}
            style={{ color: COLORS.navy }}
          >
            {showAll ? "Show less" : "See more"}
            {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </motion.button>
        </div>
      )}

      {filteredBrands.length === 0 && (
        <div className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-slate-900/10">
          <p className="text-sm text-slate-600">No brands found. Try a different search or category.</p>
        </div>
      )}
    </motion.section>
  );
}
