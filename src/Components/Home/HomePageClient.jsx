"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useNav from "@/Components/Utils/useNav";

import HomeSlider from "./HomeSlider";
import FeatureStrips from "./FeatureStrips";
import HomeCategoryClient from "./HomeCategory";
import LoginModal from "../UI/LoginModal";

import {
  FiChevronLeft,
  FiChevronRight,
  FiShoppingCart,
  FiStar,
} from "react-icons/fi";
import { HiMiniFire } from "react-icons/hi2";
import { Toaster, toast } from "react-hot-toast";

/* -------------------- THEME -------------------- */

const PALETTE = {
  navy: "#0f172a",
  navySoft: "#1e293b",

  coral: "#ff8a78",
  coralStrong: "#f47c68",
  coralSoft: "rgba(255,138,120,.10)",
  coralBtnStart: "#ff907f",
  coralBtnEnd: "#f07b69",
  coralTextSoft: "#de6f5f",

  gold: "#eab308",
  goldDeep: "#ca8a04",

  danger: "#dc2626",
  dangerSoft: "rgba(220,38,38,.08)",

  bg: "#ffffff",
  bgTint: "#fcfcfd",
  card: "#ffffff",
  cardTint: "#fbfbfc",
  imageBg: "#f7f8fa",

  text: "#111827",
  muted: "#6b7280",

  border: "#e5e7eb",
  lightBorder: "#edf0f2",
  softBorder: "rgba(15,23,42,.055)",

  shadow: "0 8px 24px rgba(15,23,42,.05)",
  premiumShadow: "0 10px 26px rgba(15,23,42,.075)",
  premiumHoverShadow: "0 14px 30px rgba(15,23,42,.10)",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");
const GRID = "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4";
const CARD_WIDTH_STYLE = { width: "clamp(190px, 23vw, 285px)" };
const TAKA_IMAGE_SRC = "/assets/sign/taka.png";

/* -------------------- UTILS -------------------- */

function formatPriceNumber(n) {
  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

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
  return (
    p?.image ||
    p?.primaryImage?.url ||
    p?.thumbnail ||
    p?.featuredImage ||
    "/placeholder.png"
  );
}

function resolveProductTitle(p) {
  return p?.name || p?.title || "Untitled product";
}

function resolveProductSellingPrice(p) {
  const discountPrice = Number(p?.discountPrice ?? 0);
  const finalPrice = Number(p?.finalPrice ?? 0);
  const normalPrice = Number(p?.normalPrice ?? 0);

  if (discountPrice > 0 && normalPrice > 0 && discountPrice < normalPrice) {
    return discountPrice;
  }

  return finalPrice || discountPrice || normalPrice || 0;
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

function isOnSaleProduct(p) {
  const normal = Number(p?.normalPrice ?? 0);
  const selling = Number(resolveProductSellingPrice(p) ?? 0);
  return normal > 0 && selling > 0 && selling < normal;
}

function isInStockProduct(p) {
  if (typeof p?.inStockNow === "boolean") return p.inStockNow;
  return Number(p?.availableStock ?? 0) > 0;
}

function isNewArrivalProduct(p) {
  return !!(p?.isNew || p?.newArrival || p?.arrivalType === "new");
}

function resolveProductRating(p) {
  const raw =
    p?.rating ??
    p?.avgRating ??
    p?.averageRating ??
    p?.reviewAverage ??
    p?.stars;

  const n = Number(raw);
  if (!Number.isNaN(n) && n > 0) return Math.min(5, Math.max(0, n));

  if (isOnSaleProduct(p)) return 4.8;
  if (isNewArrivalProduct(p)) return 4.7;
  return 4.5;
}

function resolveProductStatusTag(p) {
  if (isOnSaleProduct(p)) return "Hot Deal";
  if (isNewArrivalProduct(p)) return "New Arrival";
  return "";
}

/* -------------------- MONEY UI -------------------- */

function MoneyWithTk({
  amount,
  size = "md",
  weight = 700,
  color = PALETTE.navy,
  faded = false,
  lineThrough = false,
}) {
  const sizeMap = {
    xs: {
      wrap: "gap-1",
      img: "h-[10px] w-[10px]",
      text: "text-[10px]",
    },
    sm: {
      wrap: "gap-1",
      img: "h-[11px] w-[11px]",
      text: "text-[11px]",
    },
    md: {
      wrap: "gap-1.5",
      img: "h-[13px] w-[13px]",
      text: "text-[13px] sm:text-[15px]",
    },
    lg: {
      wrap: "gap-1.5",
      img: "h-[14px] w-[14px]",
      text: "text-[14px] sm:text-[16px]",
    },
  };

  const cfg = sizeMap[size] || sizeMap.md;

  return (
    <span
      className={cn(
        "inline-flex items-center leading-none",
        cfg.wrap,
        lineThrough ? "line-through" : ""
      )}
      style={{
        color,
        fontWeight: weight,
        opacity: faded ? 0.68 : 1,
      }}
    >
      <img
        src={TAKA_IMAGE_SRC}
        alt="Tk"
        className={cn("object-contain select-none", cfg.img)}
        draggable="false"
      />
      <span className={cfg.text}>{formatPriceNumber(amount)}</span>
    </span>
  );
}

/* -------------------- SHARED UI -------------------- */

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
      border: "rgba(255,138,120,.18)",
    },
    gold: {
      bg: "rgba(234,179,8,.10)",
      fg: "#8a6700",
      border: "rgba(234,179,8,.18)",
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
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
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

function SaveTag({ amount }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px]"
      style={{
        background: "#f8fafc",
        color: PALETTE.muted,
        border: `1px solid ${PALETTE.border}`,
        fontWeight: 500,
      }}
    >
      <span>Save</span>
      <MoneyWithTk amount={amount} size="xs" weight={600} color={PALETTE.navySoft} />
    </span>
  );
}

