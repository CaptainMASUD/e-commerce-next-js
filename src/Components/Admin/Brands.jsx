"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Search,
  X,
  Trash2,
  Pencil,
  RefreshCcw,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  SlidersHorizontal,
  Tag,
  Sparkles,
  GripVertical,
  ChevronDown,
  Upload,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

const cx = (...c) => c.filter(Boolean).join(" ");

const PALETTE = {
  navy: "#001f3f",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  bg: "#ffffff",
  card: "#ffffff",
  muted: "rgba(0,31,63,0.62)",
  border: "rgba(2, 10, 25, 0.10)",
  soft: "rgba(0,31,63,0.04)",
  soft2: "rgba(0,31,63,0.06)",
};

function getAuth() {
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const rawUser = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function isAdminUser(user) {
  return Boolean(user && (user.role === "admin" || user.isAdmin === true));
}

function parseApiError(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (typeof data.details === "string") return data.details;
  if (typeof data.message === "string") return data.message;
  return fallback;
}

function useDebouncedValue(value, delay = 220) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function slugify(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqStrings(arr = []) {
  const seen = new Set();
  const out = [];
  for (const x of arr || []) {
    const s = String(x || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

const modalAnim = {
  initial: { opacity: 0, y: 10, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.985 },
  transition: { type: "spring", stiffness: 360, damping: 28, mass: 0.8 },
};

const rowAnim = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.18 },
};

/* -------------------------- Toggle (same as Categories) -------------------------- */

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

/* -------------------------------- UI -------------------------------- */

function ModalShell({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" onClick={onClose} style={{ background: "rgba(0,0,0,0.38)" }} />

          <motion.div
            {...modalAnim}
            className="relative w-full max-w-3xl overflow-hidden"
            style={{
              borderRadius: 26,
              background: "rgba(255,255,255,0.98)",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 30px 90px rgba(0,31,63,0.25)",
              willChange: "transform",
            }}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5">
              <div className="min-w-0">
                <div className="text-lg font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                  {title}
                </div>
                {subtitle ? (
                  <div className="mt-1 text-xs font-medium" style={{ color: PALETTE.muted }}>
                    {subtitle}
                  </div>
                ) : null}
              </div>

              <button
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-2xl transition hover:opacity-90 cursor-pointer"
                style={{ background: "rgba(0,31,63,0.04)", border: `1px solid ${PALETTE.border}` }}
                aria-label="Close modal"
              >
                <X className="h-4 w-4" style={{ color: PALETTE.navy }} />
              </button>
            </div>

            {/* ✅ Mobile-friendly height */}
            <div className="px-6 pb-6 overflow-auto" style={{ maxHeight: "68vh" }}>
              {children}
            </div>

            {footer ? (
              <div
                className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: PALETTE.border, background: "rgba(0,31,63,0.02)" }}
              >
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Pill({ icon: Icon, children }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.muted,
        boxShadow: "0 10px 25px rgba(0,31,63,.06)",
      }}
    >
      <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
      {children}
    </div>
  );
}

function PrimaryButton({ children, disabled, className, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cx(
        "group relative overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold text-white",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer active:scale-[0.99]",
        className
      )}
      style={{
        background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
        boxShadow: "0 18px 40px rgba(0,31,63,.18)",
      }}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.navy}, ${PALETTE.gold})`,
            opacity: 0.42,
          }}
        />
      </span>
      <span className="relative inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

function SoftButton({ children, className, disabled, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-95 active:scale-[0.99]",
        className
      )}
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
        boxShadow: "0 12px 30px rgba(0,31,63,.06)",
      }}
    >
      {children}
    </button>
  );
}

function DangerButton({ children, className, disabled, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-95 active:scale-[0.99]",
        className
      )}
      style={{
        background: "rgba(255,107,107,0.10)",
        border: "1px solid rgba(255,107,107,0.25)",
        color: PALETTE.navy,
      }}
    >
      {children}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div
      className="grid grid-cols-12 gap-3 rounded-2xl p-4"
      style={{ background: "rgba(0,31,63,0.02)", border: `1px solid ${PALETTE.border}` }}
    >
      <div className="col-span-5 h-4 animate-pulse rounded bg-black/10" />
      <div className="col-span-3 h-4 animate-pulse rounded bg-black/10" />
      <div className="col-span-2 h-4 animate-pulse rounded bg-black/10" />
      <div className="col-span-2 h-4 animate-pulse rounded bg-black/10" />
    </div>
  );
}

function CategoryMultiSelect({ items = [], value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 160);

  const getId = (x) => String(x?._id ?? x?.id ?? x ?? "").trim();

  const itemsById = useMemo(() => {
    const m = new Map();
    for (const c of items || []) {
      const id = getId(c);
      if (!id) continue;
      m.set(id, c);
    }
    return m;
  }, [items]);

  const selectedIds = useMemo(() => uniqStrings((value || []).map(getId)), [value]);

  const filtered = useMemo(() => {
    const s = dq.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => (x.name || "").toLowerCase().includes(s));
  }, [items, dq]);

  const toggle = (id) => {
    const sid = getId(id);
    if (!sid) return;
    const has = selectedIds.includes(sid);
    const next = has ? selectedIds.filter((x) => x !== sid) : [...selectedIds, sid];
    onChange?.(next);
  };

  const remove = (id) => {
    const sid = getId(id);
    onChange?.(selectedIds.filter((x) => x !== sid));
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-2xl px-3 py-3 text-left text-sm font-medium cursor-pointer"
        style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
      >
        {selectedIds.length ? `${selectedIds.length} selected` : "Select categories…"}
      </button>

      {selectedIds.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const name = itemsById.get(id)?.name || id.slice(-6);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium"
                style={{
                  background: "rgba(0,31,63,0.04)",
                  border: `1px solid ${PALETTE.border}`,
                  color: PALETTE.navy,
                }}
                title={id}
              >
                {name}
                <button type="button" className="cursor-pointer hover:opacity-90" onClick={() => remove(id)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-3 overflow-hidden rounded-3xl"
            style={{ background: "#fff", border: `1px solid ${PALETTE.border}` }}
          >
            <div className="flex items-center gap-2 px-3 py-3" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
              <Search className="h-4 w-4" style={{ color: PALETTE.muted }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search categories…"
                className="w-full bg-transparent text-sm font-medium outline-none"
                style={{ color: PALETTE.navy }}
              />
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl cursor-pointer hover:opacity-90"
              >
                <X className="h-4 w-4" style={{ color: PALETTE.muted }} />
              </button>
            </div>

            <div className="p-2 overflow-auto" style={{ maxHeight: 260 }}>
              {filtered.length === 0 ? (
                <div className="p-3 text-xs font-medium" style={{ color: PALETTE.muted }}>
                  No categories found.
                </div>
              ) : (
                filtered.map((c) => {
                  const id = getId(c);
                  const checked = selectedIds.includes(id);

                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => toggle(id)}
                      className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium cursor-pointer hover:opacity-95"
                      style={{
                        background: checked ? "rgba(255,126,105,0.10)" : "transparent",
                        color: PALETTE.navy,
                      }}
                    >
                      <span className="truncate">{c.name}</span>
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium"
                        style={{
                          background: checked ? "rgba(34,197,94,0.14)" : "rgba(0,31,63,0.04)",
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

function Dropzone({ disabled, previewUrl, existingUrl, hint, errorText, onPickFile, onOpenPicker, onClear }) {
  const [isOver, setIsOver] = useState(false);

  const onDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsOver(true);
  };

  const onDragLeave = () => setIsOver(false);

  const onDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsOver(false);
    const file = e.dataTransfer?.files?.[0] || null;
    if (file) onPickFile?.(file);
  };

  const hasImage = Boolean(previewUrl || existingUrl);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="rounded-3xl p-4"
      style={{ background: "rgba(0,31,63,0.02)", border: `1px solid ${PALETTE.border}` }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold" style={{ color: PALETTE.navy }}>
          Brand logo
        </div>

        <div className="flex items-center gap-2">
          {hasImage ? (
            <SoftButton className="px-3 py-2" onClick={onClear} disabled={disabled}>
              <Trash2 className="h-4 w-4" />
              Clear
            </SoftButton>
          ) : null}

          <SoftButton className="px-3 py-2" onClick={onOpenPicker} disabled={disabled}>
            <Upload className="h-4 w-4" />
            Choose
          </SoftButton>
        </div>
      </div>

      <div
        className="mt-4 grid place-items-center overflow-hidden rounded-3xl"
        style={{
          background: "#fff",
          border: `1px solid ${PALETTE.border}`,
          height: 240,
          outline: isOver ? "2px solid rgba(255,126,105,0.55)" : "none",
          boxShadow: isOver ? "0 16px 44px rgba(255,126,105,0.10)" : "none",
          transition: "outline 160ms ease, box-shadow 160ms ease",
        }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
        ) : existingUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={existingUrl} alt="brand" className="h-full w-full object-cover" />
        ) : (
          <div className="grid place-items-center gap-2 text-center px-6">
            <div
              className="grid h-12 w-12 place-items-center rounded-3xl"
              style={{ background: "rgba(255,126,105,0.10)", border: `1px solid ${PALETTE.border}` }}
            >
              <GripVertical className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </div>
            <div className="text-sm font-semibold" style={{ color: PALETTE.navy }}>
              Drag & drop an image
            </div>
            <div className="text-xs font-medium" style={{ color: PALETTE.muted }}>
              or click <span style={{ color: PALETTE.navy }}>Choose</span> to upload
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs font-medium" style={{ color: PALETTE.muted }}>
          {hint}
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          PNG/JPG/WebP
        </div>
      </div>

      {errorText ? (
        <div className="mt-3 text-xs font-medium" style={{ color: "rgba(255,107,107,0.95)" }}>
          {errorText}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------- Page -------------------------------- */

export default function Brands() {
  const router = useRouter();
  const { token, user } = useMemo(() => getAuth(), []);
  const isAdmin = isAdminUser(user);

  useEffect(() => {
    if (!token) router.push("/login");
    else if (!isAdmin) router.push("/");
  }, [token, isAdmin, router]);

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  const [pageInfo, setPageInfo] = useState({ limit: 20, hasNextPage: false, nextCursor: null });

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("active");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const dSearch = useDebouncedValue(search, 220);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState("");
  const [togglingId, setTogglingId] = useState(""); // ✅ same pattern as categories

  const fileRef = useRef(null);
  const sentinelRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    sortOrder: 0,
    isActive: true,
    alt: "",
    categoryIds: [],
    imageFile: null,
    imagePreview: "",
    existingImageUrl: "",
  });

  const toastBase = useMemo(
    () => ({
      duration: 3200,
      style: {
        background: "rgba(255,255,255,0.92)",
        color: PALETTE.navy,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 18px 50px rgba(0,31,63,0.14)",
        borderRadius: 18,
        padding: "12px 14px",
        backdropFilter: "blur(10px)",
      },
    }),
    []
  );

  const showToast = (type, msg) => {
    if (!msg) return;
    if (type === "success") return toast.success(msg, toastBase);
    if (type === "error")
      return toast.error(msg, {
        ...toastBase,
        style: {
          ...toastBase.style,
          background: "rgba(255,107,107,0.10)",
          border: "1px solid rgba(255,107,107,0.22)",
        },
      });
    return toast(msg, toastBase);
  };

  const categoriesById = useMemo(() => {
    const m = new Map();
    for (const c of categories || []) {
      const id = String(c._id || c.id);
      m.set(id, c);
    }
    return m;
  }, [categories]);

  async function fetchCategories() {
    try {
      setLoadingCats(true);
      const url = new URL(window.location.origin + "/api/admin/categories");
      url.searchParams.set("status", "active");
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString(), { headers: { ...authHeaders } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, "Failed to load categories"));
      setCategories(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setCategories([]);
      showToast("error", e.message || "Failed to load categories");
    } finally {
      setLoadingCats(false);
    }
  }

  function dedupeById(list) {
    const seen = new Set();
    const out = [];
    for (const item of list) {
      const id = String(item?._id || item?.id || "");
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(item);
    }
    return out;
  }

  async function fetchBrands({ reset = false } = {}) {
    try {
      setError("");

      if (reset) {
        setLoadingList(true);
        setBrands([]);
        setPageInfo((p) => ({ ...p, hasNextPage: false, nextCursor: null }));
      } else {
        if (!pageInfo?.hasNextPage || !pageInfo?.nextCursor) return;
        if (loadingMore || loadingList) return;
        setLoadingMore(true);
      }

      const url = new URL(window.location.origin + "/api/admin/brands");

      if (status) url.searchParams.set("status", status);
      if (categoryFilter) url.searchParams.set("categoryId", categoryFilter);

      const limit = pageInfo?.limit || 20;
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("fields", "name,slug,image,categoryIds,sortOrder,isActive");

      if (!reset && pageInfo?.nextCursor) {
        url.searchParams.set("afterSortOrder", String(pageInfo.nextCursor.afterSortOrder));
        url.searchParams.set("afterId", String(pageInfo.nextCursor.afterId));
      }

      const res = await fetch(url.toString(), { headers: { ...authHeaders } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, "Failed to load brands"));

      const incoming = Array.isArray(data?.items) ? data.items : [];
      const pi = data?.pageInfo || null;

      setBrands((prev) => (reset ? incoming : dedupeById([...prev, ...incoming])));
      setPageInfo((prev) => ({
        limit: Number(pi?.limit || prev.limit || 20),
        hasNextPage: Boolean(pi?.hasNextPage),
        nextCursor: pi?.nextCursor || null,
      }));
    } catch (e) {
      if (reset) setBrands([]);
      setError(e.message || "Failed to load brands");
    } finally {
      setLoadingList(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!token || !isAdmin) return;
    fetchCategories();
    fetchBrands({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    fetchBrands({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, categoryFilter]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;
        if (!pageInfo?.hasNextPage) return;
        if (loadingList || loadingMore) return;
        fetchBrands({ reset: false });
      },
      { root: null, rootMargin: "240px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageInfo?.hasNextPage, pageInfo?.nextCursor, loadingList, loadingMore]);

  const filteredBrands = useMemo(() => {
    const s = dSearch.trim().toLowerCase();
    if (!s) return brands;
    return brands.filter((b) => {
      const n = (b.name || "").toLowerCase();
      const sl = (b.slug || "").toLowerCase();
      return n.includes(s) || sl.includes(s);
    });
  }, [brands, dSearch]);

  const canSave = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!Array.isArray(form.categoryIds) || form.categoryIds.length === 0) return false;
    if (!editing && !form.imageFile) return false;
    return !saving;
  }, [form, editing, saving]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      slug: "",
      sortOrder: 0,
      isActive: true,
      alt: "",
      categoryIds: [],
      imageFile: null,
      imagePreview: "",
      existingImageUrl: "",
    });
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      name: b?.name || "",
      slug: b?.slug || "",
      sortOrder: Number(b?.sortOrder || 0),
      isActive: Boolean(b?.isActive ?? true),
      alt: b?.image?.alt || "",
      categoryIds: uniqStrings((b?.categoryIds || []).map(String)),
      imageFile: null,
      imagePreview: "",
      existingImageUrl: b?.image?.url || "",
    });
    setModalOpen(true);
  };

  const onPickFile = (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      showToast("error", "Please upload a valid image file.");
      return;
    }
    const url = URL.createObjectURL(file);
    setForm((p) => ({ ...p, imageFile: file, imagePreview: url }));
  };

  const clearPickedFile = () => {
    setForm((p) => {
      if (p.imagePreview) URL.revokeObjectURL(p.imagePreview);
      return { ...p, imageFile: null, imagePreview: "" };
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  async function saveBrand() {
    try {
      setSaving(true);

      const isEdit = Boolean(editing?._id || editing?.id);
      const id = editing?._id || editing?.id;

      const fd = new FormData();
      fd.set("name", form.name.trim());
      if (form.slug.trim()) fd.set("slug", slugify(form.slug.trim()));
      fd.set("sortOrder", String(Number(form.sortOrder || 0)));
      fd.set("isActive", String(Boolean(form.isActive)));
      fd.set("alt", form.alt.trim());
      fd.set("categoryIds", JSON.stringify(uniqStrings(form.categoryIds)));
      if (form.imageFile) fd.set("image", form.imageFile);

      const res = await fetch(isEdit ? `/api/admin/brands/${id}` : "/api/admin/brands", {
        method: isEdit ? "PUT" : "POST",
        headers: { ...authHeaders },
        body: fd,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, isEdit ? "Update failed" : "Create failed"));

      showToast("success", isEdit ? "Brand updated" : "Brand created");
      setModalOpen(false);
      setEditing(null);
      await fetchBrands({ reset: true });
    } catch (e) {
      showToast("error", e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand(id) {
    if (!id) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/brands/${id}`, { method: "DELETE", headers: { ...authHeaders } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, "Delete failed"));
      showToast("success", "Brand deleted");
      await fetchBrands({ reset: true });
    } catch (e) {
      showToast("error", e.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  }

  // ✅ Active toggle like Categories: instant UI update + API PUT (multipart)
  async function toggleBrandActive(b, nextActive) {
    const id = b?._id || b?.id;
    if (!id) return;
    if (togglingId === String(id)) return;

    setTogglingId(String(id));

    const prev = Boolean(b?.isActive);
    setBrands((items) => items.map((x) => (String(x._id || x.id) === String(id) ? { ...x, isActive: nextActive } : x)));

    try {
      const fd = new FormData();
      fd.set("isActive", String(Boolean(nextActive)));

      const res = await fetch(`/api/admin/brands/${id}`, {
        method: "PUT",
        headers: { ...authHeaders },
        body: fd,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, "Failed to update status"));

      showToast("success", nextActive ? "Brand activated" : "Brand deactivated");
    } catch (e) {
      setBrands((items) => items.map((x) => (String(x._id || x.id) === String(id) ? { ...x, isActive: prev } : x)));
      showToast("error", e.message || "Failed to update status");
    } finally {
      setTogglingId("");
    }
  }

  if (!token) return null;

  if (!isAdmin) {
    return (
      <main className="min-h-[60vh] grid place-items-center px-5" style={{ background: PALETTE.bg }}>
        <div
          className="max-w-md w-full rounded-3xl p-6"
          style={{
            background: "rgba(255,255,255,0.96)",
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 24px 70px rgba(0,31,63,0.14)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl"
              style={{ background: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.25)" }}
            >
              <ShieldAlert className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </div>
            <div>
              <div className="text-lg font-semibold" style={{ color: PALETTE.navy }}>
                Access denied
              </div>
              <div className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                Your account does not have admin privileges.
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const shownCount = filteredBrands.length;

  return (
    <main className="w-full" style={{ background: PALETTE.bg, color: PALETTE.navy }}>
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
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#ffffff" } },
          error: { iconTheme: { primary: "#ff6b6b", secondary: "#ffffff" } },
        }}
      />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-20 -top-20 h-[340px] w-[340px] rounded-full blur-3xl" style={{ background: "rgba(255,126,105,0.10)" }} />
        <div className="absolute right-[-140px] top-[120px] h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: "rgba(0,31,63,0.06)" }} />
      </div>

      <div className="mx-auto max-w-screen-2xl px-5 py-6 md:px-10 md:py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill icon={Tag}>Brands</Pill>
              <Pill icon={SlidersHorizontal}>Manage</Pill>
              <Pill icon={Sparkles}>Premium</Pill>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: PALETTE.navy }}>
              Brand Management
            </h1>

            <p className="mt-2 text-sm font-medium" style={{ color: PALETTE.muted }}>
              Add new brands, edit details, toggle active status, connect categories, and upload logos.
            </p>

            <div className="mt-2">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
              >
                {loadingList ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading brands…
                  </>
                ) : (
                  <>
                    Showing {shownCount} brand{shownCount === 1 ? "" : "s"}
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SoftButton onClick={() => fetchBrands({ reset: true })} disabled={loadingList || loadingMore}>
              {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Refresh
            </SoftButton>

            <PrimaryButton onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New brand
            </PrimaryButton>
          </div>
        </div>

        {/* toolbar */}
        <div
          className="mt-6 grid gap-3 rounded-3xl p-4 md:grid-cols-12"
          style={{
            background: "rgba(255,255,255,0.96)",
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 18px 46px rgba(0,31,63,0.08)",
          }}
        >
          <div className="md:col-span-5">
            <div className="flex h-12 items-center gap-2 rounded-2xl px-3" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, cursor: "text" }}>
              <Search className="h-4 w-4" style={{ color: PALETTE.muted }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brands…"
                className="w-full bg-transparent text-sm font-medium outline-none"
                style={{ color: PALETTE.navy }}
              />
              {search ? (
                <button onClick={() => setSearch("")} className="grid h-9 w-9 place-items-center rounded-xl hover:opacity-90" style={{ cursor: "pointer" }}>
                  <X className="h-4 w-4" style={{ color: PALETTE.muted }} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="md:col-span-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
              style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy, cursor: "pointer" }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
              style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy, cursor: "pointer" }}
            >
              <option value="">All categories</option>
              {(categories || []).map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* list */}
        <div className="mt-5">
          {error ? (
            <div className="rounded-3xl px-5 py-4 text-sm font-medium" style={{ background: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.25)", color: PALETTE.navy }}>
              {error}
            </div>
          ) : null}

          <div
            className="mt-4 overflow-hidden rounded-3xl"
            style={{ background: "rgba(255,255,255,0.96)", border: `1px solid ${PALETTE.border}`, boxShadow: "0 18px 46px rgba(0,31,63,0.08)" }}
          >
            <div className="grid grid-cols-12 gap-3 px-5 py-4 text-xs font-medium" style={{ color: PALETTE.muted }}>
              <div className="col-span-5">Brand</div>
              <div className="col-span-3">Categories</div>
              <div className="col-span-2">Active</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="grid gap-3 px-5 pb-5">
              {loadingList ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : filteredBrands.length === 0 ? (
                <div className="rounded-2xl p-6 text-sm font-medium" style={{ color: PALETTE.muted }}>
                  No brands found.
                </div>
              ) : (
                filteredBrands.map((b) => {
                  const id = b._id || b.id;
                  const img = b?.image?.url;

                  const isToggling = togglingId === String(id);

                  return (
                    <motion.div
                      key={id}
                      layout
                      {...rowAnim}
                      className="grid grid-cols-12 items-center gap-3 rounded-2xl p-4"
                      style={{ background: "rgba(0,31,63,0.02)", border: `1px solid ${PALETTE.border}`, boxShadow: "0 10px 22px rgba(0,31,63,0.04)" }}
                    >
                      <div className="col-span-12 md:col-span-5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl" style={{ background: "#fff", border: `1px solid ${PALETTE.border}` }}>
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt={b?.image?.alt || b.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5" style={{ color: PALETTE.muted }} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold" style={{ color: PALETTE.navy }}>
                              {b.name}
                            </div>
                            <div className="truncate text-xs font-medium" style={{ color: PALETTE.muted }}>
                              /{b.slug}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-3">
                        <div className="flex flex-wrap gap-2">
                          {(b.categoryIds || []).slice(0, 2).map((cid) => {
                            const sid = String(cid);
                            const cname = categoriesById.get(sid)?.name;
                            return (
                              <span
                                key={sid}
                                className="rounded-full px-3 py-1 text-[11px] font-medium"
                                style={{ background: "rgba(0,31,63,0.04)", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                                title={cname ? cname : sid}
                              >
                                {cname ? cname : sid.slice(-6)}
                              </span>
                            );
                          })}
                          {(b.categoryIds || []).length > 2 ? (
                            <span className="text-[11px] font-medium" style={{ color: PALETTE.muted }}>
                              +{(b.categoryIds || []).length - 2}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="col-span-6 md:col-span-2" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-3">
                          <ToggleSwitch
                            checked={Boolean(b.isActive)}
                            disabled={isToggling}
                            onChange={(next) => toggleBrandActive(b, next)}
                          />
                          <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                            {Boolean(b.isActive) ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-6 md:col-span-2 flex justify-end gap-2">
                        <SoftButton className="px-3 py-2" onClick={() => openEdit(b)} style={{ cursor: "pointer" }}>
                          <Pencil className="h-4 w-4" />
                        </SoftButton>

                        <DangerButton className="px-3 py-2" onClick={() => deleteBrand(id)} disabled={deletingId === id} style={{ cursor: "pointer" }}>
                          {deletingId === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </DangerButton>
                      </div>
                    </motion.div>
                  );
                })
              )}

              <div className="pt-2">
                <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(0,31,63,0.02)", border: `1px dashed ${PALETTE.border}` }}>
                  <div className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    {pageInfo?.hasNextPage ? "More brands are available. Scroll down or press “Load more”." : "No more brands to show."}
                  </div>

                  {pageInfo?.hasNextPage ? (
                    <SoftButton className="px-3 py-2" onClick={() => fetchBrands({ reset: false })} disabled={loadingMore || loadingList} style={{ cursor: "pointer" }}>
                      {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                      Load more
                    </SoftButton>
                  ) : null}
                </div>

                <div ref={sentinelRef} className="h-1 w-full" />
              </div>
            </div>
          </div>
        </div>

        <ModalShell
          open={modalOpen}
          onClose={() => (saving ? null : setModalOpen(false))}
          title={editing ? "Edit brand" : "Create brand"}
          subtitle="Upload a logo, pick categories, choose status, and set order."
          footer={
            <>
              <div className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                {editing ? "Update the info and save." : "Logo + at least 1 category is required."}
              </div>
              <div className="flex gap-2">
                <SoftButton onClick={() => (!saving ? setModalOpen(false) : null)} disabled={saving} style={{ cursor: "pointer" }}>
                  Cancel
                </SoftButton>

                <PrimaryButton onClick={saveBrand} disabled={!canSave}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </PrimaryButton>
              </div>
            </>
          }
        >
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-7">
              <label className="grid gap-2">
                <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                  Brand name
                </span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      name: e.target.value,
                      slug: p.slug ? p.slug : slugify(e.target.value),
                    }))
                  }
                  className="h-12 rounded-2xl px-3 text-sm font-medium outline-none"
                  style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                  placeholder="e.g. AURA & OHM"
                />
              </label>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Slug (optional)
                  </span>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                    className="h-12 rounded-2xl px-3 text-sm font-medium outline-none"
                    style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                    placeholder="auto from name"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Sort order
                  </span>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value || 0) }))}
                    className="h-12 rounded-2xl px-3 text-sm font-medium outline-none"
                    style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                  />
                </label>
              </div>

              {/* ✅ Active toggle INSIDE modal too */}
              <div className="mt-3 rounded-3xl px-4 py-3" style={{ background: "rgba(0,31,63,0.02)", border: `1px solid ${PALETTE.border}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: PALETTE.navy }}>
                      Status
                    </div>
                    <div className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                      {form.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <ToggleSwitch checked={Boolean(form.isActive)} onChange={(v) => setForm((p) => ({ ...p, isActive: Boolean(v) }))} />
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-1">
                <label className="grid gap-2">
                  <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Image alt (optional)
                  </span>
                  <input
                    value={form.alt}
                    onChange={(e) => setForm((p) => ({ ...p, alt: e.target.value }))}
                    className="h-12 rounded-2xl px-3 text-sm font-medium outline-none"
                    style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                    placeholder="Short description"
                  />
                </label>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold" style={{ color: PALETTE.navy }}>
                    Categories
                  </div>
                  {loadingCats ? (
                    <div className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: PALETTE.muted }}>
                      <Loader2 className="h-4 w-4 animate-spin" /> loading…
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 rounded-3xl p-3" style={{ background: "rgba(0,31,63,0.02)", border: `1px solid ${PALETTE.border}` }}>
                  <CategoryMultiSelect items={categories} value={form.categoryIds} onChange={(ids) => setForm((p) => ({ ...p, categoryIds: ids }))} />

                  {(!form.categoryIds || form.categoryIds.length === 0) && (
                    <div className="mt-3 text-xs font-medium" style={{ color: "rgba(255,107,107,0.95)" }}>
                      Select at least 1 category.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-5">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0] || null)} />

              <Dropzone
                disabled={saving}
                previewUrl={form.imagePreview}
                existingUrl={form.existingImageUrl}
                hint={editing ? "Upload a new logo to replace (optional)." : "Logo is required when creating a brand."}
                errorText={!editing && !form.imageFile ? "Logo is required for creating a brand." : ""}
                onPickFile={onPickFile}
                onOpenPicker={() => fileRef.current?.click()}
                onClear={clearPickedFile}
              />
            </div>
          </div>
        </ModalShell>
      </div>
    </main>
  );
}