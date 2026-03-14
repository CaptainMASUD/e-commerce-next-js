"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Package,
  Layers,
  Tag,
  Image as ImageIcon,
  Boxes,
  Barcode as BarcodeIcon,
  Info,
  Save,
  Loader2,
  RefreshCcw,
  Pencil,
  CheckCircle2,
  Sparkles,
  Flame,
  Plus,
  Trash2,
  Upload,
  ChevronUp,
  Eye,
  FileText,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
  Smartphone,
  FolderTree,
  ListTree,
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
  soft: "rgba(11,27,51,0.035)",
  soft2: "rgba(11,27,51,0.05)",
  green: "#10b981",
  red: "#ef4444",
};

const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"';

const TW = {
  title: "text-[20px] sm:text-[22px] font-bold tracking-tight",
  sectionTitle: "text-[16px] font-semibold tracking-tight",
  label: "text-[12px] font-semibold tracking-wide",
  input: "text-sm font-medium",
  helper: "text-[12px] font-medium",
  chip: "text-[12px] font-semibold",
  button: "text-sm font-semibold",
  pill: "text-[12px] font-semibold",
};

const ALLOWED_PRODUCT_TYPE = ["simple", "variable"];

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
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

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function toNumber(v, fallback = null) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function randomDigits(len = 13) {
  let out = "";
  for (let i = 0; i < len; i += 1) out += Math.floor(Math.random() * 10);
  return out;
}

function showToast(kind, message) {
  const base = {
    duration: 3200,
    style: {
      background: "rgba(255,255,255,0.92)",
      color: PALETTE.navy,
      border: `1px solid ${PALETTE.border}`,
      boxShadow: "0 18px 50px rgba(0,31,63,0.14)",
      borderRadius: 18,
      padding: "12px 14px",
      backdropFilter: "blur(10px)",
      fontWeight: 500,
      fontFamily: FONT_STACK,
    },
  };

  if (kind === "success") return toast.success(message, base);
  if (kind === "error") {
    return toast.error(message, {
      ...base,
      style: {
        ...base.style,
        background: "rgba(255,107,107,0.10)",
        border: "1px solid rgba(255,107,107,0.22)",
      },
    });
  }
  return toast(message, base);
}

function createEmptySpec(order = 0) {
  return {
    id: uid(),
    label: "",
    value: "",
    isHighlighted: false,
    order,
  };
}

function createSpecGroup(name = "General", order = 0) {
  return {
    id: uid(),
    name,
    order,
    specs: [createEmptySpec(0)],
  };
}

function normalizeDescriptionBlocks(list) {
  return safeArray(list).map((b, idx) => ({
    id: uid(),
    title: String(b?.title || ""),
    details: String(b?.details || ""),
    order: Number.isFinite(Number(b?.order)) ? Number(b.order) : idx,
  }));
}

function normalizeSpecGroups(specifications) {
  const list = safeArray(specifications);
  if (!list.length) return [createSpecGroup("General", 0)];

  const map = new Map();

  list.forEach((spec, idx) => {
    const groupName = String(spec?.group || "").trim() || "General";
    if (!map.has(groupName)) {
      map.set(groupName, {
        id: uid(),
        name: groupName,
        order: map.size,
        specs: [],
      });
    }

    map.get(groupName).specs.push({
      id: uid(),
      label: String(spec?.label || ""),
      value: Array.isArray(spec?.value)
        ? spec.value.join(", ")
        : spec?.value === null || spec?.value === undefined
          ? ""
          : String(spec.value),
      isHighlighted: Boolean(spec?.isHighlighted),
      order: Number.isFinite(Number(spec?.order))
        ? Number(spec.order)
        : map.get(groupName).specs.length,
    });
  });

  return Array.from(map.values()).map((g, idx) => ({
    ...g,
    order: idx,
    specs: safeArray(g.specs).map((s, sidx) => ({ ...s, order: sidx })),
  }));
}

function normalizeVariantImages(images) {
  return safeArray(images).map((img, idx) => ({
    id: uid(),
    url: String(img?.url || ""),
    publicId: String(img?.publicId || ""),
    alt: String(img?.alt || ""),
    order: Number.isFinite(Number(img?.order)) ? Number(img.order) : idx,
    file: null,
    preview: String(img?.url || ""),
    isExisting: true,
  }));
}

function normalizeVariants(list) {
  return safeArray(list).map((v) => ({
    id: uid(),
    barcode: String(v?.barcode || ""),
    attributes:
      v?.attributes && typeof v.attributes === "object" ? { ...v.attributes } : {},
    price: v?.price ?? "",
    salePrice: v?.salePrice ?? "",
    stockQty: v?.stockQty ?? 0,
    isActive: v?.isActive !== false,
    images: normalizeVariantImages(v?.images),
  }));
}

function buildEditableState(product) {
  return {
    id: String(product?._id || ""),
    title: String(product?.title || ""),
    category: String(product?.category?._id || product?.category || ""),
    subcategory: String(product?.subcategoryObj?._id || product?.subcategory || ""),
    brand: String(product?.brand?._id || product?.brand || ""),
    productType: String(product?.productType || "simple"),
    price: product?.price ?? "",
    salePrice: product?.salePrice ?? "",
    barcode: String(product?.barcode || ""),
    stockQty: product?.stockQty ?? 0,
    isNew: Boolean(product?.isNew),
    isTrending: Boolean(product?.isTrending),
    tags: safeArray(product?.tags),
    description: normalizeDescriptionBlocks(product?.description),
    specGroups: normalizeSpecGroups(product?.specifications),
    variants: normalizeVariants(product?.variants),
    primaryImage: product?.primaryImage || null,
    galleryImages: safeArray(product?.galleryImages),
  };
}

function cleanDescriptionForApi(list) {
  return safeArray(list)
    .map((b, idx) => ({
      title: String(b?.title || "").trim(),
      details: String(b?.details || ""),
      order: Number.isFinite(Number(b?.order)) ? Number(b.order) : idx,
    }))
    .filter((b) => b.title || String(b.details || "").trim());
}

function cleanSpecsPayload(groups) {
  const specifications = [];
  const highlights = [];
  let globalOrder = 0;

  safeArray(groups).forEach((group, groupIndex) => {
    const groupName = String(group?.name || "").trim() || `Group ${groupIndex + 1}`;
    safeArray(group?.specs).forEach((spec, specIndex) => {
      const label = String(spec?.label || "").trim();
      const value = String(spec?.value || "").trim();
      if (!label || !value) return;

      const isHighlighted = Boolean(spec?.isHighlighted);
      const entry = {
        key: label
          .trim()
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/['"]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `spec-${groupIndex + 1}-${specIndex + 1}`,
        label,
        value,
        valueType: "text",
        unit: "",
        group: groupName,
        isFilterable: false,
        isComparable: true,
        isHighlighted,
        order: globalOrder,
      };

      specifications.push(entry);
      if (isHighlighted) highlights.push(`${label}: ${value}`);
      globalOrder += 1;
    });
  });

  return { specifications, highlights };
}

function cleanVariantsForApi(list) {
  return safeArray(list)
    .map((v) => {
      const attrs = v?.attributes && typeof v.attributes === "object" ? v.attributes : {};
      const nextAttrs = {};

      Object.entries(attrs).forEach(([k, val]) => {
        const kk = String(k || "").trim();
        const vv = String(val ?? "").trim();
        if (!kk || !vv) return;
        nextAttrs[kk] = vv;
      });

      return {
        barcode: String(v?.barcode || "").trim(),
        attributes: nextAttrs,
        price: v?.price === "" ? null : toNumber(v?.price, null),
        salePrice: v?.salePrice === "" ? null : toNumber(v?.salePrice, null),
        stockQty: Math.max(0, toNumber(v?.stockQty, 0) ?? 0),
        images: safeArray(v?.images).map((img, idx) => ({
          url: img?.file ? undefined : String(img?.url || ""),
          publicId: img?.file ? "" : String(img?.publicId || ""),
          alt: String(img?.alt || ""),
          order: idx,
        })).filter((img) => img.url),
        isActive: v?.isActive !== false,
      };
    })
    .filter((v) => v.barcode || Object.keys(v.attributes || {}).length);
}

const Card = React.memo(function Card({ children, className }) {
  return (
    <div
      className={cx("rounded-[24px] overflow-hidden", className)}
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 18px 55px rgba(0,31,63,0.08)",
        fontFamily: FONT_STACK,
      }}
    >
      {children}
    </div>
  );
});

const Divider = React.memo(function Divider({ className }) {
  return (
    <div
      className={className}
      style={{ height: 1, width: "100%", background: "rgba(2,10,25,0.06)" }}
    />
  );
});

const Label = React.memo(function Label({ children }) {
  return (
    <span
      className={TW.label}
      style={{ color: PALETTE.navy, fontFamily: FONT_STACK }}
    >
      {children}
    </span>
  );
});

function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={cx("w-full bg-transparent outline-none", TW.input, className)}
      style={{ color: PALETTE.navy, height: 42, fontFamily: FONT_STACK }}
    />
  );
}

function Textarea({ className, rows = 4, ...props }) {
  return (
    <textarea
      {...props}
      rows={rows}
      className={cx(
        "w-full bg-transparent outline-none resize-none",
        TW.input,
        className
      )}
      style={{ color: PALETTE.navy, fontFamily: FONT_STACK }}
    />
  );
}

