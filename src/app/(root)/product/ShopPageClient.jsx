"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useNav from "@/Components/Utils/useNav";
import { Toaster, toast } from "react-hot-toast";
import {
  FiX,
  FiFilter,
  FiShoppingCart,
  FiTag,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiSliders,
  FiStar,
  FiGrid,
  FiLayers,
} from "react-icons/fi";
import { HiMiniFire } from "react-icons/hi2";
import LoginModal from "@/Components/UI/LoginModal";
import { useCart } from "@/Context/CartContext";

/* -------------------- THEME -------------------- */

const PALETTE = {
  navy: "#0f172a",
  navySoft: "#1e293b",
  coral: "#ff8a78",
  coralStrong: "#f47c68",
  coralSoft: "rgba(255,138,120,.10)",
  coralBtnStart: "#ff907f",
  coralBtnEnd: "#f07b69",
  gold: "#eab308",
  goldDeep: "#ca8a04",
  green: "#16a34a",
  greenSoft: "rgba(22,163,74,.10)",
  danger: "#dc2626",
  dangerSoft: "rgba(220,38,38,.08)",
  bg: "#ffffff",
  card: "#ffffff",
  cardTint: "#fbfbfc",
  imageBg: "#f7f8fa",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  lightBorder: "#edf0f2",
  softBorder: "rgba(15,23,42,.055)",
  shadow: "0 8px 30px rgba(15,23,42,.04)",
  premiumShadow: "0 10px 26px rgba(15,23,42,.075)",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");
const GRID = "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4";
const TAKA_IMAGE_SRC = "/assets/sign/taka.png";
const LIMIT = 24;

/* -------------------- UTILS -------------------- */

function formatPriceNumber(n) {
  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

const formatTK = (n) =>
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

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { cache: "no-store", ...options });
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

function titleCaseFromSlug(s) {
  return String(s || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
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

function isOnSaleProduct(p) {
  const normal = Number(p?.normalPrice ?? 0);
  const selling = Number(resolveProductSellingPrice(p) ?? 0);
  return normal > 0 && selling > 0 && selling < normal;
}

function getEffectivePrice(p) {
  return Number(resolveProductSellingPrice(p) || 0);
}

function isInStockProduct(p) {
  if (typeof p?.inStockNow === "boolean") return p.inStockNow;
  return Number(p?.availableStock ?? 0) > 0;
}

function resolveProductTags(p) {
  const raw =
    p?.tags ||
    p?.badges ||
    p?.highlights ||
    p?.keywords ||
    p?.features ||
    [];

  let arr = [];

  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === "string") {
    arr = raw.split(",").map((x) => x.trim());
  }

  const cleaned = arr
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item?.name === "string") return item.name.trim();
      if (typeof item?.label === "string") return item.label.trim();
      return "";
    })
    .filter(Boolean);

  if (cleaned.length) return cleaned.slice(0, 2);

  const fallback = [];
  if (isOnSaleProduct(p)) fallback.push("Hot Deal");
  if (p?.isNew || p?.newArrival || p?.arrivalType === "new") fallback.push("New Arrival");
  if (!fallback.length) fallback.push("New Arrival");

  return fallback.slice(0, 2);
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

function isNewArrivalProduct(p) {
  return !!(p?.isNew || p?.newArrival || p?.arrivalType === "new");
}

