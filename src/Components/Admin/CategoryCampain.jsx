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
  LayoutGrid,
  Layers,
  Tag,
  Link2,
  ChevronDown,
  CalendarRange,
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
    const t = window.setTimeout(() => setDeb(value, delay));
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return deb;
}

async function apiFetchJson(path, opts = {}) {
  const token = getStoredToken();

  const hasBody = opts.body !== undefined && opts.body !== null;
  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;

  const res = await fetch(path, {
    ...opts,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!isFormData && hasBody ? { "Content-Type": "application/json" } : {}),
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

/* -------------------------------- Modal -------------------------------- */

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
            className="relative w-full max-w-3xl overflow-hidden flex flex-col"
            style={{
              borderRadius: 28,
              background: "rgba(255,255,255,0.98)",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 28px 80px rgba(0,31,63,0.16)",
              maxHeight: "84vh",
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

/* ---------------------- Landscape Preview Modal ---------------------- */

function LandscapePreviewModal({ open, onClose, banner }) {
  const imageUrl = banner?.image?.url || "";
  const title = banner?.title || "Banner title";
  const subtitle = banner?.subtitle || "Banner subtitle";
  const buttonText = banner?.buttonText || "Shop Now";
  const buttonLink = banner?.buttonLink || "";
  const ownerLabel = banner?.ownerLabel || banner?.ownerType || "Target";
  const active = Boolean(banner?.isActive);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-[rgba(11,27,51,0.55)] backdrop-blur-[6px]" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            className="relative w-full max-w-6xl overflow-hidden rounded-[32px]"
            style={{
              background: "rgba(255,255,255,0.98)",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 30px 90px rgba(0,31,63,0.28)",
            }}
          >
            <div className="flex items-center justify-between gap-4 border-b px-5 py-4" style={{ borderColor: PALETTE.border2 }}>
              <div className="min-w-0">
                <div className="text-[16px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                  Landscape Banner Preview
                </div>
                <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  Full-width promotional preview
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl transition hover:opacity-90"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
              >
                <X className="h-4 w-4" style={{ color: PALETTE.navy }} />
              </button>
            </div>

            <div className="p-5">
              <div
                className="relative overflow-hidden rounded-[28px]"
                style={{
                  aspectRatio: "21 / 8",
                  minHeight: 260,
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(255,126,105,0.18), rgba(11,27,51,0.12) 50%, rgba(6,26,47,0.95) 100%)",
                  border: `1px solid ${PALETTE.border}`,
                }}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={banner?.image?.alt || title} className="absolute inset-0 h-full w-full object-cover" />
                ) : null}

                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(6,26,47,0.88) 0%, rgba(6,26,47,0.72) 32%, rgba(6,26,47,0.34) 60%, rgba(6,26,47,0.18) 100%)",
                  }}
                />

                <div className="absolute inset-0 flex h-full w-full items-center">
                  <div className="max-w-[52%] px-7 py-7 md:px-10">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                        style={{
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.20)",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        {ownerLabel}
                      </span>

                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
                        style={{
                          background: active ? "rgba(16,185,129,0.18)" : "rgba(255,107,107,0.16)",
                          border: active ? "1px solid rgba(16,185,129,0.28)" : "1px solid rgba(255,107,107,0.28)",
                          color: "#fff",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <h2
                      className="text-[26px] font-semibold leading-tight md:text-[38px]"
                      style={{ color: "#fff", textShadow: "0 10px 24px rgba(0,0,0,0.25)" }}
                    >
                      {title}
                    </h2>

                    <p
                      className="mt-3 max-w-[92%] text-[13px] font-medium leading-6 md:text-[15px]"
                      style={{ color: "rgba(255,255,255,0.88)" }}
                    >
                      {subtitle}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                        style={{
                          background: `linear-gradient(180deg, ${PALETTE.coral} 0%, #f26b52 100%)`,
                          boxShadow: "0 16px 34px rgba(255,126,105,0.30)",
                        }}
                      >
                        {buttonText}
                      </button>

                      {buttonLink ? (
                        <span
                          className="inline-flex max-w-[320px] truncate rounded-2xl px-3 py-2 text-[12px] font-semibold"
                          style={{
                            background: "rgba(255,255,255,0.10)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: "rgba(255,255,255,0.92)",
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          {buttonLink}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                >
                  <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                    Layout
                  </div>
                  <div className="mt-1 text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                    Landscape promotional banner
                  </div>
                </div>

                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                >
                  <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                    CTA
                  </div>
                  <div className="mt-1 truncate text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                    {buttonText || "No button text"}
                  </div>
                </div>

                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                >
                  <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                    Target
                  </div>
                  <div className="mt-1 truncate text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                    {ownerLabel}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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

function TableSkeleton({ rows = 10 }) {
  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-3 px-2 py-2">
        <Shimmer className="col-span-3 h-5 rounded-xl" />
        <Shimmer className="col-span-3 h-5 rounded-xl" />
        <Shimmer className="col-span-2 h-5 rounded-xl" />
        <Shimmer className="col-span-1 h-5 rounded-xl" />
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
            <div className="col-span-3 flex items-center gap-3">
              <Shimmer className="h-12 w-16 rounded-2xl" style={{ border: "none" }} />
              <div className="flex-1 grid gap-2">
                <Shimmer className="h-4 rounded-xl" style={{ width: "58%", border: "none" }} />
                <Shimmer className="h-3 rounded-xl" style={{ width: "40%", border: "none" }} />
              </div>
            </div>

            <div className="col-span-3">
              <Shimmer className="h-8 rounded-full" style={{ width: 170, border: "none" }} />
            </div>

            <div className="col-span-2">
              <Shimmer className="h-7 rounded-full" style={{ width: 110, border: "none" }} />
            </div>

            <div className="col-span-1">
              <Shimmer className="h-7 rounded-xl" style={{ width: "70%", border: "none" }} />
            </div>

            <div className="col-span-3 flex justify-end gap-2">
              <Shimmer className="h-9 w-9 rounded-2xl" style={{ border: "none" }} />
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

/* ------------------------------ Helpers ------------------------------ */

function formatDateInput(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatOwnerLabel(item) {
  if (item.ownerType === "Category") {
    return `Category • ${item.ownerName || item.ownerId}`;
  }
  if (item.ownerType === "Brand") {
    return `Brand • ${item.ownerName || item.ownerId}`;
  }
  return `Subcategory • ${item.subcategoryName || item.subcategoryId}`;
}

function ownerBadgeTone(ownerType) {
  if (ownerType === "Category") {
    return {
      bg: "rgba(59,130,246,0.10)",
      bd: "1px solid rgba(59,130,246,0.18)",
    };
  }
  if (ownerType === "Brand") {
    return {
      bg: "rgba(234,179,8,0.14)",
      bd: "1px solid rgba(234,179,8,0.22)",
    };
  }
  return {
    bg: "rgba(255,126,105,0.12)",
    bd: "1px solid rgba(255,126,105,0.22)",
  };
}

/* ------------------------------ Row ------------------------------ */

const BannerRow = React.memo(function BannerRow({
  item,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onPreview,
  onToggleActive,
  toggling,
  deleting,
}) {
  const tone = ownerBadgeTone(item.ownerType);
  const imgUrl = item?.image?.url || "";

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
            className="h-12 w-20 rounded-2xl overflow-hidden shrink-0"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl} alt={item?.image?.alt || item?.title || "banner"} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <ImageIcon className="h-4 w-4" style={{ color: PALETTE.navy }} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="font-semibold leading-snug truncate" style={{ color: PALETTE.navy, maxWidth: 240 }}>
              {item.title || "Untitled banner"}
            </div>
            <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted, maxWidth: 280 }}>
              {item.subtitle || "No subtitle"}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{ background: tone.bg, border: tone.bd }}
        >
          <Layers className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
          <div className="text-[12px] font-semibold truncate" style={{ color: PALETTE.navy, maxWidth: 220 }}>
            {formatOwnerLabel(item)}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-3">
          <ToggleSwitch checked={Boolean(item.isActive)} disabled={toggling} onChange={(next) => onToggleActive(item, next)} />
          <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
            {Boolean(item.isActive) ? "Active" : "Inactive"}
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
          {Number(item.sortOrder) || 0}
        </span>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex justify-end gap-2">
          <IconBtn
            title="Preview"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(item);
            }}
          >
            <Eye className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </IconBtn>

          <IconBtn
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
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
              onDelete(item);
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

export default function AdminBannersPage() {
  const router = useRouter();
  const PAGE_SIZE = 20;

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 220);

  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const [selectedId, setSelectedId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingId, setEditingId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

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
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
    ownerType: "Category",
    ownerId: "",
    subcategoryId: "",
    sortOrder: 0,
    isActive: true,
    startsAt: "",
    endsAt: "",
    alt: "",
    file: null,
    existingImageUrl: "",
    existingPublicId: "",
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

  const ownerTypeOptions = useMemo(
    () => [
      { id: "all", name: "All types" },
      { id: "Category", name: "Category" },
      { id: "Subcategory", name: "Subcategory" },
      { id: "Brand", name: "Brand" },
    ],
    []
  );

  const ownerTypeFormOptions = useMemo(
    () => [
      { id: "Category", name: "Category" },
      { id: "Subcategory", name: "Subcategory" },
      { id: "Brand", name: "Brand" },
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

  async function loadCategoriesAndBrands({ showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoadingLookups(true);

    try {
      const [catRes, brandRes] = await Promise.all([
        apiFetchJson(`/api/admin/categories?limit=100`),
        apiFetchJson(`/api/admin/brands?limit=100`),
      ]);

      const categoryItems = Array.isArray(catRes.items) ? catRes.items : [];
      const brandItems = Array.isArray(brandRes.items) ? brandRes.items : [];

      setCategories(categoryItems);
      setBrands(brandItems);
    } catch (e) {
      showToast("error", e.message || "Failed to load categories / brands");
    } finally {
      setLoadingLookups(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  function withDisplayNames(rawItems) {
    return (rawItems || []).map((item) => {
      const ownerId = String(item.ownerId || "");
      const subcategoryId = String(item.subcategoryId || "");

      let ownerName = "";
      let subcategoryName = "";

      if (item.ownerType === "Category") {
        const cat = categories.find((c) => String(c._id || c.id) === ownerId);
        ownerName = cat?.name || "";
      }

      if (item.ownerType === "Brand") {
        const brand = brands.find((b) => String(b._id || b.id) === ownerId);
        ownerName = brand?.name || "";
      }

      if (item.ownerType === "Subcategory") {
        const cat = categories.find((c) => String(c._id || c.id) === ownerId);
        ownerName = cat?.name || "";
        const sub = Array.isArray(cat?.subcategories)
          ? cat.subcategories.find((s) => String(s._id || s.id) === subcategoryId)
          : null;
        subcategoryName = sub?.name || "";
      }

      return { ...item, ownerName, subcategoryName };
    });
  }

  async function loadItems(targetPage = 1, { reset = false, showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoadingItems(true);

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
      if (statusFilter === "active") qs.set("status", "active");
      if (statusFilter === "inactive") qs.set("status", "inactive");
      if (ownerTypeFilter !== "all") qs.set("ownerType", ownerTypeFilter);

      if (cursor?.afterId) qs.set("afterId", cursor.afterId);
      if (cursor?.afterSortOrder !== undefined && cursor?.afterSortOrder !== null) {
        qs.set("afterSortOrder", String(cursor.afterSortOrder));
      }

      const data = await apiFetchJson(`/api/admin/banners?${qs.toString()}`);
      const rawItems = Array.isArray(data.items) ? data.items : [];
      const hydrated = withDisplayNames(rawItems);
      const nxc = data?.pageInfo?.nextCursor || null;

      setItems(hydrated);
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
      showToast("error", e.message || "Failed to load banners");
    } finally {
      setLoadingItems(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  useEffect(() => {
    (async () => {
      await loadCategoriesAndBrands();
    })();
  }, []);

  useEffect(() => {
    if (categories.length || brands.length) {
      loadItems(1, { reset: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length, brands.length]);

  useEffect(() => {
    loadItems(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, ownerTypeFilter]);

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const subtitle = String(item.subtitle || "").toLowerCase();
      const btn = String(item.buttonText || "").toLowerCase();
      const link = String(item.buttonLink || "").toLowerCase();
      const ownerType = String(item.ownerType || "").toLowerCase();
      const ownerName = String(item.ownerName || "").toLowerCase();
      const subName = String(item.subcategoryName || "").toLowerCase();
      return (
        title.includes(q) ||
        subtitle.includes(q) ||
        btn.includes(q) ||
        link.includes(q) ||
        ownerType.includes(q) ||
        ownerName.includes(q) ||
        subName.includes(q)
      );
    });
  }, [items, debouncedSearch]);

  const headerStats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => Boolean(x.isActive)).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [items]);

  const currentCategoryForSubcats = useMemo(() => {
    if (form.ownerType !== "Subcategory") return null;
    return categories.find((c) => String(c._id || c.id) === String(form.ownerId)) || null;
  }, [categories, form.ownerId, form.ownerType]);

  const availableSubcategories = useMemo(() => {
    if (!currentCategoryForSubcats) return [];
    return Array.isArray(currentCategoryForSubcats.subcategories) ? currentCategoryForSubcats.subcategories : [];
  }, [currentCategoryForSubcats]);

  function resetForm() {
    setForm({
      title: "",
      subtitle: "",
      buttonText: "",
      buttonLink: "",
      ownerType: "Category",
      ownerId: "",
      subcategoryId: "",
      sortOrder: 0,
      isActive: true,
      startsAt: "",
      endsAt: "",
      alt: "",
      file: null,
      existingImageUrl: "",
      existingPublicId: "",
    });
  }

  function openCreate() {
    setMode("create");
    setEditingId(null);
    resetForm();
    setModalOpen(true);
  }

  async function openEdit(item) {
    const id = String(item?.id || item?._id || "");
    if (!id) return showToast("error", "Invalid banner");

    setMode("edit");
    setEditingId(id);
    setModalOpen(true);
    setLoadingEdit(true);

    try {
      const data = await apiFetchJson(`/api/admin/banners/${id}`);
      const banner = data?.item;
      if (!banner) throw new Error("Banner not found");

      setForm({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        buttonText: banner.buttonText || "",
        buttonLink: banner.buttonLink || "",
        ownerType: banner.ownerType || "Category",
        ownerId: String(banner.ownerId || ""),
        subcategoryId: String(banner.subcategoryId || ""),
        sortOrder: Number(banner.sortOrder) || 0,
        isActive: Boolean(banner.isActive),
        startsAt: formatDateInput(banner.startsAt),
        endsAt: formatDateInput(banner.endsAt),
        alt: banner?.image?.alt || "",
        file: null,
        existingImageUrl: banner?.image?.url || "",
        existingPublicId: banner?.image?.publicId || "",
      });
    } catch (e) {
      showToast("error", e.message || "Failed to load banner");
      setModalOpen(false);
    } finally {
      setLoadingEdit(false);
    }
  }

  function validateForm() {
    if (!String(form.ownerType || "").trim()) return "Owner type is required";
    if (!String(form.ownerId || "").trim()) return "Owner is required";
    if (form.ownerType === "Subcategory" && !String(form.subcategoryId || "").trim()) {
      return "Subcategory is required";
    }
    if (mode === "create" && !(form.file instanceof File)) {
      return "Banner image is required";
    }
    if (form.startsAt && form.endsAt) {
      const a = new Date(form.startsAt);
      const b = new Date(form.endsAt);
      if (a > b) return "Start date cannot be after end date";
    }
    return "";
  }

  async function submitForm() {
    const errMsg = validateForm();
    if (errMsg) return showToast("error", errMsg);

    setSaving(true);

    try {
      if (mode === "create") {
        const fd = new FormData();
        fd.set("title", String(form.title || "").trim());
        fd.set("subtitle", String(form.subtitle || "").trim());
        fd.set("buttonText", String(form.buttonText || "").trim());
        fd.set("buttonLink", String(form.buttonLink || "").trim());
        fd.set("ownerType", form.ownerType);
        fd.set("ownerId", form.ownerId);
        if (form.ownerType === "Subcategory") fd.set("subcategoryId", form.subcategoryId);
        fd.set("sortOrder", String(Number(form.sortOrder) || 0));
        fd.set("isActive", String(Boolean(form.isActive)));
        if (form.startsAt) fd.set("startsAt", form.startsAt);
        if (form.endsAt) fd.set("endsAt", form.endsAt);
        if (form.alt) fd.set("alt", String(form.alt || "").trim());
        fd.set("image", form.file);

        await apiFetchForm(`/api/admin/banners`, { method: "POST", formData: fd });
        showToast("success", "Banner created");
      } else {
        if (!editingId) return showToast("error", "No banner selected");

        if (form.file instanceof File) {
          const fd = new FormData();
          fd.set("title", String(form.title || "").trim());
          fd.set("subtitle", String(form.subtitle || "").trim());
          fd.set("buttonText", String(form.buttonText || "").trim());
          fd.set("buttonLink", String(form.buttonLink || "").trim());
          fd.set("ownerType", form.ownerType);
          fd.set("ownerId", form.ownerId);
          if (form.ownerType === "Subcategory") fd.set("subcategoryId", form.subcategoryId);
          fd.set("sortOrder", String(Number(form.sortOrder) || 0));
          fd.set("isActive", String(Boolean(form.isActive)));
          fd.set("startsAt", form.startsAt || "");
          fd.set("endsAt", form.endsAt || "");
          fd.set("alt", String(form.alt || "").trim());
          fd.set("image", form.file);

          await apiFetchForm(`/api/admin/banners/${editingId}`, { method: "PATCH", formData: fd });
        } else {
          await apiFetchJson(`/api/admin/banners/${editingId}`, {
            method: "PATCH",
            body: JSON.stringify({
              title: String(form.title || "").trim(),
              subtitle: String(form.subtitle || "").trim(),
              buttonText: String(form.buttonText || "").trim(),
              buttonLink: String(form.buttonLink || "").trim(),
              ownerType: form.ownerType,
              ownerId: form.ownerId,
              subcategoryId: form.ownerType === "Subcategory" ? form.subcategoryId : null,
              sortOrder: Number(form.sortOrder) || 0,
              isActive: Boolean(form.isActive),
              startsAt: form.startsAt || null,
              endsAt: form.endsAt || null,
              image: {
                url: form.existingImageUrl,
                publicId: form.existingPublicId,
                alt: String(form.alt || "").trim(),
              },
            }),
          });
        }

        showToast("success", "Banner updated");
      }

      setModalOpen(false);
      await loadItems(1, { reset: true, showSpinner: true });
    } catch (e) {
      showToast("error", e.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(item) {
    const id = item?.id || item?._id;
    if (!id) return showToast("error", "Invalid banner");

    setConfirm({
      title: "Delete banner?",
      description: "This will permanently remove the banner.",
      dangerText: "Delete banner",
      onConfirm: async () => {
        try {
          setDeleting(id, true);
          await apiFetchJson(`/api/admin/banners/${id}`, { method: "DELETE" });
          setConfirmOpen(false);
          showToast("success", "Banner deleted");
          if (String(selectedId) === String(id)) setSelectedId(null);
          await loadItems(1, { reset: true, showSpinner: true });
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
    const id = item?.id || item?._id;
    if (!id) return;
    if (isToggling(id)) return;

    setToggling(id, true);
    const prev = Boolean(item.isActive);

    setItems((rows) => rows.map((x) => (String(x.id || x._id) === String(id) ? { ...x, isActive: nextActive } : x)));

    try {
      await apiFetchJson(`/api/admin/banners/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: item.title || "",
          subtitle: item.subtitle || "",
          buttonText: item.buttonText || "",
          buttonLink: item.buttonLink || "",
          ownerType: item.ownerType,
          ownerId: item.ownerId,
          subcategoryId: item.ownerType === "Subcategory" ? item.subcategoryId : null,
          sortOrder: Number(item.sortOrder) || 0,
          isActive: Boolean(nextActive),
          image: item.image,
          startsAt: item.startsAt || null,
          endsAt: item.endsAt || null,
        }),
      });

      showToast("success", nextActive ? "Banner activated" : "Banner deactivated");
    } catch (e) {
      setItems((rows) => rows.map((x) => (String(x.id || x._id) === String(id) ? { ...x, isActive: prev } : x)));
      showToast("error", e.message || "Failed to update status");
    } finally {
      setToggling(id, false);
    }
  }

  function openLandscapePreview(itemLike) {
    if (!itemLike) return;

    const prepared = {
      ...itemLike,
      ownerLabel: formatOwnerLabel(itemLike),
      image: itemLike.image || {
        url: itemLike.existingImageUrl || "",
        alt: itemLike.alt || itemLike.title || "banner",
      },
    };

    setPreviewData(prepared);
    setPreviewOpen(true);
  }

  const formPreviewBanner = useMemo(() => {
    return {
      title: form.title,
      subtitle: form.subtitle,
      buttonText: form.buttonText,
      buttonLink: form.buttonLink,
      ownerType: form.ownerType,
      ownerId: form.ownerId,
      subcategoryId: form.subcategoryId,
      ownerName:
        form.ownerType === "Brand"
          ? brands.find((b) => String(b._id || b.id) === String(form.ownerId))?.name || ""
          : categories.find((c) => String(c._id || c.id) === String(form.ownerId))?.name || "",
      subcategoryName:
        form.ownerType === "Subcategory"
          ? availableSubcategories.find((s) => String(s._id || s.id) === String(form.subcategoryId))?.name || ""
          : "",
      isActive: form.isActive,
      image: {
        url: previewUrl,
        alt: form.alt || form.title || "preview",
      },
    };
  }, [form, previewUrl, brands, categories, availableSubcategories]);

  const maxKnown = Math.max(1, cursors.length);
  const { pages: pageWindow } = buildPageWindow(page, maxKnown, Boolean(nextCursor), 5);

  const statusMeta = useMemo(() => {
    if (statusFilter === "all") return "ALL";
    if (statusFilter === "active") return "ACTIVE";
    return "INACTIVE";
  }, [statusFilter]);

  const typeMeta = useMemo(() => {
    if (ownerTypeFilter === "all") return "ALL";
    return ownerTypeFilter.toUpperCase();
  }, [ownerTypeFilter]);

  const headerScopeLabel =
    ownerTypeFilter === "all" ? "All banner targets" : `${ownerTypeFilter} banners`;

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
                    <ImageIcon className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                            Banner Images
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
                              {typeMeta}
                            </span>
                            <span className="truncate" style={{ maxWidth: 260 }}>
                              {headerScopeLabel}
                            </span>
                          </span>
                        </div>

                        <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                          Manage your banners.
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
                    await loadCategoriesAndBrands({ showSpinner: true });
                    await loadItems(1, { reset: true, showSpinner: true });
                  }}
                >
                  Refresh
                </SoftButton>

                <PrimaryButton icon={Plus} onClick={openCreate}>
                  New Banner
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
                    placeholder="Search title, subtitle, owner, button, link…"
                  />
                </Field>
              </div>

              <div className="w-full md:w-auto md:flex md:items-end md:gap-3">
                <div className="w-full md:w-[210px]">
                  <label className="grid gap-2">
                    <Label>Target type</Label>
                    <ThinSingleSelect
                      items={ownerTypeOptions}
                      value={ownerTypeFilter}
                      onChange={(id) => setOwnerTypeFilter(id || "all")}
                      disabled={loadingItems}
                      placeholder="All types"
                      metaText={typeMeta}
                      icon={Layers}
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
                      disabled={loadingItems}
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
          <div className="overflow-auto" style={{ height: "min(58vh, 620px)" }}>
            {loadingItems ? (
              <TableSkeleton rows={10} />
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
                    <th className="px-6 py-3 font-semibold">Target</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Sort</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => (
                    <BannerRow
                      key={String(item.id || item._id)}
                      item={item}
                      isSelected={Boolean(selectedId && String(selectedId) === String(item.id || item._id))}
                      onSelect={(id) => setSelectedId(id)}
                      onEdit={openEdit}
                      onDelete={confirmDelete}
                      onPreview={openLandscapePreview}
                      onToggleActive={toggleActive}
                      toggling={isToggling(item.id || item._id)}
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
                    No banners found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Adjust filters or create a new banner for category, subcategory, or brand.
                  </div>

                  <div className="mt-5 flex justify-center">
                    <PrimaryButton icon={Plus} onClick={openCreate}>
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
              <SoftButton
                disabled={!(page > 1) || loadingItems}
                icon={ChevronLeft}
                onClick={() => loadItems(Math.max(1, page - 1))}
              >
                Prev
              </SoftButton>

              <div className="flex items-center gap-2">
                {pageWindow.map((p) => {
                  const isGhostNext = p > Math.max(1, cursors.length);
                  const disabled = loadingItems || (isGhostNext && !Boolean(nextCursor));

                  return (
                    <PagePill
                      key={p}
                      active={p === page}
                      disabled={disabled}
                      onClick={() => {
                        if (isGhostNext) return loadItems(page + 1);
                        return loadItems(p);
                      }}
                    >
                      {p}
                    </PagePill>
                  );
                })}
              </div>

              <SoftButton
                disabled={!Boolean(nextCursor) || loadingItems}
                icon={ChevronRight}
                onClick={() => loadItems(page + 1)}
              >
                Next
              </SoftButton>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        title={mode === "create" ? "Create banner" : "Edit banner"}
        subtitle={
          mode === "create"
            ? "Owner type + owner + image are required."
            : "You can change banner target, schedule, image, and content."
        }
        onClose={() => (saving ? null : setModalOpen(false))}
        footer={
          <>
            <SoftButton disabled={saving} onClick={() => setModalOpen(false)}>
              Cancel
            </SoftButton>

            <SoftButton
              icon={Eye}
              disabled={loadingEdit || (!previewUrl && !form.title && !form.subtitle)}
              onClick={() => openLandscapePreview(formPreviewBanner)}
            >
              Preview banner
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
              Loading banner…
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <Label required>Target type</Label>
                <ThinSingleSelect
                  items={ownerTypeFormOptions}
                  value={form.ownerType}
                  onChange={(id) =>
                    setForm((f) => ({
                      ...f,
                      ownerType: id || "Category",
                      ownerId: "",
                      subcategoryId: "",
                    }))
                  }
                  disabled={loadingLookups}
                  placeholder="Select type…"
                  metaText="REQUIRED"
                  icon={Layers}
                  searchable={false}
                  getId={(x) => String(x?.id ?? "")}
                  getLabel={(x) => String(x?.name ?? "")}
                  showClear={false}
                  height={38}
                  itemPadY={9}
                />
              </label>

              {form.ownerType === "Brand" ? (
                <label className="grid gap-2">
                  <Label required>Brand</Label>
                  <ThinSingleSelect
                    items={brands}
                    value={form.ownerId}
                    onChange={(id) => setForm((f) => ({ ...f, ownerId: id, subcategoryId: "" }))}
                    disabled={loadingLookups}
                    placeholder="Select a brand…"
                    metaText={form.ownerId ? "SELECTED" : "REQUIRED"}
                    icon={Tag}
                    searchable
                    searchPlaceholder="Search brands…"
                    getId={(x) => String(x?._id ?? x?.id ?? "")}
                    getLabel={(x) => String(x?.name ?? "")}
                    showClear
                    height={38}
                    itemPadY={9}
                  />
                </label>
              ) : (
                <label className="grid gap-2">
                  <Label required>Category</Label>
                  <ThinSingleSelect
                    items={categories}
                    value={form.ownerId}
                    onChange={(id) => setForm((f) => ({ ...f, ownerId: id, subcategoryId: "" }))}
                    disabled={loadingLookups}
                    placeholder="Select a category…"
                    metaText={form.ownerId ? "SELECTED" : "REQUIRED"}
                    icon={LayoutGrid}
                    searchable
                    searchPlaceholder="Search categories…"
                    getId={(x) => String(x?._id ?? x?.id ?? "")}
                    getLabel={(x) => String(x?.name ?? "")}
                    showClear
                    height={38}
                    itemPadY={9}
                  />
                </label>
              )}

              {form.ownerType === "Subcategory" ? (
                <label className="grid gap-2 sm:col-span-2">
                  <Label required>Subcategory</Label>
                  <ThinSingleSelect
                    items={availableSubcategories}
                    value={form.subcategoryId}
                    onChange={(id) => setForm((f) => ({ ...f, subcategoryId: id }))}
                    disabled={!form.ownerId}
                    placeholder={form.ownerId ? "Select a subcategory…" : "Pick category first…"}
                    metaText={form.subcategoryId ? "SELECTED" : "REQUIRED"}
                    icon={Layers}
                    searchable
                    searchPlaceholder="Search subcategories…"
                    getId={(x) => String(x?._id ?? x?.id ?? "")}
                    getLabel={(x) => String(x?.name ?? "")}
                    showClear
                    height={38}
                    itemPadY={9}
                  />
                </label>
              ) : null}

              <Field label="Title" icon={Type}>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="Banner headline"
                />
              </Field>

              <Field label="Subtitle" icon={Type}>
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="Short subtitle"
                />
              </Field>

              <Field label="Button text" icon={Tag}>
                <input
                  value={form.buttonText}
                  onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="Shop now"
                />
              </Field>

              <Field label="Button link" icon={Link2}>
                <input
                  value={form.buttonLink}
                  onChange={(e) => setForm((f) => ({ ...f, buttonLink: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="/category/shoes"
                />
              </Field>

              <Field label="Sort order" icon={ChevronRight}>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
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
                  <span className="text-sm font-semibold">{form.isActive ? "Active" : "Inactive"}</span>
                  <ToggleSwitch checked={Boolean(form.isActive)} onChange={(v) => setForm((f) => ({ ...f, isActive: Boolean(v) }))} />
                </div>
              </label>

              <Field label="Start date" icon={CalendarRange}>
                <input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                />
              </Field>

              <Field label="End date" icon={CalendarRange}>
                <input
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                />
              </Field>

              <Field label="Image alt (optional)" icon={ImageIcon}>
                <input
                  value={form.alt}
                  onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: PALETTE.navy, height: 42 }}
                  placeholder="Short description"
                />
              </Field>

              <div className="grid gap-2 sm:col-span-2">
                <Label required={mode === "create"}>{mode === "create" ? "Banner image" : "Replace image (optional)"}</Label>

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
                    title="Upload banner image"
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
                  >
                    <X className="h-4 w-4" style={{ color: PALETTE.muted }} />
                  </button>
                </div>

                {mode === "create" && !(form.file instanceof File) ? (
                  <div className="text-[11px] font-semibold" style={{ color: "rgba(255,107,107,0.95)" }}>
                    Banner image is required for create.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <Label>Preview</Label>
                <SoftButton
                  icon={Eye}
                  disabled={!previewUrl && !form.title && !form.subtitle}
                  onClick={() => openLandscapePreview(formPreviewBanner)}
                >
                  Open landscape preview
                </SoftButton>
              </div>

              <div
                className="mt-2 flex items-center gap-4 rounded-3xl p-4"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  border: `1px solid rgba(2,10,25,0.06)`,
                  boxShadow: "0 10px 26px rgba(0,31,63,0.04)",
                }}
              >
                <div
                  className="h-20 w-28 overflow-hidden rounded-3xl shrink-0"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={form.alt || form.title || "preview"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center">
                      <ImageIcon className="h-5 w-5" style={{ color: PALETTE.muted }} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold truncate" style={{ color: PALETTE.navy }}>
                    {form.title || "Banner title"}
                  </div>
                  <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                    {form.subtitle || "Banner subtitle"}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                      style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                    >
                      <Layers className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
                      <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                        {form.ownerType}
                      </div>
                    </div>

                    {form.buttonText ? (
                      <div
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                        style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                      >
                        <Tag className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
                        <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                          {form.buttonText}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="ml-auto text-[11px] font-semibold text-right" style={{ color: PALETTE.muted }}>
                  <div>{form.ownerId ? "TARGET OK" : "TARGET REQUIRED"}</div>
                  <div>
                    {mode === "create"
                      ? form.file
                        ? "READY"
                        : "IMAGE REQUIRED"
                      : form.file
                      ? "IMAGE WILL REPLACE"
                      : "KEEPING CURRENT"}
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

      <LandscapePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        banner={previewData}
      />
    </main>
  );
}