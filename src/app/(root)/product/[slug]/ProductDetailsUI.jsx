"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useNav from "@/Components/Utils/useNav";
import { Toaster, toast } from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiShare2,
  FiTruck,
  FiRefreshCcw,
  FiStar,
  FiMinus,
  FiPlus,
  FiShoppingCart,
} from "react-icons/fi";
import LoginModal from "@/Components/UI/LoginModal";

const PALETTE = {
  bg: "#ffffff",
  panel: "#ffffff",
  panelSoft: "#fafafa",
  text: "#111827",
  textSoft: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  borderSoft: "#f1f5f9",
  primary: "#111827",
  primarySoft: "#f3f4f6",
  accent: "#ff7e69",
  accentStrong: "#f96d57",
  accentSoft: "rgba(255,126,105,.10)",
  success: "#15803d",
  successSoft: "#f0fdf4",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  gold: "#eab308",
  shadow: "0 10px 30px rgba(17,24,39,.05)",
};

const relatedProductsCache = new Map();
const relatedProductsRequests = new Map();

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatBDT = (n) => {
  const num = Number(n || 0);
  return `Tk ${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(num)}`;
};

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function getImageUrl(img) {
  if (!img) return "";
  if (typeof img === "string") return img.trim();
  if (typeof img === "object" && img.url) return String(img.url).trim();
  return "";
}

function normalizeAttributes(attrs) {
  if (!attrs) return {};
  if (attrs instanceof Map) return Object.fromEntries(attrs.entries());
  if (typeof attrs === "object" && !Array.isArray(attrs)) return attrs;
  return {};
}

function getVariantFinalPrice(variant) {
  if (!variant) return 0;
  const sale =
    typeof variant.salePrice === "number"
      ? variant.salePrice
      : typeof variant.discountPrice === "number"
        ? variant.discountPrice
        : null;
  const base = typeof variant.price === "number" ? variant.price : 0;
  return sale !== null ? sale : base;
}

function getProductFinalPrice(product) {
  if (typeof product?.finalPrice === "number") return product.finalPrice;
  if (typeof product?.discountPrice === "number") return product.discountPrice;
  if (typeof product?.salePrice === "number") return product.salePrice;
  if (typeof product?.price === "number") return product.price;
  if (typeof product?.normalPrice === "number") return product.normalPrice;
  return 0;
}

function getDiscountPercent(oldPrice, finalPrice) {
  const oldP = Number(oldPrice || 0);
  const finalP = Number(finalPrice || 0);
  if (!oldP || !finalP || finalP >= oldP) return 0;
  return Math.round(((oldP - finalP) / oldP) * 100);
}

function resolveProductImage(p) {
  return (
    getImageUrl(p?.image) ||
    getImageUrl(p?.primaryImage) ||
    getImageUrl(p?.thumbnail) ||
    getImageUrl(p?.featuredImage) ||
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

function isOnSaleProduct(p) {
  const normal = Number(p?.normalPrice ?? p?.price ?? 0);
  const selling = Number(resolveProductSellingPrice(p) ?? 0);
  return normal > 0 && selling > 0 && selling < normal;
}

function isInStockProduct(p) {
  if (typeof p?.inStockNow === "boolean") return p.inStockNow;
  return Number(p?.availableStock ?? p?.stockQty ?? 0) > 0;
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
  if (p?.isNew || p?.newArrival) return 4.7;
  return 4.5;
}

function findMatchingVariant(variants, selectedAttributes) {
  return (
    variants.find((variant) => {
      const attrs = normalizeAttributes(variant?.attributes);
      return Object.entries(selectedAttributes).every(
        ([key, value]) => String(attrs?.[key] || "") === String(value || "")
      );
    }) || null
  );
}

function formatSpecValue(spec) {
  const value = spec?.value;

  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "";

  const base = String(value).trim();
  if (!base) return "";

  return spec?.unit ? `${base} ${spec.unit}` : base;
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

function extractVariantBarcodeFromProduct(product, selectedVariant) {
  if (typeof selectedVariant?.barcode === "string" && selectedVariant.barcode.trim()) {
    return selectedVariant.barcode.trim();
  }
  if (
    typeof product?.selectedVariant?.barcode === "string" &&
    product.selectedVariant.barcode.trim()
  ) {
    return product.selectedVariant.barcode.trim();
  }
  if (
    typeof product?.previewVariant?.barcode === "string" &&
    product.previewVariant.barcode.trim()
  ) {
    return product.previewVariant.barcode.trim();
  }
  if (
    typeof product?.selectedVariantBarcode === "string" &&
    product.selectedVariantBarcode.trim()
  ) {
    return product.selectedVariantBarcode.trim();
  }
  if (typeof product?.variantBarcode === "string" && product.variantBarcode.trim()) {
    return product.variantBarcode.trim();
  }
  return "";
}

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
              color: filled ? PALETTE.gold : "#d1d5db",
              fill: filled ? PALETTE.gold : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

function Tag({ children, tone = "neutral" }) {
  const toneMap = {
    neutral: {
      bg: "#f9fafb",
      fg: PALETTE.textSoft,
      border: PALETTE.border,
    },
    success: {
      bg: PALETTE.successSoft,
      fg: PALETTE.success,
      border: "#dcfce7",
    },
    danger: {
      bg: PALETTE.dangerSoft,
      fg: PALETTE.danger,
      border: "#fee2e2",
    },
    accent: {
      bg: PALETTE.accentSoft,
      fg: PALETTE.accentStrong,
      border: "rgba(255,126,105,.18)",
    },
  };

  const t = toneMap[tone] || toneMap.neutral;

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium"
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

function getColorValue(colorValue = "") {
  const normalized = String(colorValue || "").trim().toLowerCase();

  const namedColors = {
    black: "#111111",
    white: "#ffffff",
    red: "#ef4444",
    green: "#22c55e",
    blue: "#3b82f6",
    yellow: "#facc15",
    orange: "#fb923c",
    purple: "#a855f7",
    pink: "#ec4899",
    gray: "#9ca3af",
    grey: "#9ca3af",
    silver: "#c0c0c0",
    gold: "#d4af37",
    navy: "#1e3a8a",
    brown: "#92400e",
    beige: "#d6c7a1",
    maroon: "#7f1d1d",
    cyan: "#06b6d4",
    teal: "#0f766e",
  };

  const hexLike = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized);
  return hexLike ? normalized : namedColors[normalized] || colorValue || "#e5e7eb";
}

function OptionPill({
  active,
  disabled,
  children,
  onClick,
  isColor = false,
  colorValue = "",
}) {
  const swatchColor = getColorValue(colorValue);
  const isWhiteish =
    swatchColor.toLowerCase() === "#fff" || swatchColor.toLowerCase() === "#ffffff";

  if (isColor) {
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-all duration-200",
          disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:-translate-y-[1px]"
        )}
        style={{
          background: "#fff",
          color: PALETTE.text,
          border: `1px solid ${active ? PALETTE.accentStrong : PALETTE.border}`,
          boxShadow: active ? "0 0 0 3px rgba(255,126,105,.12)" : "none",
        }}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full"
          style={{
            background: swatchColor,
            border: `1px solid ${isWhiteish ? "#d1d5db" : swatchColor}`,
          }}
        />
        <span className="font-medium">{children}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200",
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:-translate-y-[1px]"
      )}
      style={{
        background: active ? PALETTE.primary : "#fff",
        color: active ? "#fff" : PALETTE.text,
        border: `1px solid ${active ? PALETTE.primary : PALETTE.border}`,
        boxShadow: active ? "0 8px 18px rgba(17,24,39,.14)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function Thumb({ src, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative shrink-0 overflow-hidden rounded-2xl bg-white transition cursor-pointer"
      style={{
        border: active ? `1.5px solid ${PALETTE.accent}` : `1px solid ${PALETTE.border}`,
        boxShadow: active ? "0 0 0 3px rgba(255,126,105,.10)" : "none",
      }}
      type="button"
      aria-label="Select image"
    >
      <div className="h-16 w-16 p-2 sm:h-[72px] sm:w-[72px]">
        <img src={src} alt="" className="h-full w-full object-contain" loading="lazy" />
      </div>
    </button>
  );
}

function StockRibbon({ show }) {
  if (!show) return null;

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20">
      <Tag tone="danger">Out of stock</Tag>
    </div>
  );
}