function resolveProductStatusTag(p) {
  if (isOnSaleProduct(p)) return "Hot Deal";
  if (isNewArrivalProduct(p)) return "New Arrival";
  return "";
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
    coralSolid: {
      bg: PALETTE.coralStrong,
      fg: "#ffffff",
      border: PALETTE.coralStrong,
    },
    gold: {
      bg: "rgba(234,179,8,.10)",
      fg: "#8a6700",
      border: "rgba(234,179,8,.18)",
    },
    success: {
      bg: PALETTE.greenSoft,
      fg: PALETTE.green,
      border: "rgba(22,163,74,.18)",
    },
    danger: {
      bg: PALETTE.dangerSoft,
      fg: "#b91c1c",
      border: "rgba(239,68,68,.18)",
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
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm"
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

function Surface({ children, className = "", padded = true }) {
  return (
    <div
      className={cn("rounded-[1.5rem] bg-white", padded ? "p-5 sm:p-6" : "", className)}
      style={{
        border: `1px solid ${PALETTE.border}`,
        boxShadow: PALETTE.shadow,
      }}
    >
      {children}
    </div>
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

/* -------------------- SECTION HEADER -------------------- */

function SectionHeader({ title, accent = "coral", rightSlot, subtitle }) {
  const accentColor = accent === "gold" ? PALETTE.gold : PALETTE.coral;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2
              className="text-[24px] font-bold tracking-tight sm:text-[34px] md:text-[36px] leading-tight"
              style={{ color: PALETTE.navy }}
            >
              {title}
            </h2>
            <span
              className="hidden h-2 w-2 rounded-full sm:inline-block"
              style={{ background: accentColor }}
            />
          </div>
        </div>

        {rightSlot ? <div className="shrink-0 flex items-center">{rightSlot}</div> : null}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="h-[3px] w-10 rounded-full" style={{ background: accentColor }} />
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
  );
}

/* -------------------- SMALL UI PRIMS -------------------- */

function IconBtn({ onClick, children, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center rounded-full bg-white p-2.5 hover:bg-slate-50 active:scale-[0.98]"
      style={{ border: `1px solid ${PALETTE.border}` }}
    >
      {children}
    </button>
  );
}

function Chip({ children, onRemove }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-medium"
      style={{
        background: "white",
        color: PALETTE.navy,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 8px 20px rgba(15,23,42,.05)",
      }}
    >
      <span>{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-slate-100"
          aria-label="Remove filter"
        >
          <FiX className="h-3.5 w-3.5" />
        </button>
      ) : null}
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
  const brandLabel = p?.brand?.name || p?.brandName || "";
  const rating = resolveProductRating(p);
  const statusTag = resolveProductStatusTag(p);
  const tags = resolveProductTags(p);

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
      title={clickable ? "Open product" : "Missing slug"}
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

        <div className="absolute right-2.5 top-2.5 z-10 sm:right-3 sm:top-3">
          {hasDiscount ? (
            <FlatBadge tone="coralSolid">
              <FiTag className="h-3.5 w-3.5" />
              {pctOff(displayPrice, normal)}% OFF
            </FlatBadge>
          ) : null}
        </div>

        <div className="relative z-[2] h-40 sm:h-52 lg:h-60 w-full overflow-hidden">
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
          {brandLabel ? (
            <div
              className="mb-0.5 line-clamp-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "#94a3b8" }}
            >
              {brandLabel}
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
          ) : tags?.[0] ? (
            <div
              className="text-[9px] font-medium sm:text-[10px]"
              style={{ color: PALETTE.muted }}
            >
              {tags[0]}
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
              {!inStock
                ? "Currently unavailable"
                : hasDiscount
                ? `You save ${formatTK(oldPrice - displayPrice)}`
                : `${Number(p?.availableStock ?? 0)} available now`}
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

/* -------------------- HERO -------------------- */

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
          alt="Products Banner"
          className="absolute inset-0 block h-full w-full object-contain sm:object-cover object-center"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
}

/* -------------------- FILTER UI -------------------- */

function FilterShell({ title, right, children }) {
  return (
    <Surface className="rounded-[1.5rem]" padded>
      <div className="flex items-center gap-2">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium"
          style={{ background: "#f8fafc", color: PALETTE.navy, border: `1px solid ${PALETTE.border}` }}
        >
          <FiFilter className="h-4 w-4" />
          {title}
        </div>
        {right ? <div className="ml-auto">{right}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </Surface>
  );
}

function Select({ value, onChange, options, label, disabled = false }) {
  return (
    <label className="block">
      <div
        className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em]"
        style={{ color: PALETTE.muted }}
      >
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full cursor-pointer rounded-2xl bg-white px-3 py-3 text-[13px] font-medium outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
      >
        {(options || []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Pill({ active, children, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] font-medium transition active:scale-[0.99]"
      style={{
        background: active ? PALETTE.navy : "#fff",
        color: active ? "#fff" : PALETTE.navy,
        border: `1px solid ${active ? PALETTE.navy : PALETTE.border}`,
        boxShadow: active ? "0 10px 26px rgba(15,23,42,.08)" : "none",
      }}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function PriceInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <div
        className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em]"
        style={{ color: PALETTE.muted }}
      >
        {label}
      </div>
      <div className="relative">
        <FiDollarSign
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: PALETTE.muted }}
        />
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-white py-3 pl-9 pr-3 text-[13px] font-medium outline-none focus:ring-0"
          style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
        />
      </div>
    </label>
  );
}

/* -------------------- MOBILE FILTER DRAWER -------------------- */

function MobileFilterDrawer({ open, onClose, children, title = "Filters" }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={cn("fixed inset-0 z-[60]", open ? "" : "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        style={{ background: "rgba(2,6,23,0.45)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "absolute right-0 top-0 h-full bg-white",
          "w-[96vw] max-w-none sm:w-[640px] md:w-[680px] lg:w-[720px]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ boxShadow: "0 30px 80px rgba(15,23,42,.18)" }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex h-full flex-col">
          <div
            className="flex items-center gap-2 border-b px-4 py-4"
            style={{ borderColor: PALETTE.border }}
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium"
              style={{ background: "#f8fafc", color: PALETTE.navy, border: `1px solid ${PALETTE.border}` }}
            >
              <FiSliders className="h-4 w-4" />
              {title}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-2xl px-3 py-2 text-[12px] font-medium hover:bg-slate-50"
              style={{ color: PALETTE.navy }}
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">{children}</div>

          <div className="border-t p-4" style={{ borderColor: PALETTE.border }}>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[12px] font-medium text-white shadow-md active:scale-[0.99]"
              style={{ backgroundColor: PALETTE.navy }}
            >
              Done <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- SKELETONS -------------------- */

function CardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[1.35rem] bg-white"
      style={{
        border: `1px solid ${PALETTE.softBorder}`,
        boxShadow: PALETTE.premiumShadow,
      }}
    >
      <div
        className="h-40 sm:h-56 lg:h-60"
        style={{
          background:
            "linear-gradient(90deg, rgba(15,23,42,.05), rgba(15,23,42,.10), rgba(15,23,42,.05))",
        }}
      />
      <div className="p-3 sm:p-4">
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

/* -------------------- PAGE -------------------- */

export default function ShopPageClient({
  bannerImage = "https://rewardmobile.co.uk/wp-content/uploads/2023/09/Apple-iPhone-15-promo-banner-buy-now-scaled.jpg",
  defaultSubtitle = "Search, filter, and sort products quickly.",
  initialQ = "",
  initialCategorySlug = "",
  initialSubSlug = "",
  initialBrand = "",
  initialItems = [],
  initialBanner = "",
  initialHasMore = false,
  initialServerTotal = 0,
  initialCategories = [],
  initialBrands = [],
  initialError = "",
}) {
  const nav = useNav();
  const { addToCart } = useCart();

  const [q, setQ] = useState(String(initialQ || "").trim());
  const [categorySlug, setCategorySlug] = useState(String(initialCategorySlug || "").trim());
  const [subSlug, setSubSlug] = useState(String(initialSubSlug || "").trim());
  const [brand, setBrand] = useState(String(initialBrand || "").trim());

  const [only, setOnly] = useState("");
  const [sort, setSort] = useState("latest");
  const [inStock, setInStock] = useState("");

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [pricePreset, setPricePreset] = useState("");
  const [saleOnly, setSaleOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [serverItems, setServerItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(initialError);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [addingId, setAddingId] = useState("");

  const [categories] = useState(initialCategories);
  const [brands] = useState(initialBrands);
  const [filterDataLoading] = useState(false);

  const [hasMore, setHasMore] = useState(initialHasMore);
  const [apiBanner, setApiBanner] = useState(initialBanner || null);

  const topRef = useRef(null);
  const didMountRef = useRef(false);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => String(c?.slug) === String(categorySlug)) || null;
  }, [categories, categorySlug]);

  const subcategoryOptions = useMemo(() => {
    const subs = Array.isArray(selectedCategory?.subcategories)
      ? selectedCategory.subcategories
      : [];
    return subs;
  }, [selectedCategory]);

  const selectedBrandName = useMemo(() => {
    return brands.find((b) => b.slug === brand)?.name || titleCaseFromSlug(brand);
  }, [brands, brand]);

  const selectedCategoryName = useMemo(() => {
    return selectedCategory?.name || titleCaseFromSlug(categorySlug);
  }, [selectedCategory, categorySlug]);

  const selectedSubcategoryName = useMemo(() => {
    return subcategoryOptions.find((s) => s.slug === subSlug)?.name || titleCaseFromSlug(subSlug);
  }, [subcategoryOptions, subSlug]);

  const serverTotal = serverItems.length || initialServerTotal || 0;

  const items = useMemo(() => {
    let arr = [...serverItems];

    if (saleOnly) {
      arr = arr.filter((p) => isOnSaleProduct(p));
    }

    if (priceMin !== "") {
      const min = Number(priceMin || 0);
      arr = arr.filter((p) => getEffectivePrice(p) >= min);
    }

    if (priceMax !== "") {
      const max = Number(priceMax || 0);
      arr = arr.filter((p) => getEffectivePrice(p) <= max);
    }

    if (sort === "name_asc") {
      arr.sort((a, b) => String(resolveProductTitle(a)).localeCompare(String(resolveProductTitle(b))));
    } else if (sort === "name_desc") {
      arr.sort((a, b) => String(resolveProductTitle(b)).localeCompare(String(resolveProductTitle(a))));
    } else if (sort === "oldest") {
      arr.sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));
    }

    return arr;
  }, [serverItems, saleOnly, priceMin, priceMax, sort]);

  const handleLoginSuccess = useCallback(async () => {
    window.dispatchEvent(new Event("auth-updated"));
    toast.success("Logged in successfully.");
  }, []);

  const onAdd = useCallback(
    async (p) => {
      if (!isInStockProduct(p)) {
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

      const requestId = String(productId);
      setAddingId(requestId);

      try {
        const res = await addToCart({
          productId,
          variantBarcode: extractVariantBarcode(p),
          qty: 1,
          snapshot: {
            title: resolveProductTitle(p),
            image: resolveProductImage(p),
            unitPrice: resolveProductSellingPrice(p),
          },
        });

        if (!res?.ok) {
          if (res?.auth === false) {
            setShowLoginModal(true);
            toast.error("Please login first.");
            return;
          }

          toast.error(res?.message || "Failed to add item to cart.");
          return;
        }

        toast.success("Added to cart.");
      } catch {
        toast.error("Failed to add item to cart.");
      } finally {
        setAddingId("");
      }
    },
    [addToCart]
  );

  const openProduct = useCallback(
    (p) => {
      const slug = String(p?.slug || "").trim();
      if (!slug) return;
      nav.push(`/product/${encodeURIComponent(slug)}`);
    },
    [nav]
  );

  useEffect(() => {
    if (!categorySlug) {
      setSubSlug("");
      return;
    }

    const currentCategory = categories.find((c) => c.slug === categorySlug);
    if (!currentCategory) {
      setSubSlug("");
      return;
    }

    const exists = (currentCategory.subcategories || []).some((s) => s.slug === subSlug);
    if (!exists) setSubSlug("");
  }, [categorySlug, categories, subSlug]);

  const headerTitle = useMemo(() => {
    if (subSlug) return selectedSubcategoryName || "Shop";
    if (categorySlug) return selectedCategoryName || "Shop";
    if (brand) return `${selectedBrandName || "Brand"} Products`;
    return "Shop";
  }, [subSlug, categorySlug, brand, selectedSubcategoryName, selectedCategoryName, selectedBrandName]);

  const headerSubtitle = useMemo(() => {
    const parts = [];

    if (categorySlug) parts.push(`Category: ${selectedCategoryName || categorySlug}`);
    if (subSlug) parts.push(`Sub-category: ${selectedSubcategoryName || subSlug}`);
    if (brand) parts.push(`Brand: ${selectedBrandName || brand}`);
    if (q) parts.push(`Search: “${q}”`);
    if (only) parts.push(`Only: ${only}`);
    if (inStock === "1") parts.push("Stock: in");
    if (inStock === "0") parts.push("Stock: out");
    if (sort === "price_asc") parts.push("Sort: price low→high");
    if (sort === "price_desc") parts.push("Sort: price high→low");
    if (sort === "oldest") parts.push("Sort: oldest");
    if (sort === "name_asc") parts.push("Sort: name A→Z");
    if (sort === "name_desc") parts.push("Sort: name Z→A");
    if (saleOnly) parts.push("On sale only");
    if (priceMin || priceMax) {
      parts.push(
        `Price: ${priceMin ? formatTK(priceMin) : "Any"} - ${priceMax ? formatTK(priceMax) : "Any"}`
      );
    }

    return parts.length ? parts.join(" • ") : defaultSubtitle;
  }, [
    categorySlug,
    subSlug,
    brand,
    q,
    only,
    inStock,
    sort,
    saleOnly,
    priceMin,
    priceMax,
    selectedCategoryName,
    selectedSubcategoryName,
    selectedBrandName,
    defaultSubtitle,
  ]);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if ((q || "").trim()) n += 1;
    if (categorySlug) n += 1;
    if (subSlug) n += 1;
    if (brand) n += 1;
    if (only) n += 1;
    if (sort && sort !== "latest") n += 1;
    if (inStock !== "") n += 1;
    if (saleOnly) n += 1;
    if (priceMin || priceMax) n += 1;
    return n;
  }, [q, categorySlug, subSlug, brand, only, sort, inStock, saleOnly, priceMin, priceMax]);

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        q,
        categorySlug,
        subSlug,
        brand,
        only,
        sort,
        inStock,
        page,
      }),
    [q, categorySlug, subSlug, brand, only, sort, inStock, page]
  );

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const apiSort =
          sort === "price_asc" || sort === "price_desc" || sort === "latest"
            ? sort
            : "latest";

        const qs = buildQS({
          q: q || "",
          brand: brand || "",
          only: only || "",
          sort: apiSort,
          inStock: inStock === "" ? "" : inStock,
          categorySlug: categorySlug || "",
          subSlug: subSlug || "",
          limit: LIMIT,
          page,
        });

        const data = await fetchJSON(`/api/products${qs}`);
        if (!alive) return;

        const incoming = Array.isArray(data?.products) ? data.products : [];

        setServerItems((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
        setApiBanner(data?.banner?.url || "");
        setHasMore(incoming.length === LIMIT);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load products");
        if (page === 1) setServerItems([]);
        setHasMore(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [requestKey]);

  const applyPricePreset = useCallback((preset) => {
    setPricePreset(preset);

    if (preset === "under_5000") {
      setPriceMin("");
      setPriceMax("5000");
      return;
    }

    if (preset === "5000_15000") {
      setPriceMin("5000");
      setPriceMax("15000");
      return;
    }

    if (preset === "15000_30000") {
      setPriceMin("15000");
      setPriceMax("30000");
      return;
    }

    if (preset === "30000_plus") {
      setPriceMin("30000");
      setPriceMax("");
      return;
    }

    setPriceMin("");
    setPriceMax("");
  }, []);

  const clearAll = useCallback(() => {
    setQ("");
    setCategorySlug("");
    setSubSlug("");
    setBrand("");
    setOnly("");
    setSort("latest");
    setInStock("");
    setPriceMin("");
    setPriceMax("");
    setPricePreset("");
    setSaleOnly(false);
    setPage(1);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const filtersRightSlot = activeFiltersCount ? (
    <button
      type="button"
      onClick={clearAll}
      className="cursor-pointer rounded-full bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50 active:scale-[0.98]"
      style={{ color: PALETTE.navy, border: `1px solid ${PALETTE.border}` }}
    >
      Clear ({activeFiltersCount})
    </button>
  ) : null;

  const activeChips = useMemo(() => {
    const chips = [];

    if (q) {
      chips.push({
        key: "q",
        label: `Search: ${q}`,
        remove: () => setQ(""),
      });
    }

    if (categorySlug) {
      chips.push({
        key: "category",
        label: `Category: ${selectedCategoryName || titleCaseFromSlug(categorySlug)}`,
        remove: () => {
          setCategorySlug("");
          setSubSlug("");
        },
      });
    }

    if (subSlug) {
      chips.push({
        key: "subcategory",
        label: `Sub-category: ${selectedSubcategoryName || titleCaseFromSlug(subSlug)}`,
        remove: () => setSubSlug(""),
      });
    }

    if (brand) {
      chips.push({
        key: "brand",
        label: `Brand: ${selectedBrandName || titleCaseFromSlug(brand)}`,
        remove: () => setBrand(""),
      });
    }

    if (only) {
      chips.push({
        key: "only",
        label: `Only: ${titleCaseFromSlug(only)}`,
        remove: () => setOnly(""),
      });
    }

    if (inStock === "1") {
      chips.push({
        key: "inStock",
        label: "In stock",
        remove: () => setInStock(""),
      });
    }

    if (inStock === "0") {
      chips.push({
        key: "outStock",
        label: "Out of stock",
        remove: () => setInStock(""),
      });
    }

    if (sort !== "latest") {
      chips.push({
        key: "sort",
        label:
          sort === "price_asc"
            ? "Price low → high"
            : sort === "price_desc"
            ? "Price high → low"
            : sort === "name_asc"
            ? "Name A → Z"
            : sort === "name_desc"
            ? "Name Z → A"
            : sort === "oldest"
            ? "Oldest"
            : titleCaseFromSlug(sort),
        remove: () => setSort("latest"),
      });
    }

    if (saleOnly) {
      chips.push({
        key: "saleOnly",
        label: "On sale",
        remove: () => setSaleOnly(false),
      });
    }

    if (priceMin || priceMax) {
      chips.push({
        key: "price",
        label: `Price: ${priceMin ? formatTK(priceMin) : "Any"} - ${priceMax ? formatTK(priceMax) : "Any"}`,
        remove: () => {
          setPriceMin("");
          setPriceMax("");
          setPricePreset("");
        },
      });
    }

    return chips;
  }, [
    q,
    categorySlug,
    subSlug,
    brand,
    only,
    inStock,
    sort,
    saleOnly,
    priceMin,
    priceMax,
    selectedCategoryName,
    selectedSubcategoryName,
    selectedBrandName,
  ]);

  const FiltersContent = (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-[1.25rem] border p-4"
        style={{
          borderColor: PALETTE.border,
          background:
            "linear-gradient(to bottom, rgba(15,23,42,.03), rgba(255,255,255,1))",
        }}
      >
        <div
          className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]"
          style={{ color: PALETTE.navy }}
        >
          Quick filters
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Pill active={only === ""} onClick={() => setOnly("")}>
            All
          </Pill>
          <Pill active={only === "new"} onClick={() => setOnly("new")} icon={FiClock}>
            New
          </Pill>
          <Pill active={only === "trending"} onClick={() => setOnly("trending")}>
            Trending
          </Pill>
          <Pill active={saleOnly} onClick={() => setSaleOnly((v) => !v)} icon={FiTag}>
            On Sale
          </Pill>
        </div>
      </div>

      <div
        className="rounded-[1.25rem] border p-4"
        style={{ borderColor: PALETTE.border }}
      >
        <div className="flex items-center gap-2">
          <div
            className="text-[12px] font-medium uppercase tracking-[0.12em]"
            style={{ color: PALETTE.navy }}
          >
            Browse filters
          </div>
          <FlatBadge tone="coral">
            <FiGrid className="h-3.5 w-3.5" />
            Smart
          </FlatBadge>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3">
          <Select
            label="Category"
            value={categorySlug}
            onChange={(v) => {
              setCategorySlug(v);
              setSubSlug("");
              setPage(1);
            }}
            disabled={filterDataLoading}
            options={[
              { value: "", label: filterDataLoading ? "Loading categories..." : "All categories" },
              ...categories.map((c) => ({
                value: c.slug,
                label: c.name,
              })),
            ]}
          />

          <Select
            label="Sub-category"
            value={subSlug}
            onChange={(v) => {
              setSubSlug(v);
              setPage(1);
            }}
            disabled={!categorySlug || filterDataLoading}
            options={[
              {
                value: "",
                label: !categorySlug
                  ? "Select category first"
                  : "All sub-categories",
              },
              ...subcategoryOptions.map((s) => ({
                value: s.slug,
                label: s.name,
              })),
            ]}
          />

          <Select
            label="Brand"
            value={brand}
            onChange={(v) => {
              setBrand(v);
              setPage(1);
            }}
            disabled={filterDataLoading}
            options={[
              { value: "", label: filterDataLoading ? "Loading brands..." : "All brands" },
              ...brands.map((b) => ({
                value: b.slug,
                label: b.name,
              })),
            ]}
          />
        </div>
      </div>

      <div
        className="rounded-[1.25rem] border p-4"
        style={{ borderColor: PALETTE.border }}
      >
        <div
          className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]"
          style={{ color: PALETTE.navy }}
        >
          Core filters
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Select
            label="Only"
            value={only}
            onChange={(v) => {
              setOnly(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "All" },
              { value: "trending", label: "Trending" },
              { value: "new", label: "New" },
            ]}
          />

          <Select
            label="Stock"
            value={inStock}
            onChange={(v) => {
              setInStock(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "Any stock" },
              { value: "1", label: "In stock" },
              { value: "0", label: "Out of stock" },
            ]}
          />

          <Select
            label="Sort"
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
            options={[
              { value: "latest", label: "Latest" },
              { value: "price_asc", label: "Price: Low → High" },
              { value: "price_desc", label: "Price: High → Low" },
              { value: "oldest", label: "Oldest" },
              { value: "name_asc", label: "Name: A → Z" },
              { value: "name_desc", label: "Name: Z → A" },
            ]}
          />
        </div>
      </div>

      <div
        className="rounded-[1.25rem] border p-4"
        style={{ borderColor: PALETTE.border }}
      >
        <div className="flex items-center gap-2">
          <div
            className="text-[12px] font-medium uppercase tracking-[0.12em]"
            style={{ color: PALETTE.navy }}
          >
            Price range
          </div>
          <FlatBadge tone="gold">New</FlatBadge>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <PriceInput
            label="Min price"
            value={priceMin}
            onChange={(v) => {
              setPricePreset("");
              setPriceMin(v);
            }}
            placeholder="0"
          />

          <PriceInput
            label="Max price"
            value={priceMax}
            onChange={(v) => {
              setPricePreset("");
              setPriceMax(v);
            }}
            placeholder="50000"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Pill
            active={pricePreset === "under_5000"}
            onClick={() =>
              applyPricePreset(pricePreset === "under_5000" ? "" : "under_5000")
            }
          >
            Under ৳5k
          </Pill>

          <Pill
            active={pricePreset === "5000_15000"}
            onClick={() =>
              applyPricePreset(pricePreset === "5000_15000" ? "" : "5000_15000")
            }
          >
            ৳5k - ৳15k
          </Pill>

          <Pill
            active={pricePreset === "15000_30000"}
            onClick={() =>
              applyPricePreset(pricePreset === "15000_30000" ? "" : "15000_30000")
            }
          >
            ৳15k - ৳30k
          </Pill>

          <Pill
            active={pricePreset === "30000_plus"}
            onClick={() =>
              applyPricePreset(pricePreset === "30000_plus" ? "" : "30000_plus")
            }
          >
            Premium
          </Pill>
        </div>
      </div>

      <div
        className="rounded-[1.25rem] border bg-white p-4"
        style={{ borderColor: PALETTE.border }}
      >
        <div className="flex items-center gap-2">
          <div
            className="text-[11px] font-medium uppercase tracking-[0.12em]"
            style={{ color: PALETTE.muted }}
          >
            Current view
          </div>
          <FlatBadge tone="navy">
            <FiLayers className="h-3.5 w-3.5" />
            {serverTotal} items
          </FlatBadge>
        </div>

        <div
          className="mt-2 text-[14px] font-medium"
          style={{ color: PALETTE.navy }}
        >
          {headerTitle}
        </div>

        <div
          className="mt-1 text-[12px] font-medium leading-6"
          style={{ color: PALETTE.muted }}
        >
          {headerSubtitle}
        </div>
      </div>

      {activeFiltersCount ? (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-[12px] font-medium hover:bg-slate-50 active:scale-[0.99]"
          style={{
            color: PALETTE.navy,
            border: `1px solid ${PALETTE.border}`,
          }}
        >
          <FiRefreshCw className="h-4 w-4" />
          Reset all filters ({activeFiltersCount})
        </button>
      ) : null}
    </div>
  );

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
            "linear-gradient(to bottom, rgba(15,23,42,.08), rgba(255,138,120,.06), rgba(234,179,8,.04), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8" ref={topRef}>
        <section className="mt-0">
          <DealsHeroBanner image={apiBanner || bannerImage} />
        </section>

        <section className="mt-8">
          <SectionHeader
            title={headerTitle}
            accent="coral"
            subtitle={headerSubtitle}
            rightSlot={
              <div className="flex flex-wrap items-center gap-2">
                {activeFiltersCount ? (
                  <IconBtn onClick={clearAll} ariaLabel="Clear filters">
                    <FiX className="h-4 w-4" style={{ color: PALETTE.navy }} />
                  </IconBtn>
                ) : null}

                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="md:hidden shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2.5 text-[12px] font-medium hover:bg-slate-50 active:scale-[0.98]"
                  style={{ color: PALETTE.navy, border: `1px solid ${PALETTE.border}` }}
                >
                  <FiFilter className="h-4 w-4" />
                  Filters{activeFiltersCount ? ` (${activeFiltersCount})` : ""}
                </button>
              </div>
            }
          />
        </section>

        {activeChips.length ? (
          <section className="mt-5">
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <Chip key={chip.key} onRemove={chip.remove}>
                  {chip.label}
                </Chip>
              ))}
            </div>
          </section>
        ) : null}

        <MobileFilterDrawer open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)}>
          {FiltersContent}
        </MobileFilterDrawer>

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <aside className="hidden md:block lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-24">
              <FilterShell title="Filters" right={filtersRightSlot}>
                {FiltersContent}
              </FilterShell>
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9">
            {err ? (
              <Surface className="mt-2 text-sm font-medium" padded>
                <div style={{ color: PALETTE.navy }}>{err}</div>
              </Surface>
            ) : null}

            {(loading && page === 1) || filterDataLoading ? (
              <div className={cn("mt-2", GRID)}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                <div className={cn("mt-2", GRID)}>
                  {(items || []).map((p) => (
                    <ProductCard
                      key={p?._id || p?.slug}
                      p={p}
                      onAdd={onAdd}
                      onOpen={openProduct}
                      adding={addingId === String(p?._id || p?.id || p?.slug || "")}
                    />
                  ))}
                </div>

                {!loading && !err && items?.length === 0 ? (
                  <Surface className="mt-6" padded>
                    <div className="text-sm font-medium" style={{ color: PALETTE.navy }}>
                      No products found for the selected filters.
                    </div>
                  </Surface>
                ) : null}
              </>
            )}

            {hasMore ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white shadow-md active:scale-[0.99] disabled:opacity-60"
                  style={{ backgroundColor: PALETTE.navy }}
                >
                  {loading ? "Loading..." : "See more"}
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {!hasMore && items?.length > 0 ? (
              <div
                className="mt-8 text-center text-[12px] font-medium"
                style={{ color: PALETTE.muted }}
              >
                You’ve reached the end.
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}