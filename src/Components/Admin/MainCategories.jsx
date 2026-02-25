// app/admin/categories/page.jsx
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
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

/**
 * Admin Categories CRUD UI (Premium)
 *
 * Requested updates (final):
 * ✅ Keep header card design as it was (separate from table card)
 * ✅ Table card remains separate
 * ✅ Use react-hot-toast with a matte-finish style (remove custom Toast component)
 * ✅ Increase "Categories" header size slightly
 * ✅ Fix modal "double blur" feel: overlay no blur (just dim). Only modal/backdrop area dims once.
 *
 * API:
 * - /api/admin/categories?cursor=&limit=
 * - /api/admin/categories/[id]
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

async function apiFetch(path, opts = {}) {
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
          {/* FIX: no backdropFilter blur here -> avoids "double blur" */}
          <div className="absolute inset-0" style={{ background: "rgba(11,27,51,0.18)" }} onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="relative w-full max-w-2xl overflow-hidden"
            style={{
              borderRadius: 28,
              background: "rgba(255,255,255,0.98)",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 28px 80px rgba(0,31,63,0.16)",
            }}
          >
            <div className="flex items-start justify-between gap-4 p-6">
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
            <div className="p-6">{children}</div>

            {footer ? (
              <>
                <Divider />
                <div className="flex flex-wrap items-center justify-end gap-3 p-6">{footer}</div>
              </>
            ) : null}
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
        <Shimmer className="col-span-5 h-5 rounded-xl" />
        <Shimmer className="col-span-3 h-5 rounded-xl" />
        <Shimmer className="col-span-2 h-5 rounded-xl" />
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
            <div className="col-span-5 flex items-center gap-3">
              <Shimmer className="h-9 w-9 rounded-2xl" style={{ border: "none" }} />
              <div className="flex-1 grid gap-2">
                <Shimmer className="h-4 rounded-xl" style={{ width: "58%", border: "none" }} />
                <Shimmer className="h-3 rounded-xl" style={{ width: "40%", border: "none" }} />
              </div>
            </div>

            <div className="col-span-3 flex justify-start">
              <Shimmer className="h-7 rounded-full" style={{ width: 120, border: "none" }} />
            </div>

            <div className="col-span-2">
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

/* ------------------------------ Table Row ------------------------------ */

const CategoryRow = React.memo(function CategoryRow({
  c,
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
      onClick={() => onSelect(c._id)}
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
            <LayoutGrid className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </div>

          <div className="min-w-0">
            <div className="font-semibold leading-snug" style={{ color: PALETTE.navy }}>
              {c.name}
            </div>
            <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
              {c.slug ? `/${c.slug}` : "—"}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-middle">
        <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-3">
          <ToggleSwitch checked={Boolean(c.isActive)} disabled={toggling} onChange={(next) => onToggleActive(c, next)} />
          <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
            {Boolean(c.isActive) ? "Active" : "Inactive"}
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
          {Number(c.sortOrder) || 0}
        </span>
      </td>

      <td className="px-6 py-4 align-middle">
        <div className="flex justify-end gap-2">
          <IconBtn
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(c);
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
              onDelete(c);
            }}
          >
            <Trash2 className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </IconBtn>
        </div>
      </td>
    </tr>
  );
});

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

/* -------------------------------- Page --------------------------------- */

