"use client";

import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

/**
 * BrandsSection.jsx
 * Click brand => /brands/[brandSlug]
 * Now also starts TopRouteLoader before router.push()
 */

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  gold: "#eab308",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

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

/* -------------------- SMALL FETCH CACHE -------------------- */

const __cache = new Map();
const CACHE_TTL_MS = 60_000;

async function fetchJson(url, { signal } = {}) {
  const now = Date.now();
  const cached = __cache.get(url);

  if (cached && now - cached.ts < CACHE_TTL_MS) return cached.data;

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json" },
  });

  if (res.status === 304 && cached) return cached.data;

  const text = await res.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.error || `Request failed: ${res.status}`;
    const details = json?.details ? ` — ${json.details}` : "";
    throw new Error(msg + details);
  }

  __cache.set(url, { ts: now, data: json });
  return json;
}

function safeAlt(brand) {
  return brand?.image?.alt || brand?.name || "Brand logo";
}

function getBrandRoute(brand) {
  const slug = String(brand?.slug || "").trim();
  return slug ? `/brands/${encodeURIComponent(slug)}` : "/brands";
}

/* -------------------- CATEGORY PILL -------------------- */

const CategoryPill = React.memo(function CategoryPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "select-none cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition",
        "ring-1 ring-black/10 bg-white",
        "hover:shadow-md active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      )}
      style={{
        color: active ? "white" : PALETTE.navy,
        background: active ? PALETTE.navy : "white",
        outlineColor: PALETTE.coral,
        boxShadow: active ? "0 10px 25px rgba(0,31,63,.10)" : "0 10px 25px rgba(0,31,63,.06)",
      }}
    >
      {children}
    </button>
  );
});

/* -------------------- BRAND CARD -------------------- */