function SectionHeader({
  title,
  accent = "coral",
  rightSlot,
  subtitle,
  keepRightInlineOnMobile = false,
}) {
  const accentColor = accent === "gold" ? PALETTE.gold : PALETTE.coral;

  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        keepRightInlineOnMobile
          ? "items-start"
          : "flex-col sm:flex-row sm:items-end"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h2
            className="text-[26px] font-bold tracking-tight sm:text-[34px] md:text-[36px] leading-tight"
            style={{ color: PALETTE.navy }}
          >
            {title}
          </h2>
          <span
            className="hidden h-2 w-2 rounded-full sm:inline-block"
            style={{ background: accentColor }}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className="h-[3px] w-10 rounded-full"
            style={{ background: accentColor }}
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

      {rightSlot ? (
        <div className={cn("flex shrink-0", keepRightInlineOnMobile ? "pt-1" : "")}>
          {rightSlot}
        </div>
      ) : null}
    </div>
  );
}

function IconBtn({ onClick, children, ariaLabel, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white p-2.5 active:scale-[0.98] transition",
        disabled ? "cursor-not-allowed opacity-45" : "hover:bg-slate-50"
      )}
      style={{
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 4px 12px rgba(15,23,42,.05)",
      }}
    >
      {children}
    </button>
  );
}