export default function AdminCategoriesPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  const PAGE_SIZE = 25;

  const [catItems, setCatItems] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [cursors, setCursors] = useState([null]); // page1 cursor always null
  const [nextCursor, setNextCursor] = useState(null);

  const [catSearch, setCatSearch] = useState("");
  const debouncedSearch = useDebouncedValue(catSearch, 220);
  const [statusFilter, setStatusFilter] = useState("all"); // all|active|inactive

  const [selectedCategory, setSelectedCategory] = useState(null);
  const selectedCategoryId = selectedCategory?._id || selectedCategory?.id;

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catMode, setCatMode] = useState("create");
  const [catEditingId, setCatEditingId] = useState(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", sortOrder: 0, isActive: true });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirm, setConfirm] = useState({
    title: "",
    description: "",
    dangerText: "Delete",
    onConfirm: async () => {},
  });

  const selectReqIdRef = useRef(0);

  // row-action loading trackers (toggle / delete)
  const togglingIdsRef = useRef(new Set());
  const deletingIdsRef = useRef(new Set());
  const [, force] = useState(0);
  const bump = () => force((x) => x + 1);

  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

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

  // matte-finish toast
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

  const catFiltered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = catItems;

    if (statusFilter !== "all") {
      const want = statusFilter === "active";
      list = list.filter((c) => Boolean(c.isActive) === want);
    }

    if (!q) return list;

    return list.filter((c) => {
      const name = String(c.name || "").toLowerCase();
      const slug = String(c.slug || "").toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [catItems, debouncedSearch, statusFilter]);

  const headerStats = useMemo(() => {
    const total = catItems.length;
    const active = catItems.filter((x) => Boolean(x.isActive)).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [catItems]);

  async function loadCategoriesByPage(targetPage = 1, { reset = false, showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setCatLoading(true);

    try {
      if (reset) {
        setPage(1);
        setCursors([null]);
        targetPage = 1;
      }

      const cursor = cursors[targetPage - 1] ?? null;

      const qs = new URLSearchParams();
      if (cursor) qs.set("cursor", cursor);
      qs.set("limit", String(PAGE_SIZE));

      const data = await apiFetch(`/api/admin/categories?${qs.toString()}`);

      const items = Array.isArray(data.items) ? data.items : [];
      const nxc = data.nextCursor || null;

      setCatItems(items);
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
      else showToast("error", e.message || "Failed to load categories");
    } finally {
      setCatLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  async function loadCategoryById(id) {
    if (!id) return;

    setSelectedCategory((prev) => {
      const already = prev?._id === id || prev?.id === id;
      if (already) return prev;
      return { _id: id };
    });

    const reqId = ++selectReqIdRef.current;

    try {
      const data = await apiFetch(`/api/admin/categories/${id}`);
      if (reqId !== selectReqIdRef.current) return;
      setSelectedCategory(data.item || null);
    } catch (e) {
      if (reqId !== selectReqIdRef.current) return;
      showToast("error", e.message || "Failed to load category");
    }
  }

  useEffect(() => {
    loadCategoriesByPage(1, { reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreateCategory() {
    setCatMode("create");
    setCatEditingId(null);
    setCatForm({ name: "", slug: "", sortOrder: 0, isActive: true });
    setCatModalOpen(true);
  }

  function openEditCategory(cat) {
    setCatMode("edit");
    setCatEditingId(String(cat?._id || cat?.id || ""));
    setCatForm({
      name: cat?.name || "",
      slug: cat?.slug || "",
      sortOrder: Number(cat?.sortOrder) || 0,
      isActive: Boolean(cat?.isActive),
    });
    setCatModalOpen(true);
  }

  async function submitCategory() {
    const name = String(catForm.name || "").trim();
    const slug = String(catForm.slug || "").trim();
    if (!name) return showToast("error", "Category name is required");

    const payload = {
      name,
      slug: slug || undefined,
      sortOrder: Number(catForm.sortOrder) || 0,
      isActive: Boolean(catForm.isActive),
    };

    const isCreate = catMode === "create";
    setSaving(true);
    if (isCreate) setCreating(true);

    try {
      if (isCreate) {
        await apiFetch(`/api/admin/categories`, { method: "POST", body: JSON.stringify(payload) });
        showToast("success", "Category created");
      } else {
        const id = catEditingId || selectedCategoryId;
        if (!id) return showToast("error", "No category selected");
        await apiFetch(`/api/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) });
        showToast("success", "Category updated");
      }

      setCatModalOpen(false);
      await loadCategoriesByPage(1, { reset: true, showSpinner: true });

      const editedId = catEditingId || selectedCategoryId;
      if (!isCreate && editedId && String(editedId) === String(selectedCategoryId)) {
        await loadCategoryById(editedId);
      }
    } catch (e) {
      showToast("error", e.message || "Failed to save category");
    } finally {
      setSaving(false);
      setCreating(false);
    }
  }

  function confirmDeleteCategory(cat) {
    const id = cat?._id || cat?.id;
    if (!id) return showToast("error", "Invalid category");

    setConfirm({
      title: "Delete category?",
      description: "This will permanently remove the category.",
      dangerText: "Delete category",
      onConfirm: async () => {
        try {
          setDeleting(id, true);
          await apiFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
          setConfirmOpen(false);
          showToast("success", "Category deleted");
          if (String(selectedCategoryId) === String(id)) setSelectedCategory(null);
          await loadCategoriesByPage(1, { reset: true, showSpinner: true });
        } catch (e) {
          showToast("error", e.message || "Failed to delete category");
        } finally {
          setDeleting(id, false);
        }
      },
    });
    setConfirmOpen(true);
  }

  async function toggleCategoryActive(cat, nextActive) {
    const id = cat?._id || cat?.id;
    if (!id) return;
    if (isToggling(id)) return;

    setToggling(id, true);

    const prev = Boolean(cat.isActive);
    setCatItems((items) => items.map((x) => (String(x._id) === String(id) ? { ...x, isActive: nextActive } : x)));

    try {
      await apiFetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: cat.name,
          slug: cat.slug || undefined,
          sortOrder: Number(cat.sortOrder) || 0,
          isActive: Boolean(nextActive),
        }),
      });

      showToast("success", nextActive ? "Category activated" : "Category deactivated");

      if (String(selectedCategoryId) === String(id)) {
        setSelectedCategory((sc) => (sc ? { ...sc, isActive: nextActive } : sc));
      }
    } catch (e) {
      setCatItems((items) => items.map((x) => (String(x._id) === String(id) ? { ...x, isActive: prev } : x)));
      showToast("error", e.message || "Failed to update status");
    } finally {
      setToggling(id, false);
    }
  }

  const canPrev = page > 1 && !catLoading;
  const canNext = Boolean(nextCursor) && !catLoading;

  const maxKnown = Math.max(1, cursors.length);
  const { pages: pageWindow, maxKnown: maxKnownOut } = buildPageWindow(page, maxKnown, Boolean(nextCursor), 5);

  return (
    <main className="w-full" style={{ background: PALETTE.bg, color: PALETTE.navy }}>
      {/* react-hot-toast */}
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

      {/* Header (separate card, as original) */}
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
                    <LayoutGrid className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      {/* slightly bigger */}
                      <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                        Categories
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
                      Create, update, toggle status, and delete categories.
                    </div>
                  </div>
                </div>

                {/* micro-stats */}
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
                  onClick={() => loadCategoriesByPage(1, { reset: true, showSpinner: true })}
                >
                  Refresh
                </SoftButton>

                <PrimaryButton icon={Plus} onClick={openCreateCategory}>
                  New Category
                </PrimaryButton>
              </div>
            </div>

            {/* Search/Filter row */}
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
              <div className="md:col-span-8">
                <Field label="Search" icon={Search}>
                  <input
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                    placeholder="Search by name or slug…"
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

      {/* Table Card (separate) */}
      <div className="mx-auto max-w-screen-xl px-5 pb-10 md:px-10 lg:px-12">
        <Card>
          <div className="overflow-auto" style={{ height: "min(58vh, 600px)" }}>
            {catLoading ? (
              <TableSkeleton rows={10} />
            ) : catFiltered.length ? (
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
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Sort</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {catFiltered.map((c) => (
                    <CategoryRow
                      key={String(c._id)}
                      c={c}
                      isSelected={Boolean(selectedCategoryId && String(selectedCategoryId) === String(c._id))}
                      onSelect={loadCategoryById}
                      onEdit={openEditCategory}
                      onDelete={confirmDeleteCategory}
                      onToggleActive={toggleCategoryActive}
                      toggling={isToggling(c._id)}
                      deleting={isDeleting(c._id)}
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
                    No categories found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Adjust search or status filter, or create a new category.
                  </div>

                  <div className="mt-5 flex justify-center">
                    <PrimaryButton icon={Plus} onClick={openCreateCategory}>
                      New Category
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* Footer: pagination on RIGHT */}
          <div className="flex items-center justify-between p-4">
            <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              Page <span style={{ color: PALETTE.navy, fontWeight: 800 }}>{page}</span>
            </div>

            <div className="flex items-center gap-2">
              <SoftButton disabled={!canPrev} icon={ChevronLeft} onClick={() => loadCategoriesByPage(Math.max(1, page - 1))}>
                Prev
              </SoftButton>

              <div className="flex items-center gap-2">
                {pageWindow.map((p) => {
                  const isGhostNext = p > maxKnownOut;
                  const disabled = catLoading || (isGhostNext && !canNext);

                  return (
                    <PagePill
                      key={p}
                      active={p === page}
                      disabled={disabled}
                      onClick={() => {
                        if (isGhostNext) return loadCategoriesByPage(page + 1);
                        return loadCategoriesByPage(p);
                      }}
                    >
                      {p}
                    </PagePill>
                  );
                })}
              </div>

              <SoftButton disabled={!canNext} icon={ChevronRight} onClick={() => loadCategoriesByPage(page + 1)}>
                Next
              </SoftButton>
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------------- Modals ------------------------------- */}

      <Modal
        open={catModalOpen}
        title={catMode === "create" ? "Create category" : "Edit category"}
        subtitle="Name is required. Slug is optional (auto-friendly)."
        onClose={() => (saving ? null : setCatModalOpen(false))}
        footer={
          <>
            <SoftButton disabled={saving} onClick={() => setCatModalOpen(false)}>
              Cancel
            </SoftButton>
            <PrimaryButton loading={saving} onClick={submitCategory}>
              {catMode === "create" ? "Create" : "Save changes"}
            </PrimaryButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" icon={LayoutGrid}>
            <input
              value={catForm.name}
              onChange={(e) => {
                const v = e.target.value;
                setCatForm((f) => ({ ...f, name: v, slug: f.slug ? f.slug : slugify(v) }));
              }}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="e.g. Electronics"
            />
          </Field>

          <Field label="Slug (optional)" icon={ArrowRight}>
            <input
              value={catForm.slug}
              onChange={(e) => setCatForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="e.g. electronics"
            />
          </Field>

          <Field label="Sort order" icon={ChevronRight}>
            <input
              type="number"
              value={catForm.sortOrder}
              onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: e.target.value }))}
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
              <span className="text-sm font-semibold">{catForm.isActive ? "Active" : "Inactive"}</span>
              <ToggleSwitch
                checked={Boolean(catForm.isActive)}
                onChange={(v) => setCatForm((f) => ({ ...f, isActive: Boolean(v) }))}
              />
            </div>
          </label>
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