function ProductZoomSlide({
  src,
  alt,
  active,
  zoomDesktop = 1.8,
  zoomMobile = 2,
  containerHeightClass = "h-[320px] sm:h-[400px] lg:h-[500px] xl:h-[520px]",
  soldOut = false,
}) {
  const wrapRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [mobileZoomed, setMobileZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const isMobile = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  }, []);

  useEffect(() => {
    setHovered(false);
    setMobileZoomed(false);
    setPosition({ x: 50, y: 50 });
  }, [src]);

  const updatePosition = useCallback((clientX, clientY) => {
    const el = wrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (isMobile()) return;
      updatePosition(e.clientX, e.clientY);
    },
    [isMobile, updatePosition]
  );

  const handleTouchStart = useCallback(
    (e) => {
      if (!isMobile()) return;
      const touch = e.touches?.[0];
      if (!touch) return;
      if (!mobileZoomed) setMobileZoomed(true);
      updatePosition(touch.clientX, touch.clientY);
    },
    [isMobile, mobileZoomed, updatePosition]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isMobile() || !mobileZoomed) return;
      const touch = e.touches?.[0];
      if (!touch) return;
      updatePosition(touch.clientX, touch.clientY);
    },
    [isMobile, mobileZoomed, updatePosition]
  );

  const handleTapToggle = useCallback(
    (e) => {
      if (!isMobile()) return;
      const touch = e.changedTouches?.[0];
      if (touch) updatePosition(touch.clientX, touch.clientY);
      setMobileZoomed((prev) => !prev);
    },
    [isMobile, updatePosition]
  );

  const zoomActive = isMobile() ? mobileZoomed : hovered;
  const zoomValue = isMobile() ? zoomMobile : zoomDesktop;

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative w-full min-w-full shrink-0 overflow-hidden bg-white px-4 py-6 lg:px-3",
        containerHeightClass
      )}
      onMouseEnter={() => {
        if (!isMobile()) setHovered(true);
      }}
      onMouseLeave={() => {
        if (!isMobile()) {
          setHovered(false);
          setPosition({ x: 50, y: 50 });
        }
      }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTapToggle}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading={active ? "eager" : "lazy"}
        className={cn(
          "h-full w-full object-contain transition-transform duration-200 ease-out",
          soldOut ? "grayscale-[20%] opacity-80" : ""
        )}
        style={{
          transform: zoomActive ? `scale(${zoomValue})` : "scale(1)",
          transformOrigin: `${position.x}% ${position.y}%`,
          willChange: "transform",
        }}
      />
    </div>
  );
}

