"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ImagePlus,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Filter,
  ArrowRight,
  Loader2,
  CalendarDays,
  Link2,
  Type,
  Eye,
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

function formatDateTimeInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateShort(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function normalizeOptionalString(value) {
  const v = String(value ?? "").trim();
  return v ? v : "";
}

async function apiFetch(path, opts = {}) {
  const token = getStoredToken();

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
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
          "group flex min-h-11 items-center gap-2 overflow-hidden rounded-2xl px-3 transition",
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
  className,
  ...props
}) {
  const isDisabled = disabled || loading;
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
        background: "rgba(255,255,255,0.96)",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
        boxShadow: "0 10px 24px rgba(0,31,63,.06)",
      }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
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
        "group relative overflow-hidden rounded-2xl px-4 py-2.5 text-sm font-semibold text-white",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer active:scale-[0.99]",
        className
      )}
      style={{
        background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
        boxShadow: "0 16px 34px rgba(0,31,63,.20)",
      }}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.navy}, ${PALETTE.gold})`,
            opacity: 0.32,
          }}
        />
      </span>

      <span className="relative inline-flex items-center justify-center gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
        {children}
      </span>
    </button>
  );
});

const IconBtn = React.memo(function IconBtn({ title, onClick, children, tone = "soft", disabled, loading }) {
  const isDisabled = disabled || loading;
  const toneStyle =
    tone === "danger"
      ? { background: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.22)", color: PALETTE.navy }
      : { background: "rgba(255,255,255,0.96)", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={isDisabled}
      className={cx(
        "inline-flex h-9 w-9 items-center justify-center rounded-2xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-90 active:scale-[0.99]"
      )}
      style={toneStyle}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
});

function ToggleSwitch({ checked, onChange, disabled, size = "sm" }) {
  const dims = size === "sm" ? { w: 44, h: 26, pad: 3, knob: 19 } : { w: 52, h: 30, pad: 3, knob: 24 };
  const xOn = dims.w - dims.pad - dims.knob;
  const xOff = dims.pad;

  const bg = checked ? "rgba(16,185,129,0.18)" : "rgba(255,107,107,0.14)";
  const bd = checked ? "1px solid rgba(16,185,129,0.30)" : "1px solid rgba(255,107,107,0.28)";

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
          background: bg,
          border: bd,
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

function Modal({ open, title, subtitle, children, onClose, footer, maxWidth = "max-w-3xl" }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0" style={{ background: "rgba(11,27,51,0.18)" }} onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className={cx("relative w-full overflow-hidden flex flex-col", maxWidth)}
            style={{
              maxHeight: "90vh",
              borderRadius: 28,
              background: "rgba(255,255,255,0.98)",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 28px 80px rgba(0,31,63,0.16)",
            }}
          >
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5 shrink-0">
              <div className="min-w-0">
                <div className="text-[16px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                  {title}
                </div>
                {subtitle ? (
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    {subtitle}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                aria-label="Close modal"
              >
                <X className="h-4 w-4" style={{ color: PALETTE.muted }} />
              </button>
            </div>

            <Divider />
            <div className="p-4 sm:p-5 overflow-y-auto min-h-0">{children}</div>

            {footer ? (
              <>
                <Divider />
                <div className="flex flex-wrap items-center justify-end gap-3 p-4 sm:p-5 shrink-0">{footer}</div>
              </>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const Shimmer = React.memo(function Shimmer({ className, style }) {
  return (
    <div
      className={cx("relative overflow-hidden", className)}
      style={{
        background: "rgba(11,27,51,0.06)",
        border: `1px solid rgba(2,10,25,0.06)`,
        ...style,
      }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ x: "-60%" }}
        animate={{ x: "160%" }}
        transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 100%)",
          transform: "skewX(-12deg)",
        }}
      />
    </div>
  );
});

function TableSkeleton({ rows = 8 }) {
  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-3 px-2 py-2">
        <Shimmer className="col-span-5 h-5 rounded-xl" />
        <Shimmer className="col-span-2 h-5 rounded-xl" />
        <Shimmer className="col-span-2 h-5 rounded-xl" />
        <Shimmer className="col-span-3 h-5 rounded-xl" />
      </div>

      <div className="mt-4 grid gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-12 items-center gap-3 rounded-3xl px-4 py-4"
            style={{
              background: "rgba(255,255,255,0.65)",
              border: `1px solid rgba(2,10,25,0.06)`,
              boxShadow: "0 10px 26px rgba(0,31,63,0.04)",
            }}
          >
            <div className="col-span-5 flex items-center gap-3">
              <Shimmer className="h-12 w-16 rounded-2xl" style={{ border: "none" }} />
              <div className="flex-1 grid gap-2">
                <Shimmer className="h-4 rounded-xl" style={{ width: "58%", border: "none" }} />
                <Shimmer className="h-3 rounded-xl" style={{ width: "40%", border: "none" }} />
              </div>
            </div>

            <div className="col-span-2">
              <Shimmer className="h-7 rounded-full" style={{ width: 100, border: "none" }} />
            </div>

            <div className="col-span-2">
              <Shimmer className="h-7 rounded-xl" style={{ width: "70%", border: "none" }} />
            </div>

            <div className="col-span-3 flex justify-end gap-2">
              <Shimmer className="h-9 w-9 rounded-2xl" style={{ border: "none" }} />
              <Shimmer className="h-9 w-9 rounded-2xl" style={{ border: "none" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BannerRow = React.memo(function BannerRow({
  b,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
  toggling,
  deleting,
}) {
  return (
    <tr
      onClick={() => onSelect(b._id)}
      className="transition"
      style={{
        cursor: "pointer",
        background: isSelected ? "rgba(11,27,51,0.05)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = "rgba(11,27,51,0.035)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = "transparent";
      }}
    >
      <td className="px-6 py-4 align-middle">
        <div className="flex items-center gap-3">
          <div
            className="relative h-12 w-20 overflow-hidden rounded-2xl shrink-0"
            style={{
              background: "rgba(11,27,51,0.05)",
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            {b?.image?.url ? (
              <Image src={b.image.url} alt={b.image.alt || b.title || "Banner"} fill className="object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <ImagePlus className="h-4 w-4" style={{ color: PALETTE.muted }} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="font-semibold leading-snug truncate" style={{ color: PALETTE.navy }}>
              {b.title || "Untitled banner"}
            </div>
            <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
              {b.subtitle || b.buttonText || b.buttonLink || "New arrival banner"}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-3">
          <ToggleSwitch checked={Boolean(b.isActive)} disabled={toggling} onChange={(next) => onToggleActive(b, next)} />
          <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
            {Boolean(b.isActive) ? "Active" : "Inactive"}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <span
          className="inline-flex min-w-[44px] justify-center rounded-xl px-2 py-1 text-[12px] font-semibold"
          style={{
            background: PALETTE.soft,
            border: `1px solid ${PALETTE.border}`,
            color: PALETTE.navy,
          }}
        >
          {Number(b.sortOrder) || 0}
        </span>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
          {formatDateShort(b.startsAt)} — {formatDateShort(b.endsAt)}
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex justify-end gap-2">
          <IconBtn
            title="Preview"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(b._id);
            }}
          >
            <Eye className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </IconBtn>

          <IconBtn
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(b);
            }}
          >
            <Pencil className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </IconBtn>

          <IconBtn
            title="Delete"
            tone="danger"
            loading={deleting}
            disabled={deleting}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(b);
            }}
          >
            <Trash2 className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </IconBtn>
        </div>
      </td>
    </tr>
  );
});

const PagePill = React.memo(function PagePill({ active, disabled, children, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex h-9 min-w-[40px] items-center justify-center rounded-2xl px-3 text-sm font-semibold transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-95 active:scale-[0.99]"
      )}
      style={{
        background: active ? PALETTE.soft2 : "rgba(255,255,255,0.96)",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
        boxShadow: active ? "0 10px 22px rgba(0,31,63,.06)" : "0 10px 22px rgba(0,31,63,.04)",
      }}
    >
      {children}
    </button>
  );
});

function buildPageWindow(current, maxKnown, canGoNext, windowSize = 5) {
  const effectiveMax = canGoNext ? maxKnown + 1 : maxKnown;
  const half = Math.floor(windowSize / 2);

  let start = Math.max(1, current - half);
  let end = Math.min(effectiveMax, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return { pages, maxKnown, effectiveMax };
}

function emptyBannerForm() {
  return {
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
    sortOrder: 0,
    isActive: true,
    startsAt: "",
    endsAt: "",
    alt: "",
    imageFile: null,
    imageUrl: "",
    imagePublicId: "",
  };
}

function buildBannerFormData(form, { includeImageFile = true } = {}) {
  const fd = new FormData();

  fd.append("title", normalizeOptionalString(form.title));
  fd.append("subtitle", normalizeOptionalString(form.subtitle));
  fd.append("buttonText", normalizeOptionalString(form.buttonText));
  fd.append("buttonLink", normalizeOptionalString(form.buttonLink));
  fd.append("sortOrder", String(Number(form.sortOrder) || 0));
  fd.append("isActive", String(Boolean(form.isActive)));
  fd.append("alt", String(form.alt || "").trim());

  if (form.startsAt) fd.append("startsAt", new Date(form.startsAt).toISOString());
  if (form.endsAt) fd.append("endsAt", new Date(form.endsAt).toISOString());

  if (includeImageFile && form.imageFile) {
    fd.append("image", form.imageFile);
  }

  return fd;
}

export default function AdminNewArrivalBannersPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  const PAGE_SIZE = 20;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 220);
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedBanner, setSelectedBanner] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const selectedBannerId = selectedBanner?._id || selectedBanner?.id;

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyBannerForm());
  const [imagePreview, setImagePreview] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirm, setConfirm] = useState({
    title: "",
    description: "",
    dangerText: "Delete",
    onConfirm: async () => {},
  });

  const selectReqIdRef = useRef(0);

  const togglingIdsRef = useRef(new Set());
  const deletingIdsRef = useRef(new Set());
  const [, force] = useState(0);
  const bump = () => force((x) => x + 1);

  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isToggling = (id) => togglingIdsRef.current.has(String(id));
  const setToggling = (id, on) => {
    const k = String(id);
    if (on) togglingIdsRef.current.add(k);
    else togglingIdsRef.current.delete(k);
    bump();
  };

  const isDeleting = (id) => deletingIdsRef.current.has(String(id));
  const setDeleting = (id, on) => {
    const k = String(id);
    if (on) deletingIdsRef.current.add(k);
    else deletingIdsRef.current.delete(k);
    bump();
  };

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

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = items;

    if (!q) return list;

    return list.filter((x) => {
      const title = String(x.title || "").toLowerCase();
      const subtitle = String(x.subtitle || "").toLowerCase();
      const btnText = String(x.buttonText || "").toLowerCase();
      const btnLink = String(x.buttonLink || "").toLowerCase();
      return title.includes(q) || subtitle.includes(q) || btnText.includes(q) || btnLink.includes(q);
    });
  }, [items, debouncedSearch]);

  const headerStats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => Boolean(x.isActive)).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [items]);

  async function loadBannersByPage(targetPage = 1, { reset = false, showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoading(true);

    try {
      if (reset) {
        setPage(1);
        setCursors([null]);
        setNextCursor(null);
        targetPage = 1;
      }

      const cursor = reset ? null : cursors[targetPage - 1] ?? null;

      const qs = new URLSearchParams();
      qs.set("limit", String(PAGE_SIZE));
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (cursor?.afterId) qs.set("afterId", cursor.afterId);
      if (cursor?.afterSortOrder !== undefined && cursor?.afterSortOrder !== null) {
        qs.set("afterSortOrder", String(cursor.afterSortOrder));
      }

      const data = await apiFetch(`/api/admin/banners/new-arrivals?${qs.toString()}`);

      const nextItems = Array.isArray(data.items) ? data.items : [];
      const nxc = data?.pageInfo?.nextCursor || null;

      setItems(nextItems);
      setNextCursor(nxc);
      setPage(targetPage);

      if (nxc) {
        setCursors((prev) => {
          const next = [...prev];
          next[targetPage] = nxc;
          return next;
        });
      }
    } catch (e) {
      if (e?.status === 401) showToast("error", "Unauthorized. Please login again.");
      else if (e?.status === 403) showToast("error", "Forbidden. Admin only.");
      else showToast("error", e.message || "Failed to load banners");
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  async function loadBannerById(id, { openPreview = true } = {}) {
    if (!id) return;

    setSelectedBanner((prev) => {
      const already = prev?._id === id || prev?.id === id;
      if (already) return prev;
      return { _id: id };
    });

    if (openPreview) setPreviewOpen(true);

    const reqId = ++selectReqIdRef.current;

    try {
      const data = await apiFetch(`/api/admin/banners/new-arrivals/${id}`);
      if (reqId !== selectReqIdRef.current) return;
      setSelectedBanner(data.item || null);
    } catch (e) {
      if (reqId !== selectReqIdRef.current) return;
      showToast("error", e.message || "Failed to load banner");
    }
  }

  useEffect(() => {
    loadBannersByPage(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBannersByPage(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function resetModalState() {
    setForm(emptyBannerForm());
    setImagePreview("");
  }

  function openCreateModal() {
    setMode("create");
    setEditingId(null);
    resetModalState();
    setModalOpen(true);
  }

  function openEditModal(item) {
    setMode("edit");
    setEditingId(String(item?._id || item?.id || ""));
    setForm({
      title: item?.title || "",
      subtitle: item?.subtitle || "",
      buttonText: item?.buttonText || "",
      buttonLink: item?.buttonLink || "",
      sortOrder: Number(item?.sortOrder) || 0,
      isActive: Boolean(item?.isActive),
      startsAt: formatDateTimeInput(item?.startsAt),
      endsAt: formatDateTimeInput(item?.endsAt),
      alt: item?.image?.alt || "",
      imageFile: null,
      imageUrl: item?.image?.url || "",
      imagePublicId: item?.image?.publicId || "",
    });
    setImagePreview(item?.image?.url || "");
    setModalOpen(true);
  }

  function onPickImage(file) {
    if (!file) return;
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setForm((f) => ({ ...f, imageFile: file }));
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  function clearNewSelectedImage() {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setForm((f) => ({ ...f, imageFile: null }));
    setImagePreview(form.imageUrl || "");
  }

  async function submitBanner() {
    if (form.startsAt && form.endsAt && new Date(form.startsAt) > new Date(form.endsAt)) {
      return showToast("error", "Start date cannot be greater than end date");
    }

    const isCreate = mode === "create";

    setSaving(true);

    try {
      if (isCreate) {
        if (!form.imageFile) {
          return showToast("error", "Banner image is required");
        }

        const fd = buildBannerFormData(form, { includeImageFile: true });

        await apiFetch(`/api/admin/banners/new-arrivals`, {
          method: "POST",
          body: fd,
        });

        showToast("success", "New arrival banner created");
      } else {
        const id = editingId || selectedBannerId;
        if (!id) return showToast("error", "No banner selected");

        let body;

        if (form.imageFile) {
          body = buildBannerFormData(form, { includeImageFile: true });
        } else {
          body = JSON.stringify({
            title: normalizeOptionalString(form.title),
            subtitle: normalizeOptionalString(form.subtitle),
            buttonText: normalizeOptionalString(form.buttonText),
            buttonLink: normalizeOptionalString(form.buttonLink),
            sortOrder: Number(form.sortOrder) || 0,
            isActive: Boolean(form.isActive),
            startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
            endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
            image: form.imageUrl
              ? {
                  url: String(form.imageUrl || "").trim(),
                  publicId: String(form.imagePublicId || "").trim(),
                  alt: String(form.alt || "").trim(),
                }
              : undefined,
          });
        }

        await apiFetch(`/api/admin/banners/new-arrivals/${id}`, {
          method: "PATCH",
          body,
        });

        showToast("success", "New arrival banner updated");
      }

      setModalOpen(false);
      await loadBannersByPage(1, { reset: true, showSpinner: true });

      const editedId = editingId || selectedBannerId;
      if (!isCreate && editedId && String(editedId) === String(selectedBannerId)) {
        await loadBannerById(editedId, { openPreview: false });
      }
    } catch (e) {
      showToast("error", e.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item) {
    const id = item?._id || item?.id;
    if (!id) return showToast("error", "Invalid banner");

    setConfirm({
      title: "Delete new arrival banner?",
      description: "This will permanently remove the banner.",
      dangerText: "Delete banner",
      onConfirm: async () => {
        try {
          setDeleting(id, true);
          await apiFetch(`/api/admin/banners/new-arrivals/${id}`, { method: "DELETE" });
          setConfirmOpen(false);
          setPreviewOpen(false);
          showToast("success", "Banner deleted");

          if (String(selectedBannerId) === String(id)) setSelectedBanner(null);
          await loadBannersByPage(1, { reset: true, showSpinner: true });
        } catch (e) {
          showToast("error", e.message || "Failed to delete banner");
        } finally {
          setDeleting(id, false);
        }
      },
    });

    setConfirmOpen(true);
  }

  async function toggleActive(item, nextActive) {
    const id = item?._id || item?.id;
    if (!id) return;
    if (isToggling(id)) return;

    setToggling(id, true);

    const prev = Boolean(item.isActive);
    setItems((list) => list.map((x) => (String(x._id) === String(id) ? { ...x, isActive: nextActive } : x)));

    try {
      await apiFetch(`/api/admin/banners/new-arrivals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: normalizeOptionalString(item.title),
          subtitle: normalizeOptionalString(item.subtitle),
          buttonText: normalizeOptionalString(item.buttonText),
          buttonLink: normalizeOptionalString(item.buttonLink),
          sortOrder: Number(item.sortOrder) || 0,
          isActive: Boolean(nextActive),
          startsAt: item.startsAt || null,
          endsAt: item.endsAt || null,
          image: item.image
            ? {
                url: item.image.url || "",
                publicId: item.image.publicId || "",
                alt: item.image.alt || "",
              }
            : undefined,
        }),
      });

      showToast("success", nextActive ? "Banner activated" : "Banner deactivated");

      if (String(selectedBannerId) === String(id)) {
        setSelectedBanner((sc) => (sc ? { ...sc, isActive: nextActive } : sc));
      }
    } catch (e) {
      setItems((list) => list.map((x) => (String(x._id) === String(id) ? { ...x, isActive: prev } : x)));
      showToast("error", e.message || "Failed to update status");
    } finally {
      setToggling(id, false);
    }
  }

  const canPrev = page > 1 && !loading;
  const canNext = Boolean(nextCursor) && !loading;

  const maxKnown = Math.max(1, cursors.length);
  const { pages: pageWindow, maxKnown: maxKnownOut } = buildPageWindow(page, maxKnown, Boolean(nextCursor), 5);

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
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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
                    <ImagePlus className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                        New Arrival Banners
                      </div>

                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: "rgba(255,255,255,0.92)",
                          border: `1px solid ${PALETTE.border}`,
                          color: PALETTE.muted,
                        }}
                        title="Items per page"
                      >
                        {PAGE_SIZE}/page
                      </span>
                    </div>

                    <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                      Create, update, schedule, activate, and remove new arrival banners.
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                  >
                    <span style={{ color: PALETTE.muted }}>Total</span>
                    <span style={{ color: PALETTE.navy }}>{headerStats.total}</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}
                  >
                    <span style={{ color: PALETTE.muted }}>Active</span>
                    <span style={{ color: PALETTE.navy }}>{headerStats.active}</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.18)" }}
                  >
                    <span style={{ color: PALETTE.muted }}>Inactive</span>
                    <span style={{ color: PALETTE.navy }}>{headerStats.inactive}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SoftButton
                  icon={RefreshCw}
                  loading={refreshing}
                  onClick={() => loadBannersByPage(1, { reset: true, showSpinner: true })}
                >
                  Refresh
                </SoftButton>

                <PrimaryButton icon={Plus} onClick={openCreateModal}>
                  New Banner
                </PrimaryButton>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
              <div className="md:col-span-8">
                <Field label="Search" icon={Search}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                    placeholder="Search by title, subtitle, button text, or link…"
                  />
                </Field>
              </div>

              <div className="md:col-span-4">
                <Field
                  label="Status"
                  icon={Filter}
                  rightSlot={
                    <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                      {statusFilter.toUpperCase()}
                    </span>
                  }
                >
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                    style={{ color: PALETTE.navy, height: 42 }}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mx-auto max-w-screen-xl px-5 pb-10 md:px-10 lg:px-12">
        <Card>
          <div className="overflow-auto" style={{ height: "min(62vh, 700px)" }}>
            {loading ? (
              <TableSkeleton rows={8} />
            ) : filteredItems.length ? (
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
                    <th className="px-6 py-3 font-semibold">Banner</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Sort</th>
                    <th className="px-6 py-3 font-semibold">Schedule</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((b) => (
                    <BannerRow
                      key={String(b._id)}
                      b={b}
                      isSelected={Boolean(selectedBannerId && String(selectedBannerId) === String(b._id))}
                      onSelect={(id) => loadBannerById(id, { openPreview: true })}
                      onEdit={openEditModal}
                      onDelete={confirmDelete}
                      onToggleActive={toggleActive}
                      toggling={isToggling(b._id)}
                      deleting={isDeleting(b._id)}
                    />
                  ))}
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
                    <ImagePlus className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="mt-4 text-[15px] font-semibold" style={{ color: PALETTE.navy }}>
                    No new arrival banners found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Adjust search or status filter, or create a new banner.
                  </div>

                  <div className="mt-5 flex justify-center">
                    <PrimaryButton icon={Plus} onClick={openCreateModal}>
                      New Banner
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Divider />

          <div className="flex items-center justify-between p-4">
            <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              Page <span style={{ color: PALETTE.navy, fontWeight: 800 }}>{page}</span>
            </div>

            <div className="flex items-center gap-2">
              <SoftButton disabled={!canPrev} icon={ChevronLeft} onClick={() => loadBannersByPage(Math.max(1, page - 1))}>
                Prev
              </SoftButton>

              <div className="flex items-center gap-2">
                {pageWindow.map((p) => {
                  const isGhostNext = p > maxKnownOut;
                  const disabled = loading || (isGhostNext && !canNext);

                  return (
                    <PagePill
                      key={p}
                      active={p === page}
                      disabled={disabled}
                      onClick={() => {
                        if (isGhostNext) return loadBannersByPage(page + 1);
                        return loadBannersByPage(p);
                      }}
                    >
                      {p}
                    </PagePill>
                  );
                })}
              </div>

              <SoftButton disabled={!canNext} icon={ChevronRight} onClick={() => loadBannersByPage(page + 1)}>
                Next
              </SoftButton>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={previewOpen}
        title={selectedBanner?.title || "Banner Preview"}
        subtitle="Banner preview and details"
        onClose={() => setPreviewOpen(false)}
        maxWidth="max-w-3xl"
        footer={
          selectedBanner ? (
            <>
              <SoftButton
                icon={Pencil}
                onClick={() => {
                  setPreviewOpen(false);
                  openEditModal(selectedBanner);
                }}
              >
                Edit
              </SoftButton>
              <button
                type="button"
                onClick={() => confirmDelete(selectedBanner)}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold cursor-pointer transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: "rgba(255,107,107,0.14)",
                  border: "1px solid rgba(255,107,107,0.25)",
                  color: PALETTE.navy,
                  boxShadow: "0 12px 28px rgba(0,31,63,.10)",
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          ) : null
        }
      >
        {selectedBanner ? (
          <div className="grid gap-4">
            <div
              className="relative w-full overflow-hidden rounded-[22px]"
              style={{
                height: "clamp(140px, 24vw, 240px)",
                border: `1px solid ${PALETTE.border}`,
                background:
                  "radial-gradient(circle at 30% 20%, rgba(255,126,105,0.10), rgba(11,27,51,0.04) 55%), #fff",
              }}
            >
              {selectedBanner?.image?.url ? (
                <Image
                  src={selectedBanner.image.url}
                  alt={selectedBanner.image.alt || selectedBanner.title || "Banner preview"}
                  fill
                  className="object-contain sm:object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 900px"
                />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <ImagePlus className="h-7 w-7" style={{ color: PALETTE.muted }} />
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className="rounded-2xl p-3.5"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  Title
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {selectedBanner?.title || "Untitled banner"}
                </div>
              </div>

              <div
                className="rounded-2xl p-3.5"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  Status
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {selectedBanner?.isActive ? "Active" : "Inactive"}
                </div>
              </div>

              <div
                className="rounded-2xl p-3.5 sm:col-span-2"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  Subtitle
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {selectedBanner?.subtitle || "—"}
                </div>
              </div>

              <div
                className="rounded-2xl p-3.5"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  Button Text
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {selectedBanner?.buttonText || "—"}
                </div>
              </div>

              <div
                className="rounded-2xl p-3.5"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  Sort Order
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {Number(selectedBanner?.sortOrder) || 0}
                </div>
              </div>

              <div
                className="rounded-2xl p-3.5 sm:col-span-2"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  Button Link
                </div>
                <div className="mt-1 break-all text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {selectedBanner?.buttonLink || "—"}
                </div>
              </div>

              <div
                className="rounded-2xl p-3.5"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  Starts At
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {formatDateShort(selectedBanner?.startsAt)}
                </div>
              </div>

              <div
                className="rounded-2xl p-3.5"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  Ends At
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {formatDateShort(selectedBanner?.endsAt)}
                </div>
              </div>

              <div
                className="rounded-2xl p-3.5 sm:col-span-2"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  Image Alt Text
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {selectedBanner?.image?.alt || "—"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: PALETTE.muted }} />
          </div>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        title={mode === "create" ? "Create new arrival banner" : "Edit new arrival banner"}
        subtitle="Upload the banner image, set CTA, and optionally schedule it."
        onClose={() => (saving ? null : setModalOpen(false))}
        footer={
          <>
            <SoftButton disabled={saving} onClick={() => setModalOpen(false)}>
              Cancel
            </SoftButton>
            <PrimaryButton loading={saving} onClick={submitBanner}>
              {mode === "create" ? "Create banner" : "Save changes"}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Title (optional)" icon={Type}>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-transparent text-sm font-semibold outline-none"
                style={{ color: PALETTE.navy, height: 40 }}
                placeholder="e.g. New Arrivals"
              />
            </Field>

            <Field label="Sort order" icon={ChevronRight}>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                className="w-full bg-transparent text-sm font-semibold outline-none"
                style={{ color: PALETTE.navy, height: 40 }}
                placeholder="0"
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Subtitle (optional)" icon={ArrowRight}>
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 40 }}
                  placeholder="Short banner subtitle"
                />
              </Field>
            </div>

            <Field label="Button text (optional)" icon={Type}>
              <input
                value={form.buttonText}
                onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
                className="w-full bg-transparent text-sm font-semibold outline-none"
                style={{ color: PALETTE.navy, height: 40 }}
                placeholder="e.g. Shop Now"
              />
            </Field>

            <Field label="Button link (optional)" icon={Link2}>
              <input
                value={form.buttonLink}
                onChange={(e) => setForm((f) => ({ ...f, buttonLink: e.target.value }))}
                className="w-full bg-transparent text-sm font-semibold outline-none"
                style={{ color: PALETTE.navy, height: 40 }}
                placeholder="/new-arrivals"
              />
            </Field>

            <Field label="Starts at" icon={CalendarDays}>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                className="w-full bg-transparent text-sm font-semibold outline-none"
                style={{ color: PALETTE.navy, height: 40 }}
              />
            </Field>

            <Field label="Ends at" icon={CalendarDays}>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                className="w-full bg-transparent text-sm font-semibold outline-none"
                style={{ color: PALETTE.navy, height: 40 }}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Image alt text" icon={Type}>
                <input
                  value={form.alt}
                  onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 40 }}
                  placeholder="Accessible image description"
                />
              </Field>
            </div>

            <label className="sm:col-span-2 grid gap-2">
              <Label>Status</Label>
              <div
                className="flex h-10 items-center justify-between rounded-2xl px-4"
                style={{
                  background: "rgba(255,255,255,0.96)",
                  border: `1px solid ${PALETTE.border}`,
                  color: PALETTE.navy,
                }}
              >
                <span className="text-sm font-semibold">{form.isActive ? "Active" : "Inactive"}</span>
                <ToggleSwitch checked={Boolean(form.isActive)} onChange={(v) => setForm((f) => ({ ...f, isActive: Boolean(v) }))} />
              </div>
            </label>
          </div>

          <div className="lg:col-span-5">
            <div className="grid gap-3">
              <Label>Banner image</Label>

              <div
                className="rounded-[22px] p-3"
                style={{
                  border: `1px solid ${PALETTE.border}`,
                  background: "rgba(255,255,255,0.96)",
                }}
              >
                <div
                  className="relative aspect-[15/9] overflow-hidden rounded-[18px]"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 20%, rgba(255,126,105,0.10), rgba(11,27,51,0.04) 55%), #fff",
                    border: `1px dashed ${PALETTE.border}`,
                  }}
                >
                  {imagePreview || form.imageUrl ? (
                    <Image src={imagePreview || form.imageUrl} alt={form.alt || form.title || "Banner preview"} fill className="object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-6 w-6" style={{ color: PALETTE.muted }} />
                        <div className="mt-2 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                          Upload banner image
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <label
                    className="inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.96)",
                      border: `1px solid ${PALETTE.border}`,
                      color: PALETTE.navy,
                      boxShadow: "0 10px 24px rgba(0,31,63,.06)",
                    }}
                  >
                    <ImagePlus className="h-4 w-4" />
                    {mode === "create" ? "Upload image" : "Replace image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickImage(e.target.files?.[0])}
                    />
                  </label>

                  {form.imageFile && (
                    <SoftButton onClick={clearNewSelectedImage}>
                      Clear selected image
                    </SoftButton>
                  )}
                </div>

                <div className="mt-3 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  Recommended: wide image for hero/banner display.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        title={confirm.title}
        subtitle={confirm.description}
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <SoftButton onClick={() => setConfirmOpen(false)}>Cancel</SoftButton>
            <button
              type="button"
              onClick={confirm.onConfirm}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold cursor-pointer transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: "rgba(255,107,107,0.14)",
                border: "1px solid rgba(255,107,107,0.25)",
                color: PALETTE.navy,
                boxShadow: "0 12px 28px rgba(0,31,63,.10)",
              }}
            >
              <Trash2 className="h-4 w-4" />
              {confirm.dangerText}
            </button>
          </>
        }
      >
        <div
          className="rounded-3xl p-5"
          style={{
            background: "rgba(255,107,107,0.10)",
            border: "1px solid rgba(255,107,107,0.22)",
            color: PALETTE.navy,
          }}
        >
          <div className="text-sm font-semibold">This action can’t be undone.</div>
          <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
            Please confirm to continue.
          </div>
        </div>
      </Modal>
    </main>
  );
}