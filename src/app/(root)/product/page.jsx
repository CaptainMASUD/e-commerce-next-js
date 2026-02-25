"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiFilter,
  FiX,
  FiStar,
  FiChevronDown,
  FiChevronUp,
  FiShoppingCart,
  FiTag,
} from "react-icons/fi";
import { getAllProducts } from "@/Components/Home/HomePage";

// ✅ Update this import path to where your products live in Next.js
// Example: "@/app/(site)/home/HomePage" or "@/lib/products"

const PALETTE = {
  navy: "#001f3f", // TEXT COLOR
  coral: "#ff7e69", // TEXT COLOR
  cta: "#ff6b6b", // CTA BUTTON
  gold: "#eab308", // TEXT COLOR
  bg: "#fafafa",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n || 0);

function Stars({ value = 0, size = "sm" }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const iconSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <FiStar
            key={i}
            className={iconSize}
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
      {right ? (
        <span className="text-xs font-black text-slate-400">{right}</span>
      ) : null}
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
        {open ? (
          <FiChevronUp style={{ color: PALETTE.navy }} />
        ) : (
          <FiChevronDown style={{ color: PALETTE.navy }} />
        )}
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function MobileFilterDrawer({ open, onClose, children }) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 transition",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
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
        <div className="max-h-[calc(86vh-64px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </>
  );
}

function ProductCard({ p, onOpen, onAddToCart }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(p)}
      onKeyDown={(e) =>
        e.key === "Enter" || e.key === " " ? onOpen?.(p) : null
      }
      className={cn(
        "group h-full cursor-pointer overflow-hidden rounded-[1.25rem] border border-black/5 bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px]"
      )}
      style={{ boxShadow: "0 12px 30px rgba(0,31,63,.06)" }}
    >
      <div className="relative overflow-hidden ring-1 ring-black/5">
        <img
          src={p.image}
          alt={p.title}
          className={cn(
            "h-32 w-full object-cover transition group-hover:scale-[1.02]",
            "sm:h-44"
          )}
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {p.tag ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold text-white shadow-sm ring-1 ring-black/10"
              style={{ backgroundColor: PALETTE.navy }}
            >
              <FiTag className="h-3.5 w-3.5" style={{ color: PALETTE.gold }} />
              {p.tag}
            </span>
          ) : null}
          {p.badges?.trending ? <Chip tone="coral">Trending</Chip> : null}
          {p.badges?.new ? <Chip tone="gold">New</Chip> : null}
        </div>
      </div>

      <div className="flex h-full flex-col p-3">
        <div className="min-h-[40px] text-[13px] font-black leading-snug text-slate-900 line-clamp-2 sm:text-sm">
          {p.title}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div>
            <div
              className="text-sm font-black sm:text-base"
              style={{ color: PALETTE.cta }}
            >
              {formatBDT(p.priceBDT)}
            </div>
            {p.oldPriceBDT ? (
              <div className="text-[11px] font-black text-slate-400 line-through">
                {formatBDT(p.oldPriceBDT)}
              </div>
            ) : null}
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Stars value={p.rating ?? 4.6} />
              <span className="text-[11px] font-black text-slate-800">
                {(p.rating ?? 4.6).toFixed(1)}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] font-semibold text-slate-500">
              {p.reviewCount ?? 120} reviews
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          {p.inStock === false ? (
            <Chip tone="danger">Out</Chip>
          ) : (
            <Chip tone="soft">In stock</Chip>
          )}

          <button
            type="button"
            disabled={p.inStock === false}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(p, 1);
            }}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-black shadow-sm ring-1 ring-black/10 transition",
              p.inStock === false
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:bg-slate-50"
            )}
            style={{ color: PALETTE.navy, background: "white" }}
            aria-label="Add to cart"
            title="Add to cart"
          >
            <FiShoppingCart className="h-4 w-4" style={{ color: PALETTE.cta }} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        <div className="mt-auto" />
      </div>
    </div>
  );
}

/**
 * ✅ Next.js version:
 * - Removed react-router-dom's useNavigate
 * - Uses next/navigation useRouter + router.push(...)
 * - Added "use client" because it uses hooks and event handlers
 */
