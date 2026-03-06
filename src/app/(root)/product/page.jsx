"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiShoppingCart,
  FiTag,
  FiStar,
  FiSearch,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

/* -------------------- THEME -------------------- */

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
  price: "#ff6b6b",
  muted: "#64748b",
  border: "rgba(15, 23, 42, 0.08)",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const GRID = "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4";

/* -------------------- utils -------------------- */

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const pctOff = (price, oldPrice) => {
  const p = Number(price || 0);
  const o = Number(oldPrice || 0);
  if (!o || o <= p) return 0;
  const pct = Math.round(((o - p) / o) * 100);
  return Math.max(1, Math.min(90, pct));
};

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || data?.error || "Request failed");
  }
  return data;
}

function buildQS(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/* -------------------- mapping helpers -------------------- */

function getCategoryLabel(p) {
  const c = p?.category;
  return typeof c === "object" ? c?.name : c;
}
function getBrandLabel(p) {
  const b = p?.brand;
  return typeof b === "object" ? b?.name : b;
}

function getNormalPrice(p) {
  const n = Number(p?.normalPrice ?? p?.price ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getDiscountedPrice(p) {
  const dp = Number(p?.discountPrice ?? NaN);
  if (Number.isFinite(dp) && dp > 0) return dp;

  const fp = Number(p?.finalPrice ?? NaN);
  if (Number.isFinite(fp) && fp > 0) return fp;

  return getNormalPrice(p);
}

function hasDiscount(p) {
  const normal = getNormalPrice(p);
  const discounted = getDiscountedPrice(p);
  return normal > 0 && discounted > 0 && discounted < normal;
}

function getOffPct(p) {
  if (!hasDiscount(p)) return 0;
  return pctOff(getDiscountedPrice(p), getNormalPrice(p));
}

function getSaveAmount(p) {
  if (!hasDiscount(p)) return 0;
  const normal = getNormalPrice(p);
  const discounted = getDiscountedPrice(p);
  return Math.max(0, Math.round(normal - discounted));
}

function getRating(p) {
  return Number(p?.rating ?? 4.6);
}
function getReviewCount(p) {
  return Number(p?.reviewCount ?? 120);
}
function getInStock(p) {
  if (typeof p?.inStockNow === "boolean") return p.inStockNow;
  if (typeof p?.availableStock === "number") return p.availableStock > 0;
  return true;
}

/* -------------------- shared UI bits -------------------- */

function Stars({ value = 0 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <FiStar
            key={i}
            className="h-4 w-4"
            style={{
              color: filled ? PALETTE.gold : "rgba(0,0,0,.14)",
              fill: filled ? PALETTE.gold : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

function Chip({ children, tone = "soft" }) {
  const map = {
    navy: { bg: PALETTE.navy, fg: "#fff" },
    coral: { bg: PALETTE.coral, fg: PALETTE.navy },
    gold: { bg: "rgba(234,179,8,.16)", fg: PALETTE.navy },
    soft: { bg: "rgba(0,31,63,.06)", fg: PALETTE.navy },
    danger: { bg: "rgba(255,107,107,.16)", fg: PALETTE.cta },
  };
  const t = map[tone] || map.soft;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ring-1 ring-black/5"
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

function CheckboxRow({ label, checked, onChange, right }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-black/5">
      <span className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="h-4 w-4 cursor-pointer"
          style={{ accentColor: PALETTE.navy }}
        />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </span>
      {right ? <span className="text-xs font-black text-slate-400">{right}</span> : null}
    </label>
  );
}

function RadioRow({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-black/5">
      <span className="inline-flex items-center gap-2">
        <input
          type="radio"
          checked={checked}
          onChange={() => onChange?.()}
          className="h-4 w-4 cursor-pointer"
          style={{ accentColor: PALETTE.navy }}
        />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </span>
    </label>
  );
}

function RangeInput({ value, onChange, min = 0, max = 20000, step = 100 }) {
  return (
    <input
      type="range"
      className="w-full cursor-pointer"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange?.(Number(e.target.value))}
      style={{ accentColor: PALETTE.cta }}
    />
  );
}

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between"
      >
        <span className="text-sm font-black" style={{ color: PALETTE.navy }}>
          {title}
        </span>
        {open ? <FiChevronUp style={{ color: PALETTE.navy }} /> : <FiChevronDown style={{ color: PALETTE.navy }} />}
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function MobileFilterDrawer({ open, onClose, children }) {
  return (
    <>
      <div
        className={cn("fixed inset-0 z-40 transition", open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}
        style={{ background: "rgba(0,0,0,.28)" }}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 max-h-[86vh] transform rounded-t-[2rem] bg-white shadow-2xl transition",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
            Filters
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-white p-2 ring-1 ring-black/10 hover:bg-slate-50"
            aria-label="Close"
          >
            <FiX style={{ color: PALETTE.coral }} />
          </button>
        </div>
        <div className="max-h-[calc(86vh-64px)] overflow-y-auto p-5">{children}</div>
      </div>
    </>
  );
}

/* -------------------- PRODUCT CARD -------------------- */

const ProductCard = React.memo(function ProductCard({ p, onAdd, onOpen }) {
  const clickable = !!String(p?.slug || "").trim();
  const categoryLabel = getCategoryLabel(p);

  const normal = getNormalPrice(p);
  const discountedPrice = getDiscountedPrice(p);
  const discounted = hasDiscount(p);
  const offPct = getOffPct(p);
  const saveAmt = getSaveAmount(p);

  const inStock = getInStock(p);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (clickable ? onOpen?.(p) : null)}
      onKeyDown={(e) => (clickable && (e.key === "Enter" || e.key === " ")) ? onOpen?.(p) : null}
      className={cn(
        "group w-full overflow-hidden rounded-3xl border bg-white transition motion-reduce:transition-none",
        "h-full flex flex-col",
        clickable ? "cursor-pointer" : "cursor-not-allowed opacity-70",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-black/10",
        clickable ? "hover:-translate-y-0.5 hover:shadow-md" : ""
      )}
      style={{
        borderColor: PALETTE.border,
        boxShadow: "0 10px 28px rgba(0,31,63,.07), 0 1px 0 rgba(0,0,0,.02)",
      }}
      title={clickable ? "Open product" : "Missing slug (check backend)"}
    >
      <div
        className="relative overflow-hidden"
        style={{
          background: discounted
            ? "linear-gradient(to bottom, rgba(0,31,63,.04), rgba(255,126,105,.03), transparent)"
            : "linear-gradient(to bottom, rgba(0,31,63,.04), rgba(234,179,8,.06), transparent)",
        }}
      >
        <div
          className={cn(
            "pointer-events-none absolute -left-1/2 top-0 h-full w-[140%] -skew-x-12 opacity-0",
            "transition-opacity duration-300 group-hover:opacity-100"
          )}
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0.25) 55%, transparent 100%)",
          }}
        />

        <div className="h-36 sm:h-40 md:h-44 p-2 flex items-center justify-center">
          <img
            src={p?.image || "/placeholder.png"}
            alt={p?.name || "Product"}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-contain",
              "transition-transform duration-500 ease-out will-change-transform motion-reduce:transition-none",
              clickable ? "group-hover:scale-[1.03]" : ""
            )}
          />
        </div>

        {discounted ? (
          <div className="absolute right-2 top-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black text-white ring-1 ring-black/10"
              style={{ backgroundColor: PALETTE.cta }}
              aria-label={`${offPct}% off`}
            >
              <FiTag className="h-3.5 w-3.5" />
              {offPct}% OFF
            </span>
          </div>
        ) : (
          <div className="absolute right-2 top-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ring-black/10"
              style={{ background: "rgba(255,255,255,0.92)", color: PALETTE.navy }}
            >
              Best value
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/8 via-transparent to-transparent" />
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="text-[10px] font-extrabold" style={{ color: PALETTE.coral }}>
          {categoryLabel || "—"}
        </div>

        <div className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug tracking-tight text-slate-900">
          {p?.name || "Untitled"}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Stars value={getRating(p)} />
            <span className="text-[11px] font-black text-slate-800">{getRating(p).toFixed(1)}</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500">{getReviewCount(p)} reviews</span>
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between gap-1.5 sm:gap-2">
          <div className="flex min-w-0 flex-col">
            <div className="text-[13px] font-black" style={{ color: PALETTE.price }}>
              {formatBDT(discountedPrice)}
            </div>

            {discounted ? (
              <>
                <div className="text-[11px] font-semibold text-slate-500 line-through">{formatBDT(normal)}</div>
                {saveAmt > 0 ? (
                  <div className="text-[10px] font-extrabold" style={{ color: PALETTE.navy }}>
                    You save {formatBDT(saveAmt)}
                  </div>
                ) : null}
              </>
            ) : (
              <span
                className="mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1 ring-black/5"
                style={{ color: PALETTE.muted, background: "rgba(100,116,139,0.09)" }}
              >
                Regular price
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!inStock}
            onClick={(e) => {
              e.stopPropagation();
              if (!inStock) return;
              onAdd?.(p, 1);
            }}
            className={cn(
              "shrink-0 whitespace-nowrap inline-flex items-center",
              "gap-1 rounded-2xl font-black text-white shadow-sm active:scale-[0.99]",
              "px-2.5 py-1.5 text-[10px] sm:gap-1.5 sm:px-3 sm:py-2 sm:text-[11px]",
              !inStock ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            )}
            style={{ backgroundColor: PALETTE.cta }}
          >
            <FiShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Add
          </button>
        </div>

        <div className="mt-2">{!inStock ? <Chip tone="danger">Out</Chip> : <Chip tone="soft">In stock</Chip>}</div>
      </div>
    </div>
  );
});

/* -------------------- PAGE -------------------- */

export default function ProductsPage({ onAddToCart }) {
  const router = useRouter();
  const params = useParams();

  // ✅ if page is under /c/[categorySlug]/[subSlug]
  const categorySlug = String(params?.categorySlug || "").trim();
  const subSlug = String(params?.subSlug || "").trim();
  const isCategoryRoute = !!categorySlug;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const LIMIT = 24;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState(() => new Set());
  const [selectedBrands, setSelectedBrands] = useState(() => new Set());
  const [minRating, setMinRating] = useState(0);
  const [onlyInStock, setOnlyInStock] = useState(false);

  const openProduct = useCallback(
    (p) => {
      const slug = String(p?.slug || "").trim();
      if (!slug) return;
      // ✅ product details remains /product/[slug]
      router.push(`/product/${encodeURIComponent(slug)}`);
    },
    [router]
  );

  const onAdd = useCallback((p, qty = 1) => onAddToCart?.(p, qty), [onAddToCart]);

  // categories/brands list from current rows
  const allCategories = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((p) => {
      const c = p?.category;
      const id = typeof c === "object" ? String(c?._id || c?.id || c?.slug || "") : String(c || "");
      const label = getCategoryLabel(p);
      if (id && label) map.set(id, label);
    });
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const allBrands = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((p) => {
      const b = p?.brand;
      const id = typeof b === "object" ? String(b?._id || b?.id || b?.slug || "") : String(b || "");
      const label = getBrandLabel(p);
      if (id && label) map.set(id, label);
    });
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const priceMinPossible = useMemo(() => {
    const arr = (rows || []).map(getDiscountedPrice).filter((n) => Number.isFinite(n));
    return arr.length ? Math.min(...arr) : 0;
  }, [rows]);

  const priceMaxPossible = useMemo(() => {
    const arr = (rows || []).map(getDiscountedPrice).filter((n) => Number.isFinite(n));
    return arr.length ? Math.max(...arr) : 0;
  }, [rows]);

  const [maxPrice, setMaxPrice] = useState(0);
  useEffect(() => setMaxPrice(priceMaxPossible || 0), [priceMaxPossible]);

  // ✅ FETCH (supports both /product and /c routes)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const serverBrand = selectedBrands.size === 1 ? Array.from(selectedBrands)[0] : "";

        // only allow serverCategory on "all products" page (not on category route)
        const serverCategory =
          !isCategoryRoute && selectedCategories.size === 1 ? Array.from(selectedCategories)[0] : "";

        const qs = buildQS({
          page,
          limit: LIMIT,
          q: search.trim() || "",
          sort,
          category: serverCategory, // id-based (only global page)
          brand: serverBrand,
          inStock: onlyInStock ? "1" : "",
          categorySlug: isCategoryRoute ? categorySlug : "",
          subSlug: isCategoryRoute ? subSlug : "",
        });

        const data = await fetchJSON(`/api/products${qs}`);
        const incoming = data?.products || [];

        if (!alive) return;

        setRows((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
        setHasMore(incoming.length === LIMIT);
      } catch (e) {
        if (!alive) return;
        if (page === 1) setRows([]);
        setHasMore(false);
        setErr(e?.message || "Failed to load products");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, search, sort, onlyInStock, selectedCategories, selectedBrands, isCategoryRoute, categorySlug, subSlug]);

  useEffect(() => {
    setPage(1);
  }, [search, sort, onlyInStock, selectedCategories, selectedBrands, isCategoryRoute, categorySlug, subSlug]);

  // Client filtering (multi-select etc.)
  const filtered = useMemo(() => {
    let list = (rows || []).filter((p) => {
      const inStock = getInStock(p);
      const catLabel = getCategoryLabel(p) || "";
      const brandLabel = getBrandLabel(p) || "";

      // ✅ Category filter only makes sense on global /product page
      if (!isCategoryRoute && selectedCategories.size > 1) {
        const selectedLabels = new Set(allCategories.filter((x) => selectedCategories.has(x.id)).map((x) => x.label));
        if (selectedLabels.size && !selectedLabels.has(catLabel)) return false;
      }

      if (selectedBrands.size > 1) {
        const selectedLabels = new Set(allBrands.filter((x) => selectedBrands.has(x.id)).map((x) => x.label));
        if (selectedLabels.size && !selectedLabels.has(brandLabel)) return false;
      }

      if (minRating > 0 && getRating(p) < minRating) return false;
      if (maxPrice > 0 && getDiscountedPrice(p) > maxPrice) return false;
      if (onlyInStock && !inStock) return false;

      return true;
    });

    return list;
  }, [rows, selectedCategories, selectedBrands, minRating, maxPrice, onlyInStock, allCategories, allBrands, isCategoryRoute]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (!isCategoryRoute && selectedCategories.size) n += 1; // ✅ only count it globally
    if (selectedBrands.size) n += 1;
    if (minRating > 0) n += 1;
    if (onlyInStock) n += 1;
    if (priceMaxPossible > 0 && maxPrice < priceMaxPossible) n += 1;
    return n;
  }, [selectedCategories, selectedBrands, minRating, onlyInStock, maxPrice, priceMaxPossible, isCategoryRoute]);

  const clearAll = () => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setMinRating(0);
    setOnlyInStock(false);
    setMaxPrice(priceMaxPossible || 0);
  };

  const titleText = isCategoryRoute
    ? subSlug
      ? `Category: ${categorySlug} / ${subSlug}`
      : `Category: ${categorySlug}`
    : "Products";

  const subText = isCategoryRoute
    ? "Browse products under selected category"
    : "Browse all products with search & filters";

  const FiltersUI = (
    <div className="space-y-3">
      {/* ✅ Hide Category filter on /c routes */}
      {!isCategoryRoute ? (
        <Section title="Category">
          <div className="space-y-1">
            {allCategories.length ? (
              allCategories.map((c) => {
                const checked = selectedCategories.has(c.id);
                return (
                  <CheckboxRow
                    key={c.id}
                    label={c.label}
                    checked={checked}
                    onChange={(v) => {
                      setSelectedCategories((prev) => {
                        const next = new Set(prev);
                        v ? next.add(c.id) : next.delete(c.id);
                        return next;
                      });
                    }}
                  />
                );
              })
            ) : (
              <div className="text-xs font-semibold text-slate-500">No categories yet.</div>
            )}
          </div>
        </Section>
      ) : null}

      <Section title="Brand">
        <div className="space-y-1">
          {allBrands.length ? (
            allBrands.map((b) => {
              const checked = selectedBrands.has(b.id);
              return (
                <CheckboxRow
                  key={b.id}
                  label={b.label}
                  checked={checked}
                  onChange={(v) => {
                    setSelectedBrands((prev) => {
                      const next = new Set(prev);
                      v ? next.add(b.id) : next.delete(b.id);
                      return next;
                    });
                  }}
                />
              );
            })
          ) : (
            <div className="text-xs font-semibold text-slate-500">No brands yet.</div>
          )}
        </div>
      </Section>

      <Section title="Price (Max)">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-slate-600">Up to</div>
            <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
              {formatBDT(maxPrice)}
            </div>
          </div>

          <RangeInput min={priceMinPossible} max={priceMaxPossible || 0} step={100} value={maxPrice} onChange={setMaxPrice} />

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{formatBDT(priceMinPossible)}</span>
            <span>{formatBDT(priceMaxPossible)}</span>
          </div>
        </div>
      </Section>

      <Section title="Rating (UI only)">
        <div className="space-y-1">
          {[0, 3.5, 4, 4.5].map((r) => (
            <RadioRow
              key={r}
              label={r === 0 ? "Any rating" : `${r}+ stars`}
              checked={minRating === r}
              onChange={() => setMinRating(r)}
            />
          ))}
        </div>
      </Section>

      <Section title="Availability">
        <CheckboxRow label="Only show in-stock" checked={onlyInStock} onChange={setOnlyInStock} />
      </Section>

      <button
        type="button"
        onClick={clearAll}
        className="w-full cursor-pointer rounded-2xl px-4 py-3 text-sm font-black text-white shadow-sm"
        style={{ backgroundColor: PALETTE.cta }}
      >
        Clear filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.12), rgba(255,126,105,.10), rgba(234,179,8,.06), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xl font-black" style={{ color: PALETTE.navy }}>
                {titleText}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">{subText}</div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: PALETTE.coral }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white pl-10 pr-3 text-sm font-semibold text-slate-900 shadow-sm outline-none ring-0 focus:border-black/20 sm:w-[360px]"
                />
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-11 cursor-pointer rounded-2xl border border-black/10 bg-white px-3 text-sm font-black text-slate-900 shadow-sm outline-none hover:bg-slate-50"
                style={{ color: PALETTE.navy }}
              >
                <option value="latest">Sort: Latest</option>
                <option value="price_asc">Sort: Price (Low)</option>
                <option value="price_desc">Sort: Price (High)</option>
              </select>

              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-black shadow-sm hover:bg-slate-50 lg:hidden"
                style={{ color: PALETTE.navy }}
              >
                <FiFilter style={{ color: PALETTE.coral }} />
                Filters {activeFilterCount ? <Chip tone="soft">{activeFilterCount}</Chip> : null}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeFilterCount ? (
              <>
                <Chip tone="soft">
                  <FiTag style={{ color: PALETTE.coral }} />
                  Filters active
                </Chip>

                {!isCategoryRoute && selectedCategories.size ? <Chip tone="soft">{selectedCategories.size} categories</Chip> : null}
                {selectedBrands.size ? <Chip tone="soft">{selectedBrands.size} brands</Chip> : null}
                {minRating > 0 ? <Chip tone="soft">{minRating}+ rating</Chip> : null}
                {onlyInStock ? <Chip tone="soft">In-stock only</Chip> : null}
                {priceMaxPossible > 0 && maxPrice < priceMaxPossible ? <Chip tone="soft">Max {formatBDT(maxPrice)}</Chip> : null}

                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-1 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black ring-1 ring-black/10 hover:bg-slate-50"
                  style={{ color: PALETTE.navy }}
                >
                  <FiX style={{ color: PALETTE.coral }} />
                  Clear
                </button>
              </>
            ) : (
              <div className="text-xs font-semibold text-slate-500">Tip: Click any product to open full details.</div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="hidden lg:block">{FiltersUI}</aside>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-black text-slate-900">
                Showing <span style={{ color: PALETTE.coral }}>{filtered.length}</span> items
              </div>
            </div>

            {loading && page === 1 ? (
              <div className="mt-3 text-xs font-semibold" style={{ color: PALETTE.muted }}>
                Loading products…
              </div>
            ) : null}

            {err ? (
              <div className="mt-6 rounded-[1.75rem] border border-black/5 bg-white p-8 text-center shadow-sm">
                <div className="text-lg font-black" style={{ color: PALETTE.navy }}>
                  Failed to load
                </div>
                <div className="mt-2 text-sm font-semibold" style={{ color: PALETTE.muted }}>
                  {err}
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[1.75rem] border border-black/5 bg-white p-8 text-center shadow-sm">
                <div className="text-lg font-black" style={{ color: PALETTE.navy }}>
                  No products found
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-600">Try changing filters or search keywords..</div>
              </div>
            ) : (
              <>
                <div className={GRID}>
                  {filtered.map((p) => (
                    <ProductCard key={p?._id || p?.slug} p={p} onAdd={onAdd} onOpen={openProduct} />
                  ))}
                </div>

                {hasMore ? (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setPage((v) => v + 1)}
                      disabled={loading}
                      className="cursor-pointer inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-black text-white shadow-md active:scale-[0.99] disabled:opacity-60"
                      style={{ backgroundColor: PALETTE.navy }}
                    >
                      {loading ? "Loading…" : "See more"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </main>

      <MobileFilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)}>
        {FiltersUI}
      </MobileFilterDrawer>
    </div>
  );
}