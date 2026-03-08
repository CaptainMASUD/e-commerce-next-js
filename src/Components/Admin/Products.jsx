// app/admin/products/page.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Package,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Flame,
  Boxes,
  Tags,
  Barcode,
  Layers,
  Loader2,
  Trash2,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

const cx = (...c) => c.filter(Boolean).join(" ");

const PALETTE = {
  navy: "#0B1B33",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  bg: "#ffffff",
  card: "rgba(255,255,255,0.98)",
  muted: "rgba(11,27,51,0.62)",
  border: "rgba(2, 10, 25, 0.10)",
  border2: "rgba(2, 10, 25, 0.08)",
  soft: "rgba(11,27,51,0.035)",
  soft2: "rgba(11,27,51,0.06)",
};

function getStoredToken() {
  try {
    const t1 = localStorage.getItem("token");
    if (t1) return t1;
  } catch {}
  try {
    const t2 = sessionStorage.getItem("token");
    if (t2) return t2;
  } catch {}
  return null;
}

function parseApiError(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  return fallback;
}

function useDebouncedValue(value, delay = 220) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDeb(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return deb;
}

async function apiFetch(path, opts = {}) {
  const token = getStoredToken();

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  if (!(opts.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, {
    ...opts,
    credentials: "include",
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = parseApiError(data, `Request failed (${res.status})`);
    const details = data?.details ? ` — ${data.details}` : "";
    const err = new Error(msg + details);
    err.status = res.status;
    throw err;
  }

  return data;
}

/* --------------------------------- UI --------------------------------- */

const Card = React.memo(function Card({ children, className }) {
  return (
    <div
      className={cx("rounded-[24px] overflow-hidden", className)}
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 18px 55px rgba(0,31,63,0.08)",
      }}
    >
      {children}
    </div>
  );
});

const Divider = React.memo(function Divider() {
  return <div style={{ height: 1, width: "100%", background: "rgba(2,10,25,0.06)" }} />;
});

const Label = React.memo(function Label({ children }) {
  return (
    <span className="text-[11px] font-medium tracking-wide" style={{ color: PALETTE.muted }}>
      {children}
    </span>
  );
});

