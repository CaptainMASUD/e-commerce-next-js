"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Image as ImageIcon,
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
  Layers,
  Link2,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  PanelsTopLeft,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

const cx = (...c) => c.filter(Boolean).join(" ");

/**
 * IMPORTANT
 * This page uses:
 *   GET    /api/admin/categories?limit=200
 *   PATCH  /api/admin/categories/:id/banner
 *   DELETE /api/admin/categories/:id/banner
 */
const API_LIST_ENDPOINT = "/api/admin/categories?limit=200";

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
    const t = window.setTimeout(() => setDeb(value, delay));
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return deb;
}

function normalizeBanner(banner) {
  if (!banner) return null;

  return {
    image: banner?.image
      ? {
          url: String(banner.image.url || ""),
          publicId: String(banner.image.publicId || ""),
          alt: String(banner.image.alt || ""),
        }
      : null,
    mobileImage: banner?.mobileImage
      ? {
          url: String(banner.mobileImage.url || ""),
          publicId: String(banner.mobileImage.publicId || ""),
          alt: String(banner.mobileImage.alt || ""),
        }
      : null,
    title: String(banner.title || ""),
    subtitle: String(banner.subtitle || ""),
    link: String(banner.link || ""),
    isActive: Boolean(banner.isActive),
  };
}

