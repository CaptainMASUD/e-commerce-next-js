import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiZap,
  FiSliders,
  FiX,
  FiCheck,
  FiShoppingCart,
  FiSearch,
} from "react-icons/fi";

// ✅ Import your shared products source
import { getAllProducts } from "../Home/HomePageClient";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
};

const cn = (...classes) => classes.filter(Boolean).join("");

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n || 0);

/* -------------------- IMAGE POOL YOU GAVE -------------------- */

const STOCK_IMAGES = [
  {
    key: "airpods",
    url: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?q=80&w=1289&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["airpod", "earbud", "buds", "pod"],
  },
  {
    key: "wirelessheadphone",
    url: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?q=80&w=1326&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["headphone", "wireless", "head set", "headset"],
  },
  {
    key: "smartwatch1",
    url: "https://images.unsplash.com/photo-1609096458733-95b38583ac4e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGdhZGdldHxlbnwwfHwwfHx8MA%3D%3D",
    hint: ["smartwatch", "smart watch"],
  },
  {
    key: "digitalwatch",
    url: "https://images.unsplash.com/photo-1549482199-bc1ca6f58502?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["digital", "watch", "gshock", "casio"],
  },
  {
    key: "samsungtabs",
    url: "https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=1084&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["tab", "tablet", "ipad", "galaxy tab"],
  },
  {
    key: "smartwatch2",
    url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["watch", "smart watch", "smartwatch"],
  },
  {
    key: "sony1",
    url: "https://images.unsplash.com/photo-1706290047679-8cd8a8694be1?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["sony", "wh", "xm", "noise", "headphone"],
  },
  {
    key: "sony2",
    url: "https://images.unsplash.com/photo-1548378329-437e1ef34263?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["sony", "headphone", "wireless"],
  },
  {
    key: "watch",
    url: "https://images.unsplash.com/photo-1599989850406-3c8de3edf0ef?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["watch", "time"],
  },
  {
    key: "gamingconsole",
    url: "https://plus.unsplash.com/premium_photo-1731951686879-da72f23ae22d?q=80&w=715&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["game", "gaming", "console", "ps", "xbox", "controller"],
  },
  {
    key: "speaker1",
    url: "https://images.unsplash.com/photo-1560701814-de5e72b8d346?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["speaker", "sound", "audio", "jbl", "sony speaker"],
  },
  {
    key: "speaker2",
    url: "https://images.unsplash.com/photo-1624812669660-fcbf43eb4aaa?q=80&w=715&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["speaker", "portable", "wireless"],
  },
  {
    key: "smartglasses",
    url: "https://plus.unsplash.com/premium_photo-1734173424653-46817e72f317?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["glass", "glasses", "smart glass", "vr", "ar"],
  },
  {
    key: "cameralens",
    url: "https://images.unsplash.com/photo-1571763806648-5d022a3d1a29?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: ["camera", "lens", "dslr", "canon", "nikon", "sony a"],
  },
];

/* -------------------- HELPERS -------------------- */

function pickImageForProduct(p) {
  const text = `${p?.title || ""} ${p?.category || ""} ${p?.brand || ""} ${p?.tag || ""}`.toLowerCase();

  const match = STOCK_IMAGES.find((img) => img.hint.some((h) => text.includes(h)));
  if (match) return match.url;

  const cat = String(p?.category || "").toLowerCase();
  const catMatch = STOCK_IMAGES.find((img) => img.hint.some((h) => cat.includes(h)));
  if (catMatch) return catMatch.url;

  const idStr = String(p?.id ?? "");
  const seed = Array.from(idStr).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
  return STOCK_IMAGES[seed % STOCK_IMAGES.length].url;
}

function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [locked]);
}

