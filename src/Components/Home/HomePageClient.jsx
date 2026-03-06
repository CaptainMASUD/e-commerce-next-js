"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useNav from "@/Components/Utils/useNav";

import HomeSlider from "./HomeSlider";
import FeatureStrips from "./FeatureStrips";
import HomeCategoryClient from "./HomeCategory";

import { FiChevronLeft, FiChevronRight, FiTag, FiShoppingCart, FiX } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";

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
const GRID = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3";
const CARD_WIDTH_STYLE = { width: "clamp(170px, 19vw, 240px)" };

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

function getStoredAuth() {
  if (typeof window === "undefined") return { token: "", user: null };

  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token") || "";

    const userRaw =
      localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");

    let user = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw);
      } catch {
        user = null;
      }
    }

    return { token, user };
  } catch {
    return { token: "", user: null };
  }
}

function parseApiError(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  return fallback;
}

function resolveProductImage(p) {
  return p?.image || p?.thumbnail || p?.featuredImage || "/placeholder.png";
}

function resolveProductTitle(p) {
  return p?.name || p?.title || "Untitled product";
}

function resolveProductSellingPrice(p) {
  const finalPrice = Number(p?.finalPrice ?? 0);
  const normalPrice = Number(p?.normalPrice ?? 0);
  return finalPrice || normalPrice || 0;
}

function extractVariantBarcode(p) {
  if (typeof p?.selectedVariantBarcode === "string" && p.selectedVariantBarcode.trim()) {
    return p.selectedVariantBarcode.trim();
  }
  if (typeof p?.variantBarcode === "string" && p.variantBarcode.trim()) {
    return p.variantBarcode.trim();
  }
  return "";
}

/* -------------------- LOGIN REQUIRED MODAL -------------------- */