export default function ProductsPage({ onAddToCart }) {
  const router = useRouter();

  const products = useMemo(() => getAllProducts(), []);

  const allCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );
  const allBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState(() => new Set());
  const [selectedBrands, setSelectedBrands] = useState(() => new Set());
  const [minRating, setMinRating] = useState(0);
  const [onlyInStock, setOnlyInStock] = useState(false);

  const priceMinPossible = useMemo(
    () => Math.min(...products.map((p) => p.priceBDT || 0)),
    [products]
  );
  const priceMaxPossible = useMemo(
    () => Math.max(...products.map((p) => p.priceBDT || 0)),
    [products]
  );
  const [maxPrice, setMaxPrice] = useState(priceMaxPossible);

  useEffect(() => setMaxPrice(priceMaxPossible), [priceMaxPossible]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    let list = products.filter((p) => {
      const inStock = p.inStock !== false;
      if (onlyInStock && !inStock) return false;
      if (selectedCategories.size && !selectedCategories.has(p.category))
        return false;
      if (selectedBrands.size && !selectedBrands.has(p.brand)) return false;
      if ((p.rating ?? 0) < minRating) return false;
      if ((p.priceBDT ?? 0) > maxPrice) return false;

      if (!s) return true;
      const hay = `${p.title} ${p.category} ${p.brand}`.toLowerCase();
      return hay.includes(s);
    });

    list = [...list];
    if (sort === "priceLow")
      list.sort((a, b) => (a.priceBDT ?? 0) - (b.priceBDT ?? 0));
    if (sort === "priceHigh")
      list.sort((a, b) => (b.priceBDT ?? 0) - (a.priceBDT ?? 0));
    if (sort === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "newest")
      list.sort((a, b) => (String(b.id) > String(a.id) ? 1 : -1));
    if (sort === "popular")
      list.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));

    return list;
  }, [
    products,
    search,
    sort,
    selectedCategories,
    selectedBrands,
    minRating,
    onlyInStock,
    maxPrice,
  ]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (selectedCategories.size) n += 1;
    if (selectedBrands.size) n += 1;
    if (minRating > 0) n += 1;
    if (onlyInStock) n += 1;
    if (maxPrice < priceMaxPossible) n += 1;
    return n;
  }, [
    selectedCategories,
    selectedBrands,
    minRating,
    onlyInStock,
    maxPrice,
    priceMaxPossible,
  ]);

  const clearAll = () => {
    setSelectedCategories(new Set());
    setSelectedBrands(new Set());
    setMinRating(0);
    setOnlyInStock(false);
    setMaxPrice(priceMaxPossible);
  };

  const openProduct = (p) => router.push(`/product/${p.id}`);

  const FiltersUI = (
    <div className="space-y-3">
      <Section title="Category">
        <div className="space-y-1">
          {allCategories.map((c) => {
            const checked = selectedCategories.has(c);
            return (
              <CheckboxRow
                key={c}
                label={c}
                checked={checked}
                onChange={(v) => {
                  setSelectedCategories((prev) => {
                    const next = new Set(prev);
                    v ? next.add(c) : next.delete(c);
                    return next;
                  });
                }}
                right={String(products.filter((p) => p.category === c).length)}
              />
            );
          })}
        </div>
      </Section>

      <Section title="Brand">
        <div className="space-y-1">
          {allBrands.map((b) => {
            const checked = selectedBrands.has(b);
            return (
              <CheckboxRow
                key={b}
                label={b}
                checked={checked}
                onChange={(v) => {
                  setSelectedBrands((prev) => {
                    const next = new Set(prev);
                    v ? next.add(b) : next.delete(b);
                    return next;
                  });
                }}
                right={String(products.filter((p) => p.brand === b).length)}
              />
            );
          })}
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
          <RangeInput
            min={priceMinPossible}
            max={priceMaxPossible}
            step={100}
            value={maxPrice}
            onChange={setMaxPrice}
          />
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{formatBDT(priceMinPossible)}</span>
            <span>{formatBDT(priceMaxPossible)}</span>
          </div>
        </div>
      </Section>

      <Section title="Rating">
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
        <CheckboxRow
          label="Only show in-stock"
          checked={onlyInStock}
          onChange={setOnlyInStock}
        />
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
    <div
      className="min-h-screen"
      style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.10), rgba(255,126,105,.10), rgba(234,179,8,.08), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xl font-black" style={{ color: PALETTE.navy }}>
                Products
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                Browse all products with search & filters
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <FiSearch
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: PALETTE.coral }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, brand, category..."
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white pl-10 pr-3 text-sm font-semibold text-slate-900 shadow-sm outline-none ring-0 focus:border-black/20 sm:w-[360px]"
                />
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-11 cursor-pointer rounded-2xl border border-black/10 bg-white px-3 text-sm font-black text-slate-900 shadow-sm outline-none hover:bg-slate-50"
                style={{ color: PALETTE.navy }}
              >
                <option value="popular">Sort: Popular</option>
                <option value="newest">Sort: Newest</option>
                <option value="priceLow">Sort: Price (Low)</option>
                <option value="priceHigh">Sort: Price (High)</option>
                <option value="rating">Sort: Rating</option>
              </select>

              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-sm font-black shadow-sm hover:bg-slate-50 sm:hidden"
                style={{ color: PALETTE.navy }}
              >
                <FiFilter style={{ color: PALETTE.coral }} />
                Filters{" "}
                {activeFilterCount ? <Chip tone="soft">{activeFilterCount}</Chip> : null}
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

                {selectedCategories.size ? (
                  <Chip tone="soft">{selectedCategories.size} categories</Chip>
                ) : null}
                {selectedBrands.size ? (
                  <Chip tone="soft">{selectedBrands.size} brands</Chip>
                ) : null}
                {minRating > 0 ? <Chip tone="soft">{minRating}+ rating</Chip> : null}
                {onlyInStock ? <Chip tone="soft">In-stock only</Chip> : null}
                {maxPrice < priceMaxPossible ? (
                  <Chip tone="soft">Max {formatBDT(maxPrice)}</Chip>
                ) : null}

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
              <div className="text-xs font-semibold text-slate-500">
                Tip: Click any product to open full details.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="hidden lg:block">{FiltersUI}</aside>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-black text-slate-900">
                Showing <span style={{ color: PALETTE.coral }}>{filtered.length}</span>{" "}
                items
              </div>

              <div className="hidden lg:flex items-center gap-2">
                {activeFilterCount ? (
                  <Chip tone="soft">
                    <FiFilter style={{ color: PALETTE.navy }} /> {activeFilterCount} active
                  </Chip>
                ) : (
                  <Chip tone="soft">No filters</Chip>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-[1.75rem] border border-black/5 bg-white p-8 text-center shadow-sm">
                <div className="text-lg font-black" style={{ color: PALETTE.navy }}>
                  No products found
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-600">
                  Try changing filters or search keywords..
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-4 cursor-pointer rounded-2xl px-5 py-3 text-sm font-black text-white shadow-sm"
                  style={{ backgroundColor: PALETTE.cta }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    onOpen={openProduct}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
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
