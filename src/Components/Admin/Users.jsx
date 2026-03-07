// app/admin/users/page.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Filter,
  Loader2,
  Shield,
  User as UserIcon,
  Mail,
  Lock,
  ChevronDown,
  KeyRound,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

/**
 * Admin Users CRUD UI
 *
 * Works with:
 * - GET    /api/admin/users
 * - POST   /api/admin/users
 * - GET    /api/admin/users/[id]
 * - PATCH  /api/admin/users/[id]
 * - DELETE /api/admin/users/[id]
 *
 * Expected API shape:
 * GET /api/admin/users =>
 * {
 *   users: [],
 *   pagination: {
 *     limit,
 *     hasMore,
 *     nextCursor
 *   }
 * }
 *
 * GET /api/admin/users/[id] =>
 * {
 *   user: { ... }
 * }
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

const PAGE_SIZE = 20;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const t = window.setTimeout(() => setDeb(value, delay));
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
    const err = new Error(msg);
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

function ThinSingleSelect({
  items = [],
  value = "",
  onChange,
  disabled,
  placeholder = "Select…",
  metaText = "",
  icon: LeftIcon = Users,
  searchable = true,
  searchPlaceholder = "Search…",
  getId = (x) => String(x?.id ?? x?.value ?? x ?? "").trim(),
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

function TableSkeleton({ rows = 10 }) {
  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-3 px-2 py-2">
        <Shimmer className="col-span-4 h-5 rounded-xl" />
        <Shimmer className="col-span-3 h-5 rounded-xl" />
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
                <Shimmer className="h-3 rounded-xl" style={{ width: "44%", border: "none" }} />
              </div>
            </div>

            <div className="col-span-3">
              <Shimmer className="h-8 rounded-full" style={{ width: 150, border: "none" }} />
            </div>

            <div className="col-span-2">
              <Shimmer className="h-7 rounded-full" style={{ width: 100, border: "none" }} />
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

/* ------------------------------- Row ------------------------------- */

