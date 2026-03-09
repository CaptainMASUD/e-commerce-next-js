"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import { FiTag, FiShoppingCart } from "react-icons/fi";
import useNav from "@/Components/Utils/useNav";

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

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

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

function getListingPrice(p) {
  const basePrice = isNum(p?.price) ? p.price : 0;

  if (p?.productType === "variable") {
    const vars = Array.isArray(p?.variants) ? p.variants : [];
    const active = vars.filter((v) => v?.isActive !== false);

    const finals = active
      .map((v) => {
        const vPrice = isNum(v?.price) ? v.price : basePrice;
        const vSale = isNum(v?.salePrice) ? v.salePrice : null;
        return isNum(vSale) && vSale >= 0 ? vSale : vPrice;
      })
      .filter((n) => isNum(n) && n >= 0);

    if (finals.length) return Math.min(...finals);

    const pSale = isNum(p?.salePrice) ? p.salePrice : null;
    return isNum(pSale) && pSale >= 0 ? pSale : basePrice;
  }

  const pSale = isNum(p?.salePrice) ? p.salePrice : null;
  return isNum(pSale) && pSale >= 0 ? pSale : basePrice;
}

function getDiscountMeta(p) {
  const basePrice = isNum(p?.price) ? p.price : 0;

  if (p?.productType === "variable") {
    const vars = Array.isArray(p?.variants) ? p.variants : [];
    const active = vars.filter((v) => v?.isActive !== false);

    const baseCandidates = active
      .map((v) => (isNum(v?.price) ? v.price : basePrice))
      .filter((n) => isNum(n) && n >= 0);

    const finalCandidates = active
      .map((v) => {
        const vPrice = isNum(v?.price) ? v.price : basePrice;
        const vSale = isNum(v?.salePrice) ? v.salePrice : null;
        return isNum(vSale) && vSale >= 0 ? vSale : vPrice;
      })
      .filter((n) => isNum(n) && n >= 0);

    const oldP = baseCandidates.length ? Math.min(...baseCandidates) : basePrice;
    const newP = finalCandidates.length ? Math.min(...finalCandidates) : getListingPrice(p);
    const hasDiscount = oldP > 0 && newP > 0 && newP < oldP;

    return { oldPrice: oldP, newPrice: newP, hasDiscount };
  }

  const oldP = basePrice;
  const newP = getListingPrice(p);
  const hasDiscount = oldP > 0 && newP > 0 && newP < oldP;
  return { oldPrice: oldP, newPrice: newP, hasDiscount };
}

function resolveProductImage(p) {
  const primary = String(p?.primaryImage?.url || "").trim();
  if (primary) return primary;

  const explicit = String(p?.image || "").trim();
  if (explicit) return explicit;

  return FALLBACK_IMAGE;
}

function resolveProductTitle(p) {
  return p?.title || p?.name || "Untitled product";
}