function StockRibbon({ show }) {
  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[1.3rem]">
      <div
        className="absolute right-[-54px] top-[22px] w-[220px] rotate-45 py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}
      >
        Out of Stock
      </div>
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

  const normal = Number(p?.normalPrice ?? 0);
  const discount = Number(p?.discountPrice ?? 0);
  const final = Number(p?.finalPrice ?? 0);

  const effectiveSelling =
    discount > 0 && normal > 0 && discount < normal ? discount : final || discount || normal || 0;

  const hasDiscount = effectiveSelling > 0 && normal > 0 && effectiveSelling < normal;
  const displayPrice = effectiveSelling || normal || 0;
  const oldPrice = hasDiscount ? normal : 0;
  const savedAmount = hasDiscount ? oldPrice - displayPrice : 0;

  const inStock = isInStockProduct(p);
  const title = p?.name || p?.title || "Untitled";
  const brand = p?.brand?.name || p?.brandName || "";
  const rating = resolveProductRating(p);
  const statusTag = resolveProductStatusTag(p);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (clickable ? onOpen?.(p) : null)}
      onKeyDown={(e) =>
        clickable && (e.key === "Enter" || e.key === " ") ? onOpen?.(p) : null
      }
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-black/10",
        clickable ? "cursor-pointer hover:-translate-y-1" : "cursor-not-allowed opacity-70"
      )}
      style={{
        border: `1px solid ${PALETTE.softBorder}`,
        boxShadow: noShadow ? "none" : PALETTE.premiumShadow,
        background: `linear-gradient(180deg, ${PALETTE.card} 0%, ${PALETTE.cardTint} 100%)`,
      }}
      title={clickable ? "Open product" : "Missing slug (check backend)"}
    >
      <div
        className="relative overflow-hidden border-b"
        style={{
          borderColor: "rgba(15,23,42,.05)",
          background: PALETTE.imageBg,
        }}
      >
        <StockRibbon show={!inStock} />

        <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5">
          {statusTag ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold"
              style={{
                background: "#ffffff",
                color: PALETTE.navy,
                border: `1px solid ${PALETTE.border}`,
              }}
            >
              {statusTag === "Hot Deal" ? (
                <HiMiniFire className="h-3.5 w-3.5" style={{ color: PALETTE.coralStrong }} />
              ) : null}
              {statusTag}
            </span>
          ) : null}
        </div>

        <div className="relative z-[2] h-36 sm:h-44 lg:h-48 w-full overflow-hidden">
          <img
            src={resolveProductImage(p)}
            alt={title}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-contain transition-transform duration-500 ease-out will-change-transform",
              !inStock ? "grayscale-[15%] opacity-80" : "",
              clickable ? "group-hover:scale-[1.03]" : ""
            )}
            style={{
              filter: "drop-shadow(0 8px 16px rgba(15,23,42,.07))",
            }}
          />
        </div>
      </div>

      <div className="relative z-[2] flex flex-1 flex-col px-3 pb-3 pt-2.5 sm:px-3.5 sm:pb-3.5 sm:pt-3">
        <div className="min-h-[42px] sm:min-h-[46px]">
          {brand ? (
            <div
              className="mb-0.5 line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "#94a3b8" }}
            >
              {brand}
            </div>
          ) : null}

          <div
            className="line-clamp-2 font-semibold text-slate-900"
            style={{
              fontSize: "clamp(13px, 1.15vw, 17px)",
              lineHeight: 1.3,
              letterSpacing: "-0.014em",
            }}
          >
            {title}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <div
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold sm:text-[10px]"
            style={{
              background: "rgba(234,179,8,.10)",
              color: PALETTE.goldDeep,
              border: "1px solid rgba(234,179,8,.22)",
            }}
          >
            <FiStar
              className="h-3.5 w-3.5 fill-current"
              style={{ color: PALETTE.gold }}
            />
            {Number(rating).toFixed(1)}
          </div>

          {hasDiscount ? (
            <SaveTag amount={savedAmount} />
          ) : !inStock ? (
            <div
              className="text-[9px] font-medium sm:text-[10px]"
              style={{ color: PALETTE.muted }}
            >
              Unavailable
            </div>
          ) : (
            <div
              className="text-[9px] font-medium sm:text-[10px]"
              style={{ color: PALETTE.muted }}
            >
              Best price
            </div>
          )}
        </div>

        <div
          className="my-2.5 h-px w-full"
          style={{
            background: "linear-gradient(90deg, rgba(15,23,42,.07), rgba(15,23,42,.025), transparent)",
          }}
        />

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
              <MoneyWithTk
                amount={displayPrice}
                size="lg"
                weight={700}
                color={PALETTE.navy}
              />

              {hasDiscount ? (
                <MoneyWithTk
                  amount={oldPrice}
                  size="xs"
                  weight={500}
                  color="#94a3b8"
                  faded
                  lineThrough
                />
              ) : null}
            </div>

            <div
              className="mt-1 line-clamp-1 text-[9px] font-medium sm:text-[10px]"
              style={{ color: PALETTE.muted }}
            >
              {!inStock ? "Currently unavailable" : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.(p);
            }}
            disabled={adding || !inStock}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold text-white transition active:scale-[0.99] sm:px-3.5 sm:py-2",
              adding || !inStock
                ? "cursor-not-allowed opacity-70"
                : "cursor-pointer hover:opacity-95"
            )}
            style={{
              background: `linear-gradient(135deg, ${PALETTE.coralBtnStart}, ${PALETTE.coralBtnEnd})`,
              boxShadow: "0 8px 18px rgba(244,124,104,.18)",
            }}
          >
            <FiShoppingCart className="h-3.5 w-3.5" />
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
});