function useMediaQuery(query) {
  const getMatch = () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    if (m.addEventListener) m.addEventListener("change", onChange);
    else m.addListener(onChange);
    return () => {
      if (m.removeEventListener) m.removeEventListener("change", onChange);
      else m.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

/* -------------------- UI BASICS -------------------- */

function Chip({ children, tone = "soft" }) {
  const map = {
    coral: { bg: PALETTE.coral, fg: PALETTE.navy },
    soft: { bg: "rgba(0,31,63,.06)", fg: PALETTE.navy },
  };
  const t = map[tone] || map.soft;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ring-1 ring-black/10"
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

/**
 * ✅ FIX: active pill uses WHITE background (as you asked),
 * with navy text + subtle border. Inactive stays white too but less emphasis.
 */
function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-xs font-black",
        "transition motion-reduce:transition-none",
        active
          ? "bg-white text-slate-900 ring-2 ring-black/10 shadow-sm"
          : "bg-white text-slate-900 ring-1 ring-black/10 hover:bg-slate-50"
      )}
      style={active ? { boxShadow: "0 8px 18px rgba(0,31,63,.08)", borderColor: PALETTE.navy } : undefined}
    >
      <span className="inline-flex items-center gap-2">
        {children}
        {active ? (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: PALETTE.navy }}>
            <FiCheck className="h-3 w-3 text-white" />
          </span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * ✅ FIX: Toggles are now a real switch (more visible) and faster (less layout).
 */
function ToggleRow({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-left hover:bg-slate-50"
    >
      <div className="min-w-0">
        <div className="text-sm font-black text-slate-900">{label}</div>
        {description ? <div className="mt-0.5 text-xs font-semibold text-slate-500">{description}</div> : null}
      </div>

      {/* switch */}
      <div
        className={cn(
          "relative mt-1 inline-flex h-6 w-11 items-center rounded-full ring-1 ring-black/10 transition",
          checked ? "bg-white" : "bg-slate-200"
        )}
        style={checked ? { backgroundColor: PALETTE.navy } : undefined}
      >
        <span
          className={cn(
            "absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
    </button>
  );
}

/* -------------------- MOBILE FILTER SHEET -------------------- */

function MobileFilterSheet({ open, title, subtitle, onClose, children }) {
  const [mounted, setMounted] = useState(open);
  const [ready, setReady] = useState(false);

  useLockBodyScroll(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(t);
    } else {
      setReady(false);
      const t = setTimeout(() => setMounted(false), 240);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[80] md:hidden">
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-200 motion-reduce:transition-none",
          ready ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0">
        <div
          className={cn(
            "rounded-t-[1.75rem] border border-black/10 bg-neutral-50 shadow-2xl",
            "transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none",
            ready ? "translate-y-0" : "translate-y-6"
          )}
        >
          <div className="flex items-start justify-between gap-3 px-4 py-4">
            <div>
              <div className="text-base font-black" style={{ color: PALETTE.navy }}>
                {title}
              </div>
              {subtitle ? <div className="mt-0.5 text-xs font-semibold text-slate-500">{subtitle}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-black/10 hover:bg-slate-50"
              aria-label="Close"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-4 pb-28 [scrollbar-gutter:stable]">{children}</div>

          <div className="sticky bottom-0 border-t border-black/10 bg-white/90 px-4 py-3 backdrop-blur">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl px-4 py-3 text-sm font-black text-white shadow-sm active:scale-[0.99]"
              style={{ backgroundColor: PALETTE.cta }}
            >
              Show results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- DESKTOP COLLAPSIBLE LEFT FILTER PANEL (FAST + NO LAG) -------------------- */
/**
 * ✅ Lag reduction:
 * - collapse width to 0 (no layout gap)
 * - unmount content after close animation (no hidden expensive DOM)
 * - baseline max price memoized once
 */
function DesktopSidebar({ open, onClose, children }) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <aside
      className={cn("hidden md:block overflow-hidden", "transition-[width] duration-250 ease-out")}
      style={{ width: open ? 328 : 0 }}
      aria-hidden={!open}
    >
      <div className={cn("transition-all duration-250 ease-out", open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 pointer-events-none")}>
        <div className="sticky top-6">
          <div className="rounded-[1.75rem] border border-black/10 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                Filters
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl bg-slate-100 p-2 hover:bg-slate-200"
                aria-label="Close desktop filters"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-110px)] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
              {mounted ? children : null}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* -------------------- SLIDER (BANNER) -------------------- */

function DealsAdsCarousel({ slides }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!slides?.length || paused) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 5200);
    return () => clearInterval(t);
  }, [slides?.length, paused]);

  const prev = useCallback(() => setI((p) => (p - 1 + slides.length) % slides.length), [slides.length]);
  const next = useCallback(() => setI((p) => (p + 1) % slides.length), [slides.length]);

  if (!slides?.length) return null;

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] border border-black/10 bg-white shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ✅ Mobile height stays like before */}
      <div className="relative h-[170px] w-full sm:h-[200px] md:h-[230px] lg:h-[260px]">
        <div
          className="absolute inset-0 flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {slides.map((s) => (
            <div key={s.id} className="relative h-full w-full flex-shrink-0">
              <img src={s.image} alt={s.title || "Banner"} className="h-full w-full object-cover" loading="eager" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
            </div>
          ))}
        </div>

        <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
          <div
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-extrabold shadow-sm ring-1 ring-black/10 backdrop-blur"
            style={{ color: PALETTE.navy }}
          >
            <FiZap style={{ color: PALETTE.coral }} />
            Deals
          </div>
        </div>

        <button
          type="button"
          onClick={prev}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-sm ring-1 ring-black/10 backdrop-blur hover:bg-white",
            "p-2 sm:p-2.5"
          )}
          aria-label="Previous banner"
        >
          <FiChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          type="button"
          onClick={next}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow-sm ring-1 ring-black/10 backdrop-blur hover:bg-white",
            "p-2 sm:p-2.5"
          )}
          aria-label="Next banner"
        >
          <FiChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setI(idx)}
              className="rounded-full transition-all duration-300"
              style={{
                height: 8,
                width: idx === i ? 26 : 10,
                backgroundColor: idx === i ? "white" : "rgba(255,255,255,.55)",
              }}
              aria-label={`Go to banner ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------- PRODUCT CARD -------------------- */

function DealsProductCard({ p, onOpen, onAdd }) {
  const pct = useMemo(() => {
    const oldP = Number(p.oldPriceBDT || 0);
    const nowP = Number(p.priceBDT || 0);
    if (!oldP || oldP <= nowP) return 0;
    return Math.min(90, Math.max(0, Math.round(((oldP - nowP) / oldP) * 100)));
  }, [p.oldPriceBDT, p.priceBDT]);

  const image = useMemo(() => pickImageForProduct(p), [p]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(p)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? onOpen?.(p) : null)}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-black/10 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ boxShadow: "0 10px 28px rgba(0,31,63,.07), 0 1px 0 rgba(0,0,0,.02)" }}
    >
      <div className="relative">
        <div className="h-28 sm:h-36 lg:h-40">
          <img
            src={image}
            alt={p.title}
            className="h-full w-full object-cover scale-[1.06] transition-transform duration-500 ease-out group-hover:scale-100"
            loading="lazy"
          />
        </div>

        {pct ? (
          <div className="absolute left-2 top-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white shadow-sm ring-1 ring-black/10"
              style={{ backgroundColor: PALETTE.cta }}
            >
              {pct}% OFF
            </span>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      </div>

      <div className="p-2.5 sm:p-3">
        <div className="mt-1 line-clamp-2 text-[12.5px] sm:text-[13px] font-extrabold leading-snug tracking-tight text-slate-900">
          {p.title}
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] sm:text-[14px] font-black" style={{ color: PALETTE.cta }}>
              {formatBDT(p.priceBDT)}
            </div>
            {p.oldPriceBDT ? (
              <div className="text-[10.5px] sm:text-[11px] font-black text-slate-400 line-through">
                {formatBDT(p.oldPriceBDT)}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={p.inStock === false}
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.(p, 1);
            }}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-2.5 py-2 text-[11px] font-black shadow-sm ring-1 ring-black/10 transition",
              p.inStock === false ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-slate-50"
            )}
            style={{ color: PALETTE.navy, background: "white" }}
          >
            <FiShoppingCart className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- FILTERS CONTENT -------------------- */

function FiltersContent({
  activeFilterCount,
  clearFilters,
  categories,
  brands,
  category,
  setCategory,
  brand,
  setBrand,
  sort,
  setSort,
  onlyInStock,
  setOnlyInStock,
  onlyBigDiscount,
  setOnlyBigDiscount,
  maxPrice,
  setMaxPrice,
  maxPricePossible,
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-black text-slate-900">Active filters</div>
            <div className="mt-0.5 text-xs font-semibold text-slate-500">
              {activeFilterCount ? `${activeFilterCount} applied` : "None applied"}
            </div>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-200"
          >
            Reset all
          </button>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">Category</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Pill>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">Brand</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {brands.map((b) => (
            <Pill key={b} active={brand === b} onClick={() => setBrand(b)}>
              {b}
            </Pill>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">Sort</div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {[
            { key: "best", label: "Best deals (recommended)" },
            { key: "price_asc", label: "Price: Low → High" },
            { key: "price_desc", label: "Price: High → Low" },
            { key: "newest", label: "Newest" },
          ].map((s) => (
            <button
              type="button"
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-black",
                "transition motion-reduce:transition-none",
                sort === s.key ? "bg-white text-slate-900 ring-2 ring-black/10 shadow-sm" : "border-black/10 bg-white text-slate-900 hover:bg-slate-50"
              )}
              style={sort === s.key ? { borderColor: PALETTE.navy } : undefined}
            >
              <span className="truncate">{s.label}</span>
              {sort === s.key ? (
                <span className="ml-3 inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: PALETTE.navy }}>
                  <FiCheck className="h-3 w-3 text-white" />
                </span>
              ) : (
                <span className="ml-3 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#e5e7eb" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">Quick options</div>
        <div className="mt-3 space-y-2">
          <ToggleRow label="Only in-stock" description="Hide out-of-stock items." checked={onlyInStock} onChange={setOnlyInStock} />
          <ToggleRow label="Big discounts (25%+)" description="Only show larger discount deals." checked={onlyBigDiscount} onChange={setOnlyBigDiscount} />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">Max price</div>
          <div className="text-xs font-extrabold" style={{ color: PALETTE.coral }}>
            Up to {formatBDT(maxPrice)}
          </div>
        </div>

        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={maxPricePossible}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: PALETTE.navy }}
          />
          <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{formatBDT(0)}</span>
            <span>{formatBDT(maxPricePossible)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- MAIN PAGE -------------------- */

export default function DealsPage({ onAddToCart }) {
  const navigate = useNavigate();
  const isMdUp = useMediaQuery("(min-width: 768px)");

  const products = useMemo(() => getAllProducts(), []);

  const withDiscount = useMemo(() => {
    return products.map((p) => {
      const oldP = Number(p.oldPriceBDT || 0);
      const nowP = Number(p.priceBDT || 0);
      const discountPct = oldP && oldP > nowP ? Math.round(((oldP - nowP) / oldP) * 100) : 0;
      return { ...p, discountPct: Math.max(0, Math.min(90, discountPct)) };
    });
  }, [products]);

  const dealPool = useMemo(() => {
    return withDiscount
      .map((p) => ({
        ...p,
        _isDeal:
          p.discountPct >= 10 ||
          Boolean(p.oldPriceBDT) ||
          (p.tag || "").toLowerCase().includes("value") ||
          (p.tag || "").toLowerCase().includes("deal") ||
          (p.tag || "").toLowerCase().includes("best deal"),
      }))
      .filter((p) => p._isDeal);
  }, [withDiscount]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(dealPool.map((p) => p.category))).filter(Boolean)],
    [dealPool]
  );
  const brands = useMemo(
    () => ["All", ...Array.from(new Set(dealPool.map((p) => p.brand))).filter(Boolean)],
    [dealPool]
  );

  // ✅ baseline computed ONCE (big lag fix)
  const baselineMaxPrice = useMemo(
    () => Math.max(...dealPool.map((p) => Number(p.priceBDT || 0)), 40000),
    [dealPool]
  );

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [sort, setSort] = useState("best");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyBigDiscount, setOnlyBigDiscount] = useState(false);
  const [maxPrice, setMaxPrice] = useState(40000);
  const [q, setQ] = useState("");

  useEffect(() => {
    setMaxPrice(baselineMaxPrice);
  }, [baselineMaxPrice]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (category !== "All") c += 1;
    if (brand !== "All") c += 1;
    if (sort !== "best") c += 1;
    if (onlyInStock) c += 1;
    if (onlyBigDiscount) c += 1;
    if (q.trim()) c += 1;
    if (maxPrice < baselineMaxPrice) c += 1;
    return c;
  }, [category, brand, sort, onlyInStock, onlyBigDiscount, maxPrice, baselineMaxPrice, q]);

  const clearFilters = useCallback(() => {
    setCategory("All");
    setBrand("All");
    setSort("best");
    setOnlyInStock(false);
    setOnlyBigDiscount(false);
    setQ("");
    setMaxPrice(baselineMaxPrice);
  }, [baselineMaxPrice]);

  const filtered = useMemo(() => {
    let list = [...dealPool];

    if (category !== "All") list = list.filter((p) => p.category === category);
    if (brand !== "All") list = list.filter((p) => (p.brand || "") === brand);
    if (onlyInStock) list = list.filter((p) => p.inStock !== false);
    if (onlyBigDiscount) list = list.filter((p) => (p.discountPct || 0) >= 25);
    list = list.filter((p) => (p.priceBDT || 0) <= maxPrice);

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((p) =>
        `${p.title || ""} ${p.brand || ""} ${p.category || ""} ${p.tag || ""}`.toLowerCase().includes(s)
      );
    }

    if (sort === "price_asc") list.sort((a, b) => (a.priceBDT || 0) - (b.priceBDT || 0));
    if (sort === "price_desc") list.sort((a, b) => (b.priceBDT || 0) - (a.priceBDT || 0));
    if (sort === "newest") list.sort((a, b) => (String(b.id) > String(a.id) ? 1 : -1));
    if (sort === "best") {
      const score = (p) =>
        (p.discountPct || 0) * 3 +
        ((p.tag || "").toLowerCase().includes("best") ? 50 : 0) +
        ((p.tag || "").toLowerCase().includes("value") ? 30 : 0) +
        (p.badges?.trending ? 18 : 0) +
        (p.badges?.new ? 10 : 0);
      list.sort((a, b) => score(b) - score(a));
    }

    return list;
  }, [dealPool, category, brand, onlyInStock, onlyBigDiscount, maxPrice, sort, q]);

  const maxPricePossible = baselineMaxPrice;

  const bannerSlides = useMemo(
    () => [
      {
        id: "banner-1",
        image: "https://techlustt.com/wp-content/uploads/2018/08/Gearbest-Consumer-Electronics-deal.png",
        title: "Banner 1",
      },
      {
        id: "banner-2",
        image:
          "https://img.freepik.com/free-psd/black-friday-big-sale-social-media-post-design-template_47987-25239.jpg?semt=ais_user_personalization&w=740&q=80",
        title: "Banner 2",
      },
      {
        id: "banner-3",
        image: "https://img.freepik.com/premium-vector/watch-that-has-time-it_812236-16595.jpg?semt=ais_user_personalization&w=740&q=80",
        title: "Banner 3",
      },
      {
        id: "banner-4",
        image: "https://img.freepik.com/premium-vector/watch-that-has-words-watch-watch-it_812236-16623.jpg?semt=ais_user_personalization&w=740&q=80",
        title: "Banner 4",
      },
    ],
    []
  );

  const openMobileFilters = useCallback(() => setFiltersOpen(true), []);
  const toggleDesktopFilters = useCallback(() => setFiltersOpen((v) => !v), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  const desktopSidebarOpen = isMdUp && filtersOpen;

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.12), rgba(255,126,105,.10), rgba(234,179,8,.06), transparent)",
        }}
      />

      {/* Mobile sheet */}
      <MobileFilterSheet open={filtersOpen && !isMdUp} title="Deal Filters" subtitle="Find the best deal faster" onClose={closeFilters}>
        <div className="mb-4 rounded-[1.5rem] border border-black/10 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-slate-100 p-2">
              <FiSearch />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search deals (brand, product...)"
              className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
            {q ? (
              <button type="button" onClick={() => setQ("")} className="rounded-2xl bg-slate-100 p-2" aria-label="Clear search">
                <FiX />
              </button>
            ) : null}
          </div>
        </div>

        <FiltersContent
          activeFilterCount={activeFilterCount}
          clearFilters={clearFilters}
          categories={categories}
          brands={brands}
          category={category}
          setCategory={setCategory}
          brand={brand}
          setBrand={setBrand}
          sort={sort}
          setSort={setSort}
          onlyInStock={onlyInStock}
          setOnlyInStock={setOnlyInStock}
          onlyBigDiscount={onlyBigDiscount}
          setOnlyBigDiscount={setOnlyBigDiscount}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          maxPricePossible={maxPricePossible}
        />
      </MobileFilterSheet>

      <main className="mx-auto max-w-[1400px] px-3 py-6 sm:px-4 sm:py-8">
        <section className="mx-auto mt-1 w-full">
          <DealsAdsCarousel slides={bannerSlides} />
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Chip tone="coral">
                <FiZap /> Best Deals
              </Chip>
              <div className="text-sm font-black text-slate-900">
                Showing <span style={{ color: PALETTE.coral }}>{filtered.length}</span> deals
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm">
                <FiSearch className="h-4 w-4 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search deals..."
                  className="w-56 bg-transparent text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400"
                />
                {q ? (
                  <button type="button" onClick={() => setQ("")} className="rounded-xl bg-slate-100 p-1.5" aria-label="Clear search">
                    <FiX className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => (isMdUp ? toggleDesktopFilters() : openMobileFilters())}
                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-black text-slate-900 shadow-sm hover:bg-slate-50"
              >
                <FiSliders className="h-4 w-4" style={{ color: PALETTE.navy }} />
                {isMdUp ? (filtersOpen ? "Hide filters" : "Show filters") : "Open filters"}
                {activeFilterCount ? (
                  <span
                    className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-black"
                    style={{ backgroundColor: "rgba(255,126,105,.14)", color: PALETTE.navy }}
                  >
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <div className={cn("mt-6 flex items-start", desktopSidebarOpen ? "gap-4" : "gap-0")}>
            <DesktopSidebar open={desktopSidebarOpen} onClose={closeFilters}>
              <div className="mb-4 rounded-[1.5rem] border border-black/10 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="rounded-2xl bg-slate-100 p-2">
                    <FiSearch />
                  </div>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search deals (brand, product...)"
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {q ? (
                    <button type="button" onClick={() => setQ("")} className="rounded-2xl bg-slate-100 p-2" aria-label="Clear search">
                      <FiX />
                    </button>
                  ) : null}
                </div>
              </div>

              <FiltersContent
                activeFilterCount={activeFilterCount}
                clearFilters={clearFilters}
                categories={categories}
                brands={brands}
                category={category}
                setCategory={setCategory}
                brand={brand}
                setBrand={setBrand}
                sort={sort}
                setSort={setSort}
                onlyInStock={onlyInStock}
                setOnlyInStock={setOnlyInStock}
                onlyBigDiscount={onlyBigDiscount}
                setOnlyBigDiscount={setOnlyBigDiscount}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                maxPricePossible={maxPricePossible}
              />

              <div className="mt-4">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900 hover:bg-slate-200"
                >
                  Reset all filters
                </button>
              </div>
            </DesktopSidebar>

            <div className="min-w-0 flex-1">
              {filtered.length === 0 ? (
                <div className="rounded-[1.75rem] border border-black/10 bg-white p-8 text-center shadow-sm">
                  <div className="text-lg font-black" style={{ color: PALETTE.navy }}>
                    No deals found
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-600">Try clearing filters or increasing max price.</div>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 cursor-pointer rounded-2xl px-5 py-3 text-sm font-black text-white shadow-sm"
                    style={{ backgroundColor: PALETTE.cta }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {filtered.map((p) => (
                    <DealsProductCard key={p.id} p={p} onOpen={(prod) => navigate(`/product/${prod.id}`)} onAdd={onAddToCart} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="mt-12 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">LUXMART</div>
              <div className="text-xs font-semibold text-slate-500">Deals, curated and fast.</div>
            </div>
            <div className="text-xs font-semibold text-slate-500">© {new Date().getFullYear()} All rights reserved.</div>
          </div>
        </footer>
      </main>

      {/* Mobile floating button */}
      <button
        type="button"
        onClick={openMobileFilters}
        className={cn(
          "fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-2xl md:hidden",
          "active:scale-[0.99]"
        )}
        style={{ backgroundColor: PALETTE.navy }}
        aria-label="Open deal filters"
      >
        <FiSliders className="h-4 w-4" style={{ color: PALETTE.gold }} />
        Filters
        {activeFilterCount ? (
          <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/15 px-2 text-xs font-black">
            {activeFilterCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