function resolveProductSellingPrice(p) {
  return getListingPrice(p);
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

/* -------------------- image resolver -------------------- */

const FALLBACK_IMAGE =
  "https://img.freepik.com/psd-gratuitas/novo-modelo-de-design-de-capa-de-midia-social-para-smartphone-16-pro_47987-25428.jpg?semt=ais_hybrid&w=740&q=80";

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
            <div
              className="inline-flex h-14 w-14 items-center justify-center rounded-3xl"
              style={{ background: "rgba(255,107,107,0.10)" }}
            >
              <FiShoppingCart className="h-6 w-6" style={{ color: PALETTE.cta }} />
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

/* -------------------- SECTION HEADER -------------------- */

function SectionHeader({ title, subtitle, count, loading, onRetry, error }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h2
            className="text-[22px] font-black tracking-tight sm:text-[30px]"
            style={{ color: PALETTE.navy }}
          >
            {title}
          </h2>
          <span
            className="hidden h-2 w-2 rounded-full sm:inline-block"
            style={{ background: PALETTE.gold }}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="h-[3px] w-10 rounded-full" style={{ background: PALETTE.gold }} />
          <span
            className="h-[3px] w-6 rounded-full"
            style={{ background: "rgba(0,31,63,0.10)" }}
          />
          {subtitle ? (
            <span
              className="ml-2 truncate text-[12px] font-semibold"
              style={{ color: PALETTE.muted }}
            >
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {loading ? (
          <span className="text-[12px] font-bold" style={{ color: PALETTE.muted }}>
            Loading…
          </span>
        ) : error ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-2xl border bg-white px-3 py-2 text-[12px] font-black shadow-sm"
            style={{ borderColor: PALETTE.border, color: PALETTE.navy }}
          >
            Retry
          </button>
        ) : (
          <span className="text-[12px] font-bold" style={{ color: PALETTE.muted }}>
            {count ? `${count} items` : "No items"}
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------- SKELETON CARD -------------------- */

function ProductCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-3xl border bg-white"
      style={{
        borderColor: PALETTE.border,
        boxShadow: "0 10px 28px rgba(0,31,63,.07), 0 1px 0 rgba(0,0,0,.02)",
      }}
    >
      <div className="relative h-36 sm:h-40 md:h-44 w-full bg-slate-100 animate-pulse" />
      <div className="p-3">
        <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
        <div className="mt-2 h-4 w-[90%] bg-slate-100 rounded animate-pulse" />
        <div className="mt-2 h-4 w-[65%] bg-slate-100 rounded animate-pulse" />
        <div className="mt-4 flex items-end justify-between">
          <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-8 w-16 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* -------------------- PRODUCT CARD -------------------- */

const ProductCard = React.memo(function ProductCard({ p, onAdd, onOpen, adding = false }) {
  const clickable = !!String(p?.slug || "").trim();
  const categoryLabel = typeof p?.category === "object" ? p?.category?.name : p?.category;
  const brandLabel = typeof p?.brand === "object" ? p?.brand?.name : "";

  const { oldPrice, newPrice, hasDiscount } = useMemo(() => getDiscountMeta(p), [p]);
  const displayPrice = useMemo(() => getListingPrice(p), [p]);
  const offPct = hasDiscount ? pctOff(newPrice, oldPrice) : 0;
  const imgSrc = useMemo(() => resolveProductImage(p), [p]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (clickable ? onOpen?.(p) : null)}
      onKeyDown={(e) => (clickable && (e.key === "Enter" || e.key === " ") ? onOpen?.(p) : null)}
      className={cn(
        "group overflow-hidden rounded-3xl border bg-white transition motion-reduce:transition-none",
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
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.04), rgba(255,255,255,0.9), transparent)",
        }}
      >
        <div className="relative h-36 sm:h-40 md:h-44 w-full p-2 sm:p-3">
          <div className="absolute inset-0 bg-white/70" />
          <img
            src={imgSrc}
            alt={p?.title || p?.name || "Product"}
            loading="lazy"
            decoding="async"
            className={cn(
              "relative z-[1] h-full w-full object-contain",
              "transition-transform duration-500 ease-out will-change-transform motion-reduce:transition-none",
              clickable ? "group-hover:scale-[1.03]" : ""
            )}
          />
        </div>

        {hasDiscount ? (
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

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/6 via-transparent to-transparent" />
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold truncate" style={{ color: PALETTE.coral }}>
              {categoryLabel || "—"}
            </div>
            {brandLabel ? (
              <div className="mt-0.5 text-[10px] font-bold truncate" style={{ color: PALETTE.muted }}>
                {brandLabel}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug tracking-tight text-slate-900">
          {p?.title || p?.name || "Untitled"}
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <div className="text-[13px] font-black" style={{ color: PALETTE.price }}>
              {formatBDT(displayPrice)}
            </div>

            {hasDiscount ? (
              <div className="text-[11px] font-semibold text-slate-500 line-through">
                {formatBDT(oldPrice)}
              </div>
            ) : (
              <span
                className="mt-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1 ring-black/5"
                style={{ color: PALETTE.muted, background: "rgba(100,116,139,0.09)" }}
              >
                Regular price
              </span>
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
              "gap-1.5 rounded-2xl font-black text-white shadow-sm active:scale-[0.99]",
              "px-3 py-2 text-[11px]",
              adding ? "cursor-not-allowed opacity-70" : "cursor-pointer"
            )}
            style={{ backgroundColor: PALETTE.cta }}
          >
            <FiShoppingCart className="h-4 w-4" />
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
});

/* -------------------- PAGE -------------------- */

export default function NewArrivals({ onAddToCart }) {
  const nav = useNav();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [addingId, setAddingId] = useState("");

  const goLogin = useCallback(() => {
    setShowLoginModal(false);
    nav.push("/login");
  }, [nav]);

  const handleAddToCart = useCallback(
    async (p) => {
      if (typeof onAddToCart === "function") {
        onAddToCart(p);
        return;
      }

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

        window.dispatchEvent(new Event("cart-updated"));
        toast.success("Added to cart.");
      } catch {
        toast.error("Failed to add item to cart.");
      } finally {
        setAddingId("");
      }
    },
    [onAddToCart]
  );

  const onOpen = useCallback(
    (p) => {
      const slug = String(p?.slug || "").trim();
      if (!slug) return;
      nav.push(`/product/${encodeURIComponent(slug)}`);
    },
    [nav]
  );

  const fetchNewArrivals = useCallback(async () => {
    const controller = new AbortController();

    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`/api/new-arival?limit=10&page=1`, {
        method: "GET",
        signal: controller.signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to load new arrivals");

      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      if (e?.name !== "AbortError") setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cleanup;
    (async () => {
      cleanup = await fetchNewArrivals();
    })();
    return () => cleanup?.();
  }, [fetchNewArrivals]);

  const skeletonCount = 10;

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
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
        <section className="mt-2">
          <div
            className="mb-4 overflow-hidden rounded-3xl border bg-white"
            style={{
              borderColor: PALETTE.border,
              boxShadow: "0 10px 28px rgba(0,31,63,.07), 0 1px 0 rgba(0,0,0,.02)",
            }}
          >
            <div className="relative w-full overflow-hidden bg-slate-50 h-[90px] sm:h-[110px] md:h-[130px] lg:h-[145px] xl:h-[155px] max-h-[155px]">
              <img
                src="https://cdn.jiostore.online/v2/jmd-asp/jdprod/wrkr/company/1/applications/645a057875d8c4882b096f7e/theme/pictures/free/original/theme-image-1766663124010.jpeg"
                alt="New Arrivals Banner"
                className="h-full w-full object-contain object-center"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-transparent" />
            </div>
          </div>

          <SectionHeader
            title="New Arrivals"
            subtitle="Fresh drops you’ll love"
            count={items.length}
            loading={loading}
            error={err}
            onRetry={fetchNewArrivals}
          />

          {err ? (
            <div className="mt-4 rounded-3xl border bg-white p-4 sm:p-5" style={{ borderColor: PALETTE.border }}>
              <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                Couldn’t load new arrivals
              </div>
              <div className="mt-1 text-xs font-semibold" style={{ color: PALETTE.muted }}>
                {err}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={fetchNewArrivals}
                  className="rounded-2xl px-4 py-2 text-[12px] font-black text-white shadow-sm"
                  style={{ backgroundColor: PALETTE.cta }}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}

          <div className={cn("mt-4", GRID)}>
            {loading
              ? Array.from({ length: skeletonCount }).map((_, i) => (
                  <ProductCardSkeleton key={`sk_${i}`} />
                ))
              : items.map((p) => (
                  <ProductCard
                    key={p?._id || p?.slug}
                    p={p}
                    onAdd={handleAddToCart}
                    onOpen={onOpen}
                    adding={addingId === String(p?._id || p?.id || p?.slug || "")}
                  />
                ))}
          </div>

          {!loading && !err && items.length === 0 ? (
            <div
              className="mt-6 rounded-3xl border bg-white p-5 text-sm font-bold"
              style={{ borderColor: PALETTE.border, color: PALETTE.navy }}
            >
              No new arrival products found.
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}