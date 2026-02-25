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
  Loader2,
  Image as ImageIcon,
  SlidersHorizontal,
  Tag,
  Sparkles,
  ChevronDown,
  Upload,
  Star,
  Eye,
  EyeOff,
  Boxes,
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
};

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

/* ---------------------------- auth (same pattern) ---------------------------- */

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

function slugify(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toMoney(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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

function parseTagsInput(str = "") {
  return uniqStrings(
    String(str)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  );
}

/* ------------------------------- UI pieces ------------------------------- */

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
            className="relative w-full max-w-4xl overflow-hidden"
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

            <div className="px-6 pb-6 overflow-auto" style={{ maxHeight: "72vh" }}>
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

function ImagePickerCard({
  title = "Image",
  required,
  disabled,
  previewUrl,
  existingUrl,
  hint,
  errorText,
  onPickFile,
  onOpenPicker,
  onClear,
  height = 220,
}) {
  const [isOver, setIsOver] = useState(false);
  const hasImage = Boolean(previewUrl || existingUrl);

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
          {title} {required ? <span style={{ color: "rgba(255,107,107,0.95)" }}>*</span> : null}
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
          height,
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
          <img src={existingUrl} alt="existing" className="h-full w-full object-cover" />
        ) : (
          <div className="grid place-items-center gap-2 text-center px-6">
            <div
              className="grid h-12 w-12 place-items-center rounded-3xl"
              style={{ background: "rgba(255,126,105,0.10)", border: `1px solid ${PALETTE.border}` }}
            >
              <ImageIcon className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </div>
            <div className="text-sm font-semibold" style={{ color: PALETTE.navy }}>
              Drag & drop an image
            </div>
            <div className="text-xs font-medium" style={{ color: PALETTE.muted }}>
              or click <span style={{ color: PALETTE.navy }}>Choose</span>
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

export default function AdminProductsPage() {
  const router = useRouter();
  const { token, user } = useMemo(() => getAuth(), []);
  const isAdmin = isAdminUser(user);

  useEffect(() => {
    if (!token) router.push("/login");
    else if (!isAdmin) router.push("/");
  }, [token, isAdmin, router]);

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

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

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // simple client filtering
  const [search, setSearch] = useState("");
  const s = search.trim().toLowerCase();

  const [statusFilter, setStatusFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      if (statusFilter && String(p.status) !== statusFilter) return false;
      if (visibilityFilter && String(p.visibility) !== visibilityFilter) return false;
      if (categoryFilter && String(p?.category?._id || p.category) !== categoryFilter) return false;
      if (brandFilter && String(p?.brand?._id || p.brand) !== brandFilter) return false;

      if (!s) return true;
      const t = (p.title || "").toLowerCase();
      const sl = (p.slug || "").toLowerCase();
      return t.includes(s) || sl.includes(s);
    });
  }, [products, s, statusFilter, visibilityFilter, categoryFilter, brandFilter]);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  // image input refs
  const primaryRef = useRef(null);
  const galleryRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "",
    subcategory: "",
    brand: "",
    price: "",
    salePrice: "",
    shortDescription: "",
    description: "",
    status: "draft",
    visibility: "public",
    isFeatured: false,
    tagsInput: "",
    features: [],

    primaryFile: null,
    primaryPreview: "",
    existingPrimaryUrl: "",

    galleryFiles: [],
    galleryPreviews: [],
    existingGalleryUrls: [],
  });

  const selectedCategory = useMemo(() => {
    const id = String(form.category || "");
    return (categories || []).find((c) => String(c?._id || c?.id) === id) || null;
  }, [categories, form.category]);

  const subcategories = useMemo(() => {
    const list = selectedCategory?.subcategories || [];
    return Array.isArray(list) ? list : [];
  }, [selectedCategory]);

  const canSave = useMemo(() => {
    if (!form.title.trim()) return false;
    if (!form.slug.trim()) return false;
    if (!form.category) return false;
    if (!form.brand) return false;
    if (String(form.price).trim() === "") return false;

    // create requires primary image
    if (!editing && !form.primaryFile) return false;

    return !saving;
  }, [form, saving, editing]);

  function resetForm() {
    // revoke old URLs
    if (form.primaryPreview) URL.revokeObjectURL(form.primaryPreview);
    for (const u of form.galleryPreviews || []) {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    }

    setForm({
      title: "",
      slug: "",
      category: "",
      subcategory: "",
      brand: "",
      price: "",
      salePrice: "",
      shortDescription: "",
      description: "",
      status: "draft",
      visibility: "public",
      isFeatured: false,
      tagsInput: "",
      features: [],

      primaryFile: null,
      primaryPreview: "",
      existingPrimaryUrl: "",

      galleryFiles: [],
      galleryPreviews: [],
      existingGalleryUrls: [],
    });
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    resetForm();

    const catId = String(p?.category?._id || p.category || "");
    const brandId = String(p?.brand?._id || p.brand || "");

    const tagsArr = Array.isArray(p?.tags) ? p.tags : [];
    const tagsInput = tagsArr.join(", ");

    setForm((prev) => ({
      ...prev,
      title: p?.title || "",
      slug: p?.slug || "",
      category: catId,
      subcategory: p?.subcategory ? String(p.subcategory) : "",
      brand: brandId,
      price: p?.price ?? "",
      salePrice: p?.salePrice ?? "",
      shortDescription: p?.shortDescription || "",
      description: p?.description || "",
      status: p?.status || "draft",
      visibility: p?.visibility || "public",
      isFeatured: Boolean(p?.isFeatured),
      tagsInput,
      features: Array.isArray(p?.features) ? p.features : [],

      existingPrimaryUrl: p?.primaryImage?.url || "",
      existingGalleryUrls: Array.isArray(p?.galleryImages) ? p.galleryImages.map((g) => g?.url).filter(Boolean) : [],
    }));

    setModalOpen(true);
  }

  function onPickPrimary(file) {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      showToast("error", "Please upload a valid image file.");
      return;
    }
    const url = URL.createObjectURL(file);
    setForm((p) => {
      if (p.primaryPreview) URL.revokeObjectURL(p.primaryPreview);
      return { ...p, primaryFile: file, primaryPreview: url };
    });
  }

  function clearPrimary() {
    setForm((p) => {
      if (p.primaryPreview) URL.revokeObjectURL(p.primaryPreview);
      return { ...p, primaryFile: null, primaryPreview: "", existingPrimaryUrl: "" };
    });
    if (primaryRef.current) primaryRef.current.value = "";
  }

  function onPickGallery(files) {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length) return;

    for (const f of list) {
      if (!f.type?.startsWith("image/")) {
        showToast("error", "Gallery: please upload only image files.");
        return;
      }
    }

    const previews = list.map((f) => URL.createObjectURL(f));
    setForm((p) => {
      // revoke old previews
      for (const u of p.galleryPreviews || []) {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      }
      return {
        ...p,
        galleryFiles: list,
        galleryPreviews: previews,
        // if admin picks new gallery, we’ll replace gallery server-side
        // (your PATCH route replaces gallery when galleryImages is provided)
      };
    });
  }

  function clearGalleryPicked() {
    setForm((p) => {
      for (const u of p.galleryPreviews || []) {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      }
      return { ...p, galleryFiles: [], galleryPreviews: [], existingGalleryUrls: [] };
    });
    if (galleryRef.current) galleryRef.current.value = "";
  }

  function addFeatureRow() {
    setForm((p) => ({
      ...p,
      features: [
        ...(Array.isArray(p.features) ? p.features : []),
        { label: "", value: "", isKey: false, order: (p.features?.length || 0) * 10, group: "" },
      ],
    }));
  }

  function updateFeatureRow(idx, patch) {
    setForm((p) => {
      const arr = Array.isArray(p.features) ? [...p.features] : [];
      arr[idx] = { ...(arr[idx] || {}), ...patch };
      return { ...p, features: arr };
    });
  }

  function removeFeatureRow(idx) {
    setForm((p) => {
      const arr = Array.isArray(p.features) ? [...p.features] : [];
      arr.splice(idx, 1);
      return { ...p, features: arr };
    });
  }

  async function fetchMeta() {
    try {
      setLoadingMeta(true);

      // categories
      const catsUrl = new URL(window.location.origin + "/api/admin/categories");
      catsUrl.searchParams.set("status", "active");
      catsUrl.searchParams.set("limit", "200");

      const brandsUrl = new URL(window.location.origin + "/api/admin/brands");
      brandsUrl.searchParams.set("status", "active");
      brandsUrl.searchParams.set("limit", "300");
      brandsUrl.searchParams.set("fields", "name,slug,image,categoryIds,isActive");

      const [catsRes, brandsRes] = await Promise.all([
        fetch(catsUrl.toString(), { headers: { ...authHeaders } }),
        fetch(brandsUrl.toString(), { headers: { ...authHeaders } }),
      ]);

      const catsData = await catsRes.json().catch(() => null);
      if (!catsRes.ok) throw new Error(parseApiError(catsData, "Failed to load categories"));
      setCategories(Array.isArray(catsData?.items) ? catsData.items : []);

      const brandsData = await brandsRes.json().catch(() => null);
      if (!brandsRes.ok) throw new Error(parseApiError(brandsData, "Failed to load brands"));
      setBrands(Array.isArray(brandsData?.items) ? brandsData.items : []);
    } catch (e) {
      showToast("error", e.message || "Failed to load meta");
      setCategories([]);
      setBrands([]);
    } finally {
      setLoadingMeta(false);
    }
  }

  async function fetchProducts() {
    try {
      setError("");
      setLoadingList(true);

      const res = await fetch("/api/admin/products", { headers: { ...authHeaders } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, "Failed to load products"));

      setProducts(Array.isArray(data?.products) ? data.products : []);
    } catch (e) {
      setProducts([]);
      setError(e.message || "Failed to load products");
    } finally {
      setLoadingList(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!token || !isAdmin) return;
    fetchMeta();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  async function saveProduct() {
    try {
      setSaving(true);

      const isEdit = Boolean(editing?._id || editing?.id);
      const id = editing?._id || editing?.id;

      // build FormData to match your API
      const fd = new FormData();

      fd.set("title", form.title.trim());
      fd.set("slug", slugify(form.slug.trim()));
      fd.set("category", String(form.category));
      fd.set("brand", String(form.brand));

      if (form.subcategory) fd.set("subcategory", String(form.subcategory));
      else fd.set("subcategory", "");

      fd.set("price", String(toMoney(form.price)));
      if (String(form.salePrice).trim() !== "") fd.set("salePrice", String(toMoney(form.salePrice)));

      fd.set("shortDescription", form.shortDescription || "");
      fd.set("description", form.description || "");

      fd.set("status", form.status || "draft");
      fd.set("visibility", form.visibility || "public");
      fd.set("isFeatured", String(Boolean(form.isFeatured)));

      const tagsArr = parseTagsInput(form.tagsInput);
      fd.set("tags", JSON.stringify(tagsArr));

      const featuresArr = Array.isArray(form.features) ? form.features : [];
      fd.set("features", JSON.stringify(featuresArr));

      // images
      if (!isEdit) {
        // create: primary required
        if (!form.primaryFile) throw new Error("Primary image is required.");
        fd.set("primaryImage", form.primaryFile);
      } else {
        // edit: optional
        if (form.primaryFile) fd.set("primaryImage", form.primaryFile);
      }

      // gallery replace if provided
      if (Array.isArray(form.galleryFiles) && form.galleryFiles.length) {
        for (const gf of form.galleryFiles) fd.append("galleryImages", gf);
      }

      const res = await fetch(isEdit ? `/api/admin/products/${id}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { ...authHeaders },
        body: fd,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, isEdit ? "Update failed" : "Create failed"));

      showToast("success", isEdit ? "Product updated" : "Product created");
      setModalOpen(false);
      setEditing(null);
      resetForm();
      await fetchProducts();
    } catch (e) {
      showToast("error", e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    if (!id) return;
    try {
      setDeletingId(String(id));
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE", headers: { ...authHeaders } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, "Delete failed"));

      showToast("success", "Product deleted");
      await fetchProducts();
    } catch (e) {
      showToast("error", e.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  }

  async function quickToggleFeatured(p, nextVal) {
    const id = p?._id || p?.id;
    if (!id) return;

    // optimistic update
    setProducts((arr) => arr.map((x) => (String(x._id || x.id) === String(id) ? { ...x, isFeatured: nextVal } : x)));

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: nextVal }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, "Failed to update"));

      showToast("success", nextVal ? "Marked featured" : "Unfeatured");
    } catch (e) {
      setProducts((arr) => arr.map((x) => (String(x._id || x.id) === String(id) ? { ...x, isFeatured: !nextVal } : x)));
      showToast("error", e.message || "Failed to update");
    }
  }

  async function quickToggleVisibility(p, nextVal) {
    const id = p?._id || p?.id;
    if (!id) return;

    setProducts((arr) => arr.map((x) => (String(x._id || x.id) === String(id) ? { ...x, visibility: nextVal } : x)));

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: nextVal }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(parseApiError(data, "Failed to update"));

      showToast("success", nextVal === "public" ? "Now public" : "Now hidden");
    } catch (e) {
      // revert
      setProducts((arr) => arr.map((x) => (String(x._id || x.id) === String(id) ? { ...x, visibility: nextVal === "public" ? "hidden" : "public" } : x)));
      showToast("error", e.message || "Failed to update");
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

  const shownCount = filteredProducts.length;

  return (
    <main className="w-full" style={{ background: PALETTE.bg, color: PALETTE.navy }}>
      <Toaster position="bottom-right" />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -left-20 -top-20 h-[340px] w-[340px] rounded-full blur-3xl"
          style={{ background: "rgba(255,126,105,0.10)" }}
        />
        <div
          className="absolute right-[-140px] top-[120px] h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: "rgba(0,31,63,0.06)" }}
        />
      </div>

      <div className="mx-auto max-w-screen-2xl px-5 py-6 md:px-10 md:py-10">
        {/* header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Pill icon={Boxes}>Products</Pill>
              <Pill icon={SlidersHorizontal}>Manage</Pill>
              <Pill icon={Sparkles}>Premium</Pill>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl" style={{ color: PALETTE.navy }}>
              Product Management
            </h1>

            <p className="mt-2 text-sm font-medium" style={{ color: PALETTE.muted }}>
              Create products with images, category/subcategory, brand, pricing, tags, and features.
            </p>

            <div className="mt-2">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
              >
                {loadingList ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading products…
                  </>
                ) : (
                  <>Showing {shownCount} product{shownCount === 1 ? "" : "s"}</>
                )}
              </span>
              {loadingMeta ? (
                <span className="ml-2 text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                  (loading categories/brands…)
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SoftButton onClick={() => fetchProducts()} disabled={loadingList || loadingMore}>
              {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Refresh
            </SoftButton>

            <PrimaryButton onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New product
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
            <div
              className="flex h-12 items-center gap-2 rounded-2xl px-3"
              style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, cursor: "text" }}
            >
              <Search className="h-4 w-4" style={{ color: PALETTE.muted }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products… (title or slug)"
                className="w-full bg-transparent text-sm font-medium outline-none"
                style={{ color: PALETTE.navy }}
              />
              {search ? (
                <button
                  onClick={() => setSearch("")}
                  className="grid h-9 w-9 place-items-center rounded-xl hover:opacity-90"
                  style={{ cursor: "pointer" }}
                >
                  <X className="h-4 w-4" style={{ color: PALETTE.muted }} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
              style={{
                background: PALETTE.card,
                border: `1px solid ${PALETTE.border}`,
                color: PALETTE.navy,
                cursor: "pointer",
              }}
            >
              <option value="">All status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
              style={{
                background: PALETTE.card,
                border: `1px solid ${PALETTE.border}`,
                color: PALETTE.navy,
                cursor: "pointer",
              }}
            >
              <option value="">All visibility</option>
              <option value="public">Public</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
              style={{
                background: PALETTE.card,
                border: `1px solid ${PALETTE.border}`,
                color: PALETTE.navy,
                cursor: "pointer",
              }}
            >
              <option value="">All categories</option>
              {(categories || []).map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
              style={{
                background: PALETTE.card,
                border: `1px solid ${PALETTE.border}`,
                color: PALETTE.navy,
                cursor: "pointer",
              }}
            >
              <option value="">All brands</option>
              {(brands || []).map((b) => (
                <option key={b._id || b.id} value={b._id || b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* list */}
        <div className="mt-5">
          {error ? (
            <div
              className="rounded-3xl px-5 py-4 text-sm font-medium"
              style={{
                background: "rgba(255,107,107,0.10)",
                border: "1px solid rgba(255,107,107,0.25)",
                color: PALETTE.navy,
              }}
            >
              {error}
            </div>
          ) : null}

          <div
            className="mt-4 overflow-hidden rounded-3xl"
            style={{
              background: "rgba(255,255,255,0.96)",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 18px 46px rgba(0,31,63,0.08)",
            }}
          >
            <div className="grid grid-cols-12 gap-3 px-5 py-4 text-xs font-medium" style={{ color: PALETTE.muted }}>
              <div className="col-span-5">Product</div>
              <div className="col-span-3">Category / Brand</div>
              <div className="col-span-2">Visibility</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="grid gap-3 px-5 pb-5">
              {loadingList ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-2xl p-6 text-sm font-medium" style={{ color: PALETTE.muted }}>
                  No products found.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const id = p._id || p.id;
                  const img = p?.primaryImage?.url;
                  const catName = p?.category?.name || "—";
                  const brandName = p?.brand?.name || "—";
                  const isDeleting = deletingId === String(id);

                  const featured = Boolean(p?.isFeatured);
                  const visibility = String(p?.visibility || "public");

                  return (
                    <motion.div
                      key={id}
                      layout
                      {...rowAnim}
                      className="grid grid-cols-12 items-center gap-3 rounded-2xl p-4"
                      style={{
                        background: "rgba(0,31,63,0.02)",
                        border: `1px solid ${PALETTE.border}`,
                        boxShadow: "0 10px 22px rgba(0,31,63,0.04)",
                      }}
                    >
                      <div className="col-span-12 md:col-span-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl"
                            style={{ background: "#fff", border: `1px solid ${PALETTE.border}` }}
                          >
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt={p?.title || "product"} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5" style={{ color: PALETTE.muted }} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold" style={{ color: PALETTE.navy }}>
                              {p.title}
                            </div>
                            <div className="truncate text-xs font-medium" style={{ color: PALETTE.muted }}>
                              /{p.slug} • ৳{p.finalPrice ?? p.salePrice ?? p.price ?? 0}
                              {p.salePrice != null ? (
                                <span className="ml-2" style={{ color: "rgba(16,185,129,0.95)" }}>
                                  sale
                                </span>
                              ) : null}
                              {p.status ? (
                                <span className="ml-2" style={{ color: PALETTE.muted }}>
                                  • {p.status}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-3">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className="rounded-full px-3 py-1 text-[11px] font-medium"
                            style={{
                              background: "rgba(0,31,63,0.04)",
                              border: `1px solid ${PALETTE.border}`,
                              color: PALETTE.navy,
                            }}
                          >
                            {catName}
                          </span>
                          <span
                            className="rounded-full px-3 py-1 text-[11px] font-medium"
                            style={{
                              background: "rgba(255,126,105,0.10)",
                              border: `1px solid ${PALETTE.border}`,
                              color: PALETTE.navy,
                            }}
                          >
                            {brandName}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-8 md:col-span-2">
                        <div className="flex items-center gap-2">
                          <SoftButton
                            className="px-3 py-2"
                            onClick={() => quickToggleVisibility(p, visibility === "public" ? "hidden" : "public")}
                            style={{ cursor: "pointer" }}
                          >
                            {visibility === "public" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            <span className="text-xs">{visibility}</span>
                          </SoftButton>

                          <button
                            className="grid h-10 w-10 place-items-center rounded-2xl cursor-pointer hover:opacity-90"
                            style={{ background: "rgba(0,31,63,0.04)", border: `1px solid ${PALETTE.border}` }}
                            onClick={() => quickToggleFeatured(p, !featured)}
                            title="Toggle featured"
                          >
                            <Star className="h-4 w-4" style={{ color: featured ? PALETTE.gold : PALETTE.muted }} />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-4 md:col-span-2 flex justify-end gap-2">
                        <SoftButton className="px-3 py-2" onClick={() => openEdit(p)} style={{ cursor: "pointer" }}>
                          <Pencil className="h-4 w-4" />
                        </SoftButton>

                        <DangerButton
                          className="px-3 py-2"
                          onClick={() => deleteProduct(id)}
                          disabled={isDeleting}
                          style={{ cursor: "pointer" }}
                        >
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </DangerButton>
                      </div>
                    </motion.div>
                  );
                })
              )}

              <div className="pt-2">
                <div
                  className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                  style={{ background: "rgba(0,31,63,0.02)", border: `1px dashed ${PALETTE.border}` }}
                >
                  <div className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Tip: Use filters to narrow down products.
                  </div>

                  <SoftButton className="px-3 py-2" onClick={() => fetchProducts()} disabled={loadingList} style={{ cursor: "pointer" }}>
                    {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                    Reload
                  </SoftButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* modal */}
        <ModalShell
          open={modalOpen}
          onClose={() => (saving ? null : setModalOpen(false))}
          title={editing ? "Edit product" : "Create product"}
          subtitle="Primary image is required for create. Brand must belong to selected category. Subcategory must belong to category."
          footer={
            <>
              <div className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                {editing ? "Update fields and save." : "Fill required fields and upload primary image."}
              </div>
              <div className="flex gap-2">
                <SoftButton onClick={() => (!saving ? setModalOpen(false) : null)} disabled={saving} style={{ cursor: "pointer" }}>
                  Cancel
                </SoftButton>

                <PrimaryButton onClick={saveProduct} disabled={!canSave}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </PrimaryButton>
              </div>
            </>
          }
        >
          {/* hidden file inputs */}
          <input
            ref={primaryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickPrimary(e.target.files?.[0] || null)}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onPickGallery(e.target.files || [])}
          />

          <div className="grid gap-4 md:grid-cols-12">
            {/* left form */}
            <div className="md:col-span-7">
              <label className="grid gap-2">
                <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                  Title *
                </span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      title: e.target.value,
                      slug: p.slug ? p.slug : slugify(e.target.value),
                    }))
                  }
                  className="h-12 rounded-2xl px-3 text-sm font-medium outline-none"
                  style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                  placeholder="e.g. Premium Hoodie"
                />
              </label>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Slug *
                  </span>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                    className="h-12 rounded-2xl px-3 text-sm font-medium outline-none"
                    style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                    placeholder="auto from title"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Price *
                  </span>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    className="h-12 rounded-2xl px-3 text-sm font-medium outline-none"
                    style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                    placeholder="e.g. 1299"
                  />
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Sale price (optional)
                  </span>
                  <input
                    type="number"
                    value={form.salePrice}
                    onChange={(e) => setForm((p) => ({ ...p, salePrice: e.target.value }))}
                    className="h-12 rounded-2xl px-3 text-sm font-medium outline-none"
                    style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                    placeholder="e.g. 999"
                  />
                </label>

                <div className="grid gap-2">
                  <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Featured
                  </span>
                  <div
                    className="flex items-center justify-between rounded-2xl px-3"
                    style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, height: 48 }}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" style={{ color: form.isFeatured ? PALETTE.gold : PALETTE.muted }} />
                      <span className="text-sm font-medium" style={{ color: PALETTE.navy }}>
                        {form.isFeatured ? "Featured" : "Not featured"}
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={Boolean(form.isFeatured)}
                      onChange={(v) => setForm((p) => ({ ...p, isFeatured: Boolean(v) }))}
                    />
                  </div>
                </div>
              </div>

              {/* taxonomy */}
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Category *
                  </span>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const nextCat = e.target.value;
                      setForm((p) => ({
                        ...p,
                        category: nextCat,
                        subcategory: "", // reset subcategory when category changes
                      }));
                    }}
                    className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
                    style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy, cursor: "pointer" }}
                  >
                    <option value="">Select category…</option>
                    {(categories || []).map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Subcategory (optional)
                  </span>
                  <select
                    value={form.subcategory}
                    onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))}
                    className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
                    style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy, cursor: "pointer" }}
                    disabled={!form.category}
                  >
                    <option value="">{form.category ? "Select subcategory…" : "Pick category first"}</option>
                    {(subcategories || []).map((sc) => (
                      <option key={sc._id} value={sc._id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                    Brand *
                  </span>
                  <select
                    value={form.brand}
                    onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                    className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
                    style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy, cursor: "pointer" }}
                  >
                    <option value="">Select brand…</option>
                    {(brands || []).map((b) => (
                      <option key={b._id || b.id} value={b._id || b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px]" style={{ color: PALETTE.muted }}>
                    Note: Your backend enforces Brand.categoryIds includes selected category.
                  </div>
                </label>

                <div className="grid gap-3">
                  <label className="grid gap-2">
                    <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                      Status
                    </span>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                      className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
                      style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy, cursor: "pointer" }}
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                      Visibility
                    </span>
                    <select
                      value={form.visibility}
                      onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value }))}
                      className="h-12 w-full rounded-2xl px-3 text-sm font-medium outline-none"
                      style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy, cursor: "pointer" }}
                    >
                      <option value="public">public</option>
                      <option value="hidden">hidden</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* descriptions */}
              <label className="mt-3 grid gap-2">
                <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                  Short description (optional)
                </span>
                <input
                  value={form.shortDescription}
                  onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
                  className="h-12 rounded-2xl px-3 text-sm font-medium outline-none"
                  style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                  placeholder="Up to 400 chars"
                />
              </label>

              <label className="mt-3 grid gap-2">
                <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                  Description (optional)
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="min-h-[110px] rounded-2xl px-3 py-3 text-sm font-medium outline-none"
                  style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                  placeholder="Rich text / HTML allowed"
                />
              </label>

              {/* tags */}
              <label className="mt-3 grid gap-2">
                <span className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                  Tags (comma separated)
                </span>
                <input
                  value={form.tagsInput}
                  onChange={(e) => setForm((p) => ({ ...p, tagsInput: e.target.value }))}
                  className="h-12 rounded-2xl px-3 text-sm font-medium outline-none"
                  style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                  placeholder="e.g. winter, hoodie, premium"
                />
                <div className="text-[11px]" style={{ color: PALETTE.muted }}>
                  Will be sent as JSON array to backend: <code>["winter","hoodie"]</code>
                </div>
              </label>

              {/* features */}
              <div className="mt-4 rounded-3xl p-4" style={{ background: "rgba(0,31,63,0.02)", border: `1px solid ${PALETTE.border}` }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: PALETTE.navy }}>
                      Features (optional)
                    </div>
                    <div className="text-xs font-medium" style={{ color: PALETTE.muted }}>
                      label/value required per item. isKey shows as top highlights.
                    </div>
                  </div>
                  <SoftButton className="px-3 py-2" onClick={addFeatureRow} style={{ cursor: "pointer" }}>
                    <Plus className="h-4 w-4" />
                    Add
                  </SoftButton>
                </div>

                {Array.isArray(form.features) && form.features.length ? (
                  <div className="mt-3 grid gap-3">
                    {form.features.map((f, idx) => (
                      <div
                        key={idx}
                        className="rounded-3xl p-3"
                        style={{ background: "#fff", border: `1px solid ${PALETTE.border}` }}
                      >
                        <div className="grid gap-3 md:grid-cols-12">
                          <label className="md:col-span-4 grid gap-2">
                            <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                              Label
                            </span>
                            <input
                              value={f?.label || ""}
                              onChange={(e) => updateFeatureRow(idx, { label: e.target.value })}
                              className="h-11 rounded-2xl px-3 text-sm font-medium outline-none"
                              style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                              placeholder="e.g. Material"
                            />
                          </label>

                          <label className="md:col-span-5 grid gap-2">
                            <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                              Value
                            </span>
                            <input
                              value={f?.value || ""}
                              onChange={(e) => updateFeatureRow(idx, { value: e.target.value })}
                              className="h-11 rounded-2xl px-3 text-sm font-medium outline-none"
                              style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                              placeholder="e.g. 100% Cotton"
                            />
                          </label>

                          <div className="md:col-span-3 grid gap-2">
                            <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                              Key / Order
                            </span>
                            <div className="flex items-center gap-2">
                              <ToggleSwitch
                                checked={Boolean(f?.isKey)}
                                onChange={(v) => updateFeatureRow(idx, { isKey: Boolean(v) })}
                                size="sm"
                              />
                              <input
                                type="number"
                                value={Number(f?.order ?? 0)}
                                onChange={(e) => updateFeatureRow(idx, { order: Number(e.target.value || 0) })}
                                className="h-11 w-full rounded-2xl px-3 text-sm font-medium outline-none"
                                style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                              />
                            </div>
                          </div>

                          <label className="md:col-span-9 grid gap-2">
                            <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                              Group (optional)
                            </span>
                            <input
                              value={f?.group || ""}
                              onChange={(e) => updateFeatureRow(idx, { group: e.target.value })}
                              className="h-11 rounded-2xl px-3 text-sm font-medium outline-none"
                              style={{ background: "#fff", border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                              placeholder="e.g. Specs"
                            />
                          </label>

                          <div className="md:col-span-3 flex items-end justify-end">
                            <DangerButton className="px-3 py-2" onClick={() => removeFeatureRow(idx)} style={{ cursor: "pointer" }}>
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </DangerButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-xs font-medium" style={{ color: PALETTE.muted }}>
                    No features added yet.
                  </div>
                )}
              </div>
            </div>

            {/* right images */}
            <div className="md:col-span-5 grid gap-4">
              <ImagePickerCard
                title="Primary image"
                required={!editing}
                disabled={saving}
                previewUrl={form.primaryPreview}
                existingUrl={form.existingPrimaryUrl}
                hint={editing ? "Upload to replace (optional)." : "Primary image is required for create."}
                errorText={!editing && !form.primaryFile ? "Primary image is required." : ""}
                onPickFile={onPickPrimary}
                onOpenPicker={() => primaryRef.current?.click()}
                onClear={clearPrimary}
                height={240}
              />

              <ImagePickerCard
                title="Gallery images"
                required={false}
                disabled={saving}
                previewUrl={form.galleryPreviews?.[0] || ""}
                existingUrl={form.existingGalleryUrls?.[0] || ""}
                hint="Optional. If you pick new gallery images, old gallery will be replaced (per your API)."
                errorText=""
                onPickFile={() => {}}
                onOpenPicker={() => galleryRef.current?.click()}
                onClear={clearGalleryPicked}
                height={240}
              />

              {/* preview thumbnails for gallery */}
              {((form.galleryPreviews?.length || 0) > 1 || (form.existingGalleryUrls?.length || 0) > 1) ? (
                <div className="rounded-3xl p-4" style={{ background: "rgba(0,31,63,0.02)", border: `1px solid ${PALETTE.border}` }}>
                  <div className="text-sm font-semibold" style={{ color: PALETTE.navy }}>
                    Gallery preview
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {(form.galleryPreviews?.length ? form.galleryPreviews : form.existingGalleryUrls).slice(0, 8).map((u, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={u} alt={`g${i}`} className="h-16 w-full rounded-2xl object-cover" />
                    ))}
                  </div>
                  <div className="mt-2 text-[11px]" style={{ color: PALETTE.muted }}>
                    Showing up to 8 thumbnails.
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </ModalShell>
      </div>
    </main>
  );
}