function normalizeCategory(c) {
  const banner = normalizeBanner(c?.banner);

  return {
    ...c,
    id: String(c?._id || c?.id || ""),
    _id: String(c?._id || c?.id || ""),
    name: String(c?.name || ""),
    slug: String(c?.slug || ""),
    isActive: Boolean(c?.isActive),
    sortOrder: Number(c?.sortOrder || 0),
    banner,
    hasBanner: Boolean(banner?.image?.url),
  };
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

async function apiFetchForm(path, { method = "PATCH", formData, headers = {} } = {}) {
  const token = getStoredToken();

  const res = await fetch(path, {
    method,
    body: formData,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
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
        isDisabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:opacity-95 active:scale-[0.99]",
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

function ThinSingleSelect({
  items = [],
  value = "",
  onChange,
  disabled,
  placeholder = "Select…",
  metaText = "",
  icon: LeftIcon = Layers,
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
              <Shimmer className="h-12 w-16 rounded-2xl" style={{ border: "none" }} />
              <div className="flex-1 grid gap-2">
                <Shimmer className="h-4 rounded-xl" style={{ width: "58%", border: "none" }} />
                <Shimmer className="h-3 rounded-xl" style={{ width: "40%", border: "none" }} />
              </div>
            </div>

            <div className="col-span-3">
              <Shimmer className="h-8 rounded-full" style={{ width: 170, border: "none" }} />
            </div>

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

function CategoryRow({ item, isSelected, onSelect, onEdit, onDelete, deleting }) {
  const bannerUrl = item?.banner?.image?.url || "";
  const bannerActive = Boolean(item?.banner?.isActive);

  return (
    <tr
      onClick={() => onSelect?.(item.id || item._id)}
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
            className="grid h-12 w-16 place-items-center rounded-2xl overflow-hidden"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt={item?.banner?.image?.alt || item?.name || "banner"} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-4 w-4" style={{ color: PALETTE.navy }} />
            )}
          </div>

          <div className="min-w-0">
            <div className="font-semibold leading-snug" style={{ color: PALETTE.navy }}>
              {item.name}
            </div>
            <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
              {item.slug ? `/${item.slug}` : "—"}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
        >
          <PanelsTopLeft className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold truncate" style={{ color: PALETTE.navy, maxWidth: 180 }}>
              {item.hasBanner ? "Banner Ready" : "No Banner"}
            </div>
            <div className="text-[11px] font-semibold truncate" style={{ color: PALETTE.muted, maxWidth: 180 }}>
              {item.banner?.image?.alt || "No banner uploaded"}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
          style={
            bannerActive
              ? { background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)", color: PALETTE.navy }
              : { background: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.18)", color: PALETTE.navy }
          }
        >
          {bannerActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {bannerActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-6 py-4 align-middle">
        <span
          className="inline-flex min-w-[44px] justify-center rounded-xl px-2 py-1 text-[12px] font-semibold"
          style={{
            background: item.hasBanner ? "rgba(255,126,105,0.10)" : PALETTE.soft,
            border: `1px solid ${PALETTE.border}`,
            color: PALETTE.navy,
          }}
        >
          {item.hasBanner ? "Yes" : "No"}
        </span>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex justify-end gap-2">
          <IconBtn
            title={item.hasBanner ? "Edit banner" : "Create banner"}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            {item.hasBanner ? (
              <Pencil className="h-4 w-4" style={{ color: PALETTE.navy }} />
            ) : (
              <Plus className="h-4 w-4" style={{ color: PALETTE.navy }} />
            )}
          </IconBtn>

          <IconBtn
            title="Delete banner"
            tone="danger"
            loading={deleting}
            disabled={!item.hasBanner || deleting}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
          >
            <Trash2 className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </IconBtn>
        </div>
      </td>
    </tr>
  );
}

export default function AdminCategoryBannersPage() {
  const router = useRouter();
  const PAGE_SIZE = 12;

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 220);

  const [statusFilter, setStatusFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [saving, setSaving] = useState(false);

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
    categoryId: "",
    categoryName: "",
    categorySlug: "",
    imageAlt: "",
    file: null,
    existingImageUrl: "",
    existingPublicId: "",
    isActive: true,
  });

  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    let url = "";
    if (form.file instanceof File) {
      url = URL.createObjectURL(form.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(form.existingImageUrl || "");
    }
  }, [form.file, form.existingImageUrl]);

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

  async function loadCategories({ showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoading(true);

    try {
      const data = await apiFetchJson(API_LIST_ENDPOINT);
      const rows = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
        ? data.categories
        : [];

      const mapped = rows.map(normalizeCategory);
      setItems(mapped);
    } catch (e) {
      if (e?.status === 401) showToast("error", "Unauthorized. Please login again.");
      else if (e?.status === 403) showToast("error", "Forbidden. Admin only.");
      else showToast("error", e.message || "Failed to load category banners");
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    let list = [...items];

    if (statusFilter === "with_banner") {
      list = list.filter((x) => Boolean(x?.banner?.image?.url));
    }
    if (statusFilter === "without_banner") {
      list = list.filter((x) => !x?.banner?.image?.url);
    }

    if (activityFilter === "active") {
      list = list.filter((x) => Boolean(x.isActive));
    }
    if (activityFilter === "inactive") {
      list = list.filter((x) => !Boolean(x.isActive));
    }

    if (!q) return list;

    return list.filter((x) => {
      const name = String(x.name || "").toLowerCase();
      const slug = String(x.slug || "").toLowerCase();
      const alt = String(x?.banner?.image?.alt || "").toLowerCase();
      return name.includes(q) || slug.includes(q) || alt.includes(q);
    });
  }, [items, debouncedSearch, statusFilter, activityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const stats = useMemo(() => {
    const total = items.length;
    const withBanner = items.filter((x) => Boolean(x?.banner?.image?.url)).length;
    const withoutBanner = total - withBanner;
    return { total, withBanner, withoutBanner };
  }, [items]);

  function openCreateModal() {
    setMode("create");
    setForm({
      categoryId: "",
      categoryName: "",
      categorySlug: "",
      imageAlt: "",
      file: null,
      existingImageUrl: "",
      existingPublicId: "",
      isActive: true,
    });
    setModalOpen(true);
  }

  function openEditModal(item) {
    setMode(item?.hasBanner ? "edit" : "create");
    setForm({
      categoryId: String(item?.id || item?._id || ""),
      categoryName: item?.name || "",
      categorySlug: item?.slug || "",
      imageAlt: item?.banner?.image?.alt || "",
      file: null,
      existingImageUrl: item?.banner?.image?.url || "",
      existingPublicId: item?.banner?.image?.publicId || "",
      isActive: Boolean(item?.banner?.isActive ?? true),
    });
    setModalOpen(true);
  }

  async function submitForm() {
    const categoryId = String(form.categoryId || "").trim();
    if (!categoryId) return showToast("error", "Category is required");

    const hasExisting = Boolean(form.existingImageUrl);

    if (!(form.file instanceof File) && !hasExisting) {
      return showToast("error", "Banner image is required");
    }

    setSaving(true);

    try {
      const endpoint = `/api/admin/categories/${categoryId}/banner`;
      let result = null;

      if (form.file instanceof File) {
        const fd = new FormData();
        fd.set("image", form.file);
        if (form.imageAlt) fd.set("imageAlt", String(form.imageAlt).trim());
        fd.set("isActive", String(Boolean(form.isActive)));

        result = await apiFetchForm(endpoint, {
          method: "PATCH",
          formData: fd,
        });
      } else {
        result = await apiFetchJson(endpoint, {
          method: "PATCH",
          body: JSON.stringify({
            image: {
              url: form.existingImageUrl,
              publicId: form.existingPublicId,
              alt: String(form.imageAlt || "").trim(),
            },
            isActive: Boolean(form.isActive),
          }),
        });
      }

      const updated = result?.item ? normalizeCategory(result.item) : null;

      if (updated) {
        setItems((prev) => {
          const exists = prev.some((x) => String(x.id) === String(updated.id));
          if (!exists) return [updated, ...prev];
          return prev.map((x) => (String(x.id) === String(updated.id) ? { ...x, ...updated } : x));
        });
      }

      showToast("success", mode === "create" ? "Category banner created" : "Category banner updated");
      setModalOpen(false);
      await loadCategories({ showSpinner: true });
    } catch (e) {
      showToast("error", e.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item) {
    const id = String(item?.id || item?._id || "");
    if (!id) return showToast("error", "Invalid category");

    setConfirm({
      title: "Delete category banner?",
      description: "This will remove the banner from the selected category.",
      dangerText: "Delete banner",
      onConfirm: async () => {
        try {
          setDeleting(id, true);
          await apiFetchJson(`/api/admin/categories/${id}/banner`, { method: "DELETE" });

          setItems((prev) =>
            prev.map((x) =>
              String(x.id) === String(id)
                ? {
                    ...x,
                    banner: null,
                    hasBanner: false,
                  }
                : x
            )
          );

          setConfirmOpen(false);
          showToast("success", "Category banner deleted");
          await loadCategories({ showSpinner: true });
        } catch (e) {
          showToast("error", e.message || "Failed to delete banner");
        } finally {
          setDeleting(id, false);
        }
      },
    });

    setConfirmOpen(true);
  }

  const statusOptions = useMemo(
    () => [
      { id: "all", name: "All banners" },
      { id: "with_banner", name: "Has banner" },
      { id: "without_banner", name: "No banner" },
    ],
    []
  );

  const activityOptions = useMemo(
    () => [
      { id: "all", name: "All categories" },
      { id: "active", name: "Active only" },
      { id: "inactive", name: "Inactive only" },
    ],
    []
  );

  const statusMeta = useMemo(() => {
    if (statusFilter === "with_banner") return "READY";
    if (statusFilter === "without_banner") return "EMPTY";
    return "ALL";
  }, [statusFilter]);

  const activityMeta = useMemo(() => {
    if (activityFilter === "active") return "ACTIVE";
    if (activityFilter === "inactive") return "INACTIVE";
    return "ALL";
  }, [activityFilter]);

  const selectedCategoryLabel = form.categoryName || "Choose category";
  const fileLabelText =
    form.file instanceof File
      ? form.file.name
      : mode === "create"
      ? "Choose a banner image…"
      : "Choose a new banner image (optional)…";

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
                    <PanelsTopLeft className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                            Category Banners
                          </div>

                          <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                            style={{
                              background: "rgba(255,255,255,0.92)",
                              border: `1px solid ${PALETTE.border}`,
                              boxShadow: "0 10px 20px rgba(0,31,63,0.05)",
                            }}
                            title="Banner scope"
                          >
                            <span
                              className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-bold"
                              style={{
                                background: "rgba(255,126,105,0.12)",
                                border: "1px solid rgba(255,126,105,0.22)",
                                color: PALETTE.navy,
                              }}
                            >
                              HERO
                            </span>
                            <span className="truncate" style={{ maxWidth: 260 }}>
                              One banner per category
                            </span>
                          </span>
                        </div>

                        <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                          Create, update, and delete category banner images.
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <div
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                          style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                        >
                          <span style={{ color: PALETTE.muted }}>Total</span>
                          <span style={{ color: PALETTE.navy }}>{stats.total}</span>
                        </div>
                        <div
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                          style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}
                        >
                          <span style={{ color: PALETTE.muted }}>Ready</span>
                          <span style={{ color: PALETTE.navy }}>{stats.withBanner}</span>
                        </div>
                        <div
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                          style={{ background: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.18)" }}
                        >
                          <span style={{ color: PALETTE.muted }}>Empty</span>
                          <span style={{ color: PALETTE.navy }}>{stats.withoutBanner}</span>
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
                  }}
                >
                  Refresh
                </SoftButton>

                <PrimaryButton icon={Plus} onClick={openCreateModal}>
                  New Banner
                </PrimaryButton>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end">
              <div className="w-full md:flex-1">
                <Field label="Search" icon={Search}>
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                    placeholder="Search by category name, slug, or banner alt…"
                  />
                </Field>
              </div>

              <div className="w-full md:w-auto md:flex md:items-end md:gap-3">
                <div className="w-full md:w-[220px]">
                  <label className="grid gap-2">
                    <Label>Banner status</Label>
                    <ThinSingleSelect
                      items={statusOptions}
                      value={statusFilter}
                      onChange={(id) => {
                        setStatusFilter(id || "all");
                        setPage(1);
                      }}
                      disabled={loading}
                      placeholder="All banners"
                      metaText={statusMeta}
                      icon={ImageIcon}
                      searchable={false}
                      getId={(x) => String(x?.id ?? "")}
                      getLabel={(x) => String(x?.name ?? "")}
                      showClear={false}
                      height={38}
                      itemPadY={9}
                    />
                  </label>
                </div>

                <div className="w-full md:w-[210px] mt-3 md:mt-0">
                  <label className="grid gap-2">
                    <Label>Category activity</Label>
                    <ThinSingleSelect
                      items={activityOptions}
                      value={activityFilter}
                      onChange={(id) => {
                        setActivityFilter(id || "all");
                        setPage(1);
                      }}
                      disabled={loading}
                      placeholder="All categories"
                      metaText={activityMeta}
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
              <TableSkeleton rows={8} />
            ) : pagedItems.length ? (
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
                    <th className="px-6 py-3 font-semibold">Category</th>
                    <th className="px-6 py-3 font-semibold">Banner</th>
                    <th className="px-6 py-3 font-semibold">Banner Status</th>
                    <th className="px-6 py-3 font-semibold">Has Banner</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedItems.map((item) => (
                    <CategoryRow
                      key={String(item.id || item._id)}
                      item={item}
                      isSelected={Boolean(selectedId && String(selectedId) === String(item.id || item._id))}
                      onSelect={(id) => setSelectedId(id)}
                      onEdit={openEditModal}
                      onDelete={confirmDelete}
                      deleting={isDeleting(item.id || item._id)}
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
                    <ImageIcon className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="mt-4 text-[15px] font-semibold" style={{ color: PALETTE.navy }}>
                    No category banners found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Adjust search or filters, or create a new banner.
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
              Page <span style={{ color: PALETTE.navy, fontWeight: 800 }}>{safePage}</span> of{" "}
              <span style={{ color: PALETTE.navy, fontWeight: 800 }}>{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <SoftButton
                disabled={safePage <= 1 || loading}
                icon={ChevronLeft}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </SoftButton>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages })
                  .slice(Math.max(0, safePage - 3), Math.max(0, safePage - 3) + 5)
                  .map((_, idx) => {
                    const p = Math.max(1, safePage - 2) + idx;
                    if (p > totalPages) return null;

                    return (
                      <PagePill key={p} active={p === safePage} disabled={loading} onClick={() => setPage(p)}>
                        {p}
                      </PagePill>
                    );
                  })}
              </div>

              <SoftButton
                disabled={safePage >= totalPages || loading}
                icon={ChevronRight}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </SoftButton>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        title={mode === "create" ? "Create category banner" : "Edit category banner"}
        subtitle="Choose a category and upload its banner image."
        onClose={() => (saving ? null : setModalOpen(false))}
        footer={
          <>
            <SoftButton disabled={saving} onClick={() => setModalOpen(false)}>
              Cancel
            </SoftButton>
            <PrimaryButton loading={saving} onClick={submitForm}>
              {mode === "create" ? "Create" : "Save changes"}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid gap-2 sm:col-span-2">
            <Label required>Category</Label>
            <ThinSingleSelect
              items={items}
              value={form.categoryId}
              onChange={(id) => {
                const cat = items.find((c) => String(c.id || c._id) === String(id)) || null;
                setForm((f) => ({
                  ...f,
                  categoryId: id,
                  categoryName: cat?.name || "",
                  categorySlug: cat?.slug || "",
                  existingImageUrl: mode === "create" ? "" : f.existingImageUrl,
                  existingPublicId: mode === "create" ? "" : f.existingPublicId,
                  imageAlt: mode === "create" ? "" : f.imageAlt,
                }));
              }}
              disabled={mode === "edit"}
              placeholder="Select a category…"
              metaText={form.categoryId ? "SELECTED" : "REQUIRED"}
              icon={Layers}
              searchable
              searchPlaceholder="Search categories…"
              getId={(c) => String(c?._id ?? c?.id ?? "")}
              getLabel={(c) => String(c?.name ?? "")}
              showClear={mode === "create"}
              height={38}
              itemPadY={9}
            />
            {!form.categoryId ? (
              <div className="text-[11px] font-semibold" style={{ color: "rgba(255,107,107,0.95)" }}>
                Category is required.
              </div>
            ) : null}
          </label>

          <Field label="Banner alt (optional)" icon={ImageIcon}>
            <input
              value={form.imageAlt}
              onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="Short banner description"
            />
          </Field>

          <Field label="Category slug" icon={Link2}>
            <input
              value={form.categorySlug ? `/${form.categorySlug}` : ""}
              readOnly
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.muted, height: 42 }}
              placeholder="Will appear after selecting category"
            />
          </Field>

          <div className="grid gap-2 sm:col-span-2">
            <Label required={mode === "create"}>{mode === "create" ? "Banner image" : "Replace banner (optional)"}</Label>

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
                title="Upload banner"
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
                    setForm((f) => ({ ...f, file }));
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
                disabled={!form.file}
                onClick={() => setForm((f) => ({ ...f, file: null }))}
                className={cx(
                  "inline-flex h-11 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition",
                  form.file ? "cursor-pointer hover:opacity-95 active:scale-[0.99]" : "cursor-not-allowed opacity-60"
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

            {mode === "create" && !(form.file instanceof File) && !form.existingImageUrl ? (
              <div className="text-[11px] font-semibold" style={{ color: "rgba(255,107,107,0.95)" }}>
                Banner image is required for create.
              </div>
            ) : null}
          </div>
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
              className="h-20 w-32 overflow-hidden rounded-3xl"
              style={{
                background:
                  "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
                border: `1px solid ${PALETTE.border}`,
              }}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={form.imageAlt || form.categoryName || "preview"} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center">
                  <ImageIcon className="h-5 w-5" style={{ color: PALETTE.muted }} />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                {selectedCategoryLabel}
              </div>
              <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                {form.categorySlug ? `/${form.categorySlug}` : "Select a category first"}
              </div>

              <div
                className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <Link2 className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
                <div className="text-[12px] font-semibold truncate" style={{ color: PALETTE.navy, maxWidth: 360 }}>
                  {form.imageAlt || "Category banner preview"}
                </div>
              </div>
            </div>

            <div className="ml-auto text-[11px] font-semibold" style={{ color: PALETTE.muted, textAlign: "right" }}>
              <div>{form.categoryId ? "CATEGORY OK" : "CATEGORY REQUIRED"}</div>
              <div>{previewUrl ? "BANNER READY" : "BANNER REQUIRED"}</div>
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