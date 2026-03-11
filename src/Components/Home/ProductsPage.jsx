"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useNav from "@/Components/Utils/useNav";
import { Toaster, toast } from "react-hot-toast";
import {
  FiSearch,
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
} from "react-icons/fi";
import { HiMiniFire } from "react-icons/hi2";

/* -------------------- THEME -------------------- */

const PALETTE = {
  navy: "#0f172a",
  navySoft: "#1e293b",
  coral: "#ff7e69",
  coralStrong: "#f96d57",
  coralSoft: "rgba(255,126,105,.10)",
  gold: "#eab308",
  green: "#16a34a",
  greenSoft: "rgba(22,163,74,.10)",
  danger: "#dc2626",
  dangerSoft: "rgba(220,38,38,.08)",
  bg: "#ffffff",
  bgTint: "#f8fafc",
  card: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  lightBorder: "#edf0f2",
  shadow: "0 8px 30px rgba(15,23,42,.04)",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");
const GRID = "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4";

/* -------------------- UTILS -------------------- */

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

const titleCaseFromSlug = (s) =>
  String(s || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

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
      border: "rgba(255,126,105,.20)",
    },
    coralSolid: {
      bg: PALETTE.coralStrong,
      fg: "#ffffff",
      border: PALETTE.coralStrong,
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
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[1.25rem]">
      <div
        className="absolute right-[-54px] top-[22px] w-[220px] rotate-45 py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}
      >
        Out of Stock
      </div>
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
              <FiShoppingCart className="h-6 w-6" style={{ color: PALETTE.coral }} />
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
              You need to sign in before adding items to your cart. Your cart is linked to your account.
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

/* -------------------- SECTION HEADER -------------------- */

function SectionHeader({ title, accent = "coral", rightSlot, subtitle }) {
  const accentColor = accent === "gold" ? PALETTE.gold : PALETTE.coral;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
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

      {rightSlot ? <div className="flex">{rightSlot}</div> : null}
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
  const offPct = hasDiscount ? pctOff(displayPrice, normal) : 0;

  const inStock = isInStockProduct(p);
  const availableStock = Number(p?.availableStock ?? 0);
  const title = p?.name || p?.title || "Untitled";
  const brand = p?.brand?.name || p?.brandName || "";
  const tags = resolveProductTags(p);
  const rating = resolveProductRating(p);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => (clickable ? onOpen?.(p) : null)}
      onKeyDown={(e) =>
        clickable && (e.key === "Enter" || e.key === " ") ? onOpen?.(p) : null
      }
      className={cn(
        "group h-full overflow-hidden rounded-[1.35rem] bg-white transition duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-black/10",
        "flex flex-col",
        clickable ? "cursor-pointer hover:-translate-y-1" : "cursor-not-allowed opacity-70"
      )}
      style={{
        border: `1px solid ${PALETTE.border}`,
        boxShadow: noShadow ? "none" : PALETTE.shadow,
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
        <StockRibbon show={!inStock} />

        <div className="absolute right-2.5 top-2.5 z-10 sm:right-3 sm:top-3">
          {hasDiscount ? (
            <FlatBadge tone="coralSolid">
              <FiTag className="h-3.5 w-3.5" />
              {offPct}% OFF
            </FlatBadge>
          ) : null}
        </div>

        <div className="flex h-40 items-center justify-center p-3 sm:h-52 sm:p-4 lg:h-60">
          <img
            src={resolveProductImage(p)}
            alt={title}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-contain transition-transform duration-500 ease-out will-change-transform",
              !inStock ? "grayscale-[20%] opacity-80" : "",
              clickable ? "group-hover:scale-[1.03]" : ""
            )}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/5 via-transparent to-transparent sm:h-16" />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="min-h-[48px] sm:min-h-[56px]">
          <div className="line-clamp-2 text-[14px] font-semibold leading-[1.3] tracking-tight text-slate-900 sm:text-[16px] sm:leading-snug">
            {title}
          </div>

          {brand ? (
            <div
              className="mt-1 line-clamp-1 text-[11px] font-medium sm:text-[12px]"
              style={{ color: PALETTE.muted }}
            >
              {brand}
            </div>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-[11px]"
            style={{
              background: "rgba(234,179,8,.12)",
              color: "#8a6700",
              border: "1px solid rgba(234,179,8,.18)",
            }}
          >
            <FiStar className="h-3.5 w-3.5 fill-current" />
            {Number(rating).toFixed(1)}
          </div>

          {tags.map((tag, idx) => {
            const isHotDeal = tag.toLowerCase() === "hot deal";
            const isNewArrival = tag.toLowerCase() === "new arrival";

            return (
              <span
                key={`${tag}-${idx}`}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-[11px]"
                style={{
                  background: isHotDeal
                    ? "rgba(255,126,105,.12)"
                    : isNewArrival
                    ? "rgba(234,179,8,.10)"
                    : "#f8fafc",
                  color: isHotDeal
                    ? PALETTE.coralStrong
                    : isNewArrival
                    ? "#8a6700"
                    : PALETTE.navy,
                  border: isHotDeal
                    ? "1px solid rgba(255,126,105,.18)"
                    : isNewArrival
                    ? "1px solid rgba(234,179,8,.18)"
                    : `1px solid ${PALETTE.border}`,
                }}
              >
                {isHotDeal ? <HiMiniFire className="h-3.5 w-3.5" /> : null}
                {tag}
              </span>
            );
          })}
        </div>

        <div className="mt-auto pt-3 sm:pt-4">
          <div className="flex items-end justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-end gap-x-2 gap-y-0.5">
                <div
                  className="text-[14px] font-semibold leading-none sm:text-[16px]"
                  style={{ color: PALETTE.navy }}
                >
                  {formatTK(displayPrice)}
                </div>

                {hasDiscount ? (
                  <div className="text-[11px] font-medium leading-none text-slate-400 line-through sm:text-[12px]">
                    {formatTK(oldPrice)}
                  </div>
                ) : null}
              </div>

              <div
                className="mt-1 line-clamp-1 text-[10px] font-medium leading-[1.25] sm:text-[11px]"
                style={{ color: PALETTE.muted }}
              >
                {!inStock
                  ? "Currently unavailable"
                  : hasDiscount
                  ? `You save ${formatTK(oldPrice - displayPrice)}`
                  : `${availableStock} available now`}
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
                "shrink-0 inline-flex items-center gap-1 rounded-[1rem] px-2.5 py-2 text-[10px] font-medium text-white shadow-sm active:scale-[0.99] sm:gap-1.5 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-[11px]",
                adding || !inStock ? "cursor-not-allowed opacity-70" : "cursor-pointer"
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

function Select({ value, onChange, options, label }) {
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
        className="w-full cursor-pointer rounded-2xl bg-white px-3 py-3 text-[13px] font-medium outline-none focus:ring-0"
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

/* -------------------- HEADER SEARCH -------------------- */

function HeaderSearch({ value, onChange, onClear, placeholder }) {
  return (
    <div className="w-full sm:w-[360px]">
      <div className="relative">
        <FiSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: PALETTE.muted }}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-white py-3 pl-9 pr-10 text-[13px] font-medium outline-none shadow-sm focus:ring-0"
          style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 hover:bg-slate-50"
            aria-label="Clear search"
          >
            <FiX className="h-4 w-4" style={{ color: PALETTE.muted }} />
          </button>
        ) : null}
      </div>
    </div>
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

/* -------------------- ROUTE PARSING -------------------- */

function useRouteContext() {
  const pathname = usePathname();

  return useMemo(() => {
    const p = String(pathname || "").trim();
    const seg = p.split("?")[0].split("#")[0].split("/").filter(Boolean);

    if (seg[0] === "c") {
      return {
        mode: "category",
        categorySlug: seg[1] || "",
        subSlug: seg[2] || "",
        brandSlug: "",
      };
    }

    if (seg[0] === "brands" && seg[1]) {
      return {
        mode: "brand",
        categorySlug: "",
        subSlug: "",
        brandSlug: seg[1] || "",
      };
    }

    return {
      mode: seg[0] === "product" ? "product" : "other",
      categorySlug: "",
      subSlug: "",
      brandSlug: "",
    };
  }, [pathname]);
}

/* -------------------- SKELETONS -------------------- */

function CardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[1.5rem] bg-white"
      style={{
        border: `1px solid ${PALETTE.border}`,
        boxShadow: PALETTE.shadow,
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
        <div className="h-4 w-4/5 rounded bg-slate-100" />
        <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-14 rounded-full bg-slate-100" />
          <div className="h-6 w-16 rounded-full bg-slate-100" />
        </div>
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

/* -------------------- PAGE -------------------- */

export default function ProductsPageClient({
  initialCategories = [],
  bannerImage = "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FiPhone-3448.png&w=1920&q=100",
  defaultSubtitle = "Search, filter, and sort products quickly.",
}) {
  const nav = useNav();
  const searchParams = useSearchParams();
  const { mode, categorySlug, subSlug, brandSlug } = useRouteContext();

  const initialQ = (searchParams?.get("q") || "").trim();
  const brandQuery = (searchParams?.get("brand") || "").trim();
  const brandParam = brandSlug || brandQuery;

  const [qDraft, setQDraft] = useState(initialQ);
  const [q, setQ] = useState(initialQ);

  const [only, setOnly] = useState("");
  const [sort, setSort] = useState("latest");
  const [inStock, setInStock] = useState("");

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [pricePreset, setPricePreset] = useState("");
  const [saleOnly, setSaleOnly] = useState(false);

  const LIMIT = 24;
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [addingId, setAddingId] = useState("");

  const topRef = useRef(null);

  const goLogin = useCallback(() => {
    setShowLoginModal(false);
    nav.push("/login");
  }, [nav]);

  const onAdd = useCallback(async (p) => {
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
      const payload = {
        action: "add",
        productId,
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

  const openProduct = useCallback(
    (p) => {
      const slug = String(p?.slug || "").trim();
      if (!slug) return;
      nav.push(`/product/${encodeURIComponent(slug)}`);
    },
    [nav]
  );

  const routeNames = useMemo(() => {
    const cats = Array.isArray(initialCategories) ? initialCategories : [];

    const cat = categorySlug
      ? cats.find(
          (c) =>
            String(c?.slug || "").toLowerCase() ===
            String(categorySlug).toLowerCase()
        )
      : null;

    const catName =
      cat?.label ||
      cat?.name ||
      (categorySlug ? titleCaseFromSlug(categorySlug) : "");

    const subs = Array.isArray(cat?.subcategories) ? cat.subcategories : [];
    const sub = subSlug
      ? subs.find(
          (s) =>
            String(s?.slug || "").toLowerCase() ===
            String(subSlug).toLowerCase()
        )
      : null;

    const subName = sub?.name || (subSlug ? titleCaseFromSlug(subSlug) : "");

    return { catName, subName };
  }, [initialCategories, categorySlug, subSlug]);

  const brandTitle = useMemo(() => {
    if (!brandParam) return "";
    return titleCaseFromSlug(brandParam);
  }, [brandParam]);

  const headerTitle = useMemo(() => {
    if (brandParam) {
      return brandTitle ? `${brandTitle} Products` : "Brand Products";
    }
    if (mode === "category" && subSlug) {
      return routeNames.subName || "Subcategory";
    }
    if (mode === "category" && categorySlug) {
      return routeNames.catName || "Category";
    }
    return "All Products";
  }, [brandParam, brandTitle, mode, categorySlug, subSlug, routeNames]);

  const headerSubtitle = useMemo(() => {
    const parts = [];

    if (brandParam) {
      parts.push(`Brand: ${brandTitle || brandParam}`);
    }

    if (mode === "category" && categorySlug) {
      parts.push(subSlug ? "Sub-category view" : "Category view");
    }

    if (mode === "brand") {
      parts.push("Brand view");
    }

    if (q) parts.push(`Search: “${q}”`);
    if (only) parts.push(`Only: ${only}`);
    if (inStock === "1") parts.push("Stock: in");
    if (inStock === "0") parts.push("Stock: out");
    if (sort === "price_asc") parts.push("Sort: price low→high");
    if (sort === "price_desc") parts.push("Sort: price high→low");
    if (saleOnly) parts.push("On sale only");
    if (priceMin || priceMax) {
      parts.push(
        `Price: ${priceMin ? formatTK(priceMin) : "Any"} - ${priceMax ? formatTK(priceMax) : "Any"}`
      );
    }

    return parts.length ? parts.join(" • ") : defaultSubtitle;
  }, [
    brandParam,
    brandTitle,
    mode,
    categorySlug,
    subSlug,
    q,
    only,
    inStock,
    sort,
    saleOnly,
    priceMin,
    priceMax,
    defaultSubtitle,
  ]);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if ((q || "").trim()) n += 1;
    if (only) n += 1;
    if (sort && sort !== "latest") n += 1;
    if (inStock !== "") n += 1;
    if (saleOnly) n += 1;
    if (priceMin || priceMax) n += 1;
    return n;
  }, [q, only, sort, inStock, saleOnly, priceMin, priceMax]);

  const resetAndFetch = useCallback(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQ((qDraft || "").trim()), 300);
    return () => clearTimeout(t);
  }, [qDraft]);

  useEffect(() => {
    resetAndFetch();
  }, [q, only, sort, inStock, categorySlug, subSlug, brandParam, resetAndFetch]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hasMore) return;

      try {
        setLoading(true);
        setErr("");

        const qs = buildQS({
          q: q || "",
          brand: brandParam || "",
          only: only || "",
          sort: sort || "latest",
          inStock: inStock === "" ? "" : inStock,
          categorySlug: mode === "category" ? categorySlug || "" : "",
          subSlug: mode === "category" ? subSlug || "" : "",
          limit: LIMIT,
          page,
          prioritize: 1,
        });

        const data = await fetchJSON(`/api/products${qs}`);
        if (!alive) return;

        const incoming = Array.isArray(data?.products) ? data.products : [];
        setItems((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
        setHasMore(incoming.length === LIMIT);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load products");
        if (page === 1) setItems([]);
        setHasMore(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, q, brandParam, only, sort, inStock, hasMore, mode, categorySlug, subSlug]);

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

  const visibleItems = useMemo(() => {
    const min = Number(priceMin || 0);
    const max = Number(priceMax || 0);

    const filtered = (items || []).filter((p) => {
      const price = getEffectivePrice(p);

      if (saleOnly && !isOnSaleProduct(p)) return false;
      if (priceMin && price < min) return false;
      if (priceMax && price > max) return false;

      return true;
    });

    return filtered.sort((a, b) => {
      const aIn = isInStockProduct(a) ? 1 : 0;
      const bIn = isInStockProduct(b) ? 1 : 0;

      if (aIn !== bIn) return bIn - aIn;
      return 0;
    });
  }, [items, priceMin, priceMax, saleOnly]);

  const clearAll = useCallback(() => {
    setQDraft("");
    setQ("");
    setOnly("");
    setSort("latest");
    setInStock("");
    setPriceMin("");
    setPriceMax("");
    setPricePreset("");
    setSaleOnly(false);
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

    if (brandParam) {
      chips.push({
        key: "brand",
        label: `Brand: ${brandTitle || brandParam}`,
        remove: () => nav.push("/product"),
      });
    }

    if (q) {
      chips.push({
        key: "q",
        label: `Search: ${q}`,
        remove: () => {
          setQDraft("");
          setQ("");
        },
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
  }, [brandParam, brandTitle, nav, q, only, inStock, sort, saleOnly, priceMin, priceMax]);

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
            onChange={setOnly}
            options={[
              { value: "", label: "All" },
              { value: "trending", label: "Trending" },
              { value: "new", label: "New" },
            ]}
          />

          <Select
            label="Stock"
            value={inStock}
            onChange={setInStock}
            options={[
              { value: "", label: "Any stock" },
              { value: "1", label: "In stock" },
              { value: "0", label: "Out of stock" },
            ]}
          />

          <Select
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: "latest", label: "Latest" },
              { value: "price_asc", label: "Price: Low → High" },
              { value: "price_desc", label: "Price: High → Low" },
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
        <div
          className="text-[11px] font-medium uppercase tracking-[0.12em]"
          style={{ color: PALETTE.muted }}
        >
          Current view
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8" ref={topRef}>
        <section className="mt-0">
          <DealsHeroBanner image={bannerImage} />
        </section>

        <section className="mt-8">
          <SectionHeader
            title={headerTitle}
            accent="coral"
            subtitle={headerSubtitle}
            rightSlot={
              <div className="flex flex-wrap items-center gap-2">
                <HeaderSearch
                  value={qDraft}
                  onChange={setQDraft}
                  onClear={() => setQDraft("")}
                  placeholder="Search products..."
                />

                {activeFiltersCount ? (
                  <IconBtn onClick={clearAll} ariaLabel="Clear filters">
                    <FiX className="h-4 w-4" style={{ color: PALETTE.navy }} />
                  </IconBtn>
                ) : null}

                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="md:hidden shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-3 py-3 text-[12px] font-medium hover:bg-slate-50 active:scale-[0.98]"
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

        <section className="mt-5">
          <Surface className="px-4 py-3 sm:px-5 sm:py-4" padded={false}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div
                  className="text-[14px] font-medium"
                  style={{ color: PALETTE.navy }}
                >
                  Showing {visibleItems.length} item{visibleItems.length === 1 ? "" : "s"}
                </div>
                <div
                  className="mt-1 text-[12px] font-medium"
                  style={{ color: PALETTE.muted }}
                >
                  Loaded {items.length} from server
                  {brandParam ? ` • brand: ${brandTitle || brandParam}` : ""}
                  {saleOnly || priceMin || priceMax ? " • filtered by price/sale on this page" : ""}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {brandParam ? (
                  <FlatBadge tone="navy">
                    {brandTitle || brandParam}
                  </FlatBadge>
                ) : null}

                {saleOnly ? (
                  <FlatBadge tone="coral">
                    <FiTag className="h-3.5 w-3.5" />
                    Sale only
                  </FlatBadge>
                ) : null}

                {priceMin || priceMax ? (
                  <FlatBadge tone="gold">
                    <FiDollarSign className="h-3.5 w-3.5" />
                    {priceMin ? formatTK(priceMin) : "Any"} - {priceMax ? formatTK(priceMax) : "Any"}
                  </FlatBadge>
                ) : null}
              </div>
            </div>
          </Surface>
        </section>

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

            {loading && page === 1 ? (
              <div className={cn("mt-2", GRID)}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                <div className={cn("mt-2", GRID)}>
                  {(visibleItems || []).map((p) => (
                    <ProductCard
                      key={p?._id || p?.slug}
                      p={p}
                      onAdd={onAdd}
                      onOpen={openProduct}
                      adding={addingId === String(p?._id || p?.id || p?.slug || "")}
                    />
                  ))}
                </div>

                {!loading && !err && visibleItems?.length === 0 ? (
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

            {!hasMore && visibleItems?.length > 0 ? (
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