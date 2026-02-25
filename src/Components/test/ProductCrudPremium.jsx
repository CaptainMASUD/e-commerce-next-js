// ProductCrudWhitePremium.jsx
// FIXED: Toast no longer crashes when toast is null ✅
// JSX (not TSX) • White BG • Your palette • Premium UI • Proper image upload
// No backend/server URLs shown in UI
//
// ENV (Vite): VITE_ECM_C_API="http://localhost:4000"

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiPackage,
  FiX,
  FiChevronRight,
  FiChevronLeft,
  FiImage,
  FiTag,
  FiDollarSign,
  FiLayers,
  FiSettings,
  FiStar,
  FiUploadCloud,
  FiCopy,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";

const API_BASE = import.meta.env.VITE_ECM_C_API;

// Palette from your image
const COLORS = {
  cta: "#ff6b6b",
  amber: "#eab308",
  coral: "#ff7e69",
  navy: "#001f3f",
};

const cls = (...a) => a.filter(Boolean).join(" ");

const fade = {
  hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.22 } },
  exit: { opacity: 0, y: 10, filter: "blur(6px)", transition: { duration: 0.18 } },
};

const modalAnim = {
  hidden: { opacity: 0, scale: 0.99, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.99, y: 8, transition: { duration: 0.16 } },
};