/* -------------------- SKELETON -------------------- */

function CardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[1.35rem]"
      style={{
        border: `1px solid ${PALETTE.softBorder}`,
        boxShadow: PALETTE.premiumShadow,
        background: "#fff",
      }}
    >
      <div
        className="h-36 sm:h-44 lg:h-48"
        style={{
          background:
            "linear-gradient(90deg, rgba(15,23,42,.05), rgba(15,23,42,.08), rgba(15,23,42,.05))",
        }}
      />
      <div className="p-3">
        <div className="h-3 w-20 rounded bg-slate-100" />
        <div className="mt-2.5 h-4 w-4/5 rounded bg-slate-100" />
        <div className="mt-1.5 h-4 w-3/5 rounded bg-slate-100" />
        <div className="mt-3 flex gap-2">
          <div className="h-5 w-14 rounded-full bg-slate-100" />
          <div className="h-5 w-20 rounded-full bg-slate-100" />
        </div>
        <div className="mt-3 h-px w-full bg-slate-100" />
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="mt-1.5 h-3 w-20 rounded bg-slate-100" />
          </div>
          <div className="h-9 w-16 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/* -------------------- SLIDER SECTION -------------------- */

function ProductSlider({ title, accent, items, onAdd, onOpen, addingId, loading }) {
  const wrapRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;

    const maxLeft = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < maxLeft - 6);
  }, []);

  const scrollByCard = useCallback((dir) => {
    const el = wrapRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card='1']");
    const amount = card ? Math.round(card.getBoundingClientRect().width * 1.15) : 280;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = wrapRef.current;
    if (!el) return;

    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const timer = setTimeout(updateScrollState, 80);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, [items, updateScrollState]);

  const rightSlot = (
    <div className="flex items-center gap-2">
      <IconBtn
        onClick={() => scrollByCard(-1)}
        ariaLabel={`Scroll ${title} left`}
        disabled={!canScrollLeft}
      >
        <FiChevronLeft className="h-4 w-4" style={{ color: PALETTE.navy }} />
      </IconBtn>

      <IconBtn
        onClick={() => scrollByCard(1)}
        ariaLabel={`Scroll ${title} right`}
        disabled={!canScrollRight}
      >
        <FiChevronRight className="h-4 w-4" style={{ color: PALETTE.navy }} />
      </IconBtn>
    </div>
  );

  return (
    <section className="mt-10">
      <SectionHeader
        title={title}
        accent={accent}
        rightSlot={rightSlot}
        subtitle="Hot picks based on demand"
        keepRightInlineOnMobile
      />

      {loading ? (
        <div className="mt-5 text-xs font-medium" style={{ color: PALETTE.muted }}>
          Loading {title.toLowerCase()}…
        </div>
      ) : null}

      <div className="mt-5">
        <div
          ref={wrapRef}
          className={cn(
            "hide-scrollbar flex gap-3 sm:gap-4 overflow-x-auto",
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
                adding={addingId === String(p?._id || p?.id || p?.slug || "")}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- HOME PAGE -------------------- */

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

  const goAllProducts = useCallback(() => {
    nav.push("/product");
  }, [nav]);

  const handleLoginSuccess = useCallback(async () => {
    window.dispatchEvent(new Event("auth-updated"));
    toast.success("Logged in successfully.");
  }, []);

  const onAdd = useCallback(async (p) => {
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
  }, []);

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
        const qs = buildQS({ only: "new", limit: 8, page: 1, prioritize: 1 });
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

  const productsSubtitle = useMemo(() => {
    const qq = (query || "").trim();
    if (!qq) return "Browse the full collection";
    return `Showing results for “${qq}”`;
  }, [query]);

  const summaryBadges = useMemo(() => {
    const arr = [];
    if ((query || "").trim()) {
      arr.push({
        key: "query",
        tone: "coral",
        label: `Search: ${query.trim()}`,
      });
    }
    return arr;
  }, [query]);

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

      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
        style={{
          background:
            "linear-gradient(to bottom, rgba(15,23,42,.07), rgba(255,138,120,.04), rgba(234,179,8,.025), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mt-0">
          <HomeSlider />
        </section>

        <section className="mt-6 hidden sm:block">
          <FeatureStrips />
        </section>

        <section className="mt-10">
          <HomeCategoryClient
            title="Popular Categories"
            subtitle="Browse popular picks"
            accent="coral"
            initialItems={initialHomeCategories}
            initialError={initialHomeCatError}
          />
        </section>

        <ProductSlider
          title="Trending Now"
          accent="coral"
          items={trending}
          onAdd={onAdd}
          onOpen={openProduct}
          addingId={addingId}
          loading={loadingTrending}
        />

        <section className="mt-12">
          <SectionHeader
            title="New Arrivals"
            accent="gold"
            rightSlot={
              <button
                onClick={goAllProducts}
                className="cursor-pointer rounded-full bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 active:scale-[0.98]"
                style={{
                  color: PALETTE.navy,
                  border: `1px solid ${PALETTE.border}`,
                  boxShadow: "0 4px 12px rgba(15,23,42,.05)",
                }}
                type="button"
              >
                See all
              </button>
            }
            subtitle="Fresh drops you’ll love"
          />

          {loadingNew ? (
            <div className="mt-4">
              <div className={GRID}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : null}

          {!loadingNew ? (
            <div className={cn("mt-5", GRID)}>
              {(newArrivals || []).map((p) => (
                <ProductCard
                  key={p?._id || p?.slug}
                  p={p}
                  onAdd={onAdd}
                  onOpen={openProduct}
                  adding={addingId === String(p?._id || p?.id || p?.slug || "")}
                />
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-12" ref={productsSectionRef}>
          <SectionHeader
            title="Products"
            accent="coral"
            subtitle={productsSubtitle}
            rightSlot={
              <button
                onClick={goAllProducts}
                className="cursor-pointer rounded-full bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 active:scale-[0.98]"
                style={{
                  color: PALETTE.navy,
                  border: `1px solid ${PALETTE.border}`,
                  boxShadow: "0 4px 12px rgba(15,23,42,.05)",
                }}
                type="button"
              >
                See all
              </button>
            }
          />

          {summaryBadges.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {summaryBadges.map((badge) => (
                <FlatBadge key={badge.key} tone={badge.tone}>
                  {badge.label}
                </FlatBadge>
              ))}
            </div>
          ) : null}

          {loadingProducts && page === 1 ? (
            <div className="mt-5">
              <div className={GRID}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : null}

          {!loadingProducts || page !== 1 ? (
            <div className={cn("mt-5", GRID)}>
              {(products || []).map((p) => (
                <ProductCard
                  key={p?._id || p?.slug}
                  p={p}
                  onAdd={onAdd}
                  onOpen={openProduct}
                  adding={addingId === String(p?._id || p?.id || p?.slug || "")}
                />
              ))}
            </div>
          ) : null}

          {!loadingProducts && products?.length === 0 ? (
            <div className="mt-6 text-sm font-medium" style={{ color: PALETTE.navy }}>
              No products found.
            </div>
          ) : null}

          {hasMore ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingProducts}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white shadow-md active:scale-[0.99] disabled:opacity-60"
                style={{
                  backgroundColor: PALETTE.navy,
                  boxShadow: "0 8px 18px rgba(15,23,42,.12)",
                }}
              >
                {loadingProducts ? "Loading…" : "See more"}
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}