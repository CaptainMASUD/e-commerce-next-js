// app/admin/subcategories/page.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutGrid,
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
  Image as ImageIcon,
  Layers,
  Link2,
  ChevronDown,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

/**
 * Admin Subcategories CRUD UI — UPDATED (UI polish)
 *
 * ✅ Updates requested:
 * - Replace “50/page” badge with a smooth/bold Category header badge
 * - Keep Total / Active / Inactive visible at the top (near header)
 * - Reduce filter dropdown widths (don’t stretch full width on desktop)
 * - Search remains first, then filters
 * - Category label shows ONLY category name (no slug) everywhere (kept)
 */

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

function slugify(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function useDebouncedValue(value, delay = 220) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDeb(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return deb;
}

async function apiFetchJson(path, opts = {}) {
  const token = getStoredToken();

  const res = await fetch(path, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
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

async function apiFetchForm(path, { method = "POST", formData, headers = {} } = {}) {
  const token = getStoredToken();

  const res = await fetch(path, {
    method,
    body: formData,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
      // IMPORTANT: DO NOT set Content-Type for multipart; browser sets boundary.
    },
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

const Label = React.memo(function Label({ children, required }) {
  return (
    <span className="text-[11px] font-medium tracking-wide" style={{ color: PALETTE.muted }}>
      {children}
      {required ? (
        <span className="ml-1 align-middle" style={{ color: PALETTE.coral }}>
          *
        </span>
      ) : null}
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

const SoftButton = React.memo(function SoftButton({ icon: Icon, loading, children, disabled, className, ...props }) {
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

const PrimaryButton = React.memo(function PrimaryButton({ icon: Icon, loading, children, disabled, className, ...props }) {
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
  const dims = size === "sm" ? { w: 44, h: 26, pad: 3, knob: 20 } : { w: 52, h: 30, pad: 3, knob: 24 };
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

/* --------------------- Thinner Single Select (Reusable) --------------------- */

function ThinSingleSelect({
  items = [],
  value = "",
  onChange,
  disabled,
  placeholder = "Select…",
  metaText = "",
  icon: LeftIcon = LayoutGrid,
  searchable = true,
  searchPlaceholder = "Search…",
  getId = (x) => String(x?._id ?? x?.id ?? x?.value ?? x ?? "").trim(),
  getLabel = (x) => String(x?.name ?? x?.label ?? x ?? "").trim(),
  showClear = true,
  height = 38,
  itemPadY = 9,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 160);

  const itemsById = useMemo(() => {
    const m = new Map();
    for (const it of items || []) {
      const id = getId(it);
      if (!id) continue;
      m.set(String(id), it);
    }
    return m;
  }, [items, getId]);

  const selected = value ? itemsById.get(String(value)) : null;

  const filtered = useMemo(() => {
    const s = dq.trim().toLowerCase();
    if (!searchable || !s) return items || [];
    return (items || []).filter((x) => getLabel(x).toLowerCase().includes(s));
  }, [items, dq, searchable, getLabel]);

  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e) => {
      const el = panelRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const pick = (id) => {
    const sid = String(id || "").trim();
    onChange?.(sid);
    setOpen(false);
  };

  const clear = () => {
    onChange?.("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => (!disabled ? setOpen((v) => !v) : null)}
        className={cx(
          "w-full rounded-2xl transition",
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-95"
        )}
        style={{
          height,
          paddingLeft: 10,
          paddingRight: 10,
          background: "rgba(255,255,255,0.96)",
          border: `1px solid ${PALETTE.border}`,
          color: PALETTE.navy,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
        aria-expanded={open}
      >
        <div className="flex h-full items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            {LeftIcon ? <LeftIcon className="h-4 w-4 shrink-0" style={{ color: PALETTE.muted }} /> : null}
            <div className="min-w-0 truncate text-[13px] font-semibold">
              {selected ? getLabel(selected) : placeholder}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {metaText ? (
              <span className="text-[10px] font-semibold" style={{ color: PALETTE.muted }}>
                {metaText}
              </span>
            ) : null}
            <ChevronDown className="h-4 w-4" style={{ color: PALETTE.muted }} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-3xl"
            style={{
              background: "#fff",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 18px 55px rgba(0,31,63,0.10)",
            }}
          >
            {searchable ? (
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
                <Search className="h-4 w-4" style={{ color: PALETTE.muted }} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-[13px] font-semibold outline-none"
                  style={{ color: PALETTE.navy }}
                />

                {showClear && value ? (
                  <button
                    type="button"
                    onClick={clear}
                    className="grid h-8 w-8 place-items-center rounded-2xl cursor-pointer hover:opacity-90"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" style={{ color: PALETTE.muted }} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-2xl cursor-pointer hover:opacity-90"
                    title="Close"
                  >
                    <X className="h-4 w-4" style={{ color: PALETTE.muted }} />
                  </button>
                )}
              </div>
            ) : null}

            <div className="p-2 overflow-auto" style={{ maxHeight: 280 }}>
              {filtered.length === 0 ? (
                <div className="p-3 text-xs font-semibold" style={{ color: PALETTE.muted }}>
                  No items found.
                </div>
              ) : (
                filtered.map((it) => {
                  const id = getId(it);
                  const checked = String(id) === String(value);

                  return (
                    <button
                      type="button"
                      key={String(id)}
                      onClick={() => pick(id)}
                      className="flex w-full items-center justify-between rounded-2xl px-3 text-[13px] font-semibold cursor-pointer hover:opacity-95"
                      style={{
                        paddingTop: itemPadY,
                        paddingBottom: itemPadY,
                        background: checked ? "rgba(255,126,105,0.10)" : "transparent",
                        color: PALETTE.navy,
                      }}
                    >
                      <span className="min-w-0 truncate">{getLabel(it)}</span>

                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold"
                        style={{
                          background: checked ? "rgba(34,197,94,0.14)" : "rgba(11,27,51,0.05)",
                          border: `1px solid ${PALETTE.border}`,
                        }}
                      >
                        {checked ? "Selected" : "Pick"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Modal */
function Modal({ open, title, subtitle, children, onClose, footer }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
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
            className="relative w-full max-w-2xl overflow-hidden flex flex-col"
            style={{
              borderRadius: 28,
              background: "rgba(255,255,255,0.98)",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 28px 80px rgba(0,31,63,0.16)",
              maxHeight: "82vh",
            }}
          >
            <div className="flex items-start justify-between gap-4 p-6 shrink-0">
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                aria-label="Close modal"
              >
                <X className="h-4 w-4" style={{ color: PALETTE.muted }} />
              </button>
            </div>

            <Divider />

            <div className="p-6 flex-1 overflow-y-auto modal-scroll">{children}</div>

            {footer ? (
              <>
                <Divider />
                <div className="flex flex-wrap items-center justify-end gap-3 p-6 shrink-0">{footer}</div>
              </>
            ) : null}
          </motion.div>

          <style jsx global>{`
            .modal-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(11, 27, 51, 0.28) rgba(11, 27, 51, 0.06);
            }
            .modal-scroll::-webkit-scrollbar {
              width: 10px;
            }
            .modal-scroll::-webkit-scrollbar-track {
              background: rgba(11, 27, 51, 0.06);
              border-radius: 999px;
            }
            .modal-scroll::-webkit-scrollbar-thumb {
              background: rgba(11, 27, 51, 0.26);
              border-radius: 999px;
              border: 2px solid rgba(255, 255, 255, 0.65);
            }
            .modal-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(11, 27, 51, 0.34);
            }
          `}</style>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------ Skeletons ------------------------------ */

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

function TableSkeleton({ rows = 10, showCategory = false }) {
  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-3 px-2 py-2">
        <Shimmer className="col-span-4 h-5 rounded-xl" />
        {showCategory ? <Shimmer className="col-span-3 h-5 rounded-xl" /> : null}
        <Shimmer className="col-span-2 h-5 rounded-xl" />
        <Shimmer className="col-span-1 h-5 rounded-xl" />
        <Shimmer className="col-span-2 h-5 rounded-xl" />
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
            <div className="col-span-4 flex items-center gap-3">
              <Shimmer className="h-9 w-9 rounded-2xl" style={{ border: "none" }} />
              <div className="flex-1 grid gap-2">
                <Shimmer className="h-4 rounded-xl" style={{ width: "58%", border: "none" }} />
                <Shimmer className="h-3 rounded-xl" style={{ width: "40%", border: "none" }} />
              </div>
            </div>

            {showCategory ? (
              <div className="col-span-3">
                <Shimmer className="h-8 rounded-full" style={{ width: 170, border: "none" }} />
              </div>
            ) : null}

            <div className="col-span-2 flex justify-start">
              <Shimmer className="h-7 rounded-full" style={{ width: 110, border: "none" }} />
            </div>

            <div className="col-span-1">
              <Shimmer className="h-7 rounded-xl" style={{ width: "70%", border: "none" }} />
            </div>

            <div className="col-span-2 flex justify-end gap-2">
              <Shimmer className="h-9 w-9 rounded-2xl" style={{ border: "none" }} />
              <Shimmer className="h-9 w-9 rounded-2xl" style={{ border: "none" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Pagination pills --------------------------- */

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

/* ------------------------------ Row (Sub) ------------------------------ */

const SubRow = React.memo(function SubRow({
  s,
  showCategory,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
  toggling,
  deleting,
}) {
  const imgUrl = s?.image?.url || "";
  const catName = s?.category?.name || "—";
  const catSlug = s?.category?.slug ? `/${s.category.slug}` : "";

  return (
    <tr
      onClick={() => onSelect?.(s.id || s._id)}
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
            className="grid h-9 w-9 place-items-center rounded-2xl overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl} alt={s?.image?.alt || s?.name || "image"} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-4 w-4" style={{ color: PALETTE.navy }} />
            )}
          </div>

          <div className="min-w-0">
            <div className="font-semibold leading-snug" style={{ color: PALETTE.navy }}>
              {s.name}
            </div>
            <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
              {s.slug ? `/${s.slug}` : "—"}
            </div>
          </div>
        </div>
      </td>

      {showCategory ? (
        <td className="px-6 py-4 align-middle">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
          >
            <Layers className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
            <div className="min-w-0">
              <div className="text-[12px] font-semibold truncate" style={{ color: PALETTE.navy, maxWidth: 180 }}>
                {catName}
              </div>
              {catSlug ? (
                <div className="text-[11px] font-semibold truncate" style={{ color: PALETTE.muted, maxWidth: 180 }}>
                  {catSlug}
                </div>
              ) : null}
            </div>
          </div>
        </td>
      ) : null}

      <td className="px-6 py-4 align-middle">
        <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-3">
          <ToggleSwitch checked={Boolean(s.isActive)} disabled={toggling} onChange={(next) => onToggleActive(s, next)} />
          <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
            {Boolean(s.isActive) ? "Active" : "Inactive"}
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
          {Number(s.sortOrder) || 0}
        </span>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex justify-end gap-2">
          <IconBtn
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(s);
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
              onDelete(s);
            }}
          >
            <Trash2 className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </IconBtn>
        </div>
      </td>
    </tr>
  );
});

/* -------------------------------- Page --------------------------------- */

export default function AdminSubcategoriesPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  const PAGE_SIZE = 50;

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c._id || c.id) === String(selectedCategoryId)) || null,
    [categories, selectedCategoryId]
  );

  const [subItems, setSubItems] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);

  const [subSearch, setSubSearch] = useState("");
  const debouncedSearch = useDebouncedValue(subSearch, 220);

  const [statusFilter, setStatusFilter] = useState("all"); // all|active|inactive
  const [refreshing, setRefreshing] = useState(false);

  const [selectedSubId, setSelectedSubId] = useState(null);

  // modals
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subMode, setSubMode] = useState("create");
  const [subEditingId, setSubEditingId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirm, setConfirm] = useState({
    title: "",
    description: "",
    dangerText: "Delete",
    onConfirm: async () => {},
  });

  // loading trackers
  const togglingIdsRef = useRef(new Set());
  const deletingIdsRef = useRef(new Set());
  const [, force] = useState(0);
  const bump = () => force((x) => x + 1);

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

  const [subForm, setSubForm] = useState({
    categoryId: "",
    categoryName: "",
    categorySlug: "",
    name: "",
    slug: "",
    sortOrder: 0,
    isActive: true,
    alt: "",
    file: null,
    existingImageUrl: "",
    existingPublicId: "",
  });

  const [previewUrl, setPreviewUrl] = useState("");
  useEffect(() => {
    let url = "";
    if (subForm.file instanceof File) {
      url = URL.createObjectURL(subForm.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(subForm.existingImageUrl || "");
    }
  }, [subForm.file, subForm.existingImageUrl]);

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

  const subFiltered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = subItems;

    if (statusFilter !== "all") {
      const want = statusFilter === "active";
      list = list.filter((s) => Boolean(s.isActive) === want);
    }

    if (!q) return list;

    return list.filter((s) => {
      const name = String(s.name || "").toLowerCase();
      const slug = String(s.slug || "").toLowerCase();
      const cat = String(s?.category?.name || "").toLowerCase();
      return name.includes(q) || slug.includes(q) || cat.includes(q);
    });
  }, [subItems, debouncedSearch, statusFilter]);

  const headerStats = useMemo(() => {
    const total = subItems.length;
    const active = subItems.filter((x) => Boolean(x.isActive)).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [subItems]);

  async function loadCategories({ showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setCatLoading(true);

    try {
      const data = await apiFetchJson(`/api/admin/categories?limit=100`);
      setCategories(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      if (e?.status === 401) showToast("error", "Unauthorized. Please login again.");
      else if (e?.status === 403) showToast("error", "Forbidden. Admin only.");
      else showToast("error", e.message || "Failed to load categories");
    } finally {
      setCatLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  async function loadSubcategoriesByPage(targetPage = 1, { reset = false, showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setSubLoading(true);

    try {
      if (reset) {
        setPage(1);
        setCursors([null]);
        setSelectedSubId(null);
        targetPage = 1;
      }

      const cursor = cursors[targetPage - 1] ?? null;

      const qs = new URLSearchParams();
      if (cursor) qs.set("cursor", cursor);
      qs.set("limit", String(PAGE_SIZE));

      if (statusFilter === "active") qs.set("status", "active");
      if (statusFilter === "inactive") qs.set("status", "inactive");
      if (selectedCategoryId) qs.set("categoryId", selectedCategoryId);

      const data = await apiFetchJson(`/api/admin/categories/subcategories?${qs.toString()}`);

      const items = Array.isArray(data.items) ? data.items : [];
      const nxc = data.nextCursor || null;

      setSubItems(items);
      setNextCursor(nxc);
      setPage(targetPage);

      if (nxc) {
        setCursors((prev) => {
          const next = [...prev];
          if (!next[targetPage]) next[targetPage] = nxc;
          return next;
        });
      }
    } catch (e) {
      if (e?.status === 401) showToast("error", "Unauthorized. Please login again.");
      else if (e?.status === 403) showToast("error", "Forbidden. Admin only.");
      else showToast("error", e.message || "Failed to load subcategories");
    } finally {
      setSubLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCategories();
    loadSubcategoriesByPage(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSubcategoriesByPage(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  useEffect(() => {
    loadSubcategoriesByPage(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function openCreateSub() {
    setSubMode("create");
    setSubEditingId(null);

    const preCat = selectedCategoryId || "";
    const preCatObj = preCat
      ? categories.find((c) => String(c._id || c.id) === String(preCat)) || null
      : null;

    setSubForm({
      categoryId: preCat,
      categoryName: preCatObj?.name || "",
      categorySlug: preCatObj?.slug || "",
      name: "",
      slug: "",
      sortOrder: 0,
      isActive: true,
      alt: "",
      file: null,
      existingImageUrl: "",
      existingPublicId: "",
    });

    setSubModalOpen(true);
  }

  async function openEditSub(sub) {
    const subId = String(sub?.id || sub?._id || "");
    if (!subId) return showToast("error", "Invalid subcategory");

    setSubMode("edit");
    setSubEditingId(subId);

    setSubModalOpen(true);
    setLoadingEdit(true);

    try {
      const data = await apiFetchJson(`/api/admin/categories/subcategories/${subId}`);
      const item = data?.item;
      if (!item) throw new Error("Subcategory not found");

      setSubForm({
        categoryId: String(item?.category?.id || ""),
        categoryName: item?.category?.name || "",
        categorySlug: item?.category?.slug || "",
        name: item?.name || "",
        slug: item?.slug || "",
        sortOrder: Number(item?.sortOrder) || 0,
        isActive: Boolean(item?.isActive),
        alt: item?.image?.alt || "",
        file: null,
        existingImageUrl: item?.image?.url || "",
        existingPublicId: item?.image?.publicId || "",
      });
    } catch (e) {
      showToast("error", e.message || "Failed to load subcategory for edit");
      setSubModalOpen(false);
    } finally {
      setLoadingEdit(false);
    }
  }

  async function submitSub() {
    const isCreate = subMode === "create";
    const subId = subEditingId;

    const categoryId = String(subForm.categoryId || "").trim();
    const name = String(subForm.name || "").trim();
    const slug = String(subForm.slug || "").trim();
    const sortOrder = Number(subForm.sortOrder) || 0;

    if (!categoryId) return showToast("error", "Category is required");
    if (!name) return showToast("error", "Subcategory name is required");

    setSaving(true);

    try {
      if (isCreate) {
        if (!(subForm.file instanceof File)) return showToast("error", "Image file is required");

        const fd = new FormData();
        fd.set("categoryId", categoryId);
        fd.set("name", name);
        if (slug) fd.set("slug", slugify(slug));
        fd.set("sortOrder", String(sortOrder));
        fd.set("isActive", String(Boolean(subForm.isActive)));
        if (subForm.alt) fd.set("alt", String(subForm.alt).trim());
        fd.set("image", subForm.file);

        await apiFetchForm(`/api/admin/categories/subcategories`, { method: "POST", formData: fd });

        showToast("success", "Subcategory created");
      } else {
        if (!subId) return showToast("error", "No subcategory selected");

        if (subForm.file instanceof File) {
          const fd = new FormData();
          fd.set("categoryId", categoryId);
          fd.set("name", name);
          if (slug) fd.set("slug", slugify(slug));
          fd.set("sortOrder", String(sortOrder));
          fd.set("isActive", String(Boolean(subForm.isActive)));
          if (subForm.alt) fd.set("alt", String(subForm.alt).trim());
          fd.set("image", subForm.file);

          await apiFetchForm(`/api/admin/categories/subcategories/${subId}`, { method: "PUT", formData: fd });
        } else {
          await apiFetchJson(`/api/admin/categories/subcategories/${subId}`, {
            method: "PUT",
            body: JSON.stringify({
              categoryId,
              name,
              slug: slug ? slugify(slug) : undefined,
              sortOrder,
              isActive: Boolean(subForm.isActive),
              image: {
                url: subForm.existingImageUrl,
                publicId: subForm.existingPublicId,
                alt: String(subForm.alt || "").trim(),
              },
            }),
          });
        }

        showToast("success", "Subcategory updated");
      }

      setSubModalOpen(false);
      await loadSubcategoriesByPage(1, { reset: true, showSpinner: true });
    } catch (e) {
      showToast("error", e.message || "Failed to save subcategory");
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteSub(sub) {
    const subId = sub?.id || sub?._id;
    if (!subId) return showToast("error", "Invalid subcategory");

    setConfirm({
      title: "Delete subcategory?",
      description: "This will permanently remove the subcategory from its category.",
      dangerText: "Delete subcategory",
      onConfirm: async () => {
        try {
          setDeleting(subId, true);
          await apiFetchJson(`/api/admin/categories/subcategories/${subId}`, { method: "DELETE" });
          setConfirmOpen(false);
          showToast("success", "Subcategory deleted");
          if (String(selectedSubId) === String(subId)) setSelectedSubId(null);
          await loadSubcategoriesByPage(1, { reset: true, showSpinner: true });
        } catch (e) {
          showToast("error", e.message || "Failed to delete subcategory");
        } finally {
          setDeleting(subId, false);
        }
      },
    });

    setConfirmOpen(true);
  }

  async function toggleSubActive(sub, nextActive) {
    const subId = sub?.id || sub?._id;
    if (!subId) return;
    if (isToggling(subId)) return;

    setToggling(subId, true);

    const prev = Boolean(sub.isActive);
    setSubItems((items) =>
      items.map((x) => (String(x.id || x._id) === String(subId) ? { ...x, isActive: nextActive } : x))
    );

    try {
      await apiFetchJson(`/api/admin/categories/subcategories/${subId}`, {
        method: "PUT",
        body: JSON.stringify({
          categoryId: String(sub?.category?.id || ""),
          name: sub.name,
          slug: sub.slug || undefined,
          sortOrder: Number(sub.sortOrder) || 0,
          isActive: Boolean(nextActive),
          image: sub.image,
        }),
      });

      showToast("success", nextActive ? "Subcategory activated" : "Subcategory deactivated");
    } catch (e) {
      setSubItems((items) =>
        items.map((x) => (String(x.id || x._id) === String(subId) ? { ...x, isActive: prev } : x))
      );
      showToast("error", e.message || "Failed to update status");
    } finally {
      setToggling(subId, false);
    }
  }

  const maxKnown = Math.max(1, cursors.length);
  const { pages: pageWindow } = buildPageWindow(page, maxKnown, Boolean(nextCursor), 5);

  const currentScopeText = selectedCategory
    ? `Showing subcategories for ${selectedCategory.name}`
    : "Showing subcategories for All categories";

  const fileLabelText =
    subForm.file instanceof File
      ? subForm.file.name
      : subMode === "create"
      ? "Choose an image…"
      : "Choose a new image (optional)…";

  const statusOptions = useMemo(
    () => [
      { id: "all", name: "All" },
      { id: "active", name: "Active" },
      { id: "inactive", name: "Inactive" },
    ],
    []
  );

  const statusMeta = useMemo(() => {
    if (statusFilter === "all") return "ALL";
    if (statusFilter === "active") return "ACTIVE";
    return "INACTIVE";
  }, [statusFilter]);

  // ✅ Category header pill label (replaces 50/page)
  const categoryHeaderLabel = selectedCategory?.name ? selectedCategory.name : "All categories";
  const categoryHeaderMeta = selectedCategory ? "FILTERED" : "ALL";

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

      {/* background accents */}
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

      {/* Header Card */}
      <div className="mx-auto max-w-screen-xl px-5 pt-6 pb-4 md:px-10 lg:px-12">
        <Card className="overflow-visible">
          <div className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-3xl shrink-0"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.18), rgba(11,27,51,0.05) 65%), #fff",
                      border: `1px solid ${PALETTE.border}`,
                      boxShadow: "0 12px 26px rgba(0,31,63,.07)",
                    }}
                  >
                    <LayoutGrid className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* ✅ Title row + Category header badge + Stats (top) */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                            Subcategories
                          </div>

                          {/* ✅ Replaces 50/page */}
                          <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                            style={{
                              background: "rgba(255,255,255,0.92)",
                              border: `1px solid ${PALETTE.border}`,
                              boxShadow: "0 10px 20px rgba(0,31,63,0.05)",
                            }}
                            title="Category scope"
                          >
                            <span
                              className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-bold"
                              style={{
                                background: "rgba(255,126,105,0.12)",
                                border: "1px solid rgba(255,126,105,0.22)",
                                color: PALETTE.navy,
                              }}
                            >
                              {categoryHeaderMeta}
                            </span>
                            <span className="truncate" style={{ maxWidth: 260 }}>
                              {categoryHeaderLabel}
                            </span>
                          </span>
                        </div>

                        <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                          Create, update, toggle status, and delete subcategories.
                        </div>
                      </div>

                      {/* ✅ Total / Active / Inactive shown at top (right on desktop) */}
                      <div className="flex flex-wrap gap-2">
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

                 
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SoftButton
                  icon={RefreshCw}
                  loading={refreshing}
                  onClick={async () => {
                    await loadCategories({ showSpinner: true });
                    await loadSubcategoriesByPage(1, { reset: true, showSpinner: true });
                  }}
                >
                  Refresh
                </SoftButton>

                <PrimaryButton icon={Plus} onClick={openCreateSub}>
                  New Subcategory
                </PrimaryButton>
              </div>
            </div>

            {/* ✅ Controls row: Search FIRST, then filters
                ✅ Filters are compact width on desktop (don’t stretch)
            */}
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end">
              {/* Search grows */}
              <div className="w-full md:flex-1">
                <Field label="Search" icon={Search}>
                  <input
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                    placeholder="Search subcategories by name, slug, or category…"
                  />
                </Field>
              </div>

              {/* Filters: compact, only as wide as needed */}
              <div className="w-full md:w-auto md:flex md:items-end md:gap-3">
                <div className="w-full md:w-[260px]">
                  <label className="grid gap-2">
                    <Label>Category (filter)</Label>

                    <ThinSingleSelect
                      items={categories}
                      value={selectedCategoryId}
                      onChange={(id) => setSelectedCategoryId(id)}
                      disabled={catLoading}
                      placeholder="All categories"
                      metaText={catLoading ? "LOADING" : selectedCategory ? "FILTERED" : "ALL"}
                      icon={LayoutGrid}
                      searchable
                      searchPlaceholder="Search categories…"
                      getId={(c) => String(c?._id ?? c?.id ?? "")}
                      getLabel={(c) => String(c?.name ?? "")} // ✅ ONLY name
                      showClear
                      height={38}
                      itemPadY={9}
                    />
                  </label>
                </div>

                <div className="w-full md:w-[180px] mt-3 md:mt-0">
                  <label className="grid gap-2">
                    <Label>Status</Label>

                    <ThinSingleSelect
                      items={statusOptions}
                      value={statusFilter}
                      onChange={(id) => setStatusFilter(id || "all")}
                      disabled={subLoading}
                      placeholder="All"
                      metaText={statusMeta}
                      icon={Filter}
                      searchable={false}
                      getId={(x) => String(x?.id ?? "")}
                      getLabel={(x) => String(x?.name ?? "")}
                      showClear={false}
                      height={38}
                      itemPadY={9}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Table Card */}
      <div className="mx-auto max-w-screen-xl px-5 pb-10 md:px-10 lg:px-12">
        <Card>
          <div className="overflow-auto" style={{ height: "min(58vh, 600px)" }}>
            {subLoading ? (
              <TableSkeleton rows={10} showCategory={!selectedCategoryId} />
            ) : subFiltered.length ? (
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
                    <th className="px-6 py-3 font-semibold">Name</th>
                    {!selectedCategoryId ? <th className="px-6 py-3 font-semibold">Category</th> : null}
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Sort</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {subFiltered.map((s) => (
                    <SubRow
                      key={String(s.id || s._id)}
                      s={s}
                      showCategory={!selectedCategoryId}
                      isSelected={Boolean(selectedSubId && String(selectedSubId) === String(s.id || s._id))}
                      onSelect={(id) => setSelectedSubId(id)}
                      onEdit={openEditSub}
                      onDelete={confirmDeleteSub}
                      onToggleActive={toggleSubActive}
                      toggling={isToggling(s.id || s._id)}
                      deleting={isDeleting(s.id || s._id)}
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
                    <LayoutGrid className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="mt-4 text-[15px] font-semibold" style={{ color: PALETTE.navy }}>
                    No subcategories found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Adjust search/status/category filter, or create a new subcategory.
                  </div>

                  <div className="mt-5 flex justify-center">
                    <PrimaryButton icon={Plus} onClick={openCreateSub}>
                      New Subcategory
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* Footer: pagination */}
          <div className="flex items-center justify-between p-4">
            <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              Page <span style={{ color: PALETTE.navy, fontWeight: 800 }}>{page}</span>
            </div>

            <div className="flex items-center gap-2">
              <SoftButton
                disabled={!(page > 1) || subLoading}
                icon={ChevronLeft}
                onClick={() => loadSubcategoriesByPage(Math.max(1, page - 1))}
              >
                Prev
              </SoftButton>

              <div className="flex items-center gap-2">
                {pageWindow.map((p) => {
                  const isGhostNext = p > Math.max(1, cursors.length);
                  const disabled = subLoading || (isGhostNext && !Boolean(nextCursor));

                  return (
                    <PagePill
                      key={p}
                      active={p === page}
                      disabled={disabled}
                      onClick={() => {
                        if (isGhostNext) return loadSubcategoriesByPage(page + 1);
                        return loadSubcategoriesByPage(p);
                      }}
                    >
                      {p}
                    </PagePill>
                  );
                })}
              </div>

              <SoftButton
                disabled={!Boolean(nextCursor) || subLoading}
                icon={ChevronRight}
                onClick={() => loadSubcategoriesByPage(page + 1)}
              >
                Next
              </SoftButton>
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------------- Modals ------------------------------- */}

      <Modal
        open={subModalOpen}
        title={subMode === "create" ? "Create subcategory" : "Edit subcategory"}
        subtitle={
          subMode === "create"
            ? "Category + Name + Image are required. Slug is optional (auto-friendly)."
            : "You can change category (move). Replace image if needed."
        }
        onClose={() => (saving ? null : setSubModalOpen(false))}
        footer={
          <>
            <SoftButton disabled={saving} onClick={() => setSubModalOpen(false)}>
              Cancel
            </SoftButton>
            <PrimaryButton loading={saving} disabled={loadingEdit} onClick={submitSub}>
              {subMode === "create" ? "Create" : "Save changes"}
            </PrimaryButton>
          </>
        }
      >
        {loadingEdit ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div className="mt-3 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              Loading subcategory…
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <Label required>Category</Label>
                <ThinSingleSelect
                  items={categories}
                  value={subForm.categoryId}
                  onChange={(id) => {
                    const cat = categories.find((c) => String(c._id || c.id) === String(id)) || null;
                    setSubForm((f) => ({
                      ...f,
                      categoryId: id,
                      categoryName: cat?.name || "",
                      categorySlug: cat?.slug || "",
                    }));
                  }}
                  disabled={catLoading}
                  placeholder="Select a category…"
                  metaText={subForm.categoryId ? "SELECTED" : "REQUIRED"}
                  icon={LayoutGrid}
                  searchable
                  searchPlaceholder="Search categories…"
                  getId={(c) => String(c?._id ?? c?.id ?? "")}
                  getLabel={(c) => String(c?.name ?? "")}
                  showClear
                  height={38}
                  itemPadY={9}
                />
                {!subForm.categoryId ? (
                  <div className="text-[11px] font-semibold" style={{ color: "rgba(255,107,107,0.95)" }}>
                    Category is required.
                  </div>
                ) : null}
              </label>

              <Field label="Name" icon={LayoutGrid}>
                <input
                  value={subForm.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSubForm((f) => ({ ...f, name: v, slug: f.slug ? f.slug : slugify(v) }));
                  }}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="e.g. Running Shoes"
                />
              </Field>

              <Field label="Slug (optional)" icon={ArrowRight}>
                <input
                  value={subForm.slug}
                  onChange={(e) => setSubForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="e.g. running-shoes"
                />
              </Field>

              <Field label="Sort order" icon={ChevronRight}>
                <input
                  type="number"
                  value={subForm.sortOrder}
                  onChange={(e) => setSubForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="0"
                />
              </Field>

              <label className="grid gap-2">
                <Label>Status</Label>
                <div
                  className="flex h-11 items-center justify-between rounded-2xl px-4"
                  style={{
                    background: "rgba(255,255,255,0.96)",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.navy,
                  }}
                >
                  <span className="text-sm font-semibold">{subForm.isActive ? "Active" : "Inactive"}</span>
                  <ToggleSwitch
                    checked={Boolean(subForm.isActive)}
                    onChange={(v) => setSubForm((f) => ({ ...f, isActive: Boolean(v) }))}
                  />
                </div>
              </label>

              <Field label="Image alt (optional)" icon={ImageIcon}>
                <input
                  value={subForm.alt}
                  onChange={(e) => setSubForm((f) => ({ ...f, alt: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="Short description"
                />
              </Field>

              {/* Image upload */}
              <div className="grid gap-2 sm:col-span-2">
                <Label required={subMode === "create"}>{subMode === "create" ? "Image file" : "Replace image (optional)"}</Label>

                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <label
                    className={cx(
                      "flex h-11 items-center gap-3 rounded-2xl px-3 transition",
                      "focus-within:ring-2 focus-within:ring-offset-2",
                      "cursor-pointer"
                    )}
                    style={{
                      background: "rgba(255,255,255,0.96)",
                      border: `1px solid ${PALETTE.border}`,
                    }}
                    title="Upload image"
                  >
                    <ImageIcon className="h-4 w-4" style={{ color: PALETTE.muted }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                        {fileLabelText}
                      </div>
                      <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                        PNG/JPG/WebP recommended
                      </div>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSubForm((f) => ({ ...f, file }));
                      }}
                      className="hidden"
                    />

                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                    >
                      Browse
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={!subForm.file}
                    onClick={() => setSubForm((f) => ({ ...f, file: null }))}
                    className={cx(
                      "inline-flex h-11 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition",
                      subForm.file ? "cursor-pointer hover:opacity-95 active:scale-[0.99]" : "cursor-not-allowed opacity-60"
                    )}
                    style={{
                      background: "rgba(255,255,255,0.96)",
                      border: `1px solid ${PALETTE.border}`,
                      color: PALETTE.navy,
                      boxShadow: "0 10px 24px rgba(0,31,63,.06)",
                    }}
                    title="Remove selected file"
                  >
                    <X className="h-4 w-4" style={{ color: PALETTE.muted }} />
                  </button>
                </div>

                {subMode === "create" && !(subForm.file instanceof File) ? (
                  <div className="text-[11px] font-semibold" style={{ color: "rgba(255,107,107,0.95)" }}>
                    Image file is required for create.
                  </div>
                ) : null}
              </div>
            </div>

            {/* Preview */}
            <div className="mt-5">
              <Label>Preview</Label>
              <div
                className="mt-2 flex items-center gap-4 rounded-3xl p-4"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  border: `1px solid rgba(2,10,25,0.06)`,
                  boxShadow: "0 10px 26px rgba(0,31,63,0.04)",
                }}
              >
                <div
                  className="h-16 w-16 overflow-hidden rounded-3xl"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={subForm.alt || subForm.name || "preview"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center">
                      <ImageIcon className="h-5 w-5" style={{ color: PALETTE.muted }} />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                    {String(subForm.name || "Subcategory name")}
                  </div>
                  <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                    {subForm.slug ? `/${subForm.slug}` : "Slug will be generated"}
                  </div>

                  {/* ✅ Only category name */}
                  <div
                    className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                  >
                    <Link2 className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
                    <div className="text-[12px] font-semibold truncate" style={{ color: PALETTE.navy, maxWidth: 360 }}>
                      {subForm.categoryName || "Category required"}
                    </div>
                  </div>
                </div>

                {subMode === "create" ? (
                  <div className="ml-auto text-[11px] font-semibold" style={{ color: PALETTE.muted, textAlign: "right" }}>
                    <div>{subForm.categoryId ? "CATEGORY OK" : "CATEGORY REQUIRED"}</div>
                    <div>{subForm.file ? "READY" : "IMAGE REQUIRED"}</div>
                  </div>
                ) : (
                  <div className="ml-auto text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                    {subForm.file ? "IMAGE WILL REPLACE" : "KEEPING CURRENT"}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
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