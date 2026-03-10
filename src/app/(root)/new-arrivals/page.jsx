"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  FiTag,
  FiShoppingCart,
  FiChevronRight,
} from "react-icons/fi";
import useNav from "@/Components/Utils/useNav";

const PALETTE = {
  navy: "#0f172a",
  navySoft: "#1e293b",
  coral: "#ff7e69",
  coralStrong: "#f96d57",
  coralSoft: "rgba(255,126,105,.10)",
  cta: "#ff6b6b",
  gold: "#eab308",
  green: "#16a34a",
  greenSoft: "rgba(22,163,74,.10)",
  bg: "#ffffff",
  bgTint: "#f8fafc",
  card: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  lightBorder: "#edf0f2",
  price: "#ff6b6b",
  shadow: "0 8px 30px rgba(15,23,42,.04)",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");
const GRID = "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4";

/* -------------------- utils -------------------- */

const formatBDT = (n) => `৳${Number(n || 0).toLocaleString("en-BD")}`;

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
    const newP = finalCandidates.length
      ? Math.min(...finalCandidates)
      : getListingPrice(p);
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
  if (
    typeof p?.selectedVariantBarcode === "string" &&
    p.selectedVariantBarcode.trim()
  ) {
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

/* -------------------- shared ui -------------------- */

function FlatBadge({ children, tone = "soft" }) {
  const map = {
    soft: {
      bg: "#f8fafc",
      fg: PALETTE.navy,
      border: PALETTE.border,
    },
    coral: {
      bg: PALETTE.coralSoft,
      fg: PALETTE.navy,
      border: "rgba(255,126,105,.20)",
    },
    gold: {
      bg: "rgba(234,179,8,.10)",
      fg: "#8a6700",
      border: "rgba(234,179,8,.20)",
    },
    success: {
      bg: PALETTE.greenSoft,
      fg: PALETTE.green,
      border: "rgba(22,163,74,.18)",
    },
    navy: {
      bg: "#f8fafc",
      fg: PALETTE.navy,
      border: PALETTE.border,
    },
  };

  const t = map[tone] || map.soft;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium"
      style={{
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.border}`,
      }}
    >
      {children}
    </span>
  );
}

function Surface({ children, className = "", padded = true }) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] bg-white",
        padded ? "p-5 sm:p-6" : "",
        className
      )}
      style={{
        border: `1px solid ${PALETTE.border}`,
        boxShadow: PALETTE.shadow,
      }}
    >
      {children}
    </div>
  );
}

/* -------------------- LOGIN REQUIRED MODAL -------------------- */

function LoginRequiredModal({ open, onClose, onLogin }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md overflow-hidden rounded-[30px] bg-white"
          style={{
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 30px 80px rgba(15,23,42,.18)",
          }}
        >
          <div
            className="relative px-6 py-6 sm:px-7 sm:py-7"
            style={{
              background:
                "linear-gradient(to bottom, rgba(15,23,42,.04), rgba(255,126,105,.06), rgba(234,179,8,.04), white)",
            }}
          >
            <div
              className="inline-flex h-14 w-14 items-center justify-center rounded-3xl"
              style={{ background: PALETTE.coralSoft }}
            >
              <FiShoppingCart
                className="h-6 w-6"
                style={{ color: PALETTE.coral }}
              />
            </div>

            <h3
              className="mt-4 text-[24px] font-semibold tracking-tight"
              style={{ color: PALETTE.navy }}
            >
              Login first
            </h3>

            <p
              className="mt-2 text-sm font-medium leading-relaxed"
              style={{ color: PALETTE.muted }}
            >
              You need to sign in before adding items to your cart. Your cart is
              linked to your account.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-md active:scale-[0.99] cursor-pointer"
                style={{ backgroundColor: PALETTE.navy }}
              >
                Go to Login
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.99] cursor-pointer"
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

/* -------------------- HERO IMAGE BANNER -------------------- */

function DealsHeroBanner({ image }) {
  return (
    <div
      className="relative overflow-hidden rounded-[1.5rem] bg-white"
      style={{
        border: `1px solid ${PALETTE.border}`,
        boxShadow: PALETTE.shadow,
      }}
    >
      <div className="relative h-[140px] sm:h-[200px] md:h-[260px] lg:h-[310px] xl:h-[350px] w-full bg-white">
        <img
          src={image}
          alt="New Arrivals Banner"
          className="absolute inset-0 block h-full w-full object-contain sm:object-cover object-center"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
}

/* -------------------- SECTION HEADER -------------------- */

function SectionHeader({ title, subtitle, count, loading, onRetry, error }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h2
            className="text-[24px] font-semibold tracking-tight sm:text-[34px]"
            style={{ color: PALETTE.navy }}
          >
            {title}
          </h2>
          <span
            className="hidden h-2 w-2 rounded-full sm:inline-block"
            style={{ background: PALETTE.coral }}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className="h-[3px] w-10 rounded-full"
            style={{ background: PALETTE.coral }}
          />
          <span
            className="h-[3px] w-6 rounded-full"
            style={{ background: "rgba(15,23,42,0.10)" }}
          />
          {subtitle ? (
            <span
              className="ml-2 truncate text-[12px] font-medium"
              style={{ color: PALETTE.muted }}
            >
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {loading ? (
          <span className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
            Loading…
          </span>
        ) : error ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-white px-3 py-2 text-[12px] font-medium hover:bg-slate-50 active:scale-[0.98]"
            style={{
              border: `1px solid ${PALETTE.border}`,
              color: PALETTE.navy,
            }}
          >
            Retry
          </button>
        ) : (
          <span className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
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
      className="overflow-hidden rounded-[1.5rem] bg-white"
      style={{
        border: `1px solid ${PALETTE.border}`,
        boxShadow: PALETTE.shadow,
      }}
    >
      <div
        className="h-40 sm:h-52 xl:h-56"
        style={{
          background:
            "linear-gradient(90deg, rgba(15,23,42,.05), rgba(15,23,42,.10), rgba(15,23,42,.05))",
        }}
      />
      <div className="p-3 sm:p-4">
        <div className="h-3 w-20 rounded bg-slate-100" />
        <div className="mt-2 h-4 w-[90%] rounded bg-slate-100" />
        <div className="mt-2 h-4 w-[70%] rounded bg-slate-100" />
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
          </div>
          <div className="h-9 w-20 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/* -------------------- PRODUCT CARD -------------------- */

const ProductCard = React.memo(function ProductCard({
  p,
  onAdd,
  onOpen,
  adding = false,
}) {
  const clickable = !!String(p?.slug || "").trim();
  const categoryLabel =
    typeof p?.category === "object" ? p?.category?.name : p?.category;
  const brandLabel = typeof p?.brand === "object" ? p?.brand?.name : "";

  const { oldPrice, newPrice, hasDiscount } = useMemo(() => getDiscountMeta(p), [p]);
  const displayPrice = useMemo(() => getListingPrice(p), [p]);
  const offPct = hasDiscount ? pctOff(newPrice, oldPrice) : 0;
  const imgSrc = useMemo(() => resolveProductImage(p), [p]);
  const title = p?.title || p?.name || "Untitled";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (clickable ? onOpen?.(p) : null)}
      onKeyDown={(e) =>
        clickable && (e.key === "Enter" || e.key === " ") ? onOpen?.(p) : null
      }
      className={cn(
        "group h-full overflow-hidden rounded-[1.35rem] bg-white transition focus:outline-none focus-visible:ring-4 focus-visible:ring-black/10",
        "flex flex-col",
        clickable ? "cursor-pointer hover:-translate-y-0.5" : "cursor-not-allowed opacity-70"
      )}
      style={{
        border: `1px solid ${PALETTE.border}`,
        boxShadow: PALETTE.shadow,
      }}
      title={clickable ? "Open product" : "Missing slug (check backend)"}
    >
      <div
        className="relative overflow-hidden"
        style={{
          background: hasDiscount
            ? "linear-gradient(to bottom, rgba(15,23,42,.03), rgba(255,126,105,.08), transparent)"
            : "linear-gradient(to bottom, rgba(15,23,42,.03), rgba(234,179,8,.06), transparent)",
        }}
      >
        <div className="absolute right-2.5 top-2.5 z-10 sm:right-3 sm:top-3">
          {hasDiscount ? (
            <FlatBadge tone="coral">
              <FiTag className="h-3.5 w-3.5" />
              {offPct}% OFF
            </FlatBadge>
          ) : (
            <FlatBadge tone="gold">New arrival</FlatBadge>
          )}
        </div>

        <div className="flex h-40 items-center justify-center p-3 sm:h-52 sm:p-4 xl:h-56">
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-contain transition-transform duration-500 ease-out will-change-transform",
              clickable ? "group-hover:scale-[1.03]" : ""
            )}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/5 via-transparent to-transparent sm:h-16" />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="min-h-[18px]">
          <div
            className="line-clamp-1 text-[11px] font-medium uppercase tracking-[0.12em]"
            style={{ color: PALETTE.coral }}
          >
            {categoryLabel || "General"}
          </div>
        </div>

        {brandLabel ? (
          <div
            className="mt-1 line-clamp-1 text-[11px] font-medium"
            style={{ color: PALETTE.muted }}
          >
            {brandLabel}
          </div>
        ) : (
          <div className="mt-1 h-[16px]" />
        )}

        <div className="mt-2 min-h-[38px] sm:min-h-[44px]">
          <div className="line-clamp-2 text-[14px] font-medium leading-[1.3] tracking-tight text-slate-900 sm:text-[16px] sm:leading-snug">
            {title}
          </div>
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
                <div
                  className="text-[14px] font-semibold leading-none sm:text-[16px]"
                  style={{ color: PALETTE.navy }}
                >
                  {formatBDT(displayPrice)}
                </div>

                {hasDiscount ? (
                  <div className="text-[11px] font-medium leading-none text-slate-400 line-through sm:text-[12px]">
                    {formatBDT(oldPrice)}
                  </div>
                ) : null}
              </div>

              <div
                className="mt-1 line-clamp-1 text-[10px] font-medium leading-[1.25] sm:text-[11px]"
                style={{ color: PALETTE.muted }}
              >
                {hasDiscount
                  ? `You save ${formatBDT(oldPrice - displayPrice)}`
                  : "Freshly added product"}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.(p);
              }}
              disabled={adding}
              className={cn(
                "shrink-0 inline-flex items-center gap-1 rounded-[1rem] px-2.5 py-2 text-[10px] font-medium text-white shadow-sm active:scale-[0.99] sm:gap-1.5 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-[11px]",
                adding ? "cursor-not-allowed opacity-70" : "cursor-pointer"
              )}
              style={{
                background: `linear-gradient(135deg, ${PALETTE.coral}, ${PALETTE.coralStrong})`,
              }}
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

  const skeletonCount = 8;

  return (
    <div
      className="min-h-screen overflow-x-hidden font-sans"
      style={{ background: PALETTE.bg, color: PALETTE.text }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2200,
          style: {
            background: "#fff",
            color: PALETTE.navy,
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 18px 45px rgba(15,23,42,.10)",
            borderRadius: "18px",
            fontWeight: 600,
          },
          success: {
            iconTheme: {
              primary: PALETTE.navy,
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: PALETTE.coral,
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
            "linear-gradient(to bottom, rgba(15,23,42,.08), rgba(255,126,105,.06), rgba(234,179,8,.04), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mt-0">
          <DealsHeroBanner image="https://cdn.jiostore.online/v2/jmd-asp/jdprod/wrkr/company/1/applications/645a057875d8c4882b096f7e/theme/pictures/free/original/theme-image-1766663124010.jpeg" />
        </section>

        <section className="mt-8">
          <SectionHeader
            title="New Arrivals"
            subtitle="Fresh drops you’ll love"
            count={items.length}
            loading={loading}
            error={err}
            onRetry={fetchNewArrivals}
          />
        </section>

        {err ? (
          <section className="mt-5">
            <Surface padded>
              <div className="text-sm font-medium" style={{ color: PALETTE.navy }}>
                Couldn’t load new arrivals
              </div>
              <div className="mt-1 text-xs font-medium" style={{ color: PALETTE.muted }}>
                {err}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={fetchNewArrivals}
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[12px] font-medium text-white shadow-sm"
                  style={{ backgroundColor: PALETTE.navy }}
                >
                  Try again <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </Surface>
          </section>
        ) : null}

        <section className="mt-6">
          <div className={GRID}>
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
            <Surface className="mt-6" padded>
              <div className="text-sm font-medium" style={{ color: PALETTE.navy }}>
                No new arrival products found.
              </div>
            </Surface>
          ) : null}
        </section>
      </main>
    </div>
  );
}