function Select({ className, children, ...props }) {
  return (
    <select
      {...props}
      className={cx(
        "w-full bg-transparent outline-none cursor-pointer",
        TW.input,
        className
      )}
      style={{ color: PALETTE.navy, height: 42, fontFamily: FONT_STACK }}
    >
      {children}
    </select>
  );
}

const Field = React.memo(function Field({
  label,
  required,
  icon: Icon,
  rightSlot,
  children,
  className,
  multiline = false,
  hideIcon = false,
}) {
  return (
    <label className={cx("grid gap-2", className)} style={{ fontFamily: FONT_STACK }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {label ? <Label>{label}</Label> : null}
          {required ? (
            <span className="text-[12px] font-semibold text-rose-600">*</span>
          ) : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>

      <div
        className={cx(
          "group gap-2 overflow-hidden rounded-2xl px-3 transition",
          "focus-within:ring-2 focus-within:ring-offset-2",
          multiline ? "block py-3" : "flex min-h-11 items-center"
        )}
        style={{
          background: "rgba(255,255,255,0.98)",
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {!hideIcon && Icon ? (
          <div className={cx("shrink-0", multiline ? "mb-2" : "")}>
            <Icon className="h-4 w-4 shrink-0" style={{ color: PALETTE.muted }} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </label>
  );
});

const SoftButton = React.memo(function SoftButton({
  icon: Icon,
  loading,
  children,
  disabled,
  className,
  compact = false,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        compact ? "px-3 py-2" : "px-4 py-2.5",
        isDisabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:opacity-95 active:scale-[0.99]",
        TW.button,
        className
      )}
      style={{
        background: "rgba(255,255,255,0.96)",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
        boxShadow: "0 10px 24px rgba(0,31,63,.06)",
        fontFamily: FONT_STACK,
        minHeight: compact ? 38 : 42,
      }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {children}
    </button>
  );
});

const PrimaryButton = React.memo(function PrimaryButton({
  icon: Icon,
  loading,
  children,
  disabled,
  className,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cx(
        "group relative overflow-hidden rounded-2xl px-4 py-2.5 text-white transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDisabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer active:scale-[0.99]",
        TW.button,
        className
      )}
      style={{
        background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
        boxShadow: "0 16px 34px rgba(0,31,63,.20)",
        fontFamily: FONT_STACK,
        minHeight: 42,
      }}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.navy}, ${PALETTE.gold})`,
            opacity: 0.22,
          }}
        />
      </span>
      <span className="relative inline-flex items-center justify-center gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : Icon ? (
          <Icon className="h-4 w-4" />
        ) : null}
        {children}
      </span>
    </button>
  );
});

function ToggleSwitch({ checked, onChange, disabled }) {
  const dims = { w: 44, h: 26, pad: 3, knob: 19 };
  const xOn = dims.w - dims.pad - dims.knob;
  const xOff = dims.pad;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer")}
      style={{ background: "transparent", border: "none", padding: 0 }}
      aria-pressed={checked}
    >
      <div
        className="relative rounded-full"
        style={{
          width: dims.w,
          height: dims.h,
          background: checked ? "rgba(16,185,129,0.18)" : "rgba(2,10,25,0.08)",
          border: checked
            ? "1px solid rgba(16,185,129,0.30)"
            : `1px solid ${PALETTE.border}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        <motion.div
          className="absolute rounded-full"
          initial={false}
          animate={{ x: checked ? xOn : xOff }}
          transition={{ type: "spring", stiffness: 520, damping: 32 }}
          style={{
            top: dims.pad,
            width: dims.knob,
            height: dims.knob,
            background: "rgba(255,255,255,0.98)",
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 10px 20px rgba(0,31,63,0.10)",
          }}
        />
      </div>
    </button>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      style={{ fontFamily: FONT_STACK }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="grid h-11 w-11 place-items-center rounded-3xl shrink-0"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.18), rgba(11,27,51,0.05) 65%), #fff",
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 12px 26px rgba(0,31,63,.07)",
          }}
        >
          <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
        </div>
        <div className="min-w-0">
          <div className={TW.sectionTitle} style={{ color: PALETTE.navy }}>
            {title}
          </div>
          {subtitle ? (
            <div className={TW.helper} style={{ color: PALETTE.muted, marginTop: 4 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function Chip({ children, onRemove }) {
  return (
    <span
      className={cx("inline-flex items-center gap-2 rounded-full px-3 py-1.5", TW.chip)}
      style={{
        background: "rgba(255,255,255,0.92)",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
        boxShadow: "0 10px 22px rgba(0,31,63,.04)",
        fontFamily: FONT_STACK,
      }}
    >
      <Tag className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
      <span className="max-w-[220px] truncate">{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full transition hover:opacity-90"
          style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
        >
          <Trash2 className="h-3.5 w-3.5" style={{ color: PALETTE.navy }} />
        </button>
      ) : null}
    </span>
  );
}

function PreviewTile({ label, value, full }) {
  return (
    <div
      className="rounded-[20px] p-4"
      style={{ background: "rgba(255,255,255,0.9)", border: `1px solid ${PALETTE.border}` }}
      title={full || value}
    >
      <div className={TW.helper} style={{ color: PALETTE.muted }}>
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold break-words" style={{ color: PALETTE.navy }}>
        {value || "—"}
      </div>
    </div>
  );
}

function SearchResultCard({ item, active, onClick }) {
  const finalPrice = typeof item?.salePrice === "number" ? item.salePrice : item?.price;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-[22px] p-3 transition"
      style={{
        background: active ? "rgba(11,27,51,0.06)" : "rgba(255,255,255,0.9)",
        border: active ? "1px solid rgba(11,27,51,0.18)" : `1px solid ${PALETTE.border}`,
        boxShadow: active
          ? "0 14px 28px rgba(0,31,63,0.08)"
          : "0 10px 22px rgba(0,31,63,0.04)",
      }}
    >
      <div className="flex gap-3">
        <div
          className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl"
          style={{ background: PALETTE.soft2, border: `1px solid ${PALETTE.border}` }}
        >
          {item?.primaryImage?.url ? (
            <img src={item.primaryImage.url} alt={item.title || ""} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <ImageIcon className="h-5 w-5" style={{ color: PALETTE.muted }} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold" style={{ color: PALETTE.navy }}>
                {item?.title || "Untitled product"}
              </div>
            </div>
            {active ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: PALETTE.green }} />
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: PALETTE.soft, color: PALETTE.navy }}
            >
              {item?.productType || "simple"}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: PALETTE.soft, color: PALETTE.navy }}
            >
              {finalPrice !== null && finalPrice !== undefined ? `৳${finalPrice}` : "No price"}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: PALETTE.soft, color: PALETTE.navy }}
            >
              {item?.productType === "variable"
                ? `${item?.variantMeta?.totalActiveVariants || item?.variantSummary?.activeVariants || 0} variants`
                : `${item?.stockQty ?? 0} stock`}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ImagePicker({ label, multiple, previewUrls = [], onFiles }) {
  const inputRef = useRef(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className={TW.label} style={{ color: PALETTE.navy }}>
          {label}
        </div>
        <SoftButton type="button" icon={Upload} onClick={() => inputRef.current?.click()}>
          Choose {multiple ? "files" : "file"}
        </SoftButton>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            onFiles(files);
            e.target.value = "";
          }}
        />
      </div>

      <div
        className="rounded-[22px] border border-dashed p-4"
        style={{ borderColor: "rgba(2,10,25,0.14)", background: "rgba(11,27,51,0.03)" }}
      >
        {previewUrls?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {previewUrls.map((src, i) => (
              <div
                key={src + i}
                className="overflow-hidden rounded-2xl"
                style={{ border: `1px solid ${PALETTE.border}` }}
              >
                <img src={src} alt="" className="h-28 w-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3" style={{ color: PALETTE.muted }}>
            <div
              className="grid h-10 w-10 place-items-center rounded-3xl"
              style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${PALETTE.border}` }}
            >
              <ImageIcon className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </div>
            <div className={TW.helper}>No new files selected.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function VariantImageUploader({ variant, onFiles, onRemoveImage }) {
  const inputRef = useRef(null);
  const previews = safeArray(variant?.images);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className={TW.label} style={{ color: PALETTE.navy }}>
            Variant images
          </div>
          <div className={TW.helper} style={{ color: PALETTE.muted, marginTop: 4 }}>
            Existing and new images for this exact variant combination.
          </div>
        </div>

        <SoftButton type="button" icon={Upload} onClick={() => inputRef.current?.click()}>
          Add images
        </SoftButton>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            onFiles(files);
            e.target.value = "";
          }}
        />
      </div>

      <div
        className="rounded-[24px] border border-dashed p-4"
        style={{
          borderColor: "rgba(2,10,25,0.14)",
          background: "rgba(11,27,51,0.03)",
        }}
      >
        {previews.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {previews.map((img, idx) => (
              <div
                key={img.id}
                className="relative overflow-hidden rounded-2xl"
                style={{
                  border: `1px solid ${PALETTE.border}`,
                  background: "rgba(255,255,255,0.92)",
                }}
              >
                <img src={img.preview || img.url} alt="" className="h-28 w-full object-cover" />
                <div
                  className="absolute left-2 top-2 rounded-xl px-2 py-1 text-[10px] font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.navy,
                  }}
                >
                  {img.file ? "new" : "existing"}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.navy,
                    boxShadow: "0 8px 20px rgba(0,31,63,0.12)",
                  }}
                  title="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3" style={{ color: PALETTE.muted }}>
            <div
              className="grid h-10 w-10 place-items-center rounded-3xl"
              style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${PALETTE.border}` }}
            >
              <ImageIcon className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </div>
            <div className={TW.helper}>No variant images yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  preview,
  editing,
  onToggle,
  children,
  right,
}) {
  return (
    <Card className="overflow-visible">
      <div className="p-5 sm:p-6">
        <SectionHeader
          icon={icon}
          title={title}
          subtitle={subtitle}
          right={
            <div className="flex flex-wrap items-center gap-2">
              {right}
              <SoftButton type="button" icon={editing ? ChevronUp : Pencil} onClick={onToggle}>
                {editing ? "Close" : "Edit"}
              </SoftButton>
            </div>
          }
        />

        <div className="mt-6">
          <Divider />
        </div>

        <div className="mt-6">{preview}</div>

        <AnimatePresence initial={false}>
          {editing ? (
            <motion.div {...fadeUp} transition={{ duration: 0.2 }} className="mt-6">
              <div className="mb-6">
                <Divider />
              </div>
              {children}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Card>
  );
}

export default function AdminEditProductPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [searchPanelOpen, setSearchPanelOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [nextCursor, setNextCursor] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(null);

  const [tagInput, setTagInput] = useState("");

  const [sectionBusy, setSectionBusy] = useState({});
  const [editing, setEditing] = useState({
    core: true,
    tags: false,
    specifications: false,
    description: false,
    variants: false,
    images: false,
  });

  const [newPrimaryFile, setNewPrimaryFile] = useState(null);
  const [newPrimaryPreview, setNewPrimaryPreview] = useState("");
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState([]);
  const [galleryMode, setGalleryMode] = useState("append");

  function openSection(name) {
    setEditing((prev) => ({ ...prev, [name]: true }));
  }

  async function fetchMeta() {
    setMetaLoading(true);
    setMetaError("");
    try {
      const token = getStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [catRes, brandRes] = await Promise.all([
        fetch("/api/admin/categories?status=active&limit=200", {
          headers,
          credentials: "include",
        }),
        fetch("/api/admin/brands?status=active&limit=200", {
          headers,
          credentials: "include",
        }),
      ]);

      const catData = await catRes.json().catch(() => ({}));
      const brandData = await brandRes.json().catch(() => ({}));

      if (!catRes.ok) {
        throw new Error(catData?.message || catData?.error || "Failed to load categories");
      }
      if (!brandRes.ok) {
        throw new Error(brandData?.message || brandData?.error || "Failed to load brands");
      }

      const rawCats =
        (Array.isArray(catData?.items) && catData.items) ||
        (Array.isArray(catData?.categories) && catData.categories) ||
        (Array.isArray(catData?.data) && catData.data) ||
        (Array.isArray(catData) && catData) ||
        [];

      const rawBrands =
        (Array.isArray(brandData?.items) && brandData.items) ||
        (Array.isArray(brandData?.brands) && brandData.brands) ||
        (Array.isArray(brandData?.data) && brandData.data) ||
        (Array.isArray(brandData) && brandData) ||
        [];

      setCategories(
        rawCats
          .map((c) => ({
            _id: String(c?._id || c?.id || ""),
            name: c?.name || c?.title || "Category",
            slug: c?.slug || "",
            subcategories: Array.isArray(c?.subcategories) ? c.subcategories : [],
          }))
          .filter((c) => c._id)
      );

      setBrands(
        rawBrands
          .map((b) => ({
            _id: String(b?._id || b?.id || ""),
            name: b?.name || b?.title || "Brand",
            slug: b?.slug || "",
            categoryIds: Array.isArray(b?.categoryIds) ? b.categoryIds : [],
          }))
          .filter((b) => b._id)
      );

      setMetaLoading(false);
    } catch (e) {
      setMetaError(e?.message || "Failed to load dropdown data");
      setMetaLoading(false);
    }
  }

  useEffect(() => {
    fetchMeta();
  }, []);

  const selectedCategoryObj = useMemo(() => {
    return categories.find((c) => String(c?._id) === String(form?.category || "")) || null;
  }, [categories, form?.category]);

  const subcategoryOptions = useMemo(() => {
    const subs = Array.isArray(selectedCategoryObj?.subcategories)
      ? selectedCategoryObj.subcategories
      : [];
    return subs
      .map((s) => ({
        _id: s?._id,
        name: s?.name || s?.title || "Subcategory",
        slug: s?.slug,
      }))
      .filter((s) => s?._id);
  }, [selectedCategoryObj]);

  const filteredBrands = useMemo(() => {
    if (!form?.category) return brands;
    const matched = brands.filter((b) => {
      if (!Array.isArray(b.categoryIds) || !b.categoryIds.length) return true;
      return b.categoryIds.map(String).includes(String(form.category));
    });
    return matched;
  }, [brands, form?.category]);

  async function searchProducts({ append = false, cursor = "" } = {}) {
    const q = String(searchTerm || "").trim();
    if (!q && !append) {
      setSearchResults([]);
      setNextCursor("");
      return;
    }

    setSearching(true);
    try {
      const token = getStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const url = new URL("/api/admin/products", window.location.origin);
      if (q) url.searchParams.set("search", q);
      url.searchParams.set("limit", "12");
      url.searchParams.set("includeCount", "false");
      url.searchParams.set("includeVariants", "false");
      if (cursor) url.searchParams.set("cursor", cursor);

      const res = await fetch(url.toString(), { headers, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to search products");
      }

      const items = safeArray(data?.products);
      setSearchResults((prev) => (append ? [...prev, ...items] : items));
      setNextCursor(data?.pagination?.nextCursor || "");
    } catch (e) {
      showToast("error", e?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function resetImageState() {
    if (newPrimaryPreview) URL.revokeObjectURL(newPrimaryPreview);
    newGalleryPreviews.forEach((u) => URL.revokeObjectURL(u));
    setNewPrimaryFile(null);
    setNewPrimaryPreview("");
    setNewGalleryFiles([]);
    setNewGalleryPreviews([]);
    setGalleryMode("append");
  }

  async function loadProduct(id) {
    if (!id) return;
    setLoadingProduct(true);
    setSelectedProductId(id);
    try {
      const token = getStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(`/api/admin/products/${id}`, {
        headers,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to load product");
      }
      const p = data?.product || null;
      setProduct(p);
      setForm(buildEditableState(p));
      setTagInput("");
      resetImageState();
      showToast("success", "Product loaded");
      setSearchPanelOpen(false);
    } catch (e) {
      showToast("error", e?.message || "Failed to load product");
    } finally {
      setLoadingProduct(false);
    }
  }

  useEffect(() => {
    return () => {
      if (newPrimaryPreview) URL.revokeObjectURL(newPrimaryPreview);
      newGalleryPreviews.forEach((u) => URL.revokeObjectURL(u));
      safeArray(form?.variants).forEach((variant) => {
        safeArray(variant?.images).forEach((img) => {
          if (img?.file && img?.preview && img.preview.startsWith("blob:")) {
            URL.revokeObjectURL(img.preview);
          }
        });
      });
    };
  }, [newPrimaryPreview, newGalleryPreviews, form?.variants]);

  const selectionReady = Boolean(form?.id);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addSpecGroup() {
    openSection("specifications");
    setForm((prev) => ({
      ...prev,
      specGroups: [...safeArray(prev?.specGroups), createSpecGroup("", safeArray(prev?.specGroups).length)],
    }));
  }

  function removeSpecGroup(groupId) {
    setForm((prev) => ({
      ...prev,
      specGroups: safeArray(prev?.specGroups)
        .filter((g) => g.id !== groupId)
        .map((g, i) => ({ ...g, order: i })),
    }));
  }

  function updateSpecGroup(groupId, patch) {
    setForm((prev) => ({
      ...prev,
      specGroups: safeArray(prev?.specGroups).map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
    }));
  }

  function addSpecToGroup(groupId) {
    openSection("specifications");
    setForm((prev) => ({
      ...prev,
      specGroups: safeArray(prev?.specGroups).map((g) =>
        g.id === groupId
          ? {
              ...g,
              specs: [...safeArray(g.specs), createEmptySpec(safeArray(g.specs).length)],
            }
          : g
      ),
    }));
  }

  function updateSpec(groupId, specId, patch) {
    setForm((prev) => ({
      ...prev,
      specGroups: safeArray(prev?.specGroups).map((g) =>
        g.id === groupId
          ? {
              ...g,
              specs: safeArray(g.specs).map((s) => (s.id === specId ? { ...s, ...patch } : s)),
            }
          : g
      ),
    }));
  }

  function removeSpec(groupId, specId) {
    setForm((prev) => ({
      ...prev,
      specGroups: safeArray(prev?.specGroups).map((g) =>
        g.id === groupId
          ? {
              ...g,
              specs: safeArray(g.specs)
                .filter((s) => s.id !== specId)
                .map((s, i) => ({ ...s, order: i })),
            }
          : g
      ),
    }));
  }

  function updateDescription(id, patch) {
    setForm((prev) => ({
      ...prev,
      description: safeArray(prev?.description).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }

  function updateVariant(id, patch) {
    setForm((prev) => ({
      ...prev,
      variants: safeArray(prev?.variants).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }

  function setVariantAttribute(variantId, oldKey, nextKey, nextValue, mode = "replace") {
    setForm((prev) => ({
      ...prev,
      variants: safeArray(prev?.variants).map((variant) => {
        if (variant.id !== variantId) return variant;
        const attrs = { ...(variant.attributes || {}) };

        if (mode === "rename") {
          const currentValue = attrs[oldKey] ?? "";
          delete attrs[oldKey];
          attrs[nextKey] = currentValue;
        } else if (mode === "value") {
          attrs[oldKey] = nextValue;
        } else if (mode === "replace") {
          delete attrs[oldKey];
          attrs[nextKey] = nextValue;
        }

        return { ...variant, attributes: attrs };
      }),
    }));
  }

  function removeVariantAttribute(variantId, key) {
    setForm((prev) => ({
      ...prev,
      variants: safeArray(prev?.variants).map((variant) => {
        if (variant.id !== variantId) return variant;
        const attrs = { ...(variant.attributes || {}) };
        delete attrs[key];
        return { ...variant, attributes: attrs };
      }),
    }));
  }

  function addVariantImages(variantId, files) {
    if (!files?.length) return;
    openSection("variants");

    setForm((prev) => ({
      ...prev,
      variants: safeArray(prev?.variants).map((variant) => {
        if (variant.id !== variantId) return variant;
        const nextImages = [
          ...safeArray(variant.images),
          ...files.map((file) => ({
            id: uid(),
            file,
            url: "",
            publicId: "",
            alt: "",
            order: safeArray(variant.images).length,
            preview: URL.createObjectURL(file),
            isExisting: false,
          })),
        ];
        return { ...variant, images: nextImages };
      }),
    }));
  }

  function removeVariantImage(variantId, imageIndex) {
    setForm((prev) => ({
      ...prev,
      variants: safeArray(prev?.variants).map((variant) => {
        if (variant.id !== variantId) return variant;
        const imgs = [...safeArray(variant.images)];
        const removed = imgs[imageIndex];
        if (removed?.file && removed?.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(removed.preview);
        }
        imgs.splice(imageIndex, 1);
        return { ...variant, images: imgs.map((img, idx) => ({ ...img, order: idx })) };
      }),
    }));
  }

  async function patchJson(sectionName, payload) {
    if (!form?.id) return;
    setSectionBusy((prev) => ({ ...prev, [sectionName]: true }));
    try {
      const token = getStoredToken();
      const res = await fetch(`/api/admin/products/${form.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || data?.error || `Failed to save ${sectionName}`);
      }
      const p = data?.product;
      setProduct(p);
      setForm(buildEditableState(p));
      showToast("success", `${sectionName} updated`);
    } catch (e) {
      showToast("error", e?.message || `Failed to save ${sectionName}`);
    } finally {
      setSectionBusy((prev) => ({ ...prev, [sectionName]: false }));
    }
  }

  async function patchMultipart(sectionName, builder) {
    if (!form?.id) return;
    setSectionBusy((prev) => ({ ...prev, [sectionName]: true }));
    try {
      const token = getStoredToken();
      const fd = new FormData();
      builder(fd);

      const res = await fetch(`/api/admin/products/${form.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || data?.error || `Failed to save ${sectionName}`);
      }
      const p = data?.product;
      setProduct(p);
      setForm(buildEditableState(p));
      if (sectionName === "images") resetImageState();
      showToast("success", `${sectionName} updated`);
    } catch (e) {
      showToast("error", e?.message || `Failed to save ${sectionName}`);
    } finally {
      setSectionBusy((prev) => ({ ...prev, [sectionName]: false }));
    }
  }

  function validateCore() {
    if (!form?.title?.trim()) return "Product name is required";
    if (!form?.category) return "Category is required";
    if (!form?.brand) return "Brand is required";

    if (form?.productType === "simple") {
      const price = toNumber(form?.price, null);
      const salePrice = form?.salePrice === "" ? null : toNumber(form?.salePrice, null);
      const stockQty = toNumber(form?.stockQty, null);
      if (price === null || price < 0) return "Valid price is required for simple product";
      if (stockQty === null || stockQty < 0) return "Valid stock qty is required";
      if (typeof salePrice === "number" && salePrice > price) {
        return "Sale price cannot exceed price";
      }
    }

    if (form?.productType === "variable") {
      const clean = cleanVariantsForApi(form?.variants);
      if (!clean.length) return "Variable product requires variants";
      const active = clean.filter((v) => v.isActive !== false);
      if (!active.length) return "At least one active variant is required";
      for (let i = 0; i < active.length; i += 1) {
        const v = active[i];
        if (!v.barcode) return `Variant #${i + 1} barcode is required`;
        if (typeof v.price !== "number" || v.price < 0) {
          return `Variant #${i + 1} price is invalid`;
        }
        if (typeof v.salePrice === "number" && v.salePrice > v.price) {
          return `Variant #${i + 1} sale price cannot exceed price`;
        }
        if (!Object.keys(v.attributes || {}).length) {
          return `Variant #${i + 1} needs at least one attribute`;
        }
      }
    }
    return null;
  }

  async function saveCoreSection() {
    const err = validateCore();
    if (err) return showToast("error", err);

    const payload = {
      title: String(form.title || "").trim(),
      category: form.category,
      subcategory: form.subcategory || null,
      brand: form.brand,
      productType: form.productType,
      isNew: Boolean(form.isNew),
      isTrending: Boolean(form.isTrending),
    };

    if (form.productType === "simple") {
      payload.price = toNumber(form.price, null);
      payload.salePrice = form.salePrice === "" ? null : toNumber(form.salePrice, null);
      payload.stockQty = Math.max(0, toNumber(form.stockQty, 0) ?? 0);
      payload.barcode = String(form.barcode || "").trim();
    } else {
      payload.variants = cleanVariantsForApi(form.variants);
    }

    await patchJson("core", payload);
  }

  async function saveTagsSection() {
    await patchJson("tags", { tags: safeArray(form?.tags) });
  }

  async function saveSpecificationsSection() {
    const { specifications, highlights } = cleanSpecsPayload(form?.specGroups);
    await patchJson("specifications", { specifications, highlights });
  }

  async function saveDescriptionSection() {
    await patchJson("description", {
      description: cleanDescriptionForApi(form?.description),
    });
  }

  async function saveVariantsSection() {
    if (form?.productType !== "variable") {
      return showToast("error", "This product is not variable");
    }

    const err = validateCore();
    if (err) return showToast("error", err);

    await patchMultipart("variants", (fd) => {
      fd.set("productType", "variable");
      fd.set("variants", JSON.stringify(cleanVariantsForApi(form?.variants)));

      safeArray(form?.variants).forEach((variant, index) => {
        safeArray(variant?.images).forEach((img) => {
          if (img?.file) {
            fd.append(`variantImages_${index}`, img.file);
          }
        });
      });
    });
  }

  async function saveImagesSection() {
    const hasPrimary = Boolean(newPrimaryFile);
    const hasGallery = newGalleryFiles.length > 0;
    if (!hasPrimary && !hasGallery) {
      return showToast("error", "Select new image files first");
    }

    await patchMultipart("images", (fd) => {
      if (hasPrimary) fd.set("primaryImage", newPrimaryFile);
      if (hasGallery) {
        fd.set("galleryMode", galleryMode);
        newGalleryFiles.forEach((file) => fd.append("galleryImages", file));
      }
    });
  }

  function addTag() {
    openSection("tags");
    const t = String(tagInput || "").trim();
    if (!t) return;
    setForm((prev) => ({
      ...prev,
      tags: Array.from(new Set([...(prev?.tags || []), t])),
    }));
    setTagInput("");
  }

  function removeTag(tag) {
    setForm((prev) => ({
      ...prev,
      tags: safeArray(prev?.tags).filter((x) => x !== tag),
    }));
  }

  function setPrimary(files) {
    openSection("images");
    const file = files?.[0] || null;
    setNewPrimaryFile(file);
    if (newPrimaryPreview) URL.revokeObjectURL(newPrimaryPreview);
    setNewPrimaryPreview(file ? URL.createObjectURL(file) : "");
  }

  function setGallery(files) {
    openSection("images");
    newGalleryPreviews.forEach((u) => URL.revokeObjectURL(u));
    setNewGalleryFiles(files);
    setNewGalleryPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  const highlightedSpecsPreview = useMemo(() => {
    const out = [];
    safeArray(form?.specGroups).forEach((group) => {
      safeArray(group?.specs).forEach((spec) => {
        const label = String(spec?.label || "").trim();
        const value = String(spec?.value || "").trim();
        if (!spec?.isHighlighted || !label || !value) return;
        out.push(`${label}: ${value}`);
      });
    });
    return out;
  }, [form?.specGroups]);

  const summary = useMemo(() => {
    if (!form) return null;
    const variantSummary = product?.variantMeta || null;
    return {
      finalPrice:
        form.productType === "simple"
          ? typeof toNumber(form.salePrice, null) === "number"
            ? toNumber(form.salePrice, null)
            : toNumber(form.price, null)
          : product?.variantMeta?.matchingVariantMatrix?.[0]?.salePrice ??
            product?.variantMeta?.matchingVariantMatrix?.[0]?.price ??
            null,
      totalTags: safeArray(form.tags).length,
      totalSpecifications: safeArray(form.specGroups).reduce(
        (sum, g) => sum + safeArray(g?.specs).length,
        0
      ),
      totalDescriptionBlocks: safeArray(form.description).length,
      totalGallery: safeArray(form.galleryImages).length,
      totalVariants: form.productType === "variable" ? safeArray(form.variants).length : 0,
      variantSummary,
    };
  }, [form, product]);

  return (
    <main
      className="w-full"
      style={{ background: PALETTE.bg, color: PALETTE.navy, fontFamily: FONT_STACK }}
    >
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3200,
          style: {
            background: "rgba(255,255,255,0.92)",
            color: PALETTE.navy,
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 18px 50px rgba(0,31,63,0.14)",
            borderRadius: 18,
            padding: "12px 14px",
            backdropFilter: "blur(10px)",
            fontFamily: FONT_STACK,
            fontWeight: 500,
          },
        }}
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

      <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div
            className={cx(
              "space-y-5 transition-all duration-300",
              searchPanelOpen ? "xl:col-span-4" : "xl:col-span-1"
            )}
          >
            <Card className="overflow-visible sticky top-6">
              <div className={cx(searchPanelOpen ? "p-5 sm:p-6" : "p-3")}>
                <AnimatePresence mode="wait" initial={false}>
                  {searchPanelOpen ? (
                    <motion.div key="search-open" {...fadeUp} transition={{ duration: 0.2 }}>
                      <SectionHeader
                        icon={Search}
                        title="Find Product"
                        subtitle="Search by product name, barcode, or tag."
                      />

                      <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                        <SoftButton
                          type="button"
                          icon={RefreshCcw}
                          onClick={() => searchProducts()}
                          disabled={searching}
                          compact
                          className="w-full sm:w-auto"
                        >
                          Refresh
                        </SoftButton>
                        <SoftButton
                          type="button"
                          icon={PanelLeftClose}
                          onClick={() => setSearchPanelOpen(false)}
                          compact
                          className="w-full sm:w-auto"
                        >
                          Collapse
                        </SoftButton>
                      </div>

                      <div className="mt-6">
                        <Divider />
                      </div>

                      <div className="mt-6 space-y-3">
                        <Field label="Search products" icon={Search}>
                          <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search product name..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                searchProducts();
                              }
                            }}
                          />
                        </Field>

                        <PrimaryButton
                          type="button"
                          icon={Search}
                          loading={searching}
                          onClick={() => searchProducts()}
                          className="w-full justify-center"
                        >
                          Search
                        </PrimaryButton>
                      </div>

                      <div
                        className="mt-6 rounded-[22px] p-4"
                        style={{
                          background: PALETTE.soft2,
                          border: `1px solid ${PALETTE.border}`,
                        }}
                      >
                        <div className={TW.helper} style={{ color: PALETTE.muted }}>
                          Pick a product first. After selecting one, collapse this panel for a wider editing workspace.
                        </div>
                      </div>

                      <div className="mt-6 space-y-3 max-h-[620px] overflow-auto pr-1">
                        {searchResults.length ? (
                          searchResults.map((item) => (
                            <SearchResultCard
                              key={String(item?._id)}
                              item={item}
                              active={String(selectedProductId) === String(item?._id)}
                              onClick={() => loadProduct(String(item?._id))}
                            />
                          ))
                        ) : (
                          <div
                            className="rounded-[22px] p-4 text-center"
                            style={{
                              background: PALETTE.soft,
                              border: `1px solid ${PALETTE.border}`,
                            }}
                          >
                            <div className={TW.helper} style={{ color: PALETTE.muted }}>
                              {searching ? "Searching..." : "No products yet. Search to load one."}
                            </div>
                          </div>
                        )}

                        {nextCursor ? (
                          <SoftButton
                            type="button"
                            className="w-full justify-center"
                            onClick={() => searchProducts({ append: true, cursor: nextCursor })}
                            disabled={searching}
                          >
                            Load more
                          </SoftButton>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="search-collapsed"
                      {...fadeUp}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <SoftButton
                        type="button"
                        icon={PanelLeftOpen}
                        onClick={() => setSearchPanelOpen(true)}
                        compact
                        className="w-full min-w-0 px-0"
                        title="Expand search panel"
                      />

                      <SoftButton
                        type="button"
                        icon={Search}
                        onClick={() => setSearchPanelOpen(true)}
                        compact
                        className="w-full min-w-0 px-0"
                        title="Search products"
                      />

                      {selectionReady ? (
                        <button
                          type="button"
                          onClick={() => setSearchPanelOpen(true)}
                          className="w-full overflow-hidden rounded-[20px] transition hover:opacity-95"
                          style={{
                            border: `1px solid ${PALETTE.border}`,
                            background: "rgba(255,255,255,0.95)",
                            boxShadow: "0 10px 22px rgba(0,31,63,0.04)",
                          }}
                          title={form?.title || "Selected product"}
                        >
                          <div
                            className="aspect-[3/4] w-full"
                            style={{ background: PALETTE.soft2 }}
                          >
                            {form?.primaryImage?.url ? (
                              <img
                                src={form.primaryImage.url}
                                alt={form?.title || ""}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full place-items-center">
                                <Package className="h-5 w-5" style={{ color: PALETTE.muted }} />
                              </div>
                            )}
                          </div>
                        </button>
                      ) : (
                        <div
                          className="w-full rounded-[20px] border"
                          style={{
                            height: 88,
                            borderColor: PALETTE.border,
                            background: PALETTE.soft2,
                          }}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>

          <div
            className={cx(
              "space-y-5 transition-all duration-300",
              searchPanelOpen ? "xl:col-span-8" : "xl:col-span-11"
            )}
          >
            <Card className="overflow-visible">
              <div className="p-5 sm:p-6">
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
                        <div className={TW.title} style={{ color: PALETTE.navy }}>
                          Edit Product
                        </div>
                        <div className={TW.helper} style={{ color: PALETTE.muted, marginTop: 6 }}>
                          Search a product, then edit it section by section with a wider workspace.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div
                      className={cx(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
                        TW.pill
                      )}
                      style={{
                        background: selectionReady
                          ? "rgba(16,185,129,0.10)"
                          : "rgba(255,107,107,0.10)",
                        border: selectionReady
                          ? "1px solid rgba(16,185,129,0.2)"
                          : "1px solid rgba(255,107,107,0.18)",
                      }}
                    >
                      <span style={{ color: PALETTE.muted }}>Product</span>
                      <span style={{ color: PALETTE.navy }}>
                        {selectionReady ? "Selected" : "None"}
                      </span>
                    </div>

                    <div
                      className={cx(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
                        TW.pill
                      )}
                      style={{
                        background: metaError ? "rgba(255,107,107,0.10)" : "rgba(11,27,51,0.04)",
                        border: metaError
                          ? "1px solid rgba(255,107,107,0.18)"
                          : `1px solid ${PALETTE.border}`,
                      }}
                    >
                      <span style={{ color: PALETTE.muted }}>Meta</span>
                      <span style={{ color: PALETTE.navy }}>
                        {metaLoading ? "Loading" : metaError ? "Failed" : "Loaded"}
                      </span>
                    </div>

                    <div
                      className={cx(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
                        TW.pill
                      )}
                      style={{
                        background: "rgba(11,27,51,0.04)",
                        border: `1px solid ${PALETTE.border}`,
                      }}
                    >
                      <span style={{ color: PALETTE.muted }}>Workspace</span>
                      <span style={{ color: PALETTE.navy }}>
                        {searchPanelOpen ? "Split" : "Expanded"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {!selectionReady ? (
              <Card>
                <div className="p-8 text-center">
                  <div
                    className="mx-auto grid h-20 w-20 place-items-center rounded-[26px]"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.16), rgba(11,27,51,0.05) 72%), #fff",
                      border: `1px solid ${PALETTE.border}`,
                      boxShadow: "0 18px 34px rgba(0,31,63,0.08)",
                    }}
                  >
                    {loadingProduct ? (
                      <Loader2 className="h-7 w-7 animate-spin" style={{ color: PALETTE.navy }} />
                    ) : (
                      <div className="relative">
                        <ShoppingBag className="h-8 w-8" style={{ color: PALETTE.navy }} />
                        <Smartphone
                          className="absolute -right-3 -bottom-2 h-4 w-4"
                          style={{ color: PALETTE.coral }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-base font-semibold" style={{ color: PALETTE.navy }}>
                    Select a product to edit
                  </div>
                  <div className="mt-2 text-sm" style={{ color: PALETTE.muted }}>
                    Use the search panel on the left, then choose a product. All sections will load here with live previews.
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
                  <Card>
                    <div className="p-5 sm:p-6">
                      <SectionHeader
                        icon={Eye}
                        title="Product Snapshot"
                        subtitle="Fast overview before making edits."
                      />
                      <div className="mt-6">
                        <Divider />
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <PreviewTile label="Product name" value={form?.title} />
                        <PreviewTile label="Type" value={form?.productType} />
                        <PreviewTile label="Brand" value={product?.brand?.name || "—"} />
                        <PreviewTile label="Category" value={product?.category?.name || "—"} />
                        <PreviewTile
                          label="Price preview"
                          value={
                            summary?.finalPrice !== null && summary?.finalPrice !== undefined
                              ? `৳${summary.finalPrice}`
                              : "—"
                          }
                        />
                        <PreviewTile label="Gallery images" value={String(summary?.totalGallery ?? 0)} />
                        <PreviewTile
                          label="Tags / Specs"
                          value={`${summary?.totalTags ?? 0} / ${summary?.totalSpecifications ?? 0}`}
                        />
                        <PreviewTile
                          label="Description / Variants"
                          value={`${summary?.totalDescriptionBlocks ?? 0} / ${summary?.totalVariants ?? 0}`}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.02 }}>
                  <SectionCard
                    icon={Layers}
                    title="Core"
                    subtitle="Basic product identity, pricing, stock and product type."
                    editing={editing.core}
                    onToggle={() => setEditing((p) => ({ ...p, core: !p.core }))}
                    right={
                      <PrimaryButton
                        type="button"
                        icon={Save}
                        loading={sectionBusy.core}
                        onClick={saveCoreSection}
                      >
                        Save Core
                      </PrimaryButton>
                    }
                    preview={
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <PreviewTile label="Title" value={form?.title} />
                        <PreviewTile
                          label="Category / Brand"
                          value={`${product?.category?.name || "—"} / ${product?.brand?.name || "—"}`}
                        />
                        <PreviewTile
                          label="Simple pricing"
                          value={
                            form?.productType === "simple"
                              ? `৳${form?.price || 0}${form?.salePrice ? ` → ৳${form.salePrice}` : ""}`
                              : "Uses variants"
                          }
                        />
                        <PreviewTile
                          label="Stock or Variants"
                          value={
                            form?.productType === "simple"
                              ? `${form?.stockQty ?? 0} stock`
                              : `${safeArray(form?.variants).length} variants`
                          }
                        />
                        <PreviewTile
                          label="Barcode"
                          value={
                            form?.productType === "simple"
                              ? form?.barcode || "—"
                              : "Managed by variants"
                          }
                        />
                        <PreviewTile
                          label="Flags"
                          value={`${form?.isNew ? "New" : "Normal"} · ${
                            form?.isTrending ? "Trending" : "Regular"
                          }`}
                        />
                      </div>
                    }
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Product name" required icon={Package}>
                        <Input
                          value={form?.title || ""}
                          onChange={(e) => setField("title", e.target.value)}
                          placeholder="Apple iPhone 15"
                        />
                      </Field>

                      <Field label="Product type" required icon={Boxes}>
                        <Select
                          value={form?.productType || "simple"}
                          onChange={(e) => setField("productType", e.target.value)}
                        >
                          {ALLOWED_PRODUCT_TYPE.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Category" required icon={Layers}>
                        <Select
                          value={form?.category || ""}
                          onChange={(e) => setField("category", e.target.value)}
                          disabled={metaLoading || !!metaError}
                        >
                          <option value="">Select category</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Subcategory" icon={Layers}>
                        <Select
                          value={form?.subcategory || ""}
                          onChange={(e) => setField("subcategory", e.target.value)}
                          disabled={!form?.category || subcategoryOptions.length === 0}
                        >
                          <option value="">Select subcategory</option>
                          {subcategoryOptions.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Brand" required icon={Tag}>
                        <Select
                          value={form?.brand || ""}
                          onChange={(e) => setField("brand", e.target.value)}
                          disabled={metaLoading || !!metaError}
                        >
                          <option value="">Select brand</option>
                          {filteredBrands.map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.name}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <div className="hidden md:block" />

                      {form?.productType === "simple" ? (
                        <>
                          <Field label="Price" required icon={Package}>
                            <Input
                              inputMode="decimal"
                              value={form?.price ?? ""}
                              onChange={(e) => setField("price", e.target.value)}
                              placeholder="120000"
                            />
                          </Field>

                          <Field label="Sale price" icon={Package}>
                            <Input
                              inputMode="decimal"
                              value={form?.salePrice ?? ""}
                              onChange={(e) => setField("salePrice", e.target.value)}
                              placeholder="115000"
                            />
                          </Field>

                          <Field
                            label="Barcode"
                            icon={BarcodeIcon}
                            rightSlot={
                              <SoftButton
                                type="button"
                                icon={BarcodeIcon}
                                onClick={() => setField("barcode", randomDigits(13))}
                              >
                                Generate
                              </SoftButton>
                            }
                          >
                            <Input
                              value={form?.barcode || ""}
                              onChange={(e) => setField("barcode", e.target.value)}
                              placeholder="Auto / manual"
                            />
                          </Field>

                          <Field label="Stock qty" required icon={Boxes}>
                            <Input
                              inputMode="numeric"
                              value={form?.stockQty ?? 0}
                              onChange={(e) =>
                                setField("stockQty", Math.max(0, toNumber(e.target.value, 0) ?? 0))
                              }
                              placeholder="0"
                            />
                          </Field>
                        </>
                      ) : (
                        <div
                          className="md:col-span-2 rounded-[20px] p-4"
                          style={{
                            background: PALETTE.soft2,
                            border: `1px solid ${PALETTE.border}`,
                          }}
                        >
                          <div className={TW.helper} style={{ color: PALETTE.muted }}>
                            Variable product detected. Price and stock are controlled by variant rows below.
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <div
                        className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
                        style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                      >
                        <Sparkles className="h-4 w-4" style={{ color: PALETTE.muted }} />
                        <span className={TW.helper} style={{ color: PALETTE.navy }}>
                          New
                        </span>
                        <ToggleSwitch
                          checked={Boolean(form?.isNew)}
                          onChange={(v) => setField("isNew", v)}
                        />
                      </div>

                      <div
                        className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
                        style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                      >
                        <Flame className="h-4 w-4" style={{ color: PALETTE.muted }} />
                        <span className={TW.helper} style={{ color: PALETTE.navy }}>
                          Trending
                        </span>
                        <ToggleSwitch
                          checked={Boolean(form?.isTrending)}
                          onChange={(v) => setField("isTrending", v)}
                        />
                      </div>
                    </div>
                  </SectionCard>
                </motion.div>

                <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.03 }}>
                  <SectionCard
                    icon={Tag}
                    title="Tags"
                    subtitle="Search keywords and quick filter labels."
                    editing={editing.tags}
                    onToggle={() => setEditing((p) => ({ ...p, tags: !p.tags }))}
                    right={
                      <PrimaryButton
                        type="button"
                        icon={Save}
                        loading={sectionBusy.tags}
                        onClick={saveTagsSection}
                      >
                        Save Tags
                      </PrimaryButton>
                    }
                    preview={
                      <div className="flex flex-wrap gap-2">
                        {safeArray(form?.tags).length ? (
                          form.tags.map((t) => <Chip key={t}>{t}</Chip>)
                        ) : (
                          <div className={TW.helper} style={{ color: PALETTE.muted }}>
                            No tags added.
                          </div>
                        )}
                      </div>
                    }
                  >
                    <Field
                      label="Add tag"
                      icon={Tag}
                      rightSlot={
                        <SoftButton
                          type="button"
                          onClick={() => {
                            openSection("tags");
                            addTag();
                          }}
                          disabled={!String(tagInput || "").trim()}
                        >
                          Add
                        </SoftButton>
                      }
                    >
                      <Input
                        value={tagInput}
                        onChange={(e) => {
                          openSection("tags");
                          setTagInput(e.target.value);
                        }}
                        onFocus={() => openSection("tags")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="iphone"
                      />
                    </Field>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {safeArray(form?.tags).map((t) => (
                        <Chip key={t} onRemove={() => removeTag(t)}>
                          {t}
                        </Chip>
                      ))}
                    </div>
                  </SectionCard>
                </motion.div>

                <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.04 }}>
                  <SectionCard
                    icon={FolderTree}
                    title="Specifications by Group"
                    subtitle="Grouped specifications. Highlighted specs will also populate highlights."
                    editing={editing.specifications}
                    onToggle={() => setEditing((p) => ({ ...p, specifications: !p.specifications }))}
                    right={
                      <div className="flex gap-2">
                        <SoftButton type="button" icon={Plus} onClick={addSpecGroup}>
                          Add Group
                        </SoftButton>

                        <PrimaryButton
                          type="button"
                          icon={Save}
                          loading={sectionBusy.specifications}
                          onClick={saveSpecificationsSection}
                        >
                          Save Specifications
                        </PrimaryButton>
                      </div>
                    }
                    preview={
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          <PreviewTile
                            label="Total specs"
                            value={String(summary?.totalSpecifications ?? 0)}
                          />
                          <PreviewTile
                            label="Highlighted specs"
                            value={String(highlightedSpecsPreview.length)}
                          />
                          <PreviewTile
                            label="Groups"
                            value={String(safeArray(form?.specGroups).length)}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {highlightedSpecsPreview.length ? (
                            highlightedSpecsPreview.map((item, i) => <Chip key={item + i}>{item}</Chip>)
                          ) : (
                            <div className={TW.helper} style={{ color: PALETTE.muted }}>
                              No highlighted specs yet.
                            </div>
                          )}
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                        {safeArray(form?.specGroups).map((group, groupIndex) => (
                          <motion.div
                            key={group.id}
                            {...fadeUp}
                            transition={{ duration: 0.18 }}
                            className="rounded-[24px] p-4"
                            style={{
                              background: "rgba(255,255,255,0.92)",
                              border: `1px solid ${PALETTE.border}`,
                              boxShadow: "0 12px 30px rgba(0,31,63,0.06)",
                            }}
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-flex items-center rounded-2xl px-3 py-2 text-[12px] font-semibold"
                                  style={{
                                    background: PALETTE.soft,
                                    border: `1px solid ${PALETTE.border}`,
                                    color: PALETTE.navy,
                                  }}
                                >
                                  Group #{groupIndex + 1}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeSpecGroup(group.id)}
                                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 text-sm font-semibold"
                                  style={{
                                    background: "rgba(255,107,107,0.14)",
                                    border: "1px solid rgba(255,107,107,0.25)",
                                    color: PALETTE.navy,
                                    boxShadow: "0 12px 28px rgba(0,31,63,.10)",
                                    fontFamily: FONT_STACK,
                                    minHeight: 42,
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove group
                                </button>
                              </div>
                            </div>

                            <div className="mt-4">
                              <Field label="Group name" required icon={ListTree}>
                                <Input
                                  value={group.name}
                                  onChange={(e) => updateSpecGroup(group.id, { name: e.target.value })}
                                  placeholder="Display"
                                />
                              </Field>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Chip>Group: {String(group.name || "").trim() || `Group ${groupIndex + 1}`}</Chip>
                              <Chip>Specs: {safeArray(group.specs).length}</Chip>
                            </div>

                            <div className="mt-5">
                              <Divider />
                            </div>

                            <div className="mt-5 space-y-3">
                              {safeArray(group.specs).length ? (
                                safeArray(group.specs).map((spec, specIndex) => (
                                  <div
                                    key={spec.id}
                                    className="rounded-[20px] p-4"
                                    style={{
                                      background: PALETTE.soft2,
                                      border: `1px solid ${PALETTE.border}`,
                                    }}
                                  >
                                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="inline-flex items-center rounded-2xl px-3 py-2 text-[12px] font-semibold"
                                          style={{
                                            background: "rgba(255,255,255,0.92)",
                                            border: `1px solid ${PALETTE.border}`,
                                            color: PALETTE.navy,
                                          }}
                                        >
                                          Spec #{specIndex + 1}
                                        </span>

                                        <div
                                          className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
                                          style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${PALETTE.border}` }}
                                        >
                                          <span className={TW.helper} style={{ color: PALETTE.navy }}>
                                            Highlight
                                          </span>
                                          <ToggleSwitch
                                            checked={Boolean(spec.isHighlighted)}
                                            onChange={(checked) =>
                                              updateSpec(group.id, spec.id, { isHighlighted: checked })
                                            }
                                          />
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => removeSpec(group.id, spec.id)}
                                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 text-sm font-semibold"
                                        style={{
                                          background: "rgba(255,107,107,0.14)",
                                          border: "1px solid rgba(255,107,107,0.25)",
                                          color: PALETTE.navy,
                                          fontFamily: FONT_STACK,
                                          minHeight: 42,
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Remove
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                                      <div className="lg:col-span-4">
                                        <Field label="Label" required hideIcon>
                                          <Input
                                            value={spec.label}
                                            onChange={(e) =>
                                              updateSpec(group.id, spec.id, { label: e.target.value })
                                            }
                                            placeholder="Screen Size"
                                          />
                                        </Field>
                                      </div>

                                      <div className="lg:col-span-8">
                                        <Field label="Value" required hideIcon>
                                          <Input
                                            value={spec.value}
                                            onChange={(e) =>
                                              updateSpec(group.id, spec.id, { value: e.target.value })
                                            }
                                            placeholder="6.1-inch Super Retina XDR"
                                          />
                                        </Field>
                                      </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <Chip>
                                        Group: {String(group.name || "").trim() || `Group ${groupIndex + 1}`}
                                      </Chip>
                                      <Chip>
                                        Label: {String(spec.label || "").trim() || `Spec ${specIndex + 1}`}
                                      </Chip>
                                      <Chip>
                                        Value: {String(spec.value || "").trim() || "Not added"}
                                      </Chip>
                                      {spec.isHighlighted ? <Chip>Highlighted</Chip> : null}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className={TW.helper} style={{ color: PALETTE.muted }}>
                                  No specs in this group yet.
                                </div>
                              )}

                              <div className="flex justify-end pt-1">
                                <PrimaryButton
                                  type="button"
                                  icon={Plus}
                                  onClick={() => addSpecToGroup(group.id)}
                                >
                                  Add spec
                                </PrimaryButton>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </SectionCard>
                </motion.div>

                <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.05 }}>
                  <SectionCard
                    icon={FileText}
                    title="Description Blocks"
                    subtitle="Structured content sections for the product details area."
                    editing={editing.description}
                    onToggle={() => setEditing((p) => ({ ...p, description: !p.description }))}
                    right={
                      <div className="flex gap-2">
                        <SoftButton
                          type="button"
                          icon={Plus}
                          onClick={() => {
                            openSection("description");
                            setForm((prev) => ({
                              ...prev,
                              description: [
                                ...safeArray(prev?.description),
                                {
                                  id: uid(),
                                  title: "",
                                  details: "",
                                  order: safeArray(prev?.description).length,
                                },
                              ],
                            }));
                          }}
                        >
                          Add
                        </SoftButton>

                        <PrimaryButton
                          type="button"
                          icon={Save}
                          loading={sectionBusy.description}
                          onClick={saveDescriptionSection}
                        >
                          Save Description
                        </PrimaryButton>
                      </div>
                    }
                    preview={
                      <div className="space-y-3">
                        {safeArray(form?.description).length ? (
                          form.description.slice(0, 4).map((b) => (
                            <PreviewTile
                              key={b.id}
                              label={b.title || "Untitled block"}
                              value={String(b.details || "").slice(0, 120) || "—"}
                              full={b.details || ""}
                            />
                          ))
                        ) : (
                          <div className={TW.helper} style={{ color: PALETTE.muted }}>
                            No description blocks yet.
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div className="space-y-3">
                      {safeArray(form?.description).map((b, idx) => (
                        <div
                          key={b.id}
                          className="rounded-[24px] p-4"
                          style={{
                            background: "rgba(255,255,255,0.92)",
                            border: `1px solid ${PALETTE.border}`,
                          }}
                        >
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                            <div className="md:col-span-4">
                              <Field label="Title" icon={Info}>
                                <Input
                                  value={b.title}
                                  onChange={(e) =>
                                    updateDescription(b.id, { title: e.target.value })
                                  }
                                  placeholder="Overview"
                                />
                              </Field>
                            </div>

                            <div className="md:col-span-7">
                              <Field label="Details" icon={Info} multiline>
                                <Textarea
                                  rows={4}
                                  value={b.details}
                                  onChange={(e) =>
                                    updateDescription(b.id, { details: e.target.value })
                                  }
                                  placeholder="Write details..."
                                />
                              </Field>
                            </div>

                            <div className="md:col-span-1 flex items-end justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    description: safeArray(prev?.description)
                                      .filter((x) => x.id !== b.id)
                                      .map((x, i) => ({ ...x, order: i })),
                                  }))
                                }
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                                style={{
                                  background: "rgba(255,107,107,0.12)",
                                  border: "1px solid rgba(255,107,107,0.22)",
                                  color: PALETTE.navy,
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 text-[11px] font-medium" style={{ color: PALETTE.muted }}>
                            Order: {idx}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </motion.div>

                {form?.productType === "variable" ? (
                  <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.06 }}>
                    <SectionCard
                      icon={Boxes}
                      title="Variants"
                      subtitle="Edit barcode, stock, price, attributes, and per-variant images."
                      editing={editing.variants}
                      onToggle={() => setEditing((p) => ({ ...p, variants: !p.variants }))}
                      right={
                        <div className="flex gap-2">
                          <SoftButton
                            type="button"
                            icon={Plus}
                            onClick={() => {
                              openSection("variants");
                              setForm((prev) => ({
                                ...prev,
                                variants: [
                                  ...safeArray(prev?.variants),
                                  {
                                    id: uid(),
                                    barcode: "",
                                    attributes: { storage: "", color: "" },
                                    price: "",
                                    salePrice: "",
                                    stockQty: 0,
                                    isActive: true,
                                    images: [],
                                  },
                                ],
                              }));
                            }}
                          >
                            Add Variant
                          </SoftButton>

                          <PrimaryButton
                            type="button"
                            icon={Save}
                            loading={sectionBusy.variants}
                            onClick={saveVariantsSection}
                          >
                            Save Variants
                          </PrimaryButton>
                        </div>
                      }
                      preview={
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          <PreviewTile
                            label="Variant count"
                            value={String(safeArray(form?.variants).length)}
                          />
                          <PreviewTile
                            label="Active variants"
                            value={String(
                              safeArray(form?.variants).filter((v) => v.isActive !== false).length
                            )}
                          />
                          <PreviewTile
                            label="Attribute groups"
                            value={product?.variantMeta?.attributeKeys?.join(", ") || "—"}
                          />
                        </div>
                      }
                    >
                      <div className="space-y-3">
                        {safeArray(form?.variants).map((v, idx) => (
                          <div
                            key={v.id}
                            className="rounded-[24px] p-4"
                            style={{
                              background: "rgba(255,255,255,0.92)",
                              border: `1px solid ${PALETTE.border}`,
                              boxShadow: "0 12px 30px rgba(0,31,63,0.06)",
                            }}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="inline-flex items-center rounded-2xl px-3 py-2 text-[12px] font-semibold"
                                  style={{
                                    background: PALETTE.soft,
                                    border: `1px solid ${PALETTE.border}`,
                                    color: PALETTE.navy,
                                  }}
                                >
                                  Variant #{idx + 1}
                                </span>

                                <div
                                  className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
                                  style={{
                                    background: PALETTE.soft,
                                    border: `1px solid ${PALETTE.border}`,
                                  }}
                                >
                                  <span className={TW.helper} style={{ color: PALETTE.navy }}>
                                    Active
                                  </span>
                                  <ToggleSwitch
                                    checked={v.isActive !== false}
                                    onChange={() =>
                                      updateVariant(v.id, {
                                        isActive: !(v.isActive !== false),
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <SoftButton
                                  type="button"
                                  icon={BarcodeIcon}
                                  onClick={() => updateVariant(v.id, { barcode: randomDigits(13) })}
                                >
                                  Generate
                                </SoftButton>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setForm((prev) => ({
                                      ...prev,
                                      variants: safeArray(prev?.variants).filter((x) => x.id !== v.id),
                                    }))
                                  }
                                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                                  style={{
                                    background: "rgba(255,107,107,0.14)",
                                    border: "1px solid rgba(255,107,107,0.25)",
                                    color: PALETTE.navy,
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" /> Remove
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                              <Field label="Barcode" required icon={BarcodeIcon}>
                                <Input
                                  value={v.barcode}
                                  onChange={(e) => updateVariant(v.id, { barcode: e.target.value })}
                                  placeholder="auto / manual"
                                />
                              </Field>

                              <Field label="Stock qty" required icon={Boxes}>
                                <Input
                                  inputMode="numeric"
                                  value={v.stockQty}
                                  onChange={(e) =>
                                    updateVariant(v.id, {
                                      stockQty: Math.max(0, toNumber(e.target.value, 0) ?? 0),
                                    })
                                  }
                                  placeholder="0"
                                />
                              </Field>

                              <Field label="Price" required icon={Package}>
                                <Input
                                  inputMode="decimal"
                                  value={v.price}
                                  onChange={(e) => updateVariant(v.id, { price: e.target.value })}
                                  placeholder="120000"
                                />
                              </Field>

                              <Field label="Sale price" icon={Package}>
                                <Input
                                  inputMode="decimal"
                                  value={v.salePrice}
                                  onChange={(e) => updateVariant(v.id, { salePrice: e.target.value })}
                                  placeholder="optional"
                                />
                              </Field>
                            </div>

                            <div className="mt-6">
                              <Divider />
                            </div>

                            <div className="mt-6">
                              <div className="flex items-center justify-between gap-3">
                                <div className={TW.label} style={{ color: PALETTE.navy }}>
                                  Attributes
                                </div>
                                <SoftButton
                                  type="button"
                                  icon={Plus}
                                  onClick={() => {
                                    openSection("variants");
                                    updateVariant(v.id, {
                                      attributes: { ...(v.attributes || {}), "": "" },
                                    });
                                  }}
                                >
                                  Add attribute
                                </SoftButton>
                              </div>

                              <div className="mt-3 space-y-2">
                                {Object.entries(v.attributes || {}).length ? (
                                  Object.entries(v.attributes || {}).map(([k, val], i) => (
                                    <div key={k + i} className="grid grid-cols-12 gap-2">
                                      <div className="col-span-5">
                                        <div
                                          className="rounded-2xl px-3"
                                          style={{
                                            background: "rgba(255,255,255,0.98)",
                                            border: `1px solid ${PALETTE.border}`,
                                          }}
                                        >
                                          <Input
                                            value={k}
                                            onChange={(e) =>
                                              setVariantAttribute(
                                                v.id,
                                                k,
                                                e.target.value,
                                                String(val),
                                                "rename"
                                              )
                                            }
                                            placeholder="storage"
                                          />
                                        </div>
                                      </div>

                                      <div className="col-span-6">
                                        <div
                                          className="rounded-2xl px-3"
                                          style={{
                                            background: "rgba(255,255,255,0.98)",
                                            border: `1px solid ${PALETTE.border}`,
                                          }}
                                        >
                                          <Input
                                            value={String(val)}
                                            onChange={(e) =>
                                              setVariantAttribute(
                                                v.id,
                                                k,
                                                k,
                                                e.target.value,
                                                "value"
                                              )
                                            }
                                            placeholder="128GB"
                                          />
                                        </div>
                                      </div>

                                      <div className="col-span-1 flex items-center justify-end">
                                        <button
                                          type="button"
                                          onClick={() => removeVariantAttribute(v.id, k)}
                                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                                          style={{
                                            background: "rgba(255,107,107,0.12)",
                                            border: "1px solid rgba(255,107,107,0.22)",
                                            color: PALETTE.navy,
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className={TW.helper} style={{ color: PALETTE.muted }}>
                                    No attributes.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-6">
                              <Divider />
                            </div>

                            <div className="mt-6">
                              <VariantImageUploader
                                variant={v}
                                onFiles={(files) => addVariantImages(v.id, files)}
                                onRemoveImage={(imageIndex) => removeVariantImage(v.id, imageIndex)}
                              />
                            </div>

                            <div className="mt-4 rounded-[20px] p-4" style={{ background: PALETTE.soft2, border: `1px solid ${PALETTE.border}` }}>
                              <div className={TW.helper} style={{ color: PALETTE.muted }}>
                                Tip: Use attributes like <span style={{ color: PALETTE.navy, fontWeight: 700 }}>storage</span> +{" "}
                                <span style={{ color: PALETTE.navy, fontWeight: 700 }}>color</span>.
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  </motion.div>
                ) : null}

                <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.07 }}>
                  <SectionCard
                    icon={Palette}
                    title="Images"
                    subtitle="Preview current images and upload replacement or appended gallery files."
                    editing={editing.images}
                    onToggle={() => setEditing((p) => ({ ...p, images: !p.images }))}
                    right={
                      <PrimaryButton
                        type="button"
                        icon={Save}
                        loading={sectionBusy.images}
                        onClick={saveImagesSection}
                      >
                        Save Images
                      </PrimaryButton>
                    }
                    preview={
                      <div className="space-y-4">
                        <div>
                          <div className={TW.label} style={{ color: PALETTE.navy, marginBottom: 10 }}>
                            Current primary image
                          </div>
                          <div
                            className="overflow-hidden rounded-[22px]"
                            style={{
                              border: `1px solid ${PALETTE.border}`,
                              background: PALETTE.soft2,
                            }}
                          >
                            {form?.primaryImage?.url ? (
                              <img
                                src={form.primaryImage.url}
                                alt="Primary"
                                className="h-64 w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-64 place-items-center">
                                <ImageIcon className="h-6 w-6" style={{ color: PALETTE.muted }} />
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className={TW.label} style={{ color: PALETTE.navy, marginBottom: 10 }}>
                            Current gallery
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {safeArray(form?.galleryImages).length ? (
                              safeArray(form.galleryImages).map((img, idx) => (
                                <div
                                  key={img?.url || idx}
                                  className="overflow-hidden rounded-2xl"
                                  style={{ border: `1px solid ${PALETTE.border}` }}
                                >
                                  <img src={img?.url} alt="Gallery" className="h-28 w-full object-cover" />
                                </div>
                              ))
                            ) : (
                              <div className={TW.helper} style={{ color: PALETTE.muted }}>
                                No gallery images.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-6">
                      <ImagePicker
                        label="Replace primary image"
                        multiple={false}
                        previewUrls={newPrimaryPreview ? [newPrimaryPreview] : []}
                        onFiles={setPrimary}
                      />

                      <div>
                        <Divider />
                      </div>

                      <Field label="Gallery update mode" icon={ImageIcon}>
                        <Select
                          value={galleryMode}
                          onChange={(e) => {
                            openSection("images");
                            setGalleryMode(e.target.value);
                          }}
                        >
                          <option value="append">append</option>
                          <option value="replace">replace</option>
                          <option value="keep">keep</option>
                        </Select>
                      </Field>

                      <ImagePicker
                        label="Upload gallery images"
                        multiple
                        previewUrls={newGalleryPreviews}
                        onFiles={setGallery}
                      />

                      <div
                        className="rounded-[20px] p-4"
                        style={{ background: PALETTE.soft2, border: `1px solid ${PALETTE.border}` }}
                      >
                        <div className={TW.helper} style={{ color: PALETTE.muted }}>
                          Use <span style={{ color: PALETTE.navy, fontWeight: 700 }}>append</span> to add more gallery images, or{" "}
                          <span style={{ color: PALETTE.navy, fontWeight: 700 }}>replace</span> to swap the current gallery with the new uploaded set.
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}