function useDebouncedValue(value, delay = 420) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function toSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function formatMoney(n, currency = "BDT") {
  const num = Number(n ?? 0);
  if (Number.isNaN(num)) return `${currency} 0`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString()}`;
  }
}

async function apiFetchJson(path, { method = "GET", signal } = {}) {
  if (!API_BASE) throw new Error("Missing env: VITE_ECM_C_API");
  const res = await fetch(`${API_BASE}${path}`, { method, signal });
  const text = await res.text();
  const json = text ? safeJsonParse(text, null) : null;
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

async function apiFetchForm(path, { method = "POST", formData, signal } = {}) {
  if (!API_BASE) throw new Error("Missing env: VITE_ECM_C_API");
  const res = await fetch(`${API_BASE}${path}`, { method, body: formData, signal });
  const text = await res.text();
  const json = text ? safeJsonParse(text, null) : null;
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json;
}

/** ✅ FIX: If toast is null, return null immediately. */
function Toast({ toast, onClose }) {
  if (!toast) return null;

  useEffect(() => {
    const t = setTimeout(() => onClose?.(), toast.timeout ?? 2400);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  const icon =
    toast.type === "success" ? <FiCheckCircle /> : toast.type === "error" ? <FiAlertTriangle /> : <FiSettings />;

  const ring =
    toast.type === "success"
      ? "ring-emerald-200"
      : toast.type === "error"
      ? "ring-rose-200"
      : "ring-slate-200";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className={cls(
          "fixed left-1/2 top-4 z-[60] w-[min(92vw,520px)] -translate-x-1/2",
          "rounded-2xl bg-white shadow-[0_20px_60px_-25px_rgba(0,0,0,0.25)] ring-1",
          ring
        )}
      >
        <div className="flex items-start gap-3 p-4">
          <div
            className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(0,31,63,0.06)", color: COLORS.navy }}
          >
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: COLORS.navy }}>
              {toast.title}
            </div>
            {toast.message ? <div className="mt-0.5 text-sm text-slate-600">{toast.message}</div> : null}
          </div>
          <button
            onClick={() => onClose?.()}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            style={{ cursor: "pointer" }}
            aria-label="Close toast"
          >
            <FiX />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Modal({ open, title, subtitle, children, onClose, footer }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            variants={modalAnim}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_-35px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(255,107,107,0.16)", color: COLORS.cta }}
                >
                  <FiPackage />
                </div>
                <div>
                  <div className="text-base font-semibold" style={{ color: COLORS.navy }}>
                    {title}
                  </div>
                  {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                style={{ cursor: "pointer" }}
                aria-label="Close modal"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="max-h-[74vh] overflow-y-auto px-6 py-6">{children}</div>

            {footer ? <div className="border-t border-slate-100 px-6 py-5">{footer}</div> : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, hint, icon, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {icon ? <div style={{ color: COLORS.coral }}>{icon}</div> : null}
        <label className="text-xs font-semibold" style={{ color: COLORS.navy }}>
          {label}
        </label>
      </div>
      {children}
      {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={cls(
        "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none",
        "placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100",
        className
      )}
      style={{ cursor: "text" }}
    />
  );
}

function Textarea({ className, ...props }) {
  return (
    <textarea
      {...props}
      className={cls(
        "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none",
        "placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-100",
        className
      )}
      style={{ cursor: "text" }}
    />
  );
}

function Select({ className, children, ...props }) {
  return (
    <select
      {...props}
      className={cls(
        "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none",
        "focus:border-slate-300 focus:ring-4 focus:ring-slate-100",
        className
      )}
      style={{ cursor: "pointer" }}
    >
      {children}
    </select>
  );
}

function PrimaryButton({ className, ...props }) {
  return (
    <button
      {...props}
      className={cls(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white",
        "shadow-[0_14px_40px_-18px_rgba(255,107,107,0.8)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      style={{ backgroundColor: COLORS.cta, cursor: props.disabled ? "not-allowed" : "pointer" }}
    />
  );
}

function GhostButton({ className, ...props }) {
  return (
    <button
      {...props}
      className={cls(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold",
        "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      style={{ cursor: props.disabled ? "not-allowed" : "pointer" }}
    />
  );
}

function IconButton({ className, ...props }) {
  return (
    <button
      {...props}
      className={cls(
        "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 text-slate-700",
        "hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      style={{ cursor: props.disabled ? "not-allowed" : "pointer" }}
    />
  );
}

function Chip({ tone = "slate", children }) {
  const map = {
    slate: { bg: "bg-slate-50", ring: "ring-slate-200", text: "text-slate-700" },
    amber: { bg: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700" },
    coral: { bg: "bg-orange-50", ring: "ring-orange-200", text: "text-orange-700" },
    navy: { bg: "bg-slate-50", ring: "ring-slate-200", text: "text-slate-700" },
  };
  const t = map[tone] || map.slate;
  return (
    <span className={cls("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1", t.bg, t.ring, t.text)}>
      {children}
    </span>
  );
}

const EMPTY_FORM = {
  title: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  brand: "",
  category: "",
  subcategory: "",
  tags: "",
  currency: "BDT",
  price: "",
  compareAtPrice: "",
  stock: "",
  isActive: true,
  isFeatured: false,
  hasVariants: false,

  imagesJson: "[]",
  specificationsJson: `[
  { "key": "Battery", "value": "30 hours" }
]`,
  detailsJson: `{
  "warranty": "1 year"
}`,
  attributesJson: `{
  "color": ["black", "white"],
  "size": ["S", "M"]
}`,
  variantsJson: `[
  { "sku": "SKU-RED-M", "name": "Red / M", "price": 3500, "stock": 10, "attributes": { "color": "red", "size": "M" } }
]`,
};

function fillFormFromProduct(p) {
  const safe = (v) => (v === null || v === undefined ? "" : v);
  return {
    ...EMPTY_FORM,
    title: safe(p.title),
    slug: safe(p.slug),
    sku: safe(p.sku),
    shortDescription: safe(p.shortDescription),
    description: safe(p.description),
    brand: safe(p.brand),
    category: safe(p.category),
    subcategory: safe(p.subcategory),
    tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
    currency: safe(p.currency || "BDT"),
    price: safe(p.price),
    compareAtPrice: safe(p.compareAtPrice),
    stock: safe(p.stock),
    isActive: !!p.isActive,
    isFeatured: !!p.isFeatured,
    hasVariants: !!p.hasVariants,

    imagesJson: JSON.stringify(p.images || [], null, 2),
    specificationsJson: JSON.stringify(p.specifications || [], null, 2),
    detailsJson: JSON.stringify(p.details || {}, null, 2),
    attributesJson: JSON.stringify(p.attributes || {}, null, 2),
    variantsJson: JSON.stringify(p.variants || [], null, 2),
  };
}

function formToFormData(form, { files, editingId, deletePublicIds, replaceImages }) {
  const fd = new FormData();

  fd.append("title", form.title);
  fd.append("slug", form.slug);
  fd.append("sku", form.sku || "");
  fd.append("shortDescription", form.shortDescription || "");
  fd.append("description", form.description || "");
  fd.append("brand", form.brand || "");
  fd.append("category", form.category || "");
  fd.append("subcategory", form.subcategory || "");
  fd.append("tags", form.tags || "");
  fd.append("currency", form.currency || "BDT");
  fd.append("price", String(form.price ?? ""));
  fd.append("compareAtPrice", String(form.compareAtPrice ?? ""));
  fd.append("stock", String(form.stock ?? ""));
  fd.append("isActive", String(!!form.isActive));
  fd.append("isFeatured", String(!!form.isFeatured));
  fd.append("hasVariants", String(!!form.hasVariants));

  // JSON fields (backend parses)
  fd.append("images", form.imagesJson || "[]");
  fd.append("specifications", form.specificationsJson || "[]");
  fd.append("details", form.detailsJson || "{}");
  fd.append("attributes", form.attributesJson || "{}");
  fd.append("variants", form.variantsJson || "[]");

  if (editingId) {
    fd.append("deletePublicIds", JSON.stringify(deletePublicIds || []));
    fd.append("replaceImages", String(!!replaceImages));
  }

  // files for upload
  (files || []).forEach((f) => fd.append("images", f));

  return fd;
}

export default function ProductCrudWhitePremium() {
  const [items, setItems] = useState([]);
  const [pageStack, setPageStack] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);

  const [limit, setLimit] = useState(12);
  const [sortField, setSortField] = useState("_id");
  const [sortDir, setSortDir] = useState("desc");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 420);

  const [filters, setFilters] = useState({ category: "", brand: "", isActive: "", isFeatured: "", isInStock: "" });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [toast, setToast] = useState(null);

  // editor
  const [openEditor, setOpenEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // images
  const [newFiles, setNewFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [deletePublicIds, setDeletePublicIds] = useState([]);
  const [replaceImages, setReplaceImages] = useState(false);

  // delete confirm
  const [confirmDel, setConfirmDel] = useState({ open: false, product: null });
  const [deleting, setDeleting] = useState(false);

  const abortRef = useRef(null);

  const showToast = (type, title, message, timeout) => setToast({ type, title, message, timeout });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("sortField", sortField);
    params.set("sortDir", sortDir);
    if (cursor) params.set("cursor", cursor);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    Object.entries(filters).forEach(([k, v]) => {
      if (String(v || "").trim() !== "") params.set(k, String(v).trim());
    });
    return `?${params.toString()}`;
  }, [limit, sortField, sortDir, cursor, debouncedSearch, filters]);

  useEffect(() => {
    setCursor(null);
    setPageStack([]);
  }, [
    limit,
    sortField,
    sortDir,
    debouncedSearch,
    filters.category,
    filters.brand,
    filters.isActive,
    filters.isFeatured,
    filters.isInStock,
  ]);

  const load = async () => {
    setErr("");
    setLoading(true);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const params = new URLSearchParams(queryString.slice(1));
      if (!cursor) params.delete("cursor");

      const json = await apiFetchJson(`/api/products?${params.toString()}`, { signal: controller.signal });
      const data = json?.data || [];
      const pageInfo = json?.pageInfo || {};

      setItems(data);
      setHasNext(!!pageInfo.hasNextPage);
      setNextCursor(pageInfo.nextCursor || null);
    } catch (e) {
      if (e?.name !== "AbortError") setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, limit, sortField, sortDir, debouncedSearch, filters, API_BASE]);

  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newFiles]);

  const goNext = () => {
    if (!hasNext || !nextCursor) return;
    setPageStack((s) => [...s, cursor]);
    setCursor(nextCursor);
  };

  const goBack = () => {
    setPageStack((s) => {
      if (!s.length) return s;
      const prev = s[s.length - 1];
      const next = s.slice(0, -1);
      setCursor(prev || null);
      return next;
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setNewFiles([]);
    setDeletePublicIds([]);
    setReplaceImages(false);
    setOpenEditor(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm(fillFormFromProduct(p));
    setNewFiles([]);
    setDeletePublicIds([]);
    setReplaceImages(false);
    setOpenEditor(true);
  };

  const closeEditor = () => {
    setOpenEditor(false);
    setEditing(null);
    setNewFiles([]);
    setDeletePublicIds([]);
    setReplaceImages(false);
  };

  const onFormChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "title") {
      setForm((f) => ({ ...f, slug: f.slug ? f.slug : toSlug(value) }));
    }
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.slug.trim()) return "Slug is required";
    if (String(form.price).trim() === "") return "Price is required";
    if (Number.isNaN(Number(form.price))) return "Price must be a number";
    if (form.compareAtPrice !== "" && Number.isNaN(Number(form.compareAtPrice))) return "Compare price must be a number";
    if (form.stock !== "" && Number.isNaN(Number(form.stock))) return "Stock must be a number";

    for (const [k, label] of [
      ["imagesJson", "Gallery data"],
      ["specificationsJson", "Specifications"],
      ["detailsJson", "Details"],
      ["attributesJson", "Options"],
      ["variantsJson", "Variants"],
    ]) {
      try {
        JSON.parse(form[k]);
      } catch {
        return `${label} has invalid format`;
      }
    }

    for (const f of newFiles) {
      if (f.size > 3 * 1024 * 1024) return `File "${f.name}" is larger than 3MB`;
    }

    return null;
  };

  const toggleDeletePublicId = (publicId) => {
    setDeletePublicIds((arr) => (arr.includes(publicId) ? arr.filter((x) => x !== publicId) : [...arr, publicId]));
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", "Copied", "Copied to clipboard.");
    } catch {
      showToast("error", "Copy failed", "Clipboard not available.");
    }
  };

  const save = async () => {
    const v = validate();
    if (v) return showToast("error", "Please fix this", v);

    setSaving(true);
    try {
      const fd = formToFormData(form, {
        files: newFiles,
        editingId: editing?._id,
        deletePublicIds,
        replaceImages,
      });

      if (editing?._id) {
        await apiFetchForm(`/api/products/${editing._id}`, { method: "PATCH", formData: fd });
        showToast("success", "Updated", "Product updated successfully.");
      } else {
        await apiFetchForm(`/api/products`, { method: "POST", formData: fd });
        showToast("success", "Created", "Product created successfully.");
      }

      setOpenEditor(false);
      setEditing(null);
      setCursor(null);
      setPageStack([]);
      await load();
    } catch (e) {
      showToast("error", "Save failed", e.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (p) => setConfirmDel({ open: true, product: p });

  const doDelete = async () => {
    const p = confirmDel.product;
    if (!p?._id) return;

    setDeleting(true);
    try {
      await apiFetchJson(`/api/products/${p._id}`, { method: "DELETE" });
      showToast("success", "Deleted", "Product deleted.");
      setConfirmDel({ open: false, product: null });
      await load();
    } catch (e) {
      showToast("error", "Delete failed", e.message || "Could not delete product");
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const active = items.filter((x) => x.isActive).length;
    const featured = items.filter((x) => x.isFeatured).length;
    const out = items.filter((x) => !x.isInStock).length;
    return { active, featured, out };
  }, [items]);

  return (
    <div className="min-h-screen bg-white">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute -top-48 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(255,107,107,0.12)" }}
        />
        <div
          className="absolute -bottom-56 right-[-140px] h-[620px] w-[620px] rounded-full blur-3xl"
          style={{ background: "rgba(234,179,8,0.12)" }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-10">
        {/* Header */}
        <motion.div variants={fade} initial="hidden" animate="show" className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1"
                style={{ background: "rgba(0,31,63,0.05)", color: COLORS.navy, cursor: "default" }}
              >
                <FiLayers /> Catalog Studio
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl" style={{ color: COLORS.navy }}>
                Product Manager
              </h1>
              <p className="mt-1 text-sm text-slate-600">Premium CRUD with fast search and smooth UX.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <IconButton onClick={load} disabled={loading} title="Refresh">
                <FiRefreshCw className={cls(loading && "animate-spin")} />
              </IconButton>

              <PrimaryButton onClick={openCreate}>
                <FiPlus /> Add Product
              </PrimaryButton>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_-50px_rgba(0,0,0,0.25)] md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:col-span-7 md:grid-cols-5">
              <Input value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} placeholder="Category" />
              <Input value={filters.brand} onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))} placeholder="Brand" />

              <Select value={filters.isActive} onChange={(e) => setFilters((f) => ({ ...f, isActive: e.target.value }))}>
                <option value="">Active: All</option>
                <option value="true">Active: Yes</option>
                <option value="false">Active: No</option>
              </Select>

              <Select value={filters.isFeatured} onChange={(e) => setFilters((f) => ({ ...f, isFeatured: e.target.value }))}>
                <option value="">Featured: All</option>
                <option value="true">Featured: Yes</option>
                <option value="false">Featured: No</option>
              </Select>

              <Select value={filters.isInStock} onChange={(e) => setFilters((f) => ({ ...f, isInStock: e.target.value }))}>
                <option value="">Stock: All</option>
                <option value="true">In stock</option>
                <option value="false">Out of stock</option>
              </Select>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 md:col-span-12">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="navy">Active: {stats.active}</Chip>
                <Chip tone="amber">Featured: {stats.featured}</Chip>
                <Chip tone={stats.out ? "coral" : "slate"}>Out: {stats.out}</Chip>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                  {[8, 12, 16, 20, 24].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </Select>

                <Select value={sortField} onChange={(e) => setSortField(e.target.value)}>
                  <option value="_id">Newest</option>
                  <option value="createdAt">Created</option>
                  <option value="price">Price</option>
                </Select>

                <Select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </Select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="mt-6">
          <AnimatePresence mode="popLayout">
            {err ? (
              <motion.div key="err" variants={fade} initial="hidden" animate="show" exit="exit" className="rounded-[28px] border border-rose-200 bg-rose-50 p-4">
                <div className="text-sm font-semibold text-rose-700">Something went wrong</div>
                <div className="mt-1 text-sm text-rose-700/80">{err}</div>
              </motion.div>
            ) : (
              <motion.div key="grid" variants={fade} initial="hidden" animate="show" exit="exit">
                {loading ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: Math.min(limit, 12) }).map((_, i) => (
                      <div key={i} className="h-60 animate-pulse rounded-[28px] border border-slate-200 bg-slate-50" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-[0_24px_70px_-55px_rgba(0,0,0,0.25)]">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(0,31,63,0.06)", color: COLORS.navy }}>
                      <FiPackage />
                    </div>
                    <div className="mt-4 text-base font-semibold" style={{ color: COLORS.navy }}>
                      No products yet
                    </div>
                    <div className="mt-1 text-sm text-slate-600">Create your first product and start building your catalog.</div>
                    <div className="mt-6 flex justify-center">
                      <PrimaryButton onClick={openCreate}>
                        <FiPlus /> Add Product
                      </PrimaryButton>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((p) => {
                      const primaryImg = (p.images || []).find((x) => x.isPrimary) || (p.images || [])[0];
                      const out = !p.isInStock;

                      return (
                        <motion.div
                          key={p._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-55px_rgba(0,0,0,0.25)]"
                        >
                          <div className="relative h-44 w-full overflow-hidden bg-slate-50">
                            {primaryImg?.url ? (
                              <img src={primaryImg.url} alt={primaryImg.alt || p.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <FiImage />
                              </div>
                            )}

                            <div className="absolute left-4 top-4 flex items-center gap-2">
                              {p.isFeatured && (
                                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1" style={{ background: "rgba(234,179,8,0.14)", color: COLORS.amber, ringColor: "rgba(234,179,8,0.22)" }}>
                                  <FiStar /> Featured
                                </span>
                              )}
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1"
                                style={{
                                  background: out ? "rgba(255,126,105,0.14)" : "rgba(0,31,63,0.06)",
                                  color: out ? COLORS.coral : COLORS.navy,
                                  ringColor: out ? "rgba(255,126,105,0.22)" : "rgba(0,31,63,0.12)",
                                }}
                              >
                                <FiPackage /> {out ? "Out" : "In stock"}
                              </span>
                            </div>
                          </div>

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-base font-extrabold" style={{ color: COLORS.navy }}>
                                  {p.title}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                  <span className="inline-flex items-center gap-1">
                                    <FiTag style={{ color: COLORS.coral }} /> {p.brand || "—"}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <FiLayers style={{ color: COLORS.coral }} /> {p.category || "—"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <IconButton onClick={() => openEdit(p)} title="Edit">
                                  <FiEdit2 />
                                </IconButton>
                                <IconButton onClick={() => askDelete(p)} title="Delete">
                                  <FiTrash2 />
                                </IconButton>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-baseline gap-2">
                                <div className="text-lg font-extrabold" style={{ color: COLORS.navy }}>
                                  {formatMoney(p.price, p.currency || "BDT")}
                                </div>
                                {p.compareAtPrice ? <div className="text-xs text-slate-500 line-through">{formatMoney(p.compareAtPrice, p.currency || "BDT")}</div> : null}
                              </div>
                              <div className="text-xs text-slate-600">
                                Stock: <span className="font-semibold" style={{ color: COLORS.navy }}>{p.hasVariants ? "Variants" : p.stock ?? 0}</span>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <Chip tone="slate">{p.isActive ? "Active" : "Inactive"}</Chip>
                              {Array.isArray(p.tags) && p.tags.slice(0, 2).map((t) => <Chip key={t} tone="slate">{t}</Chip>)}
                              {Array.isArray(p.tags) && p.tags.length > 2 ? <Chip tone="slate">+{p.tags.length - 2}</Chip> : null}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-7 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GhostButton onClick={() => (pageStack.length ? goBack() : null)} disabled={loading || pageStack.length === 0}>
                <FiChevronLeft /> Back
              </GhostButton>
              <PrimaryButton onClick={() => (hasNext ? goNext() : null)} disabled={loading || !hasNext || !nextCursor}>
                Next <FiChevronRight />
              </PrimaryButton>
            </div>
            <div className="text-xs text-slate-500">Smooth cursor pagination for fast browsing.</div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <Modal
        open={openEditor}
        title={editing ? "Edit product" : "Add product"}
        subtitle="Upload images and manage details."
        onClose={() => !saving && closeEditor()}
        footer={
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-500">Images are uploaded securely and optimized.</div>
            <div className="flex items-center justify-end gap-2">
              <GhostButton onClick={closeEditor} disabled={saving}>
                Cancel
              </GhostButton>
              <PrimaryButton onClick={save} disabled={saving}>
                {saving ? <FiRefreshCw className="animate-spin" /> : editing ? <FiEdit2 /> : <FiPlus />}
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </PrimaryButton>
            </div>
          </div>
        }
      >
        {/* --- Editor Body --- */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-extrabold" style={{ color: COLORS.navy }}>
                <FiPackage /> Basics
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Title" icon={<FiPackage />}>
                  <Input value={form.title} onChange={(e) => onFormChange("title", e.target.value)} placeholder="Wireless Headphones" />
                </Field>

                <Field label="Slug" icon={<FiLayers />} hint="Auto-filled from title if empty">
                  <Input value={form.slug} onChange={(e) => onFormChange("slug", toSlug(e.target.value))} placeholder="wireless-headphones" />
                </Field>

                <Field label="Price" icon={<FiDollarSign />} hint="Required">
                  <Input value={form.price} onChange={(e) => onFormChange("price", e.target.value)} placeholder="3500" />
                </Field>

                <Field label="Compare price" icon={<FiDollarSign />} hint="Optional">
                  <Input value={form.compareAtPrice} onChange={(e) => onFormChange("compareAtPrice", e.target.value)} placeholder="4500" />
                </Field>

                <Field label="Stock" icon={<FiSettings />} hint="Ignored if variants enabled">
                  <Input value={form.stock} onChange={(e) => onFormChange("stock", e.target.value)} placeholder="25" />
                </Field>

                <Field label="Currency" icon={<FiDollarSign />} hint="BDT, USD...">
                  <Input value={form.currency} onChange={(e) => onFormChange("currency", e.target.value)} placeholder="BDT" />
                </Field>

                <Field label="Brand" icon={<FiTag />}>
                  <Input value={form.brand} onChange={(e) => onFormChange("brand", e.target.value)} placeholder="SoundPro" />
                </Field>

                <Field label="Category" icon={<FiLayers />}>
                  <Input value={form.category} onChange={(e) => onFormChange("category", e.target.value)} placeholder="Electronics" />
                </Field>

                <Field label="Tags" icon={<FiTag />} hint="Comma separated">
                  <Input value={form.tags} onChange={(e) => onFormChange("tags", e.target.value)} placeholder="wireless, audio" />
                </Field>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => onFormChange("isActive", e.target.checked)} className="h-4 w-4" style={{ accentColor: COLORS.navy, cursor: "pointer" }} />
                  <div className="text-sm font-semibold" style={{ color: COLORS.navy }}>
                    Active
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => onFormChange("isFeatured", e.target.checked)} className="h-4 w-4" style={{ accentColor: COLORS.amber, cursor: "pointer" }} />
                  <div className="text-sm font-semibold" style={{ color: COLORS.navy }}>
                    Featured
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:col-span-2">
                  <input type="checkbox" checked={form.hasVariants} onChange={(e) => onFormChange("hasVariants", e.target.checked)} className="h-4 w-4" style={{ accentColor: COLORS.coral, cursor: "pointer" }} />
                  <div className="text-sm font-semibold" style={{ color: COLORS.navy }}>
                    This product has variants
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4">
                <Field label="Short description">
                  <Textarea rows={2} value={form.shortDescription} onChange={(e) => onFormChange("shortDescription", e.target.value)} placeholder="Noise-cancelling, 30h battery…" />
                </Field>

                <Field label="Full description">
                  <Textarea rows={5} value={form.description} onChange={(e) => onFormChange("description", e.target.value)} placeholder="Write full details here…" />
                </Field>
              </div>
            </div>

            {/* Images */}
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-extrabold" style={{ color: COLORS.navy }}>
                  <FiUploadCloud /> Images
                </div>
                <div className="text-xs text-slate-500">Up to 6 • Max 3MB each</div>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-2xl file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-90"
                style={{ cursor: "pointer" }}
              />

              <style>{`
                input[type="file"]::file-selector-button{ background:${COLORS.cta}; }
              `}</style>

              {previewUrls.length > 0 ? (
                <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-4">
                  {previewUrls.map((src, idx) => (
                    <div key={idx} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <img src={src} alt="preview" className="h-24 w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-white/90 px-2 py-1 text-[10px] text-slate-700">
                        {newFiles[idx]?.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Choose images to upload. They will appear here as previews.
                </div>
              )}

              {editing?._id ? (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: COLORS.navy }}>
                      Update behavior
                    </div>
                    <div className="text-xs text-slate-600">Replace = overwrite current gallery with new selection.</div>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: COLORS.navy }}>
                    <input type="checkbox" checked={replaceImages} onChange={(e) => setReplaceImages(e.target.checked)} className="h-4 w-4" style={{ accentColor: COLORS.cta, cursor: "pointer" }} />
                    Replace
                  </label>
                </div>
              ) : null}

              {editing?._id
                ? (() => {
                    const existingImages = (safeJsonParse(form.imagesJson, []) || []).filter((x) => x?.url);
                    if (!existingImages.length) return null;

                    return (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-600">Current gallery</div>
                        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                          {existingImages.map((img, idx) => {
                            const canRemove = !!img.publicId; // internal id, but we don't show it
                            const selected = canRemove && deletePublicIds.includes(img.publicId);

                            return (
                              <div key={img.publicId || `${img.url}-${idx}`} className={cls("relative overflow-hidden rounded-2xl border bg-slate-50", selected ? "border-rose-300" : "border-slate-200")}>
                                <img src={img.url} alt={img.alt || "product"} className="h-28 w-full object-cover" loading="lazy" />
                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/90 p-2">
                                  <button type="button" onClick={() => copyText(img.url)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50" style={{ cursor: "pointer" }}>
                                    <FiCopy /> Copy
                                  </button>

                                  {canRemove ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleDeletePublicId(img.publicId)}
                                      className={cls(
                                        "inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold",
                                        selected ? "bg-rose-100 text-rose-700" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                      )}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <FiTrash2 /> {selected ? "Selected" : "Remove"}
                                    </button>
                                  ) : (
                                    <span className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500">External</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {deletePublicIds.length ? (
                          <div className="mt-3 text-xs text-slate-600">
                            Selected to remove: <span className="font-semibold">{deletePublicIds.length}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()
                : null}
            </div>
          </div>

          {/* Right: Advanced (optional) */}
          <div className="space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-extrabold" style={{ color: COLORS.navy }}>
                <FiSettings /> Advanced Details
              </div>

              <div className="space-y-4">
                <Field label="Gallery data" hint="Optional extra image objects (url, alt, primary).">
                  <Textarea rows={6} value={form.imagesJson} onChange={(e) => onFormChange("imagesJson", e.target.value)} />
                </Field>

                <Field label="Specifications" hint="Array of key/value pairs.">
                  <Textarea rows={6} value={form.specificationsJson} onChange={(e) => onFormChange("specificationsJson", e.target.value)} />
                </Field>

                <Field label="Extra details" hint="Any extra fields you want (warranty, box items).">
                  <Textarea rows={6} value={form.detailsJson} onChange={(e) => onFormChange("detailsJson", e.target.value)} />
                </Field>

                <Field label="Options" hint="Options map (color, size).">
                  <Textarea rows={6} value={form.attributesJson} onChange={(e) => onFormChange("attributesJson", e.target.value)} />
                </Field>

                <Field label="Variants" hint="Used only if variants enabled.">
                  <Textarea rows={7} value={form.variantsJson} onChange={(e) => onFormChange("variantsJson", e.target.value)} />
                </Field>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="text-sm font-extrabold" style={{ color: COLORS.navy }}>
                Palette
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-700">CTA</div>
                  <div className="mt-1 text-sm font-extrabold" style={{ color: COLORS.cta }}>
                    {COLORS.cta}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-700">Primary text</div>
                  <div className="mt-1 text-sm font-extrabold" style={{ color: COLORS.navy }}>
                    {COLORS.navy}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-700">Accent</div>
                  <div className="mt-1 text-sm font-extrabold" style={{ color: COLORS.amber }}>
                    {COLORS.amber}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-700">Accent 2</div>
                  <div className="mt-1 text-sm font-extrabold" style={{ color: COLORS.coral }}>
                    {COLORS.coral}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={confirmDel.open}
        title="Delete product"
        subtitle="This will remove the product from your catalog."
        onClose={() => !deleting && setConfirmDel({ open: false, product: null })}
        footer={
          <div className="flex items-center justify-end gap-2">
            <GhostButton onClick={() => setConfirmDel({ open: false, product: null })} disabled={deleting}>
              Cancel
            </GhostButton>
            <PrimaryButton onClick={doDelete} disabled={deleting} style={{ backgroundColor: COLORS.coral }}>
              {deleting ? <FiRefreshCw className="animate-spin" /> : <FiTrash2 />}
              {deleting ? "Deleting..." : "Delete"}
            </PrimaryButton>
          </div>
        }
      >
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-700">
            You are deleting:{" "}
            <span className="font-extrabold" style={{ color: COLORS.navy }}>
              {confirmDel.product?.title}
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-600">You can add it again anytime.</div>
        </div>
      </Modal>
    </div>
  );
}