function LoginRequiredModal({ open, onClose, onLogin }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md overflow-hidden rounded-[30px] bg-white"
          style={{
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 30px 80px rgba(0,31,63,.18)",
          }}
        >
          <div
            className="relative px-6 py-6 sm:px-7 sm:py-7"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,31,63,.04), rgba(255,126,105,.06), rgba(234,179,8,.04), white)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-black/10 transition hover:bg-slate-50 cursor-pointer"
              aria-label="Close modal"
            >
              <FiX className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </button>

            <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-white ring-1 ring-black/10">
              <FiShoppingCart className="h-6 w-6" style={{ color: PALETTE.navy }} />
            </div>

            <h3
              className="mt-4 text-[24px] font-black tracking-tight"
              style={{ color: PALETTE.navy }}
            >
              Login first
            </h3>

            <p
              className="mt-2 text-sm font-semibold leading-relaxed"
              style={{ color: PALETTE.muted }}
            >
              You need to sign in before adding items to your cart. Your cart is linked to your account.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-md active:scale-[0.99] cursor-pointer"
                style={{ backgroundColor: PALETTE.navy }}
              >
                Go to Login
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.99] cursor-pointer"
                style={{ color: PALETTE.navy }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Section Header -------------------- */

function SectionHeader({ title, accent = "coral", rightSlot, subtitle }) {
  const accentColor = accent === "gold" ? PALETTE.gold : PALETTE.coral;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h2 className="text-[22px] font-black tracking-tight sm:text-[30px]" style={{ color: PALETTE.navy }}>
            {title}
          </h2>
          <span className="hidden h-2 w-2 rounded-full sm:inline-block" style={{ background: accentColor }} />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="h-[3px] w-10 rounded-full" style={{ background: accentColor }} />
          <span className="h-[3px] w-6 rounded-full" style={{ background: "rgba(0,31,63,0.10)" }} />
          {subtitle ? (
            <span className="ml-2 truncate text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>

      {rightSlot ? <div className="flex">{rightSlot}</div> : null}
    </div>
  );
}

/* -------------------- PRODUCT CARD -------------------- */

const ProductCard = React.memo(function ProductCard({
  p,
  onAdd,
  onOpen,
  noShadow = false,
  adding = false,
}) {
  const clickable = !!String(p?.slug || "").trim();
  const categoryLabel = typeof p?.category === "object" ? p?.category?.name : p?.category;

  const productType = String(p?.productType || "simple");
  const isVariable = productType === "variable";

  const normal = Number(p?.normalPrice ?? 0);
  const final = Number(p?.finalPrice ?? 0);

  const hasDiscount = final > 0 && normal > 0 && final < normal;
  const displayPrice = final || normal || 0;
  const oldPrice = hasDiscount ? normal : 0;
  const offPct = hasDiscount ? pctOff(final, normal) : 0;

  const badge = hasDiscount ? (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black text-white ring-1 ring-black/10"
      style={{ backgroundColor: PALETTE.cta }}
      aria-label={`${offPct}% off`}
    >
      <FiTag className="h-3.5 w-3.5" />
      {offPct}% OFF
    </span>
  ) : (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ring-black/10"
      style={{ background: "rgba(255,255,255,0.92)", color: PALETTE.navy }}
    >
      {isVariable ? "From" : "Best value"}
    </span>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (clickable ? onOpen?.(p) : null)}
      onKeyDown={(e) => (clickable && (e.key === "Enter" || e.key === " ")) ? onOpen?.(p) : null}
      className={cn(
        "group overflow-hidden rounded-3xl border bg-white transition motion-reduce:transition-none",
        "h-full flex flex-col",
        clickable ? "cursor-pointer" : "cursor-not-allowed opacity-70",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-black/10",
        noShadow ? "shadow-none hover:shadow-none hover:translate-y-0" : clickable ? "hover:-translate-y-0.5 hover:shadow-md" : ""
      )}
      style={{
        borderColor: PALETTE.border,
        boxShadow: noShadow ? "none" : "0 10px 28px rgba(0,31,63,.07), 0 1px 0 rgba(0,0,0,.02)",
      }}
      title={clickable ? "Open product" : "Missing slug (check backend)"}
    >
      <div
        className="relative overflow-hidden"
        style={{
          background: hasDiscount
            ? "linear-gradient(to bottom, rgba(0,31,63,.04), rgba(255,107,107,.08), transparent)"
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

        <div className="absolute right-2 top-2">{badge}</div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 truncate text-[10px] font-extrabold" style={{ color: PALETTE.coral }}>
            {categoryLabel || "—"}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {p?.isTrending ? (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1 ring-black/5"
                style={{ background: "rgba(234,179,8,0.16)", color: "#9a6a00" }}
              >
                Trending
              </span>
            ) : null}

            {p?.isNew ? (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1 ring-black/5"
                style={{ background: "rgba(255,126,105,0.14)", color: PALETTE.coral }}
              >
                New
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-slate-900">
          {p?.name || "Untitled"}
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-end gap-2">
                <div className="text-[15px] sm:text-[16px] font-black" style={{ color: PALETTE.price }}>
                  {isVariable ? "From " : ""}
                  {formatBDT(displayPrice)}
                </div>

                {hasDiscount ? (
                  <div className="text-[12px] font-bold text-slate-500 line-through">
                    {formatBDT(oldPrice)}
                  </div>
                ) : null}
              </div>

              {hasDiscount ? (
                <div className="mt-1 text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  You save {formatBDT(oldPrice - displayPrice)}
                </div>
              ) : (
                <div className="mt-1 text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  Limited-time offers update daily
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.(p);
              }}
              disabled={adding}
              className={cn(
                "shrink-0 whitespace-nowrap inline-flex items-center",
                "gap-1 rounded-2xl font-black text-white shadow-sm active:scale-[0.99]",
                "px-2.5 py-1.5 text-[10px]",
                "sm:gap-1.5 sm:px-3 sm:py-2 sm:text-[11px]",
                adding ? "cursor-not-allowed opacity-70" : "cursor-pointer"
              )}
              style={{ backgroundColor: PALETTE.cta }}
            >
              <FiShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

/* -------------------- TRENDING SLIDER -------------------- */

function ProductSlider({ title, accent, items, onAdd, onOpen, addingId }) {
  const wrapRef = useRef(null);

  const scrollByCard = useCallback((dir) => {
    const el = wrapRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card='1']");
    const amount = card ? Math.round(card.getBoundingClientRect().width * 1.15) : 260;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  const rightSlot = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => scrollByCard(-1)}
        className="cursor-pointer rounded-full bg-white p-2.5 ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.98]"
        aria-label={`Scroll ${title} left`}
        type="button"
      >
        <FiChevronLeft className="h-4 w-4" style={{ color: PALETTE.navy }} />
      </button>

      <button
        onClick={() => scrollByCard(1)}
        className="cursor-pointer rounded-full bg-white p-2.5 ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.98]"
        aria-label={`Scroll ${title} right`}
        type="button"
      >
        <FiChevronRight className="h-4 w-4" style={{ color: PALETTE.navy }} />
      </button>
    </div>
  );

  return (
    <section className="mt-10">
      <SectionHeader title={title} accent={accent} rightSlot={rightSlot} subtitle="Hot picks based on demand" />

      <div className="mt-4">
        <div
          ref={wrapRef}
          className={cn(
            "hide-scrollbar flex gap-2 sm:gap-3 overflow-x-auto",
            "snap-x snap-mandatory",
            "[-webkit-overflow-scrolling:touch]",
            "[scrollbar-width:none]",
            "[-ms-overflow-style:none]"
          )}
        >
          <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>

          {(items || []).map((p, idx) => (
            <div
              key={p?._id || p?.slug || idx}
              className="snap-start shrink-0"
              style={CARD_WIDTH_STYLE}
              data-card={idx === 0 ? "1" : undefined}
            >
              <ProductCard
                p={p}
                onAdd={onAdd}
                onOpen={onOpen}
                adding={addingId === String(p?._id || p?.slug || "")}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- HOME PAGE CLIENT -------------------- */

export default function HomePageClient({
  query = "",
  setQuery,
  initialHomeCategories = [],
  initialHomeCatError = null,
}) {
  const nav = useNav();
  const productsSectionRef = useRef(null);

  const [loadingTrending, setLoadingTrending] = useState(false);
  const [loadingNew, setLoadingNew] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [addingId, setAddingId] = useState("");

  const LIMIT = 24;
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const openProduct = useCallback(
    (p) => {
      const slug = String(p?.slug || "").trim();
      if (!slug) {
        console.warn("Product missing slug. Fix backend list response:", p);
        return;
      }
      nav.push(`/product/${encodeURIComponent(slug)}`);
    },
    [nav]
  );

  const goLogin = useCallback(() => {
    setShowLoginModal(false);
    nav.push("/login");
  }, [nav]);

  const onAdd = useCallback(
    async (p) => {
      const { token, user } = getStoredAuth();

      if (!token || !user) {
        setShowLoginModal(true);
        return;
      }

      const productId = p?._id || p?.id;
      if (!productId) {
        toast.error("Product is missing an id.");
        return;
      }

      const requestId = String(productId);
      setAddingId(requestId);

      try {
        const payload = {
          action: "add",
          productId,
          variantBarcode: extractVariantBarcode(p),
          qty: 1,
          snapshot: {
            title: resolveProductTitle(p),
            image: resolveProductImage(p),
            unitPrice: resolveProductSellingPrice(p),
          },
        };

        const res = await fetch("/api/customer/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = parseApiError(data, "Failed to add item to cart.");

          if (res.status === 401 || res.status === 403) {
            setShowLoginModal(true);
            toast.error("Please login first.");
            return;
          }

          toast.error(msg);
          return;
        }

        toast.success("Added to cart.");
      } catch {
        toast.error("Failed to add item to cart.");
      } finally {
        setAddingId("");
      }
    },
    []
  );

  const scrollToProducts = useCallback(() => {
    productsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingTrending(true);
        const qs = buildQS({ only: "trending", limit: 12, page: 1, prioritize: 1 });
        const data = await fetchJSON(`/api/products${qs}`);
        if (!alive) return;
        setTrending(Array.isArray(data?.products) ? data.products : []);
      } catch {
        if (!alive) return;
        setTrending([]);
      } finally {
        if (alive) setLoadingTrending(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingNew(true);
        const qs = buildQS({ only: "new", limit: 10, page: 1, prioritize: 1 });
        const data = await fetchJSON(`/api/products${qs}`);
        if (!alive) return;
        setNewArrivals(Array.isArray(data?.products) ? data.products : []);
      } catch {
        if (!alive) return;
        setNewArrivals([]);
      } finally {
        if (alive) setLoadingNew(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
  }, [query]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hasMore) return;
      try {
        setLoadingProducts(true);
        const qs = buildQS({
          q: (query || "").trim(),
          limit: LIMIT,
          page,
          prioritize: 1,
        });
        const data = await fetchJSON(`/api/products${qs}`);
        if (!alive) return;

        const incoming = Array.isArray(data?.products) ? data.products : [];
        setProducts((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
        setHasMore(incoming.length === LIMIT);
      } catch {
        if (!alive) return;
        if (page === 1) setProducts([]);
        setHasMore(false);
      } finally {
        if (alive) setLoadingProducts(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, query, hasMore]);

  const newArrivalsRightSlot = (
    <button
      onClick={scrollToProducts}
      className="cursor-pointer rounded-full bg-white px-3 py-2 text-xs font-black ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.98]"
      style={{ color: PALETTE.navy }}
      type="button"
    >
      See all
    </button>
  );

  const productsSubtitle = useMemo(() => {
    const qq = (query || "").trim();
    if (!qq) return "Browse the full collection";
    return `Showing results for “${qq}”`;
  }, [query]);

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2200,
          style: {
            background: "#fff",
            color: PALETTE.navy,
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 18px 45px rgba(0,31,63,.10)",
            borderRadius: "18px",
            fontWeight: 700,
          },
          success: {
            iconTheme: {
              primary: PALETTE.navy,
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: PALETTE.cta,
              secondary: "#fff",
            },
          },
        }}
      />

      <LoginRequiredModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={goLogin}
      />

      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.12), rgba(255,126,105,.10), rgba(234,179,8,.06), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <HomeSlider />

        <div className="hidden sm:block">
          <FeatureStrips />
        </div>

        <HomeCategoryClient
          title="Popular Categories"
          subtitle="Browse popular picks"
          accent="coral"
          initialItems={initialHomeCategories}
          initialError={initialHomeCatError}
        />

        <ProductSlider
          title="Trending Now"
          accent="coral"
          items={trending}
          onAdd={onAdd}
          onOpen={openProduct}
          addingId={addingId}
        />

        {loadingTrending ? (
          <div className="mt-3 text-xs font-semibold" style={{ color: PALETTE.muted }}>
            Loading trending…
          </div>
        ) : null}

        <section className="mt-10">
          <SectionHeader
            title="New Arrivals"
            accent="gold"
            rightSlot={newArrivalsRightSlot}
            subtitle="Fresh drops you’ll love"
          />

          {loadingNew ? (
            <div className="mt-3 text-xs font-semibold" style={{ color: PALETTE.muted }}>
              Loading new arrivals…
            </div>
          ) : null}

          <div className={cn("mt-4", GRID)}>
            {(newArrivals || []).map((p) => (
              <ProductCard
                key={p?._id || p?.slug}
                p={p}
                onAdd={onAdd}
                onOpen={openProduct}
                noShadow
                adding={addingId === String(p?._id || p?.slug || "")}
              />
            ))}
          </div>
        </section>

        <section className="mt-10" ref={productsSectionRef}>
          <SectionHeader title="Products" accent="coral" subtitle={productsSubtitle} />

          {loadingProducts && page === 1 ? (
            <div className="mt-3 text-xs font-semibold" style={{ color: PALETTE.muted }}>
              Loading products…
            </div>
          ) : null}

          <div className={cn("mt-4", GRID)}>
            {(products || []).map((p) => (
              <ProductCard
                key={p?._id || p?.slug}
                p={p}
                onAdd={onAdd}
                onOpen={openProduct}
                adding={addingId === String(p?._id || p?.slug || "")}
              />
            ))}
          </div>

          {!loadingProducts && products?.length === 0 ? (
            <div className="mt-6 text-sm font-bold" style={{ color: PALETTE.navy }}>
              No products found.
            </div>
          ) : null}

          {hasMore ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingProducts}
                className="cursor-pointer inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-black text-white shadow-md active:scale-[0.99] disabled:opacity-60"
                style={{ backgroundColor: PALETTE.navy }}
              >
                {loadingProducts ? "Loading…" : "See more"}
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}