const Field = React.memo(function Field({ label, icon: Icon, rightSlot, children }) {
  return (
    <label className="grid gap-2">
      {label ? <Label>{label}</Label> : null}

      <div
        className={cx(
          "group flex h-11 items-center gap-2 overflow-hidden rounded-2xl px-3 transition",
          "focus-within:ring-2 focus-within:ring-offset-2"
        )}
        style={{
          background: "rgba(255,255,255,0.96)",
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0" style={{ color: PALETTE.muted }} /> : null}
        <div className="min-w-0 flex-1">{children}</div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </label>
  );
});

const SoftButton = React.memo(function SoftButton({
  icon: Icon,
  loading,
  children,
  disabled,
  tone = "default",
  className,
  ...props
}) {
  const isDisabled = disabled || loading;

  const toneStyle =
    tone === "danger"
      ? {
          background: "rgba(255,107,107,0.10)",
          border: "1px solid rgba(255,107,107,0.20)",
          color: PALETTE.navy,
        }
      : {
          background: "rgba(255,255,255,0.96)",
          border: `1px solid ${PALETTE.border}`,
          color: PALETTE.navy,
        };

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-95 active:scale-[0.99]",
        className
      )}
      style={{
        ...toneStyle,
        boxShadow: "0 10px 24px rgba(0,31,63,.06)",
      }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
});

const Pill = React.memo(function Pill({ tone = "soft", children, title }) {
  const style =
    tone === "good"
      ? { background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }
      : tone === "warn"
      ? { background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.24)" }
      : tone === "bad"
      ? { background: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.18)" }
      : { background: PALETTE.soft, border: `1px solid ${PALETTE.border}` };

  return (
    <span
      title={title}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
      style={{ ...style, color: PALETTE.navy }}
    >
      {children}
    </span>
  );
});

function TableSkeleton({ rows = 10 }) {
  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-3 px-2 py-2">
        <div className="col-span-3 h-5 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
        <div className="col-span-2 h-5 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
        <div className="col-span-2 h-5 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
        <div className="col-span-2 h-5 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
        <div className="col-span-1 h-5 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
        <div className="col-span-2 h-5 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
      </div>

      <div className="mt-4 grid gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-12 items-center gap-3 rounded-3xl px-4 py-4"
            style={{
              background: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(2,10,25,0.06)",
              boxShadow: "0 10px 26px rgba(0,31,63,0.04)",
            }}
          >
            <div className="col-span-3 h-4 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
            <div className="col-span-2 h-4 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
            <div className="col-span-2 h-4 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
            <div className="col-span-2 h-4 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
            <div className="col-span-1 h-4 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
            <div className="col-span-2 h-4 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

function money(n) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "—";
  const formatted = new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
  return `Tk ${formatted}`;
}

function safeText(v) {
  const s = String(v ?? "").trim();
  return s || "—";
}

function attrsToLine(attributes) {
  if (!attributes) return "—";
  const entries = attributes instanceof Map ? Array.from(attributes.entries()) : Object.entries(attributes);
  const cleaned = entries
    .map(([k, v]) => [String(k || "").trim(), String(v ?? "").trim()])
    .filter(([k, v]) => k && v);
  if (!cleaned.length) return "—";
  return cleaned.map(([k, v]) => `${k}: ${v}`).join(" • ");
}

function getProductId(p) {
  return String(p?._id || p?.id || p?.slug || "");
}

function getCategoryName(p) {
  return p?.category?.name || p?.category?.slug || "—";
}

function getBrandName(p) {
  return p?.brand?.name || p?.brand?.slug || "—";
}

function getStock(p) {
  if (typeof p?.variantSummary?.availableStock === "number") return p.variantSummary.availableStock;
  if (typeof p?.stockQty === "number") return p.stockQty;
  return 0;
}

function getPriceDisplay(p) {
  const isVariable = p?.productType === "variable";

  if (!isVariable) {
    return {
      primary: money(p?.price),
      secondary: typeof p?.salePrice === "number" ? `Sale: ${money(p.salePrice)}` : "Sale: —",
    };
  }

  const min = p?.variantSummary?.minVariantFinalPrice;
  const max = p?.variantSummary?.maxVariantFinalPrice;

  if (typeof min === "number" && typeof max === "number") {
    if (min === max) {
      return {
        primary: money(min),
        secondary: `${p?.variantSummary?.activeVariants ?? 0} active variants`,
      };
    }

    return {
      primary: `${money(min)} – ${money(max)}`,
      secondary: `${p?.variantSummary?.activeVariants ?? 0} active variants`,
    };
  }

  return {
    primary: "—",
    secondary: `${p?.variantSummary?.activeVariants ?? 0} active variants`,
  };
}

/* ------------------------------ Row UI ------------------------------ */

const VariantsPanel = React.memo(function VariantsPanel({ product }) {
  const vars = Array.isArray(product?.variants) ? product.variants : [];
  const activeCount = vars.filter((v) => v?.isActive !== false).length;

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-2xl"
            style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
          >
            <Layers className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </div>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
              Variants
            </div>
            <div className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              {vars.length} total • {activeCount} active
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill tone="soft" title="Variant barcode is used as SKU">
            <Barcode className="h-4 w-4" />
            Barcode = SKU
          </Pill>

          <Pill tone="warn" title="Attribute keys available on variants">
            <Tags className="h-4 w-4" />
            {Array.isArray(product?.variantSummary?.attributeKeys) && product.variantSummary.attributeKeys.length
              ? product.variantSummary.attributeKeys.join(", ")
              : "No attributes"}
          </Pill>
        </div>
      </div>

      <div className="mt-3 overflow-auto rounded-3xl" style={{ border: `1px solid ${PALETTE.border}` }}>
        <table className="w-full text-left text-sm">
          <thead
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(10px)",
              borderBottom: `1px solid ${PALETTE.border2}`,
            }}
          >
            <tr className="text-[12px]" style={{ color: PALETTE.muted }}>
              <th className="px-4 py-3 font-semibold">Attributes</th>
              <th className="px-4 py-3 font-semibold">Barcode/SKU</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Sale</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Images</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody>
            {vars.map((v, idx) => {
              const active = v?.isActive !== false;
              const imageCount = Array.isArray(v?.images) ? v.images.length : 0;

              return (
                <tr
                  key={String(v?.variantId || v?._id || idx)}
                  style={{ background: idx % 2 ? "rgba(11,27,51,0.012)" : "transparent" }}
                >
                  <td className="px-4 py-3 align-middle">
                    <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                      {attrsToLine(v?.attributes)}
                    </div>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                      {safeText(v?.barcode)}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                      {money(v?.price)}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                      {typeof v?.salePrice === "number" ? money(v.salePrice) : "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span
                      className="inline-flex min-w-[52px] justify-center rounded-xl px-2 py-1 text-[12px] font-semibold"
                      style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                    >
                      {Number(v?.stockQty) || 0}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                      style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                    >
                      <ImageIcon className="h-4 w-4" />
                      {imageCount}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                      style={{
                        background: active ? "rgba(16,185,129,0.10)" : "rgba(255,107,107,0.10)",
                        border: active ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(255,107,107,0.18)",
                        color: PALETTE.navy,
                      }}
                    >
                      {active ? <BadgeCheck className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                      {active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {!vars.length ? (
              <tr>
                <td className="px-4 py-4 text-[12px] font-semibold" style={{ color: PALETTE.muted }} colSpan={7}>
                  No variants.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const DeleteConfirmModal = React.memo(function DeleteConfirmModal({
  open,
  product,
  deleting,
  onClose,
  onConfirm,
}) {
  if (!open || !product) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90] grid place-items-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
          onClick={deleting ? undefined : onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md rounded-[28px] p-6"
          style={{
            background: "rgba(255,255,255,0.98)",
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 24px 80px rgba(0,31,63,0.18)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-3xl"
              style={{
                background: "rgba(255,107,107,0.10)",
                border: "1px solid rgba(255,107,107,0.18)",
              }}
            >
              <AlertTriangle className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </div>

            <div className="min-w-0">
              <div className="text-[18px] font-semibold" style={{ color: PALETTE.navy }}>
                Delete product
              </div>
              <div className="mt-1 text-[13px] font-medium" style={{ color: PALETTE.muted }}>
                This will permanently delete the product and its uploaded images.
              </div>
            </div>
          </div>

          <div
            className="mt-5 rounded-3xl p-4"
            style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
          >
            <div className="text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
              {safeText(product?.title)}
            </div>
            <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              /{safeText(product?.slug)} • {getCategoryName(product)} • {getBrandName(product)}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <SoftButton type="button" disabled={deleting} onClick={onClose}>
              Cancel
            </SoftButton>
            <SoftButton
              type="button"
              tone="danger"
              icon={Trash2}
              loading={deleting}
              onClick={onConfirm}
            >
              Delete
            </SoftButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

const ProductRow = React.memo(function ProductRow({
  p,
  expanded,
  onToggleExpand,
  onDeleteClick,
  deleting,
}) {
  const isVariable = p?.productType === "variable";
  const priceInfo = getPriceDisplay(p);
  const categoryName = getCategoryName(p);
  const brandName = getBrandName(p);
  const stock = getStock(p);
  const primaryImageUrl = p?.primaryImage?.url || "";
  const variantSummary = p?.variantSummary || {};

  return (
    <>
      <tr
        className="transition"
        style={{
          cursor: isVariable ? "pointer" : "default",
          background: expanded ? "rgba(11,27,51,0.05)" : "transparent",
        }}
        onClick={() => {
          if (isVariable) onToggleExpand();
        }}
        onMouseEnter={(e) => {
          if (!expanded && isVariable) e.currentTarget.style.background = "rgba(11,27,51,0.035)";
        }}
        onMouseLeave={(e) => {
          if (!expanded) e.currentTarget.style.background = "transparent";
        }}
      >
        <td className="px-6 py-4 align-middle">
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl overflow-hidden"
              style={{
                background:
                  "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
                border: `1px solid ${PALETTE.border}`,
              }}
            >
              {primaryImageUrl ? (
                <img
                  src={primaryImageUrl}
                  alt={p?.primaryImage?.alt || p?.title || "product"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-4 w-4" style={{ color: PALETTE.navy }} />
              )}
            </div>

            <div className="min-w-0">
              <div className="font-semibold leading-snug truncate" style={{ color: PALETTE.navy }}>
                {safeText(p?.title)}
              </div>
              <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                /{safeText(p?.slug)}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {Array.isArray(p?.tags) && p.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold"
                    style={{
                      background: PALETTE.soft,
                      border: `1px solid ${PALETTE.border}`,
                      color: PALETTE.navy,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 align-middle">
          <div className="grid gap-1">
            <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
              {categoryName}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              {brandName}
            </span>
          </div>
        </td>

        <td className="px-6 py-4 align-middle">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{
              background: isVariable ? "rgba(234,179,8,0.12)" : PALETTE.soft,
              border: isVariable ? "1px solid rgba(234,179,8,0.24)" : `1px solid ${PALETTE.border}`,
              color: PALETTE.navy,
            }}
          >
            {isVariable ? <Layers className="h-4 w-4" /> : <Boxes className="h-4 w-4" />}
            {isVariable ? "Variable" : "Simple"}
          </span>
        </td>

        <td className="px-6 py-4 align-middle">
          <div className="grid gap-1">
            <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
              {priceInfo.primary}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              {priceInfo.secondary}
            </span>
          </div>
        </td>

        <td className="px-6 py-4 align-middle">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex min-w-[52px] justify-center rounded-xl px-2 py-1 text-[12px] font-semibold"
              style={{
                background: stock > 0 ? "rgba(16,185,129,0.10)" : "rgba(255,107,107,0.10)",
                border: stock > 0 ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(255,107,107,0.18)",
                color: PALETTE.navy,
              }}
              title="Available stock"
            >
              {stock}
            </span>

            {isVariable ? (
              <span
                className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-[12px] font-semibold"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                title="Total variants"
              >
                <Layers className="h-4 w-4" />
                {variantSummary?.totalVariants ?? 0}
              </span>
            ) : null}
          </div>
        </td>

        <td className="px-6 py-4 align-middle">
          <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
            {isVariable ? "—" : safeText(p?.barcode)}
          </span>
        </td>

        <td className="px-6 py-4 align-middle">
          <div className="flex flex-wrap gap-2">
            {p?.isNew ? (
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}
              >
                <BadgeCheck className="h-4 w-4" style={{ color: PALETTE.navy }} />
                New
              </span>
            ) : null}

            {p?.isTrending ? (
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ background: "rgba(255,126,105,0.12)", border: "1px solid rgba(255,126,105,0.22)" }}
              >
                <Flame className="h-4 w-4" style={{ color: PALETTE.navy }} />
                Trending
              </span>
            ) : null}

            {!p?.isNew && !p?.isTrending ? (
              <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                —
              </span>
            ) : null}
          </div>
        </td>

        <td className="px-6 py-4 align-middle">
          <div className="flex justify-end gap-2">
            {isVariable ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className={cx(
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[12px] font-semibold transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  "hover:opacity-95 active:scale-[0.99]"
                )}
                style={{
                  background: "rgba(255,255,255,0.96)",
                  border: `1px solid ${PALETTE.border}`,
                  color: PALETTE.navy,
                  boxShadow: "0 10px 22px rgba(0,31,63,.04)",
                }}
                title="Show variants"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Variants
              </button>
            ) : (
              <span className="text-[12px] font-semibold px-2" style={{ color: PALETTE.muted }}>
                —
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(p);
              }}
              disabled={deleting}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[12px] font-semibold transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                deleting ? "cursor-not-allowed opacity-60" : "hover:opacity-95 active:scale-[0.99]"
              )}
              style={{
                background: "rgba(255,107,107,0.10)",
                border: "1px solid rgba(255,107,107,0.18)",
                color: PALETTE.navy,
                boxShadow: "0 10px 22px rgba(0,31,63,.04)",
              }}
              title="Delete product"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          </div>
        </td>
      </tr>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.tr
            key="panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <td colSpan={8} style={{ padding: 0 }}>
              <div style={{ background: "rgba(11,27,51,0.02)", borderTop: `1px solid ${PALETTE.border2}` }}>
                <VariantsPanel product={p} />
              </div>
            </td>
          </motion.tr>
        ) : null}
      </AnimatePresence>
    </>
  );
});

/* -------------------------------- Page --------------------------------- */

export default function AdminProductsPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  function showToast(kind, message) {
    const base = {
      duration: 3500,
      style: {
        background: "rgba(255,255,255,0.92)",
        color: PALETTE.navy,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 18px 50px rgba(0,31,63,0.14)",
        borderRadius: 18,
        padding: "12px 14px",
        backdropFilter: "blur(10px)",
      },
    };

    if (kind === "success") return toast.success(message, base);
    if (kind === "error")
      return toast.error(message, {
        ...base,
        style: {
          ...base.style,
          background: "rgba(255,107,107,0.10)",
          border: "1px solid rgba(255,107,107,0.22)",
        },
      });

    return toast(message, base);
  }

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 220);

  const [typeFilter, setTypeFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [flagFilter, setFlagFilter] = useState("all");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  const expandedRef = useRef(new Set());
  const [, force] = useState(0);
  const bump = () => force((x) => x + 1);

  const isExpanded = (id) => expandedRef.current.has(String(id));
  const toggleExpanded = (id) => {
    const k = String(id);
    if (expandedRef.current.has(k)) expandedRef.current.delete(k);
    else expandedRef.current.add(k);
    bump();
  };

  const stats = useMemo(() => {
    const total = items.length;
    const simple = items.filter((p) => p?.productType !== "variable").length;
    const variable = total - simple;
    const inStock = items.filter((p) => getStock(p) > 0).length;
    const withSale = items.filter(
      (p) =>
        (p?.productType === "simple" && typeof p?.salePrice === "number") ||
        (p?.productType === "variable" && typeof p?.variantSummary?.minVariantFinalPrice === "number")
    ).length;

    return { total, simple, variable, inStock, withSale };
  }, [items]);

  async function loadProducts({ showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoading(true);

    try {
      const qs = new URLSearchParams({
        includeVariants: "true",
        includeGallery: "false",
        includeDescription: "false",
        includeFeatures: "false",
        limit: "100",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const data = await apiFetch(`/api/admin/products?${qs.toString()}`);
      const products = Array.isArray(data?.products) ? data.products : [];
      setItems(products);
    } catch (e) {
      if (e?.status === 401) showToast("error", "Unauthorized. Please login again.");
      else if (e?.status === 403) showToast("error", "Forbidden. Admin only.");
      else showToast("error", e.message || "Failed to load products");
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  async function handleDeleteConfirmed() {
    const target = deleteTarget;
    const id = getProductId(target);
    if (!id) return;

    setDeletingId(id);

    try {
      await apiFetch(`/api/admin/products/${id}`, { method: "DELETE" });

      setItems((prev) => prev.filter((p) => getProductId(p) !== id));
      expandedRef.current.delete(id);
      setDeleteTarget(null);
      showToast("success", "Product deleted successfully.");
    } catch (e) {
      if (e?.status === 401) showToast("error", "Unauthorized. Please login again.");
      else if (e?.status === 403) showToast("error", "Forbidden. Admin only.");
      else if (e?.status === 404) showToast("error", "Product not found.");
      else showToast("error", e.message || "Failed to delete product");
    } finally {
      setDeletingId("");
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = items;

    if (typeFilter !== "all") {
      list = list.filter((p) => (typeFilter === "variable" ? p?.productType === "variable" : p?.productType !== "variable"));
    }

    if (stockFilter !== "all") {
      const wantIn = stockFilter === "in";
      list = list.filter((p) => {
        const s = getStock(p);
        return wantIn ? s > 0 : s <= 0;
      });
    }

    if (flagFilter !== "all") {
      list = list.filter((p) => {
        if (flagFilter === "new") return !!p?.isNew;
        if (flagFilter === "trending") return !!p?.isTrending;
        if (flagFilter === "sale") {
          if (p?.productType === "simple") return typeof p?.salePrice === "number";
          return typeof p?.variantSummary?.minVariantFinalPrice === "number";
        }
        return true;
      });
    }

    if (!q) return list;

    return list.filter((p) => {
      const title = String(p?.title || "").toLowerCase();
      const slug = String(p?.slug || "").toLowerCase();
      const barcode = String(p?.barcode || "").toLowerCase();
      const category = String(p?.category?.name || p?.category?.slug || "").toLowerCase();
      const brand = String(p?.brand?.name || p?.brand?.slug || "").toLowerCase();
      const tags = Array.isArray(p?.tags) ? p.tags.join(" ").toLowerCase() : "";

      const variantBarcodes = Array.isArray(p?.variants)
        ? p.variants.map((v) => String(v?.barcode || "").toLowerCase()).join(" ")
        : "";

      const variantAttrs = Array.isArray(p?.variants)
        ? p.variants
            .flatMap((v) => Object.entries(v?.attributes || {}).map(([k, val]) => `${k} ${val}`))
            .join(" ")
            .toLowerCase()
        : "";

      return (
        title.includes(q) ||
        slug.includes(q) ||
        barcode.includes(q) ||
        category.includes(q) ||
        brand.includes(q) ||
        tags.includes(q) ||
        variantBarcodes.includes(q) ||
        variantAttrs.includes(q)
      );
    });
  }, [items, debouncedSearch, typeFilter, stockFilter, flagFilter]);

  return (
    <main className="w-full" style={{ background: PALETTE.bg, color: PALETTE.navy }}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "rgba(255,255,255,0.92)",
            color: PALETTE.navy,
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 18px 50px rgba(0,31,63,0.14)",
            borderRadius: 18,
            padding: "12px 14px",
            backdropFilter: "blur(10px)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#ffffff" } },
          error: { iconTheme: { primary: "#ff6b6b", secondary: "#ffffff" } },
        }}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        product={deleteTarget}
        deleting={!!deletingId}
        onClose={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirmed}
      />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -left-20 -top-20 h-[340px] w-[340px] rounded-full blur-3xl"
          style={{ background: "rgba(255,126,105,0.10)" }}
        />
        <div
          className="absolute right-[-140px] top-[120px] h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: "rgba(11,27,51,0.05)" }}
        />
      </div>

      <div className="mx-auto max-w-screen-xl px-5 pt-6 pb-4 md:px-10 lg:px-12">
        <Card className="overflow-visible">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-3xl"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.18), rgba(11,27,51,0.05) 65%), #fff",
                      border: `1px solid ${PALETTE.border}`,
                      boxShadow: "0 12px 26px rgba(0,31,63,.07)",
                    }}
                  >
                    <Package className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                        Products
                      </div>

                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: "rgba(255,255,255,0.92)",
                          border: `1px solid ${PALETTE.border}`,
                          color: PALETTE.muted,
                        }}
                        title="Loaded products"
                      >
                        {items.length} loaded
                      </span>
                    </div>

                    <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                      Read-only product management table with variant details and delete action.
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill tone="soft" title="All products">
                    <Tags className="h-4 w-4" />
                    Total <span style={{ marginLeft: 6, fontWeight: 800 }}>{stats.total}</span>
                  </Pill>

                  <Pill tone="soft" title="Simple products">
                    <Boxes className="h-4 w-4" />
                    Simple <span style={{ marginLeft: 6, fontWeight: 800 }}>{stats.simple}</span>
                  </Pill>

                  <Pill tone="warn" title="Variable products">
                    <Layers className="h-4 w-4" />
                    Variable <span style={{ marginLeft: 6, fontWeight: 800 }}>{stats.variable}</span>
                  </Pill>

                  <Pill tone="good" title="Products with stock">
                    <BadgeCheck className="h-4 w-4" />
                    In stock <span style={{ marginLeft: 6, fontWeight: 800 }}>{stats.inStock}</span>
                  </Pill>

                  <Pill tone="soft" title="Products with sale/final price info">
                    <Barcode className="h-4 w-4" />
                    Priced <span style={{ marginLeft: 6, fontWeight: 800 }}>{stats.withSale}</span>
                  </Pill>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SoftButton icon={RefreshCw} loading={refreshing} onClick={() => loadProducts({ showSpinner: true })}>
                  Refresh
                </SoftButton>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
              <div className="md:col-span-5">
                <Field label="Search" icon={Search}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                    placeholder="Search by title, slug, barcode, category, brand, tags, variants…"
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Type"
                  icon={Filter}
                  rightSlot={
                    <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                      {typeFilter.toUpperCase()}
                    </span>
                  }
                >
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                    style={{ color: PALETTE.navy, height: 42 }}
                  >
                    <option value="all">All</option>
                    <option value="simple">Simple</option>
                    <option value="variable">Variable</option>
                  </select>
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Stock"
                  icon={Barcode}
                  rightSlot={
                    <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                      {stockFilter.toUpperCase()}
                    </span>
                  }
                >
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                    style={{ color: PALETTE.navy, height: 42 }}
                  >
                    <option value="all">All</option>
                    <option value="in">In</option>
                    <option value="out">Out</option>
                  </select>
                </Field>
              </div>

              <div className="md:col-span-3">
                <Field
                  label="Flags"
                  icon={Tags}
                  rightSlot={
                    <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                      {flagFilter.toUpperCase()}
                    </span>
                  }
                >
                  <select
                    value={flagFilter}
                    onChange={(e) => setFlagFilter(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                    style={{ color: PALETTE.navy, height: 42 }}
                  >
                    <option value="all">All</option>
                    <option value="new">New</option>
                    <option value="trending">Trending</option>
                    <option value="sale">Priced</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mx-auto max-w-screen-xl px-5 pb-10 md:px-10 lg:px-12">
        <Card>
          <div className="overflow-auto" style={{ height: "min(68vh, 760px)" }}>
            {loading ? (
              <TableSkeleton rows={10} />
            ) : filtered.length ? (
              <table className="w-full text-left text-sm">
                <thead
                  className="sticky top-0 z-10"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(10px)",
                    borderBottom: `1px solid ${PALETTE.border2}`,
                  }}
                >
                  <tr className="text-[12px]" style={{ color: PALETTE.muted }}>
                    <th className="px-6 py-3 font-semibold">Product</th>
                    <th className="px-6 py-3 font-semibold">Category / Brand</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Price</th>
                    <th className="px-6 py-3 font-semibold">Stock / Count</th>
                    <th className="px-6 py-3 font-semibold">Barcode</th>
                    <th className="px-6 py-3 font-semibold">Flags</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((p) => {
                    const id = getProductId(p);
                    const expanded = p?.productType === "variable" ? isExpanded(id) : false;

                    return (
                      <ProductRow
                        key={id}
                        p={p}
                        expanded={expanded}
                        onToggleExpand={() => toggleExpanded(id)}
                        onDeleteClick={(product) => setDeleteTarget(product)}
                        deleting={deletingId === id}
                      />
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-10">
                <div
                  className="mx-auto max-w-lg rounded-[28px] p-8 text-center"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 20%, rgba(255,126,105,0.10), rgba(11,27,51,0.04) 55%), #fff",
                    border: `1px dashed ${PALETTE.border}`,
                    boxShadow: "0 16px 44px rgba(0,31,63,0.06)",
                  }}
                >
                  <div
                    className="mx-auto grid h-12 w-12 place-items-center rounded-3xl"
                    style={{ background: "rgba(11,27,51,0.05)", border: `1px solid ${PALETTE.border}` }}
                  >
                    <Package className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="mt-4 text-[15px] font-semibold" style={{ color: PALETTE.navy }}>
                    No products found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Adjust search or filters and try again.
                  </div>

                  <div className="mt-5 flex justify-center">
                    <SoftButton icon={RefreshCw} loading={refreshing} onClick={() => loadProducts({ showSpinner: true })}>
                      Refresh
                    </SoftButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Divider />

          <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              Showing <span style={{ color: PALETTE.navy, fontWeight: 800 }}>{filtered.length}</span> of{" "}
              <span style={{ color: PALETTE.navy, fontWeight: 800 }}>{items.length}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="soft">
                <Tags className="h-4 w-4" />
                Tip: click “Variants” on variable products
              </Pill>

              <Pill tone="bad">
                <Trash2 className="h-4 w-4" />
                Delete is permanent
              </Pill>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}