function Gallery({
  images,
  title,
  inStock,
  galleryKey,
  activeIndex = 0,
}) {
  const [idx, setIdx] = useState(0);
  const thumbsWrapRef = useRef(null);
  const showThumbScrollArrows = images.length > 4;

  useEffect(() => {
    setIdx(0);
  }, [galleryKey]);

  useEffect(() => {
    if (!images.length) return;
    const safeIndex = Math.max(0, Math.min(activeIndex, images.length - 1));
    setIdx((prev) => (prev === safeIndex ? prev : safeIndex));
  }, [activeIndex, images.length]);

  const prev = useCallback(() => {
    setIdx((p) => (p - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setIdx((p) => (p + 1) % images.length);
  }, [images.length]);

  const scrollThumbIntoView = useCallback((index) => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;

    const el = thumbsWrapRef.current;
    if (!el) return;

    const child = el.querySelector(`[data-thumb-i='${index}']`);
    if (!child) return;

    child.scrollIntoView({
      inline: "center",
      behavior: "smooth",
      block: "nearest",
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    scrollThumbIntoView(idx);
  }, [idx, scrollThumbIntoView]);

  const scrollThumbs = useCallback((direction) => {
    const el = thumbsWrapRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.75, 180);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  if (!images.length) return null;

  return (
    <div className="w-full min-w-0">
      <div
        className="relative overflow-hidden rounded-[28px] bg-white"
        style={{
          border: `1px solid ${PALETTE.border}`,
          boxShadow: PALETTE.shadow,
        }}
      >
        <StockRibbon show={!inStock} />

        <div className="relative w-full overflow-hidden">
          <div
            className="flex w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {images.map((src, i) => (
              <ProductZoomSlide
                key={`${galleryKey}-${src}-${i}`}
                src={src}
                alt={title}
                active={i === idx}
                soldOut={!inStock}
              />
            ))}
          </div>
        </div>

        {images.length > 1 ? (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 cursor-pointer"
              style={{ border: `1px solid ${PALETTE.border}` }}
              aria-label="Previous image"
              type="button"
            >
              <FiChevronLeft className="h-5 w-5" style={{ color: PALETTE.text }} />
            </button>

            <button
              onClick={next}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 cursor-pointer"
              style={{ border: `1px solid ${PALETTE.border}` }}
              aria-label="Next image"
              type="button"
            >
              <FiChevronRight className="h-5 w-5" style={{ color: PALETTE.text }} />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="relative mt-4">
          {showThumbScrollArrows ? (
            <button
              type="button"
              onClick={() => scrollThumbs("left")}
              className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 md:flex cursor-pointer"
              style={{ border: `1px solid ${PALETTE.border}` }}
              aria-label="Scroll thumbnails left"
            >
              <FiChevronLeft className="h-4 w-4" style={{ color: PALETTE.text }} />
            </button>
          ) : null}

          <div
            ref={thumbsWrapRef}
            className={cn(
              "hide-scrollbar flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none]",
              showThumbScrollArrows ? "px-0 md:px-10" : "px-0"
            )}
          >
            <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>
            {images.map((src, i) => (
              <div key={`${galleryKey}-thumb-${src}-${i}`} data-thumb-i={i} className="shrink-0">
                <Thumb src={src} active={i === idx} onClick={() => setIdx(i)} />
              </div>
            ))}
          </div>

          {showThumbScrollArrows ? (
            <button
              type="button"
              onClick={() => scrollThumbs("right")}
              className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 md:flex cursor-pointer"
              style={{ border: `1px solid ${PALETTE.border}` }}
              aria-label="Scroll thumbnails right"
            >
              <FiChevronRight className="h-4 w-4" style={{ color: PALETTE.text }} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ActionIconButton({ icon: Icon, label, onClick }) {
  return (
    <button
      className="rounded-full bg-white p-3 transition hover:bg-slate-50 cursor-pointer"
      style={{ border: `1px solid ${PALETTE.border}` }}
      aria-label={label}
      type="button"
      onClick={onClick}
    >
      <Icon className="h-4.5 w-4.5" style={{ color: PALETTE.text }} />
    </button>
  );
}

function FeatureCards() {
  const items = [
    {
      Icon: FiTruck,
      title: "Fast delivery",
      desc: "2-3 days delivery",
    },
    {
      Icon: FiRefreshCcw,
      title: "Easy return",
      desc: "7 days return policy",
    },
  ];

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map(({ Icon, title, desc }) => (
        <div
          key={title}
          className="flex items-center gap-3 rounded-2xl px-4 py-4"
          style={{
            background: PALETTE.panel,
            border: `1px solid ${PALETTE.border}`,
          }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: PALETTE.primarySoft }}
          >
            <Icon className="h-5 w-5" style={{ color: PALETTE.text }} />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-0.5 text-sm text-slate-500">{desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HighlightItem({ label, value }) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 truncate text-[14px] font-medium text-slate-900">{value}</div>
    </div>
  );
}

function QuantitySelector({ value, setValue, max }) {
  const canIncrease = max ? value < max : true;

  return (
    <div
      className="inline-flex h-10 items-center rounded-full bg-white px-1.5"
      style={{ border: `1px solid ${PALETTE.border}` }}
    >
      <button
        type="button"
        onClick={() => setValue((q) => Math.max(1, q - 1))}
        className="flex h-7.5 w-7.5 items-center justify-center rounded-full transition hover:bg-slate-50 cursor-pointer"
        aria-label="Decrease quantity"
      >
        <FiMinus className="h-3.5 w-3.5" />
      </button>

      <div className="min-w-[42px] text-center text-[14px] font-semibold text-slate-900">
        {value}
      </div>

      <button
        type="button"
        onClick={() => setValue((q) => (canIncrease ? q + 1 : q))}
        className={cn(
          "flex h-7.5 w-7.5 items-center justify-center rounded-full transition",
          canIncrease ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-40"
        )}
        aria-label="Increase quantity"
      >
        <FiPlus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SpecRow({ k, v, index }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[120px_1fr] gap-4 py-4 sm:grid-cols-[180px_1fr] sm:gap-6",
        index !== 0 && "border-t"
      )}
      style={{
        borderColor: index !== 0 ? PALETTE.borderSoft : "transparent",
      }}
    >
      <div className="text-sm font-medium text-slate-500">{k}</div>
      <div className="text-sm font-medium leading-7 text-slate-900">{v}</div>
    </div>
  );
}

const RelatedProductCard = React.memo(function RelatedProductCard({ p, onSelect }) {
  const clickable = !!String(p?.slug || p?._id || p?.id || "").trim();

  const normal = Number(p?.normalPrice ?? p?.price ?? 0);
  const selling = Number(resolveProductSellingPrice(p) ?? 0);
  const hasDiscount = selling > 0 && normal > 0 && selling < normal;
  const displayPrice = selling || normal || 0;
  const oldPrice = hasDiscount ? normal : 0;
  const offPct = hasDiscount ? getDiscountPercent(oldPrice, displayPrice) : 0;

  const inStock = isInStockProduct(p);
  const availableStock = Number(p?.availableStock ?? p?.stockQty ?? 0);
  const title = resolveProductTitle(p);
  const brand = p?.brand?.name || p?.brandName || "";
  const rating = resolveProductRating(p);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (clickable ? onSelect?.(p) : null)}
      onKeyDown={(e) =>
        clickable && (e.key === "Enter" || e.key === " ") ? onSelect?.(p) : null
      }
      className={cn(
        "group flex h-full w-[250px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-[24px] bg-white transition",
        clickable ? "hover:-translate-y-1" : "cursor-not-allowed opacity-70"
      )}
      style={{
        border: `1px solid ${PALETTE.border}`,
        boxShadow: PALETTE.shadow,
      }}
    >
      <div className="relative overflow-hidden bg-white">
        {!inStock ? (
          <div className="absolute left-3 top-3 z-10">
            <Tag tone="danger">Out of stock</Tag>
          </div>
        ) : null}

        {hasDiscount ? (
          <div className="absolute right-3 top-3 z-10">
            <Tag tone="accent">{offPct}% OFF</Tag>
          </div>
        ) : null}

        <div className="flex h-44 items-center justify-center p-4 sm:h-48">
          <img
            src={resolveProductImage(p)}
            alt={title}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-contain transition-transform duration-500",
              !inStock ? "grayscale-[20%] opacity-80" : "",
              clickable ? "group-hover:scale-[1.03]" : ""
            )}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="min-h-[52px]">
          <div className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900">
            {title}
          </div>

          {brand ? (
            <div className="mt-1 line-clamp-1 text-[12px] font-medium text-slate-500">
              {brand}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: "rgba(234,179,8,.10)",
              color: "#8a6700",
              border: "1px solid rgba(234,179,8,.18)",
            }}
          >
            <FiStar className="h-3.5 w-3.5 fill-current" />
            {Number(rating).toFixed(1)}
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
                <div className="text-[16px] font-semibold leading-none text-slate-900">
                  {formatBDT(displayPrice)}
                </div>

                {hasDiscount ? (
                  <div className="text-[12px] font-medium leading-none text-slate-400 line-through">
                    {formatBDT(oldPrice)}
                  </div>
                ) : null}
              </div>

              <div className="mt-1 line-clamp-1 text-[11px] font-medium text-slate-500">
                {!inStock
                  ? "Currently unavailable"
                  : hasDiscount
                    ? `You save ${formatBDT(oldPrice - displayPrice)}`
                    : `${availableStock} available now`}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(p);
              }}
              disabled={!inStock}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-medium text-white",
                !inStock ? "cursor-not-allowed opacity-70" : "cursor-pointer"
              )}
              style={{
                background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentStrong})`,
              }}
            >
              <FiShoppingCart className="h-4 w-4" />
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

function RelatedProductsSlider({ items = [], onSelect, loading = false }) {
  const wrapRef = useRef(null);

  const scrollByAmount = useCallback((dir) => {
    const el = wrapRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.9, 280);
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  return (
    <section
      className="rounded-[28px] bg-white p-5 sm:p-6 lg:p-7"
      style={{
        border: `1px solid ${PALETTE.border}`,
        boxShadow: PALETTE.shadow,
      }}
    >
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className="mb-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{
              background: PALETTE.accentSoft,
              color: PALETTE.accentStrong,
              border: "1px solid rgba(255,126,105,.18)",
            }}
          >
            You may also like
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
            Related Products
          </h3>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="rounded-full bg-white p-2.5 transition cursor-pointer"
            style={{ border: `1px solid ${PALETTE.border}` }}
            aria-label="Previous related products"
          >
            <FiChevronLeft className="h-4 w-4" style={{ color: PALETTE.text }} />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="rounded-full bg-white p-2.5 transition cursor-pointer"
            style={{ border: `1px solid ${PALETTE.border}` }}
            aria-label="Next related products"
          >
            <FiChevronRight className="h-4 w-4" style={{ color: PALETTE.text }} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-[250px] shrink-0 overflow-hidden rounded-[24px] bg-white"
              style={{
                border: `1px solid ${PALETTE.border}`,
                boxShadow: PALETTE.shadow,
              }}
            >
              <div className="h-48 animate-pulse bg-slate-100" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : !items.length ? (
        <div
          className="rounded-3xl px-6 py-12 text-center"
          style={{ background: "#fafafa", border: `1px dashed ${PALETTE.border}` }}
        >
          <h4 className="text-lg font-semibold text-slate-900">No related products found</h4>
          <p className="mt-2 text-sm text-slate-500">
            Related items will appear here when matching products are available.
          </p>
        </div>
      ) : (
        <div
          ref={wrapRef}
          className="hide-scrollbar flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none]"
        >
          <style>{`.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>
          {items.map((it, i) => (
            <RelatedProductCard
              key={(it?._id || it?.slug || i) + ""}
              p={it}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SectionTabButton({ active, onClick, children, tone = "dark" }) {
  const isCoral = tone === "coral";

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer"
      style={{
        background: active
          ? isCoral
            ? `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentStrong})`
            : PALETTE.primary
          : "#fff",
        color: active ? "#fff" : PALETTE.text,
        border: `1px solid ${
          active ? (isCoral ? PALETTE.accentStrong : PALETTE.primary) : PALETTE.border
        }`,
        boxShadow: active
          ? isCoral
            ? "0 10px 22px rgba(249,109,87,.22)"
            : "0 8px 18px rgba(17,24,39,.14)"
          : "none",
      }}
    >
      {children}
    </button>
  );
}

export default function ProductDetailsUI({
  product,
  relatedProducts,
  onSelectRelated,
}) {
  const nav = useNav();
  const p = product || {};

  const title = p?.title || p?.name || "Product";
  const brandLabel = p?.brand?.name || "";
  const basePrimary = getImageUrl(p?.primaryImage) || resolveProductImage(p);

  const [apiRelatedProducts, setApiRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("specification");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const variants = useMemo(
    () => (Array.isArray(p?.variants) ? p.variants.filter((v) => v?.isActive !== false) : []),
    [p?.variants]
  );

  const variantState = p?.variantState || null;
  const optionDefinitions = Array.isArray(p?.optionDefinitions) ? p.optionDefinitions : [];

  const variantGroups = useMemo(() => {
    if (optionDefinitions.length) {
      return optionDefinitions.map((def) => {
        const key = String(def?.key || "").trim();
        return {
          name: key,
          label: def?.label || key,
          options: Array.isArray(def?.values) ? def.values : [],
          availableOptions: Array.isArray(variantState?.availableOptions?.[key])
            ? variantState.availableOptions[key]
            : Array.isArray(def?.values)
              ? def.values
              : [],
        };
      });
    }

    if (variantState?.attributeKeys?.length) {
      return variantState.attributeKeys.map((key) => ({
        name: key,
        label: key
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        options: Array.isArray(variantState?.allOptions?.[key]) ? variantState.allOptions[key] : [],
        availableOptions: Array.isArray(variantState?.availableOptions?.[key])
          ? variantState.availableOptions[key]
          : [],
      }));
    }

    return [];
  }, [optionDefinitions, variantState]);

  const variantGroupsSignature = useMemo(
    () =>
      variantGroups
        .map((group) => {
          const options = Array.isArray(group.options) ? group.options.join(",") : "";
          const available = Array.isArray(group.availableOptions)
            ? group.availableOptions.join(",")
            : "";
          return `${group.name}:${group.label}:${options}:${available}`;
        })
        .join("|"),
    [variantGroups]
  );

  const variantSelectionSignature = useMemo(() => {
    const selection = variantState?.selection || {};
    return Object.entries(selection)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${String(v ?? "")}`)
      .join("|");
  }, [variantState?.selection]);

  useEffect(() => {
    if (!variantGroups.length) {
      setSelectedAttributes({});
      return;
    }

    const initial = {};

    variantGroups.forEach((group) => {
      const fromApi = variantState?.selection?.[group.name];
      if (fromApi && group.options.includes(fromApi)) {
        initial[group.name] = fromApi;
        return;
      }

      const firstAvailable =
        group.availableOptions?.find((opt) => group.options.includes(opt)) || group.options[0];

      if (firstAvailable) initial[group.name] = firstAvailable;
    });

    setSelectedAttributes(initial);
  }, [variantGroupsSignature, variantSelectionSignature, p?._id, p?.slug]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;

    const exact = findMatchingVariant(variants, selectedAttributes);
    if (exact) return exact;

    if (p?.selectedVariant?.barcode) {
      const found = variants.find(
        (v) => String(v?.barcode || "") === String(p.selectedVariant.barcode)
      );
      if (found) return found;
    }

    return null;
  }, [variants, selectedAttributes, p?.selectedVariant?.barcode]);

  const previewVariant = useMemo(() => {
    if (selectedVariant) return selectedVariant;
    if (p?.previewVariant) return p.previewVariant;
    if (p?.selectedVariant) return p.selectedVariant;
    return null;
  }, [selectedVariant, p?.previewVariant, p?.selectedVariant]);

  const selectedMedia = useMemo(() => {
    return Array.isArray(p?.selectedMedia) ? p.selectedMedia : [];
  }, [p?.selectedMedia]);

  const productGalleryImages = useMemo(() => {
    return Array.isArray(p?.galleryImages) ? p.galleryImages : [];
  }, [p?.galleryImages]);

  const allVariantImages = useMemo(() => {
    const out = [];
    const seen = new Set();

    variants.forEach((variant) => {
      const imgs = Array.isArray(variant?.images) ? variant.images : [];
      imgs.forEach((img) => {
        const url = getImageUrl(img);
        if (!url) return;
        const key = url.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        out.push(url);
      });
    });

    return out;
  }, [variants]);

  const galleryImages = useMemo(() => {
    const urls = [];
    const seen = new Set();

    const add = (img) => {
      const url = getImageUrl(img);
      if (!url) return;
      const key = url.trim().toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      urls.push(url);
    };

    selectedMedia.forEach(add);
    add(basePrimary);
    productGalleryImages.forEach(add);
    allVariantImages.forEach(add);

    if (!urls.length) add("/placeholder.png");

    return urls.slice(0, 50);
  }, [selectedMedia, basePrimary, productGalleryImages, allVariantImages]);

  const galleryKey = useMemo(() => {
    return `${p?._id || p?.slug || "product"}`;
  }, [p?._id, p?.slug]);

  const activeGalleryIndex = useMemo(() => {
    if (!galleryImages.length) return 0;

    const candidateImages = [];

    if (Array.isArray(selectedVariant?.images)) {
      selectedVariant.images.forEach((img) => {
        const url = getImageUrl(img);
        if (url) candidateImages.push(url);
      });
    }

    if (Array.isArray(previewVariant?.images)) {
      previewVariant.images.forEach((img) => {
        const url = getImageUrl(img);
        if (url) candidateImages.push(url);
      });
    }

    for (const candidate of candidateImages) {
      const idx = galleryImages.findIndex(
        (img) => img.trim().toLowerCase() === candidate.trim().toLowerCase()
      );
      if (idx !== -1) return idx;
    }

    return 0;
  }, [galleryImages, selectedVariant?.images, previewVariant?.images]);

  const isVariable = p?.productType === "variable";

  const hasFullSelection =
    !isVariable || !variantGroups.length
      ? true
      : variantGroups.every((group) => !!selectedAttributes[group.name]);

  const isSelectionAvailable =
    isVariable && hasFullSelection
      ? !!selectedVariant || !!p?.isSelectionAvailable
      : true;

  const shouldHidePrice = isVariable && hasFullSelection && !isSelectionAvailable;
  const activePriceVariant = selectedVariant || p?.previewVariant || null;

  const displayPrice = useMemo(() => {
    if (shouldHidePrice) {
      return {
        oldPrice: null,
        finalPrice: null,
      };
    }

    if (activePriceVariant) {
      const oldPrice = toNum(activePriceVariant?.price);
      const finalPrice = getVariantFinalPrice(activePriceVariant);
      return {
        oldPrice: oldPrice > finalPrice ? oldPrice : null,
        finalPrice,
      };
    }

    const finalPrice = getProductFinalPrice(p);
    const oldPrice =
      typeof p?.normalPrice === "number"
        ? p.normalPrice
        : typeof p?.price === "number"
          ? p.price
          : null;

    return {
      oldPrice: oldPrice > finalPrice ? oldPrice : null,
      finalPrice,
    };
  }, [activePriceVariant, p, shouldHidePrice]);

  const stockQty = activePriceVariant
    ? toNum(activePriceVariant?.stockQty)
    : toNum(p?.availableStock);

  const inStock = isVariable
    ? hasFullSelection
      ? !!selectedVariant?.inStockNow
      : toNum(p?.availableStock) > 0
    : stockQty > 0;

  const discountPercent = shouldHidePrice
    ? 0
    : getDiscountPercent(displayPrice.oldPrice, displayPrice.finalPrice);

  const rating = 4.6;
  const reviewCount = 128;

  const specifications = useMemo(() => {
    const items = Array.isArray(p?.specifications) ? p.specifications : [];
    return items.filter((spec) => spec?.label && formatSpecValue(spec));
  }, [p?.specifications]);

  const extraSpecs = useMemo(() => {
    const rows = [];

    if (brandLabel) {
      rows.push({ label: "Brand", value: brandLabel });
    }

    return rows;
  }, [brandLabel]);

  const specRows = useMemo(() => {
    return [
      ...extraSpecs,
      ...specifications.map((spec) => ({
        label: spec.label,
        value: formatSpecValue(spec),
      })),
    ];
  }, [extraSpecs, specifications]);

  const descriptionBlocks = useMemo(() => {
    return Array.isArray(p?.description)
      ? [...p.description].sort((a, b) => (a?.order || 0) - (b?.order || 0))
      : [];
  }, [p?.description]);

  const highlights = useMemo(() => {
    const items = [];

    if (brandLabel) items.push({ label: "Brand", value: brandLabel });

    const productHighlights = Array.isArray(p?.highlights) ? p.highlights : [];
    productHighlights.slice(0, 3).forEach((value, index) => {
      items.push({
        label: `Highlight ${index + 1}`,
        value: String(value || "").trim(),
      });
    });

    return items.slice(0, 4);
  }, [brandLabel, p?.highlights]);

  const hasProvidedRelatedProducts =
    Array.isArray(relatedProducts) && relatedProducts.length > 0;

  useEffect(() => {
    let ignore = false;

    async function fetchRelatedProducts() {
      const slug = String(p?.slug || "").trim();

      if (!slug) {
        setApiRelatedProducts([]);
        setRelatedLoading(false);
        return;
      }

      if (hasProvidedRelatedProducts) {
        setApiRelatedProducts([]);
        setRelatedLoading(false);
        return;
      }

      if (relatedProductsCache.has(slug)) {
        setApiRelatedProducts(relatedProductsCache.get(slug) || []);
        setRelatedLoading(false);
        return;
      }

      try {
        setRelatedLoading(true);

        let request = relatedProductsRequests.get(slug);

        if (!request) {
          request = fetch(`/api/products/${slug}/related?limit=8`, {
            cache: "no-store",
          })
            .then(async (res) => {
              if (!res.ok) throw new Error(`Failed with status ${res.status}`);
              const data = await res.json();
              const products = Array.isArray(data?.products) ? data.products : [];
              relatedProductsCache.set(slug, products);
              return products;
            })
            .finally(() => {
              relatedProductsRequests.delete(slug);
            });

          relatedProductsRequests.set(slug, request);
        }

        const products = await request;

        if (!ignore) setApiRelatedProducts(products);
      } catch (error) {
        if (!ignore) {
          console.error("Failed to fetch related products:", error);
          setApiRelatedProducts([]);
        }
      } finally {
        if (!ignore) setRelatedLoading(false);
      }
    }

    fetchRelatedProducts();

    return () => {
      ignore = true;
    };
  }, [p?.slug, hasProvidedRelatedProducts]);

  const resolvedRelatedProducts = useMemo(() => {
    const source = hasProvidedRelatedProducts ? relatedProducts : apiRelatedProducts;

    const currentId = String(p?._id || "");
    const currentSlug = String(p?.slug || "");

    return (Array.isArray(source) ? source : []).filter((item) => {
      const sameId = currentId && String(item?._id || "") === currentId;
      const sameSlug = currentSlug && String(item?.slug || "") === currentSlug;
      return !sameId && !sameSlug;
    });
  }, [hasProvidedRelatedProducts, relatedProducts, apiRelatedProducts, p?._id, p?.slug]);

  useEffect(() => {
    setQty(1);
  }, [p?._id, p?.slug, selectedVariant?.barcode, p?.previewVariant?.barcode]);

  const handleSelectRelated = useCallback(
    (it) => {
      if (typeof onSelectRelated === "function") return onSelectRelated(it);
      const slug = it?.slug || it?._id || it?.id;
      if (slug) nav.push?.(`/product/${slug}`);
    },
    [onSelectRelated, nav]
  );

  const selectionSummary = useMemo(() => {
    if (!variantGroups.length) return "";
    return variantGroups
      .map((group) => {
        const value = selectedAttributes[group.name];
        if (!value) return null;
        return `${group.label}: ${value}`;
      })
      .filter(Boolean)
      .join(" · ");
  }, [variantGroups, selectedAttributes]);

  const subtotalText = useMemo(() => {
    if (shouldHidePrice) return "Not available";
    return formatBDT((displayPrice.finalPrice || 0) * qty);
  }, [shouldHidePrice, displayPrice.finalPrice, qty]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = title;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied.");
      }
    } catch {
      // ignore
    }
  }, [title]);

  const handleLoginSuccess = useCallback(async () => {
    window.dispatchEvent(new Event("auth-updated"));
    toast.success("Logged in successfully.");
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (isVariable && variantGroups.length && !hasFullSelection) {
      toast.error("Please choose all options first.");
      return;
    }

    if (isVariable && hasFullSelection && !isSelectionAvailable) {
      toast.error("This option combination is not available.");
      return;
    }

    if (!inStock) {
      toast.error("This product is out of stock.");
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

    const variantBarcode = extractVariantBarcodeFromProduct(p, selectedVariant);

    try {
      setAddingToCart(true);

      const payload = {
        action: "add",
        productId,
        variantBarcode,
        qty,
        snapshot: {
          title: resolveProductTitle(p),
          image:
            galleryImages?.[activeGalleryIndex] ||
            resolveProductImage(p),
          unitPrice: displayPrice.finalPrice || resolveProductSellingPrice(p),
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
      setAddingToCart(false);
    }
  }, [
    isVariable,
    variantGroups.length,
    hasFullSelection,
    isSelectionAvailable,
    inStock,
    p,
    selectedVariant,
    qty,
    galleryImages,
    activeGalleryIndex,
    displayPrice.finalPrice,
  ]);

  return (
    <div
      className="min-h-screen overflow-x-hidden font-sans"
      style={{
        background: PALETTE.bg,
        color: PALETTE.text,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2200,
          style: {
            background: "#fff",
            color: PALETTE.primary,
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 18px 45px rgba(15,23,42,.10)",
            borderRadius: "18px",
            fontWeight: 600,
          },
          success: {
            iconTheme: {
              primary: PALETTE.primary,
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: PALETTE.accent,
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid gap-8 lg:gap-6 xl:gap-7 lg:grid-cols-[0.88fr_1.12fr] xl:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="min-w-0">
            <Gallery
              galleryKey={galleryKey}
              images={galleryImages}
              activeIndex={activeGalleryIndex}
              title={title}
              inStock={inStock}
            />
            <FeatureCards />
          </div>

          <div className="min-w-0">
            <div
              className="rounded-[28px] bg-white p-4 sm:p-5"
              style={{
                border: `1px solid ${PALETTE.border}`,
                boxShadow: PALETTE.shadow,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {brandLabel ? (
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {brandLabel}
                    </div>
                  ) : null}

                  <h1 className="mt-2 text-[20px] font-semibold leading-[1.12] tracking-tight text-slate-900 sm:text-[24px]">
                    {title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Stars value={rating} />
                      <span className="text-sm font-medium text-slate-900">
                        {Number(rating).toFixed(1)}
                      </span>
                      <span className="text-sm text-slate-500">({reviewCount} reviews)</span>
                    </div>

                    {isVariable ? (
                      !hasFullSelection ? (
                        <Tag tone="neutral">Choose options</Tag>
                      ) : isSelectionAvailable ? (
                        inStock ? (
                          <Tag tone="success">In stock · {stockQty} left</Tag>
                        ) : (
                          <Tag tone="danger">Out of stock</Tag>
                        )
                      ) : (
                        <Tag tone="danger">Not available</Tag>
                      )
                    ) : inStock ? (
                      <Tag tone="success">In stock · {stockQty} left</Tag>
                    ) : (
                      <Tag tone="danger">Out of stock</Tag>
                    )}
                  </div>
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <ActionIconButton icon={FiHeart} label="Wishlist" />
                  <ActionIconButton icon={FiShare2} label="Share" onClick={handleShare} />
                </div>
              </div>

              <div
                className="mt-5 border-t pt-5"
                style={{ borderColor: PALETTE.borderSoft }}
              >
                <div className="flex flex-wrap items-end gap-3">
                  {shouldHidePrice ? (
                    <div className="text-[20px] font-semibold leading-none text-rose-600 sm:text-[22px]">
                      Not available
                    </div>
                  ) : (
                    <>
                      <div className="text-[22px] font-semibold leading-none text-slate-900 sm:text-[25px]">
                        {formatBDT(displayPrice.finalPrice)}
                      </div>

                      {displayPrice.oldPrice ? (
                        <div className="pb-1 text-[14px] font-medium text-slate-400 line-through">
                          {formatBDT(displayPrice.oldPrice)}
                        </div>
                      ) : null}

                      {discountPercent ? <Tag tone="accent">{discountPercent}% OFF</Tag> : null}
                    </>
                  )}
                </div>

                {!shouldHidePrice && displayPrice.oldPrice ? (
                  <p className="mt-2 text-sm text-slate-500">
                    You save {formatBDT(displayPrice.oldPrice - displayPrice.finalPrice)}
                  </p>
                ) : null}

                {shouldHidePrice ? (
                  <p className="mt-2 text-sm text-slate-500">
                    This option combination is currently not available.
                  </p>
                ) : null}
              </div>

              {highlights.length ? (
                <div
                  className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-4"
                  style={{ borderColor: PALETTE.borderSoft }}
                >
                  {highlights.map((item) => (
                    <HighlightItem
                      key={`${item.label}-${item.value}`}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </div>
              ) : null}

              {variantGroups.length ? (
                <div
                  className="mt-4 border-t pt-4"
                  style={{ borderColor: PALETTE.borderSoft }}
                >
                  <div className="space-y-4">
                    {variantGroups.map((group) => {
                      const isColorGroup = String(group.name).toLowerCase() === "color";

                      return (
                        <div key={group.name}>
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">
                              {group.label}
                            </div>
                            {selectedAttributes[group.name] ? (
                              <div
                                className={cn(
                                  "text-sm font-medium",
                                  isColorGroup ? "text-slate-500" : "text-slate-900"
                                )}
                              >
                                {selectedAttributes[group.name]}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2.5">
                            {group.options.map((opt) => {
                              const active = selectedAttributes[group.name] === opt;
                              const available = group.availableOptions?.includes(opt);

                              return (
                                <OptionPill
                                  key={opt}
                                  active={active}
                                  disabled={!available}
                                  isColor={isColorGroup}
                                  colorValue={opt}
                                  onClick={() =>
                                    setSelectedAttributes((prev) => ({
                                      ...prev,
                                      [group.name]: opt,
                                    }))
                                  }
                                >
                                  {opt}
                                </OptionPill>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectionSummary ? (
                    <div className="mt-3 text-sm text-slate-500">{selectionSummary}</div>
                  ) : null}
                </div>
              ) : null}

              <div
                className="mt-4 border-t pt-4"
                style={{ borderColor: PALETTE.borderSoft }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Quantity
                    </div>
                    <QuantitySelector
                      value={qty}
                      setValue={setQty}
                      max={stockQty || undefined}
                    />
                  </div>

                  <div className="text-sm text-slate-500">
                    Subtotal <span className="ml-1 font-semibold text-slate-900">{subtotalText}</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    style={{
                      background: PALETTE.primary,
                    }}
                    type="button"
                    disabled={
                      addingToCart ||
                      !isSelectionAvailable ||
                      !inStock ||
                      (isVariable && variantGroups.length > 0 && !hasFullSelection)
                    }
                    onClick={handleAddToCart}
                  >
                    <FiShoppingCart className="h-4 w-4" />
                    {addingToCart ? "Adding..." : "Add to Cart"}
                  </button>

                  <button
                    className="h-11 rounded-full px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${PALETTE.accent}, ${PALETTE.accentStrong})`,
                    }}
                    type="button"
                    disabled={!isSelectionAvailable || !inStock}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mt-12 rounded-[28px] bg-white p-5 sm:p-7"
          style={{
            border: `1px solid ${PALETTE.border}`,
            boxShadow: PALETTE.shadow,
          }}
        >
          <div
            className="flex flex-wrap items-center gap-3 border-b pb-5"
            style={{ borderColor: PALETTE.borderSoft }}
          >
            <SectionTabButton
              active={tab === "specification"}
              onClick={() => setTab("specification")}
              tone="dark"
            >
              Specification
            </SectionTabButton>

            <SectionTabButton
              active={tab === "description"}
              onClick={() => setTab("description")}
              tone="coral"
            >
              Description
            </SectionTabButton>
          </div>

          <div className="pt-8">
            {tab === "specification" ? (
              <div className="max-w-4xl">
                <h2 className="text-2xl font-semibold text-slate-900">Technical specifications</h2>

                <div className="mt-5">
                  {specRows.length ? (
                    specRows.map((row, i) => (
                      <SpecRow
                        key={`${row.label}-${i}`}
                        k={row.label}
                        v={String(row.value)}
                        index={i}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-slate-900 sm:text-base">
                      No specifications available.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {tab === "description" ? (
              <div className="max-w-4xl">
                {descriptionBlocks.length ? (
                  <div className="space-y-8">
                    {descriptionBlocks.map((block, i) => (
                      <div
                        key={`${block?.title || "block"}-${i}`}
                        className="border-b pb-8"
                        style={{ borderColor: PALETTE.borderSoft }}
                      >
                        {block?.title ? (
                          <h3 className="text-2xl font-semibold leading-snug text-slate-900">
                            {block.title}
                          </h3>
                        ) : null}

                        <div className="mt-4 whitespace-pre-line text-[15px] leading-8 text-slate-700">
                          {block?.details || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-900 sm:text-base">
                    Product description is not available right now.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-14">
          <RelatedProductsSlider
            items={resolvedRelatedProducts}
            onSelect={handleSelectRelated}
            loading={relatedLoading}
          />
        </div>
      </main>
    </div>
  );
}