const UserRow = React.memo(function UserRow({
  user,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleStatus,
  toggling,
  deleting,
}) {
  const isActive = user.status === "active";
  const isAdmin = user.role === "admin";

  return (
    <tr
      onClick={() => onSelect?.(user.id)}
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
            className="grid h-10 w-10 place-items-center rounded-2xl overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            <UserIcon className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </div>

          <div className="min-w-0">
            <div className="font-semibold leading-snug" style={{ color: PALETTE.navy }}>
              {user.name || "Unnamed User"}
            </div>
            <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
              {user.email}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{
            background: isAdmin ? "rgba(234,179,8,0.10)" : PALETTE.soft,
            border: isAdmin ? "1px solid rgba(234,179,8,0.20)" : `1px solid ${PALETTE.border}`,
          }}
        >
          <Shield className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
          <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
            {isAdmin ? "Admin" : "Customer"}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-3">
          <ToggleSwitch checked={isActive} disabled={toggling} onChange={(next) => onToggleStatus(user, next)} />
          <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <span
          className="inline-flex min-w-[88px] justify-center rounded-xl px-2 py-1 text-[12px] font-semibold"
          style={{
            background: PALETTE.soft,
            border: `1px solid ${PALETTE.border}`,
            color: PALETTE.navy,
          }}
        >
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
        </span>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex justify-end gap-2">
          <IconBtn
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(user);
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
              onDelete(user);
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

export default function AdminUsersPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedUserId, setSelectedUserId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirm, setConfirm] = useState({
    title: "",
    description: "",
    dangerText: "Delete",
    onConfirm: async () => {},
  });

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

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    status: "active",
  });

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

  const headerStats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => x.status === "active").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [items]);

  const roleOptions = useMemo(
    () => [
      { id: "all", name: "All roles" },
      { id: "admin", name: "Admin" },
      { id: "customer", name: "Customer" },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { id: "all", name: "All" },
      { id: "active", name: "Active" },
      { id: "inactive", name: "Inactive" },
    ],
    []
  );

  const roleMeta = useMemo(() => {
    if (roleFilter === "all") return "ALL";
    if (roleFilter === "admin") return "ADMIN";
    return "CUSTOMER";
  }, [roleFilter]);

  const statusMeta = useMemo(() => {
    if (statusFilter === "all") return "ALL";
    if (statusFilter === "active") return "ACTIVE";
    return "INACTIVE";
  }, [statusFilter]);

  async function loadUsersByPage(targetPage = 1, { reset = false, showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoading(true);

    try {
      if (reset) {
        setPage(1);
        setCursors([null]);
        setSelectedUserId(null);
        targetPage = 1;
      }

      const cursor = cursors[targetPage - 1] ?? null;

      const qs = new URLSearchParams();
      qs.set("limit", String(PAGE_SIZE));

      if (cursor) qs.set("cursor", cursor);
      if (roleFilter !== "all") qs.set("role", roleFilter);
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());

      const data = await apiFetchJson(`/api/admin/users?${qs.toString()}`);
      const users = Array.isArray(data?.users) ? data.users : [];
      const nxc = data?.pagination?.nextCursor || null;

      setItems(users);
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
      else showToast("error", e.message || "Failed to load users");
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsersByPage(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadUsersByPage(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter, debouncedSearch]);

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "customer",
      status: "active",
    });
    setModalOpen(true);
  }

  async function openEdit(user) {
    const userId = String(user?.id || "");
    if (!userId) return showToast("error", "Invalid user");

    setMode("edit");
    setEditingId(userId);
    setModalOpen(true);
    setLoadingEdit(true);

    try {
      const data = await apiFetchJson(`/api/admin/users/${userId}`);
      const item = data?.user;
      if (!item) throw new Error("User not found");

      setForm({
        name: item?.name || "",
        email: item?.email || "",
        password: "",
        role: item?.role || "customer",
        status: item?.status || "active",
      });
    } catch (e) {
      showToast("error", e.message || "Failed to load user");
      setModalOpen(false);
    } finally {
      setLoadingEdit(false);
    }
  }

  async function submitForm() {
    const isCreate = mode === "create";
    const name = String(form.name || "").trim();
    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");
    const role = form.role === "admin" ? "admin" : "customer";
    const status = form.status === "inactive" ? "inactive" : "active";

    if (!email) return showToast("error", "Email is required");
    if (!EMAIL_REGEX.test(email)) return showToast("error", "Enter a valid email address");
    if (isCreate && password.length < 8) return showToast("error", "Password must be at least 8 characters");

    if (!isCreate && password && password.length < 8) {
      return showToast("error", "Password must be at least 8 characters");
    }

    setSaving(true);

    try {
      if (isCreate) {
        await apiFetchJson(`/api/admin/users`, {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            status,
          }),
        });

        showToast("success", "User created");
      } else {
        if (!editingId) return showToast("error", "No user selected");

        const payload = {
          name,
          email,
          role,
          status,
        };

        if (password) payload.password = password;

        await apiFetchJson(`/api/admin/users/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        showToast("success", "User updated");
      }

      setModalOpen(false);
      await loadUsersByPage(1, { reset: true, showSpinner: true });
    } catch (e) {
      showToast("error", e.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(user) {
    const userId = user?.id;
    if (!userId) return showToast("error", "Invalid user");

    setConfirm({
      title: "Delete user?",
      description: `This will permanently remove ${user.name || user.email || "this user"}.`,
      dangerText: "Delete user",
      onConfirm: async () => {
        try {
          setDeleting(userId, true);
          await apiFetchJson(`/api/admin/users/${userId}`, { method: "DELETE" });
          setConfirmOpen(false);
          showToast("success", "User deleted");
          if (String(selectedUserId) === String(userId)) setSelectedUserId(null);
          await loadUsersByPage(1, { reset: true, showSpinner: true });
        } catch (e) {
          showToast("error", e.message || "Failed to delete user");
        } finally {
          setDeleting(userId, false);
        }
      },
    });

    setConfirmOpen(true);
  }

  async function toggleStatus(user, nextActive) {
    const userId = user?.id;
    if (!userId) return;
    if (isToggling(userId)) return;

    setToggling(userId, true);

    const prev = user.status;
    const nextStatus = nextActive ? "active" : "inactive";

    setItems((list) =>
      list.map((x) => (String(x.id) === String(userId) ? { ...x, status: nextStatus } : x))
    );

    try {
      await apiFetchJson(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: user.name || "",
          email: user.email,
          role: user.role,
          status: nextStatus,
        }),
      });

      showToast("success", nextActive ? "User activated" : "User deactivated");
    } catch (e) {
      setItems((list) =>
        list.map((x) => (String(x.id) === String(userId) ? { ...x, status: prev } : x))
      );
      showToast("error", e.message || "Failed to update status");
    } finally {
      setToggling(userId, false);
    }
  }

  const maxKnown = Math.max(1, cursors.length);
  const { pages: pageWindow } = buildPageWindow(page, maxKnown, Boolean(nextCursor), 5);

  const usersScopeLabel =
    roleFilter === "all" ? "All users" : roleFilter === "admin" ? "Admins" : "Customers";

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
                    <Users className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                            Users
                          </div>

                          <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                            style={{
                              background: "rgba(255,255,255,0.92)",
                              border: `1px solid ${PALETTE.border}`,
                              boxShadow: "0 10px 20px rgba(0,31,63,0.05)",
                            }}
                            title="User scope"
                          >
                            <span
                              className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-bold"
                              style={{
                                background: "rgba(255,126,105,0.12)",
                                border: "1px solid rgba(255,126,105,0.22)",
                                color: PALETTE.navy,
                              }}
                            >
                              {roleFilter === "all" ? "ALL" : "FILTERED"}
                            </span>
                            <span className="truncate" style={{ maxWidth: 260 }}>
                              {usersScopeLabel}
                            </span>
                          </span>
                        </div>

                        <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                          Create, update, activate, deactivate, and delete users.
                        </div>
                      </div>

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
                    await loadUsersByPage(1, { reset: true, showSpinner: true });
                  }}
                >
                  Refresh
                </SoftButton>

                <PrimaryButton icon={Plus} onClick={openCreate}>
                  New User
                </PrimaryButton>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end">
              <div className="w-full md:flex-1">
                <Field label="Search" icon={Search}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                    placeholder="Search users by name or email…"
                  />
                </Field>
              </div>

              <div className="w-full md:w-auto md:flex md:items-end md:gap-3">
                <div className="w-full md:w-[190px]">
                  <label className="grid gap-2">
                    <Label>Role</Label>

                    <ThinSingleSelect
                      items={roleOptions}
                      value={roleFilter}
                      onChange={(id) => setRoleFilter(id || "all")}
                      disabled={loading}
                      placeholder="All roles"
                      metaText={roleMeta}
                      icon={Shield}
                      searchable={false}
                      getId={(x) => String(x?.id ?? "")}
                      getLabel={(x) => String(x?.name ?? "")}
                      showClear={false}
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
                      disabled={loading}
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

      <div className="mx-auto max-w-screen-xl px-5 pb-10 md:px-10 lg:px-12">
        <Card>
          <div className="overflow-auto" style={{ height: "min(58vh, 600px)" }}>
            {loading ? (
              <TableSkeleton rows={10} />
            ) : items.length ? (
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
                    <th className="px-6 py-3 font-semibold">User</th>
                    <th className="px-6 py-3 font-semibold">Role</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Created</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((user) => (
                    <UserRow
                      key={String(user.id)}
                      user={user}
                      isSelected={Boolean(selectedUserId && String(selectedUserId) === String(user.id))}
                      onSelect={(id) => setSelectedUserId(id)}
                      onEdit={openEdit}
                      onDelete={confirmDelete}
                      onToggleStatus={toggleStatus}
                      toggling={isToggling(user.id)}
                      deleting={isDeleting(user.id)}
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
                    <Users className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="mt-4 text-[15px] font-semibold" style={{ color: PALETTE.navy }}>
                    No users found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Adjust search or filters, or create a new user.
                  </div>

                  <div className="mt-5 flex justify-center">
                    <PrimaryButton icon={Plus} onClick={openCreate}>
                      New User
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
              <SoftButton
                disabled={!(page > 1) || loading}
                icon={ChevronLeft}
                onClick={() => loadUsersByPage(Math.max(1, page - 1))}
              >
                Prev
              </SoftButton>

              <div className="flex items-center gap-2">
                {pageWindow.map((p) => {
                  const isGhostNext = p > Math.max(1, cursors.length);
                  const disabled = loading || (isGhostNext && !Boolean(nextCursor));

                  return (
                    <PagePill
                      key={p}
                      active={p === page}
                      disabled={disabled}
                      onClick={() => {
                        if (isGhostNext) return loadUsersByPage(page + 1);
                        return loadUsersByPage(p);
                      }}
                    >
                      {p}
                    </PagePill>
                  );
                })}
              </div>

              <SoftButton
                disabled={!Boolean(nextCursor) || loading}
                icon={ChevronRight}
                onClick={() => loadUsersByPage(page + 1)}
              >
                Next
              </SoftButton>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        title={mode === "create" ? "Create user" : "Edit user"}
        subtitle={
          mode === "create"
            ? "Email and password are required. Role and status can be configured."
            : "Update profile, role, status, or set a new password."
        }
        onClose={() => (saving ? null : setModalOpen(false))}
        footer={
          <>
            <SoftButton disabled={saving} onClick={() => setModalOpen(false)}>
              Cancel
            </SoftButton>
            <PrimaryButton loading={saving} disabled={loadingEdit} onClick={submitForm}>
              {mode === "create" ? "Create" : "Save changes"}
            </PrimaryButton>
          </>
        }
      >
        {loadingEdit ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div className="mt-3 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              Loading user…
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" icon={UserIcon}>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="Your Name"
                />
              </Field>

              <Field label="Email" icon={Mail}>
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="your@example.com"
                  autoComplete="email"
                />
              </Field>

              <Field
                label={mode === "create" ? "Password" : "New password (optional)"}
                icon={mode === "create" ? Lock : KeyRound}
              >
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder={mode === "create" ? "Minimum 8 characters" : "Leave blank to keep current password"}
                  autoComplete="new-password"
                />
              </Field>

              <label className="grid gap-2">
                <Label>Role</Label>
                <ThinSingleSelect
                  items={[
                    { id: "customer", name: "Customer" },
                    { id: "admin", name: "Admin" },
                  ]}
                  value={form.role}
                  onChange={(id) => setForm((f) => ({ ...f, role: id || "customer" }))}
                  disabled={saving}
                  placeholder="Select role…"
                  metaText={form.role === "admin" ? "ADMIN" : "CUSTOMER"}
                  icon={Shield}
                  searchable={false}
                  getId={(x) => String(x?.id ?? "")}
                  getLabel={(x) => String(x?.name ?? "")}
                  showClear={false}
                  height={38}
                  itemPadY={9}
                />
              </label>

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
                  <span className="text-sm font-semibold">{form.status === "active" ? "Active" : "Inactive"}</span>
                  <ToggleSwitch
                    checked={form.status === "active"}
                    onChange={(v) => setForm((f) => ({ ...f, status: v ? "active" : "inactive" }))}
                  />
                </div>
              </label>
            </div>

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
                  className="h-16 w-16 overflow-hidden rounded-3xl grid place-items-center"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <UserIcon className="h-6 w-6" style={{ color: PALETTE.navy }} />
                </div>

                <div className="min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                    {String(form.name || "Unnamed User")}
                  </div>
                  <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                    {form.email || "Email required"}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                      style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                    >
                      <Shield className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
                      <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                        {form.role === "admin" ? "Admin" : "Customer"}
                      </div>
                    </div>

                    <div
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                      style={{
                        background: form.status === "active" ? "rgba(16,185,129,0.10)" : "rgba(255,107,107,0.10)",
                        border:
                          form.status === "active"
                            ? "1px solid rgba(16,185,129,0.20)"
                            : "1px solid rgba(255,107,107,0.18)",
                      }}
                    >
                      <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                        {form.status === "active" ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="ml-auto text-[11px] font-semibold"
                  style={{ color: PALETTE.muted, textAlign: "right" }}
                >
                  <div>{EMAIL_REGEX.test(String(form.email || "").trim()) ? "EMAIL OK" : "EMAIL REQUIRED"}</div>
                  <div>
                    {mode === "create"
                      ? form.password.length >= 8
                        ? "PASSWORD OK"
                        : "PASSWORD REQUIRED"
                      : form.password
                      ? "PASSWORD WILL CHANGE"
                      : "PASSWORD UNCHANGED"}
                  </div>
                </div>
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