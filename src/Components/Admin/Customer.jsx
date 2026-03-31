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
  User as UserIcon,
  Mail,
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ChevronDown,
  Eye,
  UserPlus,
  BadgeCheck,
  Ban,
  KeyRound,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

const cx = (...c) => c.filter(Boolean).join(" ");

const PALETTE = {
  navy: "#0B1B33",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  emerald: "#10b981",
  red: "#ef4444",
  bg: "#ffffff",
  card: "rgba(255,255,255,0.98)",
  muted: "rgba(11,27,51,0.62)",
  border: "rgba(2, 10, 25, 0.10)",
  border2: "rgba(2, 10, 25, 0.08)",
  soft: "rgba(11,27,51,0.035)",
  soft2: "rgba(11,27,51,0.06)",
};

const PAGE_SIZE = 12;
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

const Field = React.memo(function Field({ label, icon: Icon, children }) {
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
      : tone === "info"
      ? { background: "rgba(11,27,51,0.05)", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }
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

function ThinSingleSelect({
  items = [],
  value = "",
  onChange,
  disabled,
  placeholder = "Select…",
  metaText = "",
  icon: LeftIcon = Filter,
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
  const panelRef = useRef(null);

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
    onChange?.(String(id || "").trim());
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
                  <button type="button" onClick={clear} className="grid h-8 w-8 place-items-center rounded-2xl cursor-pointer hover:opacity-90" title="Clear selection">
                    <X className="h-4 w-4" style={{ color: PALETTE.muted }} />
                  </button>
                ) : (
                  <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-2xl cursor-pointer hover:opacity-90" title="Close">
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

function Modal({ open, title, subtitle, children, onClose, footer, maxWidth = "max-w-2xl" }) {
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
            className={cx("relative w-full overflow-hidden flex flex-col", maxWidth)}
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

function CardsSkeleton({ rows = 6 }) {
  return (
    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-[28px] p-5"
          style={{
            background: "rgba(255,255,255,0.7)",
            border: `1px solid rgba(2,10,25,0.06)`,
            boxShadow: "0 10px 26px rgba(0,31,63,0.04)",
          }}
        >
          <div className="flex items-center gap-3">
            <Shimmer className="h-11 w-11 rounded-2xl" style={{ border: "none" }} />
            <div className="flex-1 grid gap-2">
              <Shimmer className="h-4 rounded-xl" style={{ width: "58%", border: "none" }} />
              <Shimmer className="h-3 rounded-xl" style={{ width: "42%", border: "none" }} />
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Shimmer className="h-4 rounded-xl" style={{ width: "70%", border: "none" }} />
            <Shimmer className="h-3 rounded-xl" style={{ width: "100%", border: "none" }} />
            <Shimmer className="h-3 rounded-xl" style={{ width: "92%", border: "none" }} />
          </div>
          <div className="mt-5 flex items-center justify-between">
            <Shimmer className="h-8 rounded-full" style={{ width: 110, border: "none" }} />
            <div className="flex gap-2">
              <Shimmer className="h-9 w-9 rounded-2xl" style={{ border: "none" }} />
              <Shimmer className="h-9 w-9 rounded-2xl" style={{ border: "none" }} />
            </div>
          </div>
        </div>
      ))}
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
  return { pages };
}

function getStatusTone(status) {
  if (status === "active") {
    return {
      bg: "rgba(16,185,129,0.10)",
      border: "1px solid rgba(16,185,129,0.20)",
      label: "Active",
      icon: CheckCircle2,
    };
  }
  return {
    bg: "rgba(255,107,107,0.10)",
    border: "1px solid rgba(255,107,107,0.18)",
    label: "Inactive",
    icon: Ban,
  };
}

function VerifiedBadge({ verified }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
      style={{
        background: verified ? "rgba(16,185,129,0.10)" : "rgba(234,179,8,0.10)",
        border: verified ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(234,179,8,0.20)",
        color: PALETTE.navy,
      }}
    >
      {verified ? <BadgeCheck className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}

const CustomerCard = React.memo(function CustomerCard({
  item,
  selected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  deleting,
}) {
  const statusTone = getStatusTone(item.status);
  const StatusIcon = statusTone.icon;

  return (
    <motion.div
      layout
      onClick={() => onSelect?.(item.id)}
      className="rounded-[28px] p-5 transition cursor-pointer"
      style={{
        background: selected ? "rgba(11,27,51,0.05)" : "rgba(255,255,255,0.75)",
        border: `1px solid ${PALETTE.border}`,
        boxShadow: selected ? "0 18px 42px rgba(0,31,63,0.08)" : "0 10px 26px rgba(0,31,63,0.04)",
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-2xl shrink-0"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
            border: `1px solid ${PALETTE.border}`,
          }}
        >
          <UserIcon className="h-4 w-4" style={{ color: PALETTE.navy }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold truncate" style={{ color: PALETTE.navy }}>
                {item.name || "Unnamed Customer"}
              </div>
              <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                {item.email || "No email"}
              </div>
            </div>

            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shrink-0"
              style={{ background: statusTone.bg, border: statusTone.border, color: PALETTE.navy }}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusTone.label}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
            >
              Role: {item.role || "customer"}
            </span>

            <VerifiedBadge verified={item.isVerified} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
          <CalendarDays className="h-3.5 w-3.5" />
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <IconBtn title="View" tone="info" onClick={() => onView(item)}>
            <Eye className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </IconBtn>
          <IconBtn title="Edit" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </IconBtn>
          <IconBtn title="Delete" tone="danger" loading={deleting} disabled={deleting} onClick={() => onDelete(item)}>
            <Trash2 className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </IconBtn>
        </div>
      </div>
    </motion.div>
  );
});

export default function CustomersPage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirm, setConfirm] = useState({
    title: "",
    description: "",
    dangerText: "Delete",
    onConfirm: async () => {},
  });

  const deletingIdsRef = useRef(new Set());
  const [, force] = useState(0);
  const bump = () => force((x) => x + 1);

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
    status: "active",
    isVerified: false,
  });

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

  const statusOptions = useMemo(
    () => [
      { id: "all", name: "All statuses" },
      { id: "active", name: "Active" },
      { id: "inactive", name: "Inactive" },
    ],
    []
  );

  const formStatusOptions = useMemo(
    () => [
      { id: "active", name: "Active" },
      { id: "inactive", name: "Inactive" },
    ],
    []
  );

  const statusMeta = useMemo(() => {
    if (statusFilter === "all") return "ALL";
    return String(statusFilter).toUpperCase();
  }, [statusFilter]);

  const headerStats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => x.status === "active").length;
    const verified = items.filter((x) => x.isVerified).length;
    return { total, active, verified };
  }, [items]);

  async function loadCustomersByPage(targetPage = 1, { reset = false, showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoading(true);

    try {
      if (reset) {
        setPage(1);
        setCursors([null]);
        setSelectedId(null);
        targetPage = 1;
      }

      const cursor = cursors[targetPage - 1] ?? null;
      const qs = new URLSearchParams();
      qs.set("limit", String(PAGE_SIZE));
      qs.set("role", "customer");

      if (cursor) qs.set("cursor", cursor);
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
      else showToast("error", e.message || "Failed to load customers");
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCustomersByPage(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCustomersByPage(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, debouncedSearch]);

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      password: "",
      status: "active",
      isVerified: false,
    });
    setModalOpen(true);
  }

  async function openEdit(item) {
    const id = String(item?.id || "");
    if (!id) return showToast("error", "Invalid customer");

    setMode("edit");
    setEditingId(id);
    setModalOpen(true);
    setLoadingEdit(true);

    try {
      const data = await apiFetchJson(`/api/admin/users/${id}`);
      const u = data?.user;
      if (!u) throw new Error("Customer not found");

      setForm({
        name: u.name || "",
        email: u.email || "",
        password: "",
        status: u.status || "active",
        isVerified: Boolean(u.isVerified),
      });
    } catch (e) {
      showToast("error", e.message || "Failed to load customer");
      setModalOpen(false);
    } finally {
      setLoadingEdit(false);
    }
  }

  function openView(item) {
    setViewItem(item);
    setViewOpen(true);
  }

  async function submitForm() {
    const isCreate = mode === "create";
    const name = String(form.name || "").trim();
    const email = String(form.email || "").trim().toLowerCase();
    const password = String(form.password || "");
    const status = String(form.status || "active");
    const isVerified = Boolean(form.isVerified);

    if (!name) return showToast("error", "Customer name is required");
    if (!email || !EMAIL_REGEX.test(email)) return showToast("error", "Enter a valid email");

    setSaving(true);

    try {
      if (isCreate) {
        if (!password || password.length < 8) {
          setSaving(false);
          return showToast("error", "Password must be at least 8 characters");
        }

        await apiFetchJson(`/api/admin/users`, {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
            role: "customer",
            status,
          }),
        });

        showToast("success", "Customer created");
      } else {
        if (!editingId) {
          setSaving(false);
          return showToast("error", "No customer selected");
        }

        const payload = {
          name,
          email,
          status,
          isVerified,
          role: "customer",
        };

        if (password.trim()) {
          if (password.trim().length < 8) {
            setSaving(false);
            return showToast("error", "Password must be at least 8 characters");
          }
          payload.password = password.trim();
        }

        await apiFetchJson(`/api/admin/users/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        showToast("success", "Customer updated");
      }

      setModalOpen(false);
      await loadCustomersByPage(1, { reset: true, showSpinner: true });
    } catch (e) {
      showToast("error", e.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item) {
    const id = item?.id;
    if (!id) return showToast("error", "Invalid customer");

    setConfirm({
      title: "Delete customer?",
      description: `This will permanently remove ${item.name || "this customer"}.`,
      dangerText: "Delete customer",
      onConfirm: async () => {
        try {
          setDeleting(id, true);
          await apiFetchJson(`/api/admin/users/${id}`, { method: "DELETE" });
          setConfirmOpen(false);
          showToast("success", "Customer deleted");
          if (String(selectedId) === String(id)) setSelectedId(null);
          await loadCustomersByPage(1, { reset: true, showSpinner: true });
        } catch (e) {
          showToast("error", e.message || "Failed to delete customer");
        } finally {
          setDeleting(id, false);
        }
      },
    });

    setConfirmOpen(true);
  }

  const maxKnown = Math.max(1, cursors.length);
  const { pages: pageWindow } = buildPageWindow(page, maxKnown, Boolean(nextCursor), 5);

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
                            Customers
                          </div>

                          <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                            style={{
                              background: "rgba(255,255,255,0.92)",
                              border: `1px solid ${PALETTE.border}`,
                              boxShadow: "0 10px 20px rgba(0,31,63,0.05)",
                            }}
                          >
                            <span
                              className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-bold"
                              style={{
                                background: "rgba(255,126,105,0.12)",
                                border: "1px solid rgba(255,126,105,0.22)",
                                color: PALETTE.navy,
                              }}
                            >
                              CUSTOMER
                            </span>
                            <span>Customer management dashboard</span>
                          </span>
                        </div>

                        <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                          Manage customer accounts, view status, and update profile access.
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
                          style={{ background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.20)" }}
                        >
                          <span style={{ color: PALETTE.muted }}>Verified</span>
                          <span style={{ color: PALETTE.navy }}>{headerStats.verified}</span>
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
                    await loadCustomersByPage(1, { reset: true, showSpinner: true });
                  }}
                >
                  Refresh
                </SoftButton>

                <PrimaryButton icon={UserPlus} onClick={openCreate}>
                  New Customer
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
                    placeholder="Search by customer name or email…"
                  />
                </Field>
              </div>

              <div className="w-full md:w-[220px]">
                <label className="grid gap-2">
                  <Label>Status</Label>

                  <ThinSingleSelect
                    items={statusOptions}
                    value={statusFilter}
                    onChange={(id) => setStatusFilter(id || "all")}
                    disabled={loading}
                    placeholder="All statuses"
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
        </Card>
      </div>

      <div className="mx-auto max-w-screen-xl px-5 pb-10 md:px-10 lg:px-12">
        <Card>
          <div style={{ minHeight: "min(60vh, 720px)" }}>
            {loading ? (
              <CardsSkeleton rows={6} />
            ) : items.length ? (
              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <CustomerCard
                    key={String(item.id)}
                    item={item}
                    selected={Boolean(selectedId && String(selectedId) === String(item.id))}
                    onSelect={setSelectedId}
                    onView={openView}
                    onEdit={openEdit}
                    onDelete={confirmDelete}
                    deleting={isDeleting(item.id)}
                  />
                ))}
              </div>
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
                    No customers found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Adjust the filters, try another search, or create a new customer account.
                  </div>

                  <div className="mt-5 flex justify-center">
                    <PrimaryButton icon={UserPlus} onClick={openCreate}>
                      New Customer
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
                onClick={() => loadCustomersByPage(Math.max(1, page - 1))}
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
                        if (isGhostNext) return loadCustomersByPage(page + 1);
                        return loadCustomersByPage(p);
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
                onClick={() => loadCustomersByPage(page + 1)}
              >
                Next
              </SoftButton>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        title={mode === "create" ? "Create customer" : "Edit customer"}
        subtitle={
          mode === "create"
            ? "Add a new customer account."
            : "Update customer details, status, verification, and password."
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
              Loading customer…
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Customer name" icon={UserIcon}>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="Customer name"
                />
              </Field>

              <Field label="Customer email" icon={Mail}>
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="customer@example.com"
                />
              </Field>

              <Field label={mode === "create" ? "Password" : "New password"} icon={KeyRound}>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder={mode === "create" ? "Minimum 8 characters" : "Leave empty to keep current password"}
                />
              </Field>

              <label className="grid gap-2">
                <Label>Status</Label>
                <ThinSingleSelect
                  items={formStatusOptions}
                  value={form.status}
                  onChange={(id) => setForm((f) => ({ ...f, status: id || "active" }))}
                  disabled={saving}
                  placeholder="Select status…"
                  metaText={String(form.status || "active").toUpperCase()}
                  icon={ShieldCheck}
                  searchable={false}
                  getId={(x) => String(x?.id ?? "")}
                  getLabel={(x) => String(x?.name ?? "")}
                  showClear={false}
                  height={38}
                  itemPadY={9}
                />
              </label>

              {mode === "edit" ? (
                <div className="sm:col-span-2">
                  <label className="grid gap-2">
                    <Label>Verification</Label>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, isVerified: !f.isVerified }))}
                      className="flex h-11 items-center justify-between rounded-2xl px-4 cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,0.96)",
                        border: `1px solid ${PALETTE.border}`,
                        color: PALETTE.navy,
                      }}
                    >
                      <span className="text-sm font-semibold">
                        {form.isVerified ? "Verified customer" : "Unverified customer"}
                      </span>
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
                        style={{
                          background: form.isVerified ? "rgba(16,185,129,0.10)" : "rgba(234,179,8,0.10)",
                          border: form.isVerified ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(234,179,8,0.20)",
                        }}
                      >
                        {form.isVerified ? <BadgeCheck className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                        {form.isVerified ? "Verified" : "Pending"}
                      </span>
                    </button>
                  </label>
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              <Label>Preview</Label>
              <div
                className="mt-2 rounded-3xl p-4"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  border: `1px solid rgba(2,10,25,0.06)`,
                  boxShadow: "0 10px 26px rgba(0,31,63,0.04)",
                }}
              >
                <div className="flex items-start gap-4">
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

                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                      {String(form.name || "Unnamed Customer")}
                    </div>
                    <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                      {form.email || "Email required"}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                        style={{
                          background: getStatusTone(form.status).bg,
                          border: getStatusTone(form.status).border,
                        }}
                      >
                        <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                          {getStatusTone(form.status).label}
                        </div>
                      </div>

                      <div
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                        style={{
                          background: form.isVerified ? "rgba(16,185,129,0.10)" : "rgba(234,179,8,0.10)",
                          border: form.isVerified ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(234,179,8,0.20)",
                        }}
                      >
                        <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                          {form.isVerified ? "Verified" : "Unverified"}
                        </div>
                      </div>

                      <div
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                        style={{
                          background: PALETTE.soft,
                          border: `1px solid ${PALETTE.border}`,
                        }}
                      >
                        <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                          Role: customer
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
                        ? String(form.password || "").trim().length >= 8
                          ? "PASSWORD OK"
                          : "PASSWORD TOO SHORT"
                        : String(form.password || "").trim()
                        ? String(form.password || "").trim().length >= 8
                          ? "PASSWORD OK"
                          : "PASSWORD TOO SHORT"
                        : "KEEP CURRENT PASSWORD"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={viewOpen}
        title={viewItem?.name || "Customer details"}
        subtitle="Full customer account view"
        onClose={() => setViewOpen(false)}
        maxWidth="max-w-3xl"
        footer={
          <>
            <SoftButton onClick={() => setViewOpen(false)}>Close</SoftButton>
            {viewItem ? (
              <PrimaryButton
                icon={Pencil}
                onClick={() => {
                  setViewOpen(false);
                  openEdit(viewItem);
                }}
              >
                Edit customer
              </PrimaryButton>
            ) : null}
          </>
        }
      >
        {viewItem ? (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
              >
                <UserIcon className="h-3.5 w-3.5" />
                {viewItem.name || "Unnamed Customer"}
              </span>

              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: "rgba(255,255,255,0.96)", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
              >
                <Mail className="h-3.5 w-3.5" />
                {viewItem.email || "No email"}
              </span>

              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                style={{ background: getStatusTone(viewItem.status).bg, border: getStatusTone(viewItem.status).border, color: PALETTE.navy }}
              >
                {React.createElement(getStatusTone(viewItem.status).icon, { className: "h-3.5 w-3.5" })}
                {getStatusTone(viewItem.status).label}
              </span>

              <VerifiedBadge verified={viewItem.isVerified} />
            </div>

            <div
              className="rounded-[24px] p-5"
              style={{
                background: "rgba(255,255,255,0.7)",
                border: `1px solid ${PALETTE.border}`,
                boxShadow: "0 10px 26px rgba(0,31,63,0.04)",
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                    Name
                  </div>
                  <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                    {viewItem.name || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                    Email
                  </div>
                  <div className="mt-1 text-[14px] font-semibold break-all" style={{ color: PALETTE.navy }}>
                    {viewItem.email || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                    Role
                  </div>
                  <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                    {viewItem.role || "customer"}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                    Status
                  </div>
                  <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                    {viewItem.status || "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-semibold"
                  style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                >
                  Created
                </span>
              </div>

              <div className="inline-flex items-center gap-2 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                <CalendarDays className="h-4 w-4" />
                {viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : "—"}
              </div>
            </div>
          </div>
        ) : null}
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