const BrandCard = React.memo(function BrandCard({ brand, onSelect }) {
  const img = brand?.image?.url;

  return (
    <motion.button
      type="button"
      variants={CARD}
      onClick={() => onSelect?.(brand)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(brand);
        }
      }}
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden bg-white ring-1 ring-black/5",
        "rounded-3xl",
        "px-2.5 pt-3 pb-3",
        "sm:px-3 sm:pt-3.5 sm:pb-3.5",
        "lg:px-4 lg:pt-4 lg:pb-4",
        "transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]",
        "motion-reduce:transition-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "flex flex-col items-center justify-between"
      )}
      style={{
        boxShadow: "0 12px 30px rgba(0,31,63,.06)",
        outlineColor: PALETTE.coral,
        minHeight: 150,
      }}
      aria-label={`View products for ${brand?.name || "brand"}`}
      title={brand?.name || "View brand products"}
    >
      <div className="mt-0.5 flex items-center justify-center">
        <div
          className={cn(
            "relative flex items-center justify-center ring-1 ring-black/5",
            "h-[72px] w-[72px] rounded-[1.25rem]",
            "sm:h-[86px] sm:w-[86px] sm:rounded-[1.45rem]",
            "lg:h-[110px] lg:w-[110px] lg:rounded-[2rem]"
          )}
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.16), rgba(0,31,63,0.05) 60%), #fff",
          }}
        >
          {img ? (
            <Image
              src={img}
              alt={safeAlt(brand)}
              width={88}
              height={88}
              className={cn(
                "pointer-events-none object-contain",
                "h-[54px] w-[54px]",
                "sm:h-[64px] sm:w-[64px]",
                "lg:h-[84px] lg:w-[84px]"
              )}
              priority={false}
              unoptimized
            />
          ) : (
            <div
              className="pointer-events-none grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-black/5"
              style={{ background: "rgba(0,31,63,0.04)" }}
              aria-hidden="true"
            >
              <span className="text-[10px] font-bold" style={{ color: PALETTE.navy }}>
                LOGO
              </span>
            </div>
          )}

          <span
            className={cn(
              "pointer-events-none absolute -right-1 -top-1 rounded-full ring-2 ring-white",
              "h-2.5 w-2.5 sm:h-3 sm:w-3"
            )}
            style={{ backgroundColor: PALETTE.gold }}
          />
        </div>
      </div>

      <div
        className={cn(
          "mt-2.5 w-full text-center font-semibold leading-tight",
          "text-[11px]",
          "sm:text-[12px]",
          "lg:text-[14px]",
          "truncate px-1"
        )}
        style={{ color: PALETTE.navy }}
        title={brand?.name}
      >
        {brand?.name}
      </div>

      <div className="mt-2.5 flex w-full justify-center">
        <div className="h-1.5 w-10 overflow-hidden rounded-full bg-black/5 sm:w-12 lg:w-20">
          <div
            className="h-full w-0 rounded-full transition-all duration-300 group-hover:w-full motion-reduce:transition-none"
            style={{
              background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.gold})`,
            }}
          />
        </div>
      </div>
    </motion.button>
  );
});

export default function BrandsSection({ onBrandSelect }) {
  const router = useRouter();
  const revealProps = useScrollRevealMotionProps();

  /* -------------------- CATEGORIES -------------------- */

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState("");

  /* -------------------- BRANDS -------------------- */

  const [brands, setBrands] = useState([]);
  const [pageInfo, setPageInfo] = useState({ limit: 64, hasNextPage: false, nextCursor: null });
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState("");

  /* -------------------- UI -------------------- */

  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const deferredSearch = useDeferredValue(search);
  const deferredCategoryId = useDeferredValue(activeCategoryId);

  const catAbortRef = useRef(null);
  const brandAbortRef = useRef(null);

  /* -------------------- LOAD CATEGORIES -------------------- */

  useEffect(() => {
    let mounted = true;
    setCatLoading(true);
    setCatError("");

    catAbortRef.current?.abort?.();
    const ac = new AbortController();
    catAbortRef.current = ac;

    (async () => {
      try {
        const json = await fetchJson("/api/categories?includeSub=false", { signal: ac.signal });
        if (!mounted) return;

        const items = Array.isArray(json?.items) ? json.items : [];
        setCategories(items);
      } catch (e) {
        if (!mounted) return;
        if (String(e?.name) === "AbortError") return;
        setCatError(e?.message || "Failed to load categories");
      } finally {
        if (!mounted) return;
        setCatLoading(false);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  const categoryPills = useMemo(() => {
    const pills = [{ _id: "all", name: "All" }, ...categories];
    const seen = new Set();

    return pills.filter((c) => {
      const id = String(c?._id || "");
      if (!id) return false;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [categories]);

  const categoryNameById = useMemo(() => {
    const m = new Map();
    for (const c of categories) {
      if (c?._id) m.set(String(c._id), c.name || "");
    }
    return m;
  }, [categories]);

  const activeCategoryName = useMemo(() => {
    if (activeCategoryId === "all") return "All Brands";
    return categoryNameById.get(String(activeCategoryId)) || "Brands";
  }, [activeCategoryId, categoryNameById]);

  useEffect(() => {
    setShowAll(false);
  }, [deferredSearch, deferredCategoryId]);

  /* -------------------- LOAD BRANDS -------------------- */

  useEffect(() => {
    let mounted = true;

    setBrandsLoading(true);
    setBrandsError("");

    brandAbortRef.current?.abort?.();
    const ac = new AbortController();
    brandAbortRef.current = ac;

    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("limit", "64");
        params.set("fields", "name,slug,image,sortOrder,categoryIds");

        if (deferredCategoryId && deferredCategoryId !== "all") {
          params.set("categoryId", deferredCategoryId);
        }

        const q = deferredSearch.trim();
        if (q) params.set("q", q);

        const json = await fetchJson(`/api/brands?${params.toString()}`, { signal: ac.signal });
        if (!mounted) return;

        const items = Array.isArray(json?.items) ? json.items : [];
        const info = json?.pageInfo || {};

        setPageInfo({
          limit: info?.limit ?? 64,
          hasNextPage: Boolean(info?.hasNextPage),
          nextCursor: info?.nextCursor ?? null,
        });

        setBrands(items);
      } catch (e) {
        if (!mounted) return;
        if (String(e?.name) === "AbortError") return;
        setBrandsError(e?.message || "Failed to load brands");
        setBrands([]);
      } finally {
        if (!mounted) return;
        setBrandsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [deferredCategoryId, deferredSearch]);

  /* -------------------- FILTERED BRANDS -------------------- */

  const filteredBrands = useMemo(() => {
    const cat = deferredCategoryId;
    if (cat === "all") return brands;

    return brands.filter((b) =>
      Array.isArray(b?.categoryIds) ? b.categoryIds.map(String).includes(String(cat)) : false
    );
  }, [brands, deferredCategoryId]);

  const visibleBrands = useMemo(() => {
    if (showAll) return filteredBrands;
    return filteredBrands.slice(0, 10);
  }, [filteredBrands, showAll]);

  const canToggle = filteredBrands.length > 10;

  const onSelectCategory = useCallback((id) => setActiveCategoryId(id), []);

  const handleBrandSelect = useCallback(
    (brand) => {
      if (typeof onBrandSelect === "function") {
        onBrandSelect(brand);
        return;
      }

      if (typeof window !== "undefined" && typeof window.__toploaderStart === "function") {
        window.__toploaderStart("link");
      }

      router.push(getBrandRoute(brand));
    },
    [onBrandSelect, router]
  );

  /* -------------------- LOAD MORE -------------------- */

  const onLoadMoreFromServer = useCallback(async () => {
    if (!pageInfo?.hasNextPage || !pageInfo?.nextCursor) return;

    try {
      setBrandsLoading(true);
      setBrandsError("");

      const params = new URLSearchParams();
      params.set("limit", "64");
      params.set("fields", "name,slug,image,sortOrder,categoryIds");

      if (deferredCategoryId && deferredCategoryId !== "all") {
        params.set("categoryId", deferredCategoryId);
      }

      const q = deferredSearch.trim();
      if (q) params.set("q", q);

      params.set("afterSortOrder", String(pageInfo.nextCursor.afterSortOrder ?? 0));
      params.set("afterId", String(pageInfo.nextCursor.afterId ?? ""));

      const json = await fetchJson(`/api/brands?${params.toString()}`);
      const items = Array.isArray(json?.items) ? json.items : [];
      const info = json?.pageInfo || {};

      setBrands((prev) => {
        const seen = new Set(prev.map((x) => String(x?._id)));
        const add = items.filter((x) => {
          const id = String(x?._id);
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        return [...prev, ...add];
      });

      setPageInfo({
        limit: info?.limit ?? 64,
        hasNextPage: Boolean(info?.hasNextPage),
        nextCursor: info?.nextCursor ?? null,
      });
    } catch (e) {
      setBrandsError(e?.message || "Failed to load more brands");
    } finally {
      setBrandsLoading(false);
    }
  }, [pageInfo, deferredCategoryId, deferredSearch]);

  return (
    <motion.section className="relative mx-auto w-full max-w-6xl px-4 py-10" {...revealProps}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-2xl font-black tracking-tight sm:text-[30px]" style={{ color: PALETTE.navy }}>
            Brands
          </div>
          <p className="mt-2 text-sm md:text-base text-slate-600">{activeCategoryName}</p>

          {(catError || brandsError) && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-black/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-slate-700">{catError || brandsError}</span>
            </div>
          )}
        </div>

        <div className="w-full md:w-[420px]">
          <div
            className={cn("relative rounded-2xl p-[1px] transition")}
            style={{
              background: `linear-gradient(90deg, rgba(255,126,105,0.65), rgba(0,31,63,0.35), rgba(234,179,8,0.55))`,
              boxShadow: "0 12px 28px rgba(0,31,63,.10)",
            }}
          >
            <div className="relative rounded-2xl bg-white">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brands..."
                className={cn(
                  "w-full rounded-2xl bg-transparent pl-11 pr-14 py-3.5 text-sm outline-none",
                  "text-slate-800 placeholder:text-slate-400"
                )}
                style={{ outlineColor: PALETTE.coral }}
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <span
                  className="rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-black/5"
                  style={{ background: "rgba(0,31,63,0.06)", color: PALETTE.navy }}
                >
                  {filteredBrands.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {catLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-white ring-1 ring-black/5" />
            ))}
          </div>
        ) : (
          categoryPills.map((c) => (
            <motion.div
              key={String(c._id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="cursor-pointer"
            >
              <CategoryPill
                active={String(activeCategoryId) === String(c._id)}
                onClick={() => onSelectCategory(String(c._id))}
              >
                {c.name}
              </CategoryPill>
            </motion.div>
          ))
        )}
      </div>

      <motion.div
        variants={GRID}
        initial="hidden"
        animate="show"
        className={cn(
          "mt-6 grid",
          "grid-cols-3 gap-2.5",
          "sm:grid-cols-4 sm:gap-3",
          "md:grid-cols-5 md:gap-3",
          "lg:grid-cols-6 lg:gap-4"
        )}
      >
        <AnimatePresence initial={false} mode="sync">
          {(brandsLoading && brands.length === 0 ? Array.from({ length: 12 }) : visibleBrands).map(
            (b, idx) => {
              if (!b) {
                return (
                  <motion.div
                    key={`skeleton-${idx}`}
                    variants={CARD}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="rounded-3xl bg-white px-2.5 pt-3 pb-3 ring-1 ring-black/5"
                    style={{ boxShadow: "0 12px 30px rgba(0,31,63,.06)", minHeight: 150 }}
                  >
                    <div className="mx-auto mt-1 h-[72px] w-[72px] animate-pulse rounded-[1.25rem] bg-black/5 sm:h-[86px] sm:w-[86px] sm:rounded-[1.45rem]" />
                    <div className="mx-auto mt-3 h-3.5 w-2/3 animate-pulse rounded bg-black/5" />
                    <div className="mx-auto mt-3 h-1.5 w-10 animate-pulse rounded-full bg-black/5 sm:w-12" />
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={String(b._id)}
                  variants={CARD}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="w-full"
                >
                  <BrandCard brand={b} onSelect={handleBrandSelect} />
                </motion.div>
              );
            }
          )}
        </AnimatePresence>
      </motion.div>

      <div className="mt-5 flex flex-col items-center gap-3">
        {canToggle && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
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
            aria-expanded={showAll}
          >
            {showAll ? (
              <span className="inline-flex items-center gap-2">
                See less <ChevronUp className="h-4 w-4" />
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                See more <ChevronDown className="h-4 w-4" />
              </span>
            )}
          </button>
        )}

        {showAll && pageInfo?.hasNextPage && (
          <button
            type="button"
            onClick={onLoadMoreFromServer}
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
            disabled={brandsLoading}
          >
            {brandsLoading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>

      {!brandsLoading && filteredBrands.length === 0 && (
        <div className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-black/10">
          <p className="text-sm text-slate-600">No brands found. Try a different search or category.</p>
        </div>
      )}
    </motion.section>
  );
}