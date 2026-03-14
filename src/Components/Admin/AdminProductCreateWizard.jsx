"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Tag,
  Package,
  Layers,
  Sparkles,
  Flame,
  Save,
  Loader2,
  Barcode as BarcodeIcon,
  Boxes,
  Info,
  RefreshCcw,
  FolderTree,
  ListTree,
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
  soft: "rgba(11,27,51,0.035)",
  soft2: "rgba(11,27,51,0.05)",
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

const ALLOWED_PRODUCT_TYPE = ["simple", "variable"];

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

function toNumber(v, fallback = null) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function slugify(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function randomDigits(len = 13) {
  let out = "";
  for (let i = 0; i < len; i += 1) out += Math.floor(Math.random() * 10);
  return out;
}

function showToast(kind, message) {
  const base = {
    duration: 3200,
    style: {
      background: "rgba(255,255,255,0.92)",
      color: PALETTE.navy,
      border: `1px solid ${PALETTE.border}`,
      boxShadow: "0 18px 50px rgba(0,31,63,0.14)",
      borderRadius: 18,
      padding: "12px 14px",
      backdropFilter: "blur(10px)",
      fontWeight: 500,
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
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

const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"';

const TW = {
  title: "text-[20px] sm:text-[22px] font-bold tracking-tight",
  sectionTitle: "text-[16px] font-semibold tracking-tight",
  label: "text-[12px] font-semibold tracking-wide",
  input: "text-sm font-medium",
  helper: "text-[12px] font-medium",
  chip: "text-[12px] font-semibold",
  button: "text-sm font-semibold",
  pill: "text-[12px] font-semibold",
};

const Card = React.memo(function Card({ children, className }) {
  return (
    <div
      className={cx("rounded-[24px] overflow-hidden", className)}
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 18px 55px rgba(0,31,63,0.08)",
        fontFamily: FONT_STACK,
      }}
    >
      {children}
    </div>
  );
});

const Divider = React.memo(function Divider({ className }) {
  return (
    <div
      className={cx(className)}
      style={{ height: 1, width: "100%", background: "rgba(2,10,25,0.06)" }}
    />
  );
});

const Label = React.memo(function Label({ children }) {
  return (
    <span className={TW.label} style={{ color: PALETTE.navy, fontFamily: FONT_STACK }}>
      {children}
    </span>
  );
});

const InfoPill = React.memo(function InfoPill({ children }) {
  return (
    <span
      className="inline-flex items-center rounded-2xl px-3 py-2 text-[12px] font-semibold"
      style={{
        background: "rgba(255,255,255,0.96)",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
        boxShadow: "0 10px 22px rgba(0,31,63,.05)",
        fontFamily: FONT_STACK,
      }}
    >
      {children}
    </span>
  );
});

const Field = React.memo(function Field({
  label,
  required,
  icon: Icon,
  rightSlot,
  children,
  className,
  multiline = false,
  hideIcon = false,
}) {
  return (
    <label className={cx("grid gap-2", className)} style={{ fontFamily: FONT_STACK }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {label ? <Label>{label}</Label> : null}
          {required ? <span className="text-[12px] font-semibold text-rose-600">*</span> : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>

      <div
        className={cx(
          "group gap-2 overflow-hidden rounded-2xl px-3 transition",
          "focus-within:ring-2 focus-within:ring-offset-2",
          multiline ? "block py-3" : "flex min-h-11 items-center"
        )}
        style={{
          background: "rgba(255,255,255,0.98)",
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {!hideIcon && Icon ? (
          <div className={cx("shrink-0", multiline ? "mb-2" : "")}>
            <Icon className="h-4 w-4 shrink-0" style={{ color: PALETTE.muted }} />
          </div>
        ) : null}
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
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-95 active:scale-[0.99]",
        TW.button,
        className
      )}
      style={{
        background: "rgba(255,255,255,0.96)",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
        boxShadow: "0 10px 24px rgba(0,31,63,.06)",
        fontFamily: FONT_STACK,
        minHeight: 42,
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
        "group relative overflow-hidden rounded-2xl px-4 py-2.5 text-white transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer active:scale-[0.99]",
        TW.button,
        className
      )}
      style={{
        background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
        boxShadow: "0 16px 34px rgba(0,31,63,.20)",
        fontFamily: FONT_STACK,
        minHeight: 42,
      }}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.navy}, ${PALETTE.gold})`,
            opacity: 0.22,
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

function ToggleSwitch({ checked, onChange, disabled }) {
  const dims = { w: 44, h: 26, pad: 3, knob: 19 };
  const xOn = dims.w - dims.pad - dims.knob;
  const xOff = dims.pad;

  const bg = checked ? "rgba(16,185,129,0.18)" : "rgba(2,10,25,0.08)";
  const bd = checked ? "1px solid rgba(16,185,129,0.30)" : `1px solid ${PALETTE.border}`;

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

function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={cx("w-full bg-transparent outline-none", TW.input, className)}
      style={{ color: PALETTE.navy, height: 42, fontFamily: FONT_STACK }}
    />
  );
}

function Textarea({ className, rows = 4, ...props }) {
  return (
    <textarea
      {...props}
      rows={rows}
      className={cx("w-full bg-transparent outline-none resize-none leading-6", TW.input, className)}
      style={{
        color: PALETTE.navy,
        fontFamily: FONT_STACK,
        minHeight: rows * 24,
        paddingTop: 2,
        paddingBottom: 2,
      }}
    />
  );
}

function Select({ className, children, ...props }) {
  return (
    <select
      {...props}
      className={cx("w-full bg-transparent outline-none cursor-pointer", TW.input, className)}
      style={{ color: PALETTE.navy, height: 42, fontFamily: FONT_STACK }}
    >
      {children}
    </select>
  );
}

function Chip({ children, onRemove }) {
  return (
    <span
      className={cx("inline-flex items-center gap-2 rounded-full px-3 py-1.5", TW.chip)}
      style={{
        background: "rgba(255,255,255,0.92)",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
        boxShadow: "0 10px 22px rgba(0,31,63,.04)",
        fontFamily: FONT_STACK,
      }}
    >
      <Tag className="h-3.5 w-3.5" style={{ color: PALETTE.muted }} />
      <span className="max-w-[220px] truncate">{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full transition hover:opacity-90"
          style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
          aria-label="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" style={{ color: PALETTE.navy }} />
        </button>
      ) : null}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ fontFamily: FONT_STACK }}>
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="grid h-11 w-11 place-items-center rounded-3xl shrink-0"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.18), rgba(11,27,51,0.05) 65%), #fff",
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 12px 26px rgba(0,31,63,.07)",
          }}
        >
          <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
        </div>

        <div className="min-w-0">
          <div className={TW.sectionTitle} style={{ color: PALETTE.navy }}>
            {title}
          </div>
          {subtitle ? (
            <div className={TW.helper} style={{ color: PALETTE.muted, marginTop: 4 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function FileDrop({ label, accept, multiple, onFiles, previewUrls }) {
  const inputRef = useRef(null);

  return (
    <div className="space-y-2" style={{ fontFamily: FONT_STACK }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={TW.label} style={{ color: PALETTE.navy }}>
          {label}
        </div>

        <SoftButton type="button" icon={Upload} onClick={() => inputRef.current?.click()}>
          Choose {multiple ? "files" : "file"}
        </SoftButton>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            onFiles(files);
            e.target.value = "";
          }}
        />
      </div>

      <div
        className="rounded-[24px] border border-dashed p-4"
        style={{
          borderColor: "rgba(2,10,25,0.14)",
          background: "rgba(11,27,51,0.03)",
        }}
      >
        {previewUrls?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {previewUrls.map((src, i) => (
              <div
                key={src + i}
                className="group relative overflow-hidden rounded-2xl"
                style={{ border: `1px solid ${PALETTE.border}`, background: "rgba(255,255,255,0.92)" }}
              >
                <img src={src} alt="" className="h-28 w-full object-cover" />
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3" style={{ color: PALETTE.muted }}>
            <div
              className="grid h-10 w-10 place-items-center rounded-3xl"
              style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${PALETTE.border}` }}
            >
              <ImageIcon className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </div>
            <div className={TW.helper}>
              Drop images here. <span className="font-semibold">{accept || "images"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VariantImageUploader({ variant, onFiles, onRemoveImage }) {
  const inputRef = useRef(null);
  const previews = Array.isArray(variant?.images) ? variant.images : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className={TW.label} style={{ color: PALETTE.navy }}>
            Variant images
          </div>
          <div className={TW.helper} style={{ color: PALETTE.muted, marginTop: 4 }}>
            Upload images only for this exact combination.
          </div>
        </div>

        <SoftButton type="button" icon={Upload} onClick={() => inputRef.current?.click()}>
          Add images
        </SoftButton>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            onFiles(files);
            e.target.value = "";
          }}
        />
      </div>

      <div
        className="rounded-[24px] border border-dashed p-4"
        style={{
          borderColor: "rgba(2,10,25,0.14)",
          background: "rgba(11,27,51,0.03)",
        }}
      >
        {previews.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {previews.map((img, idx) => (
              <div
                key={img.id}
                className="relative overflow-hidden rounded-2xl"
                style={{
                  border: `1px solid ${PALETTE.border}`,
                  background: "rgba(255,255,255,0.92)",
                }}
              >
                <img src={img.preview} alt="" className="h-28 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.navy,
                    boxShadow: "0 8px 20px rgba(0,31,63,0.12)",
                  }}
                  title="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3" style={{ color: PALETTE.muted }}>
            <div
              className="grid h-10 w-10 place-items-center rounded-3xl"
              style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${PALETTE.border}` }}
            >
              <ImageIcon className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </div>
            <div className={TW.helper}>No variant images yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function createEmptySpec(order = 0) {
  return {
    id: uid(),
    label: "",
    value: "",
    isHighlighted: false,
    order,
  };
}

function createSpecGroup(name = "General", order = 0) {
  return {
    id: uid(),
    name,
    order,
    specs: [createEmptySpec(0)],
  };
}

export default function AdminCreateProductPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  const [busy, setBusy] = useState(false);

  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState("");

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");

  const [productType, setProductType] = useState("simple");

  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");

  const [barcode, setBarcode] = useState("");
  const [stockQty, setStockQty] = useState(0);

  const [isNew, setIsNew] = useState(false);
  const [isTrending, setIsTrending] = useState(false);

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  const [descriptionBlocks, setDescriptionBlocks] = useState([
    { id: uid(), title: "Overview", details: "", order: 0 },
  ]);

  const [specGroups, setSpecGroups] = useState([createSpecGroup("General", 0)]);

  const [variants, setVariants] = useState([
    {
      id: uid(),
      barcode: "",
      attributes: { storage: "128GB", color: "Green" },
      price: "",
      salePrice: "",
      stockQty: 0,
      isActive: true,
      images: [],
    },
  ]);

  const [primaryFile, setPrimaryFile] = useState(null);
  const [primaryPreview, setPrimaryPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const finalSlug = useMemo(() => slugify(title), [title]);

  const selectedCategoryObj = useMemo(
    () => categories.find((c) => String(c?._id) === String(category)) || null,
    [categories, category]
  );

  const subcategoryOptions = useMemo(() => {
    const subs = Array.isArray(selectedCategoryObj?.subcategories) ? selectedCategoryObj.subcategories : [];
    return subs
      .map((s) => ({ _id: s?._id, name: s?.name || s?.title || "Subcategory", slug: s?.slug }))
      .filter((s) => s?._id);
  }, [selectedCategoryObj]);

  const filteredBrands = useMemo(() => {
    if (!category) return brands;
    const matched = brands.filter((b) => {
      if (!Array.isArray(b.categoryIds) || !b.categoryIds.length) return true;
      return b.categoryIds.map(String).includes(String(category));
    });
    return matched;
  }, [brands, category]);

  const highlightedSpecsPreview = useMemo(() => {
    const out = [];
    specGroups.forEach((group) => {
      (group.specs || []).forEach((spec) => {
        const label = String(spec?.label || "").trim();
        const value = String(spec?.value || "").trim();
        if (!spec?.isHighlighted || !label || !value) return;
        out.push(`${label}: ${value}`);
      });
    });
    return out;
  }, [specGroups]);

  async function fetchMeta() {
    setMetaLoading(true);
    setMetaError("");

    try {
      const token = getStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [catRes, brandRes] = await Promise.all([
        fetch("/api/admin/categories?status=active&limit=200", { headers, credentials: "include" }),
        fetch("/api/admin/brands?status=active&limit=200", { headers, credentials: "include" }),
      ]);

      const catData = await catRes.json().catch(() => ({}));
      const brandData = await brandRes.json().catch(() => ({}));

      if (!catRes.ok) throw new Error(catData?.message || catData?.error || "Failed to load categories");
      if (!brandRes.ok) throw new Error(brandData?.message || brandData?.error || "Failed to load brands");

      const rawCats =
        (Array.isArray(catData?.items) && catData.items) ||
        (Array.isArray(catData?.categories) && catData.categories) ||
        (Array.isArray(catData?.data) && catData.data) ||
        (Array.isArray(catData) && catData) ||
        [];

      const rawBrands =
        (Array.isArray(brandData?.items) && brandData.items) ||
        (Array.isArray(brandData?.brands) && brandData.brands) ||
        (Array.isArray(brandData?.data) && brandData.data) ||
        (Array.isArray(brandData) && brandData) ||
        [];

      setCategories(
        rawCats
          .map((c) => ({
            _id: String(c?._id || c?.id || ""),
            name: c?.name || c?.title || "Category",
            slug: c?.slug || "",
            subcategories: Array.isArray(c?.subcategories) ? c.subcategories : [],
          }))
          .filter((c) => c._id)
      );

      setBrands(
        rawBrands
          .map((b) => ({
            _id: String(b?._id || b?.id || ""),
            name: b?.name || b?.title || "Brand",
            slug: b?.slug || "",
            categoryIds: Array.isArray(b?.categoryIds) ? b.categoryIds : [],
          }))
          .filter((b) => b._id)
      );

      setMetaLoading(false);
    } catch (e) {
      setMetaLoading(false);
      setMetaError(e?.message || "Failed to load dropdown data");
    }
  }

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    if (!subcategory) return;
    const ok = subcategoryOptions.some((s) => String(s._id) === String(subcategory));
    if (!ok) setSubcategory("");
  }, [category, subcategory, subcategoryOptions]);

  useEffect(() => {
    if (!brand) return;
    const ok = filteredBrands.some((b) => String(b._id) === String(brand));
    if (!ok) setBrand("");
  }, [category, filteredBrands, brand]);

  useEffect(() => {
    return () => {
      if (primaryPreview) URL.revokeObjectURL(primaryPreview);
      galleryPreviews.forEach((u) => URL.revokeObjectURL(u));
      variants.forEach((v) => {
        (v.images || []).forEach((img) => {
          if (img?.preview) URL.revokeObjectURL(img.preview);
        });
      });
    };
  }, [primaryPreview, galleryPreviews, variants]);

  const missingRequired = useMemo(() => {
    if (!title.trim()) return "Product name is required";
    if (!finalSlug) return "Slug is required";
    if (!category.trim()) return "Category is required";
    if (!brand.trim()) return "Brand is required";
    if (!primaryFile) return "Primary image is required";

    if (productType === "simple") {
      if (toNumber(price, null) === null) return "Price is required for simple product";
      if (typeof toNumber(stockQty, null) !== "number") return "Stock qty is required";
      const p = toNumber(price, null);
      const sp = salePrice === "" ? null : toNumber(salePrice, null);
      if (typeof p === "number" && typeof sp === "number" && sp > p) return "Sale price cannot exceed price";
      return null;
    }

    if (!variants || variants.length === 0) return "At least one variant is required";
    const active = variants.filter((v) => v?.isActive !== false);
    if (!active.length) return "At least one active variant is required";

    const missingBarcode = active.some((v) => !String(v?.barcode || "").trim());
    if (missingBarcode) return "Each active variant requires a barcode";

    const missingPrice = active.some((v) => toNumber(v?.price, null) === null || toNumber(v?.price, null) < 0);
    if (missingPrice) return "Each active variant requires a valid price";

    const badSale = active.some((v) => {
      const vp = toNumber(v?.price, null);
      const vsp = v?.salePrice === "" ? null : toNumber(v?.salePrice, null);
      return typeof vp === "number" && typeof vsp === "number" && vsp > vp;
    });
    if (badSale) return "Variant sale price cannot exceed variant price";

    return null;
  }, [title, finalSlug, category, brand, primaryFile, productType, price, salePrice, stockQty, variants]);

  function addTag(raw) {
    const t = String(raw || "").trim();
    if (!t) return;
    setTags((prev) => Array.from(new Set([...prev, t])));
  }

  function removeTag(t) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  function setPrimary(files) {
    const f = files?.[0] || null;
    setPrimaryFile(f);
    if (primaryPreview) URL.revokeObjectURL(primaryPreview);
    setPrimaryPreview(f ? URL.createObjectURL(f) : "");
  }

  function setGallery(files) {
    galleryPreviews.forEach((u) => URL.revokeObjectURL(u));
    setGalleryFiles(files);
    setGalleryPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  function addVariantImages(variantId, files) {
    if (!files?.length) return;
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== variantId) return v;
        const nextImages = [
          ...(Array.isArray(v.images) ? v.images : []),
          ...files.map((file) => ({
            id: uid(),
            file,
            preview: URL.createObjectURL(file),
          })),
        ];
        return { ...v, images: nextImages };
      })
    );
  }

  function removeVariantImage(variantId, imageIndex) {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== variantId) return v;
        const imgs = Array.isArray(v.images) ? [...v.images] : [];
        const removed = imgs[imageIndex];
        if (removed?.preview) URL.revokeObjectURL(removed.preview);
        imgs.splice(imageIndex, 1);
        return { ...v, images: imgs };
      })
    );
  }

  function removeVariantCompletely(variantId) {
    setVariants((prev) => {
      const found = prev.find((x) => x.id === variantId);
      if (found?.images?.length) {
        found.images.forEach((img) => {
          if (img?.preview) URL.revokeObjectURL(img.preview);
        });
      }
      return prev.filter((x) => x.id !== variantId);
    });
  }

  function cleanDescriptionForApi(list) {
    return (Array.isArray(list) ? list : [])
      .map((b, idx) => ({
        title: String(b.title || "").trim(),
        details: typeof b.details === "string" ? b.details : String(b.details ?? ""),
        order: Number.isFinite(Number(b.order)) ? Number(b.order) : idx,
      }))
      .filter((b) => b.title || String(b.details || "").trim());
  }

  function cleanSpecsPayload(groups) {
    const specifications = [];
    const highlights = [];
    let globalOrder = 0;

    (Array.isArray(groups) ? groups : []).forEach((group, groupIndex) => {
      const groupName = String(group?.name || "").trim() || `Group ${groupIndex + 1}`;
      const specs = Array.isArray(group?.specs) ? group.specs : [];

      specs.forEach((spec, specIndex) => {
        const label = String(spec?.label || "").trim();
        const value = String(spec?.value || "").trim();
        if (!label || !value) return;

        const isHighlighted = Boolean(spec?.isHighlighted);
        const entry = {
          key: slugify(label) || `spec-${groupIndex + 1}-${specIndex + 1}`,
          label,
          value,
          valueType: "text",
          unit: "",
          group: groupName,
          isFilterable: false,
          isComparable: true,
          isHighlighted,
          order: globalOrder,
        };

        specifications.push(entry);

        if (isHighlighted) {
          highlights.push(`${label}: ${value}`);
        }

        globalOrder += 1;
      });
    });

    return { specifications, highlights };
  }

  function cleanVariantsForApi(list) {
    return (Array.isArray(list) ? list : [])
      .map((v) => {
        const attrs = v.attributes && typeof v.attributes === "object" ? v.attributes : {};
        const attributes = {};

        Object.entries(attrs).forEach(([k, val]) => {
          const kk = String(k || "").trim();
          const vv = String(val ?? "").trim();
          if (!kk || !vv) return;
          attributes[kk] = vv;
        });

        const cleanBarcode = String(v.barcode || "").trim();

        return {
          barcode: cleanBarcode,
          attributes,
          price: v.price === "" ? null : toNumber(v.price, null),
          salePrice: v.salePrice === "" ? null : toNumber(v.salePrice, null),
          stockQty: Math.max(0, toNumber(v.stockQty, 0) ?? 0),
          images: (Array.isArray(v.images) ? v.images : []).map((img, idx) => ({
            alt: "",
            order: idx,
          })),
          isActive: v.isActive !== false,
        };
      })
      .filter((v) => v.barcode || Object.keys(v.attributes || {}).length > 0);
  }

  function generateMainBarcode() {
    const code = randomDigits(13);
    setBarcode(code);
    showToast("success", "Barcode generated");
  }

  function generateVariantBarcode(vid) {
    const code = randomDigits(13);
    setVariants((prev) => prev.map((x) => (x.id === vid ? { ...x, barcode: code } : x)));
    showToast("success", "Variant barcode generated");
  }

  function addSpecGroup() {
    setSpecGroups((prev) => [...prev, createSpecGroup("", prev.length)]);
  }

  function removeSpecGroup(groupId) {
    setSpecGroups((prev) => prev.filter((g) => g.id !== groupId).map((g, i) => ({ ...g, order: i })));
  }

  function updateSpecGroup(groupId, patch) {
    setSpecGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  }

  function addSpecToGroup(groupId) {
    setSpecGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              specs: [...(g.specs || []), createEmptySpec((g.specs || []).length)],
            }
          : g
      )
    );
  }

  function updateSpec(groupId, specId, patch) {
    setSpecGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              specs: (g.specs || []).map((s) => (s.id === specId ? { ...s, ...patch } : s)),
            }
          : g
      )
    );
  }

  function removeSpec(groupId, specId) {
    setSpecGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              specs: (g.specs || [])
                .filter((s) => s.id !== specId)
                .map((s, i) => ({ ...s, order: i })),
            }
          : g
      )
    );
  }

  async function onSubmit(e) {
    e.preventDefault();

    const reqMissing = missingRequired;
    if (reqMissing) return showToast("error", reqMissing);

    if (!ALLOWED_PRODUCT_TYPE.includes(productType)) return showToast("error", "Invalid productType");

    const { specifications, highlights } = cleanSpecsPayload(specGroups);
    const fd = new FormData();

    fd.set("title", title.trim());
    fd.set("slug", finalSlug);
    fd.set("category", category.trim());
    fd.set("brand", brand.trim());
    if (subcategory.trim()) fd.set("subcategory", subcategory.trim());

    fd.set("productType", productType);
    fd.set("isNew", String(Boolean(isNew)));
    fd.set("isTrending", String(Boolean(isTrending)));

    fd.set("tags", JSON.stringify(tags));
    fd.set("description", JSON.stringify(cleanDescriptionForApi(descriptionBlocks)));
    fd.set("specifications", JSON.stringify(specifications));
    fd.set("highlights", JSON.stringify(highlights));

    if (productType === "simple") {
      const p = toNumber(price, null);
      const sp = salePrice === "" ? null : toNumber(salePrice, null);

      if (typeof p !== "number" || p < 0) return showToast("error", "Invalid price");
      if (typeof sp === "number" && sp > p) return showToast("error", "Sale price cannot exceed price");

      fd.set("price", String(p));
      if (salePrice !== "" && sp !== null) fd.set("salePrice", String(sp));
      fd.set("stockQty", String(Math.max(0, toNumber(stockQty, 0) ?? 0)));

      if (barcode.trim()) fd.set("barcode", barcode.trim());
    } else {
      const vars = cleanVariantsForApi(variants);
      if (!vars.length) return showToast("error", "productType=variable requires variants.");

      fd.set("variants", JSON.stringify(vars));

      variants.forEach((variant, index) => {
        (variant.images || []).forEach((img) => {
          if (img?.file) {
            fd.append(`variantImages_${index}`, img.file);
          }
        });
      });
    }

    fd.set("primaryImage", primaryFile);
    galleryFiles.forEach((f) => fd.append("galleryImages", f));

    setBusy(true);

    try {
      const token = getStoredToken();
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        showToast("error", data?.message || data?.error || "Failed to create product");
        setBusy(false);
        return;
      }

      showToast("success", "Product created.");
      setBusy(false);

      setTitle("");
      setCategory("");
      setSubcategory("");
      setBrand("");
      setPrice("");
      setSalePrice("");
      setBarcode("");
      setStockQty(0);
      setIsNew(false);
      setIsTrending(false);
      setProductType("simple");

      setTags([]);
      setTagInput("");

      setDescriptionBlocks([{ id: uid(), title: "Overview", details: "", order: 0 }]);
      setSpecGroups([createSpecGroup("General", 0)]);

      variants.forEach((v) => {
        (v.images || []).forEach((img) => {
          if (img?.preview) URL.revokeObjectURL(img.preview);
        });
      });

      setVariants([
        {
          id: uid(),
          barcode: "",
          attributes: { storage: "128GB", color: "Green" },
          price: "",
          salePrice: "",
          stockQty: 0,
          isActive: true,
          images: [],
        },
      ]);

      if (primaryPreview) URL.revokeObjectURL(primaryPreview);
      galleryPreviews.forEach((u) => URL.revokeObjectURL(u));
      setPrimaryFile(null);
      setPrimaryPreview("");
      setGalleryFiles([]);
      setGalleryPreviews([]);
    } catch (err) {
      showToast("error", err?.message || "Request failed");
      setBusy(false);
    }
  }

  const headerRight = (
    <div className="flex flex-wrap items-center gap-2">
      <SoftButton
        icon={Info}
        disabled={busy}
        onClick={() => {
          if (missingRequired) return showToast("error", missingRequired);
          showToast("success", "Looks good ✅");
        }}
      >
        Check
      </SoftButton>

      <PrimaryButton
        icon={Save}
        loading={busy}
        disabled={busy}
        onClick={() => document.getElementById("createProductForm")?.requestSubmit()}
      >
        {busy ? "Creating…" : "Create"}
      </PrimaryButton>
    </div>
  );

  function handleAddTag() {
    const t = String(tagInput || "").trim();
    if (!t) return;
    addTag(t);
    setTagInput("");
  }

  return (
    <main className="w-full" style={{ background: PALETTE.bg, color: PALETTE.navy, fontFamily: FONT_STACK }}>
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
            fontFamily: FONT_STACK,
            fontWeight: 500,
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

      <div className="mx-auto max-w-screen-xl px-4 pt-6 pb-10 sm:px-6 lg:px-10">
        <div className="pb-4">
          <Card className="overflow-visible">
            <div className="p-5 sm:p-6">
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
                      <Package className="h-5 w-5" style={{ color: PALETTE.navy }} />
                    </div>

                    <div className="min-w-0">
                      <div className={TW.title} style={{ color: PALETTE.navy }}>
                        Create Product
                      </div>
                      <div className={TW.helper} style={{ color: PALETTE.muted, marginTop: 6 }}>
                        Category, brand, specs by group, description, product images, and per-variant images.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <div
                      className={cx("inline-flex items-center gap-2 rounded-full px-3 py-1.5", TW.pill)}
                      style={{
                        background: missingRequired ? "rgba(255,107,107,0.10)" : "rgba(16,185,129,0.10)",
                        border: missingRequired
                          ? "1px solid rgba(255,107,107,0.18)"
                          : "1px solid rgba(16,185,129,0.20)",
                      }}
                    >
                      <span style={{ color: PALETTE.muted }}>{missingRequired ? "Missing" : "Ready"}</span>
                      <span style={{ color: PALETTE.navy, fontWeight: 600 }}>
                        {missingRequired ? "Fix required fields" : "OK"}
                      </span>
                    </div>

                    <div
                      className={cx("inline-flex items-center gap-2 rounded-full px-3 py-1.5", TW.pill)}
                      style={{
                        background: metaError ? "rgba(255,107,107,0.10)" : "rgba(11,27,51,0.04)",
                        border: metaError ? "1px solid rgba(255,107,107,0.18)" : `1px solid ${PALETTE.border}`,
                      }}
                    >
                      <span style={{ color: PALETTE.muted }}>Meta</span>
                      <span style={{ color: PALETTE.navy, fontWeight: 600 }}>
                        {metaLoading ? "Loading…" : metaError ? "Failed" : "Loaded"}
                      </span>
                    </div>

                    <div
                      className={cx("inline-flex items-center gap-2 rounded-full px-3 py-1.5", TW.pill)}
                      style={{
                        background: "rgba(11,27,51,0.04)",
                        border: `1px solid ${PALETTE.border}`,
                      }}
                    >
                      <span style={{ color: PALETTE.muted }}>Type</span>
                      <span style={{ color: PALETTE.navy, fontWeight: 600 }}>{productType}</span>
                    </div>
                  </div>

                  {metaError ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className={TW.helper} style={{ color: "rgba(220,38,38,0.9)" }}>
                        {metaError}
                      </div>
                      <SoftButton type="button" icon={RefreshCcw} onClick={fetchMeta} disabled={metaLoading}>
                        Retry
                      </SoftButton>
                    </div>
                  ) : null}
                </div>

                {headerRight}
              </div>
            </div>
          </Card>
        </div>

        <form id="createProductForm" onSubmit={onSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.02 }}>
              <Card className="overflow-visible">
                <div className="p-5 sm:p-6">
                  <SectionHeader
                    icon={Layers}
                    title="Core"
                    subtitle="Primary details for the product."
                    right={
                      <div className="flex flex-wrap items-center gap-3">
                        <div
                          className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
                          style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                        >
                          <Sparkles className="h-4 w-4" style={{ color: PALETTE.muted }} />
                          <span className={TW.helper} style={{ color: PALETTE.navy }}>
                            New
                          </span>
                          <ToggleSwitch checked={isNew} onChange={setIsNew} />
                        </div>

                        <div
                          className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
                          style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                        >
                          <Flame className="h-4 w-4" style={{ color: PALETTE.muted }} />
                          <span className={TW.helper} style={{ color: PALETTE.navy }}>
                            Trending
                          </span>
                          <ToggleSwitch checked={isTrending} onChange={setIsTrending} />
                        </div>
                      </div>
                    }
                  />

                  <div className="mt-6">
                    <Divider />
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Product name" required icon={Package}>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Apple iPhone 15"
                      />
                    </Field>

                    <Field label="Product type" required icon={Boxes}>
                      <Select value={productType} onChange={(e) => setProductType(e.target.value)}>
                        {ALLOWED_PRODUCT_TYPE.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field
                      label="Category"
                      required
                      icon={Layers}
                      rightSlot={
                        metaLoading ? (
                          <span className="text-[11px] font-medium" style={{ color: PALETTE.muted }}>
                            Loading…
                          </span>
                        ) : null
                      }
                    >
                      <Select value={category} onChange={(e) => setCategory(e.target.value)} disabled={metaLoading || !!metaError}>
                        <option value="">{metaLoading ? "Loading categories…" : "Select category"}</option>
                        {categories.map((c) => (
                          <option key={String(c._id)} value={String(c._id)}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field
                      label="Subcategory (optional)"
                      icon={Layers}
                      rightSlot={
                        category && !subcategoryOptions.length ? (
                          <span className="text-[11px] font-medium" style={{ color: PALETTE.muted }}>
                            No subcategories
                          </span>
                        ) : null
                      }
                    >
                      <Select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        disabled={!category || metaLoading || !!metaError || subcategoryOptions.length === 0}
                      >
                        <option value="">{!category ? "Select category first" : "Select subcategory (optional)"}</option>
                        {subcategoryOptions.map((s) => (
                          <option key={String(s._id)} value={String(s._id)}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="Brand" required icon={Tag}>
                      <Select value={brand} onChange={(e) => setBrand(e.target.value)} disabled={metaLoading || !!metaError}>
                        <option value="">{metaLoading ? "Loading brands…" : "Select brand"}</option>
                        {filteredBrands.map((b) => (
                          <option key={String(b._id)} value={String(b._id)}>
                            {b.name}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <div className="hidden md:block" />

                    {productType === "simple" ? (
                      <>
                        <Field label="Price" required icon={Package}>
                          <Input
                            inputMode="decimal"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="120000"
                          />
                        </Field>

                        <Field label="Sale price" icon={Package}>
                          <Input
                            inputMode="decimal"
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.target.value)}
                            placeholder="115000"
                          />
                        </Field>

                        <Field
                          label="Barcode"
                          icon={BarcodeIcon}
                          rightSlot={
                            <SoftButton
                              type="button"
                              icon={BarcodeIcon}
                              onClick={generateMainBarcode}
                              disabled={busy}
                              className="px-3"
                              title="Generate barcode"
                            >
                              Generate
                            </SoftButton>
                          }
                        >
                          <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Auto / manual" />
                        </Field>

                        <Field label="Stock qty" required icon={Boxes}>
                          <Input
                            inputMode="numeric"
                            value={stockQty}
                            onChange={(e) => setStockQty(Math.max(0, toNumber(e.target.value, 0) ?? 0))}
                            placeholder="0"
                          />
                        </Field>
                      </>
                    ) : (
                      <div className="md:col-span-2 rounded-[20px] p-4" style={{ background: PALETTE.soft2, border: `1px solid ${PALETTE.border}` }}>
                        <div className={TW.helper} style={{ color: PALETTE.muted }}>
                          Variable product: price and stock come from <span style={{ color: PALETTE.navy, fontWeight: 700 }}>variants</span>.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            <AnimatePresence>
              {productType === "variable" ? (
                <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.03 }}>
                  <Card className="overflow-visible">
                    <div className="p-5 sm:p-6">
                      <SectionHeader
                        icon={Boxes}
                        title="Variants"
                        subtitle="Each active variant must have barcode, price, and can have its own images."
                      />

                      <div className="mt-6">
                        <Divider />
                      </div>

                      <div className="mt-6 space-y-3">
                        <AnimatePresence initial={false}>
                          {variants.map((v, idx) => (
                            <motion.div
                              key={v.id}
                              {...fadeUp}
                              transition={{ duration: 0.18 }}
                              className="rounded-[24px] p-4"
                              style={{
                                background: "rgba(255,255,255,0.92)",
                                border: `1px solid ${PALETTE.border}`,
                                boxShadow: "0 12px 30px rgba(0,31,63,0.06)",
                              }}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className="inline-flex items-center rounded-2xl px-3 py-2 text-[12px] font-semibold"
                                    style={{
                                      background: PALETTE.soft,
                                      border: `1px solid ${PALETTE.border}`,
                                      color: PALETTE.navy,
                                    }}
                                  >
                                    Variant #{idx + 1}
                                  </span>

                                  <div
                                    className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
                                    style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                                  >
                                    <span className={TW.helper} style={{ color: PALETTE.navy }}>
                                      Active
                                    </span>
                                    <ToggleSwitch
                                      checked={v.isActive !== false}
                                      onChange={() =>
                                        setVariants((prev) =>
                                          prev.map((x) =>
                                            x.id === v.id ? { ...x, isActive: !(x.isActive !== false) } : x
                                          )
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <SoftButton
                                    type="button"
                                    icon={BarcodeIcon}
                                    onClick={() => generateVariantBarcode(v.id)}
                                    disabled={busy}
                                    title="Generate variant barcode"
                                  >
                                    Generate
                                  </SoftButton>

                                  <button
                                    type="button"
                                    onClick={() => removeVariantCompletely(v.id)}
                                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 text-sm font-semibold"
                                    style={{
                                      background: "rgba(255,107,107,0.14)",
                                      border: "1px solid rgba(255,107,107,0.25)",
                                      color: PALETTE.navy,
                                      boxShadow: "0 12px 28px rgba(0,31,63,.10)",
                                      fontFamily: FONT_STACK,
                                      minHeight: 42,
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                  </button>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field label="Barcode" required icon={BarcodeIcon}>
                                  <Input
                                    value={v.barcode}
                                    onChange={(e) =>
                                      setVariants((prev) =>
                                        prev.map((x) => (x.id === v.id ? { ...x, barcode: e.target.value } : x))
                                      )
                                    }
                                    placeholder="auto / manual"
                                  />
                                </Field>

                                <Field label="Stock qty" required icon={Boxes}>
                                  <Input
                                    inputMode="numeric"
                                    value={v.stockQty}
                                    onChange={(e) =>
                                      setVariants((prev) =>
                                        prev.map((x) =>
                                          x.id === v.id
                                            ? { ...x, stockQty: Math.max(0, toNumber(e.target.value, 0) ?? 0) }
                                            : x
                                        )
                                      )
                                    }
                                    placeholder="0"
                                  />
                                </Field>

                                <Field label="Price" required icon={Package}>
                                  <Input
                                    inputMode="decimal"
                                    value={v.price}
                                    onChange={(e) =>
                                      setVariants((prev) =>
                                        prev.map((x) => (x.id === v.id ? { ...x, price: e.target.value } : x))
                                      )
                                    }
                                    placeholder="120000"
                                  />
                                </Field>

                                <Field label="Sale price" icon={Package}>
                                  <Input
                                    inputMode="decimal"
                                    value={v.salePrice}
                                    onChange={(e) =>
                                      setVariants((prev) =>
                                        prev.map((x) => (x.id === v.id ? { ...x, salePrice: e.target.value } : x))
                                      )
                                    }
                                    placeholder="optional"
                                  />
                                </Field>
                              </div>

                              <div className="mt-6">
                                <Divider />
                              </div>

                              <div className="mt-6">
                                <div className="flex items-center justify-between gap-3">
                                  <div className={TW.label} style={{ color: PALETTE.navy }}>
                                    Attributes
                                  </div>

                                  <SoftButton
                                    type="button"
                                    icon={Plus}
                                    onClick={() =>
                                      setVariants((prev) =>
                                        prev.map((x) =>
                                          x.id === v.id ? { ...x, attributes: { ...(x.attributes || {}), "": "" } } : x
                                        )
                                      )
                                    }
                                  >
                                    Add attribute
                                  </SoftButton>
                                </div>

                                <div className="mt-3 space-y-2">
                                  {Object.entries(v.attributes || {}).length ? (
                                    Object.entries(v.attributes || {}).map(([k, val], i) => (
                                      <div key={k + i} className="grid grid-cols-12 gap-2">
                                        <div className="col-span-5">
                                          <div
                                            className="rounded-2xl px-3"
                                            style={{ background: "rgba(255,255,255,0.98)", border: `1px solid ${PALETTE.border}` }}
                                          >
                                            <Input
                                              value={k}
                                              onChange={(e) => {
                                                const nk = e.target.value;
                                                setVariants((prev) =>
                                                  prev.map((x) => {
                                                    if (x.id !== v.id) return x;
                                                    const attrs = { ...(x.attributes || {}) };
                                                    const oldVal = attrs[k];
                                                    delete attrs[k];
                                                    attrs[nk] = oldVal;
                                                    return { ...x, attributes: attrs };
                                                  })
                                                );
                                              }}
                                              placeholder="storage"
                                            />
                                          </div>
                                        </div>

                                        <div className="col-span-6">
                                          <div
                                            className="rounded-2xl px-3"
                                            style={{ background: "rgba(255,255,255,0.98)", border: `1px solid ${PALETTE.border}` }}
                                          >
                                            <Input
                                              value={val}
                                              onChange={(e) => {
                                                const nv = e.target.value;
                                                setVariants((prev) =>
                                                  prev.map((x) =>
                                                    x.id === v.id ? { ...x, attributes: { ...(x.attributes || {}), [k]: nv } } : x
                                                  )
                                                );
                                              }}
                                              placeholder="128GB"
                                            />
                                          </div>
                                        </div>

                                        <div className="col-span-1 flex items-center justify-end">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setVariants((prev) =>
                                                prev.map((x) => {
                                                  if (x.id !== v.id) return x;
                                                  const attrs = { ...(x.attributes || {}) };
                                                  delete attrs[k];
                                                  return { ...x, attributes: attrs };
                                                })
                                              )
                                            }
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                            style={{
                                              background: "rgba(255,107,107,0.12)",
                                              border: "1px solid rgba(255,107,107,0.22)",
                                              color: PALETTE.navy,
                                            }}
                                            aria-label="Remove attribute"
                                            title="Remove"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className={TW.helper} style={{ color: PALETTE.muted }}>
                                      No attributes.
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-6">
                                <Divider />
                              </div>

                              <div className="mt-6">
                                <VariantImageUploader
                                  variant={v}
                                  onFiles={(files) => addVariantImages(v.id, files)}
                                  onRemoveImage={(imageIndex) => removeVariantImage(v.id, imageIndex)}
                                />
                              </div>

                              <div className="mt-4 rounded-[20px] p-4" style={{ background: PALETTE.soft2, border: `1px solid ${PALETTE.border}` }}>
                                <div className={TW.helper} style={{ color: PALETTE.muted }}>
                                  Tip: Use attributes like <span style={{ color: PALETTE.navy, fontWeight: 700 }}>storage</span> +{" "}
                                  <span style={{ color: PALETTE.navy, fontWeight: 700 }}>color</span>.
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        <div className="flex justify-end">
                          <SoftButton
                            type="button"
                            icon={Plus}
                            onClick={() =>
                              setVariants((prev) => [
                                ...prev,
                                {
                                  id: uid(),
                                  barcode: "",
                                  attributes: { storage: "", color: "" },
                                  price: "",
                                  salePrice: "",
                                  stockQty: 0,
                                  isActive: true,
                                  images: [],
                                },
                              ])
                            }
                          >
                            Add variant
                          </SoftButton>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.05 }}>
              <Card className="overflow-visible">
                <div className="p-5 sm:p-6">
                  <SectionHeader
                    icon={Info}
                    title="Description"
                    subtitle="Add content blocks for the product page."
                  />

                  <div className="mt-6">
                    <Divider />
                  </div>

                  <div className="mt-6 space-y-4">
                    <AnimatePresence initial={false}>
                      {descriptionBlocks.map((b, idx) => (
                        <motion.div
                          key={b.id}
                          {...fadeUp}
                          transition={{ duration: 0.18 }}
                          className="rounded-[24px] p-4"
                          style={{
                            background: "rgba(255,255,255,0.92)",
                            border: `1px solid ${PALETTE.border}`,
                            boxShadow: "0 12px 30px rgba(0,31,63,0.06)",
                          }}
                        >
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                            <div className="lg:col-span-4">
                              <Field label="Title" hideIcon>
                                <Input
                                  value={b.title}
                                  onChange={(e) =>
                                    setDescriptionBlocks((prev) =>
                                      prev.map((x) => (x.id === b.id ? { ...x, title: e.target.value } : x))
                                    )
                                  }
                                  placeholder="Overview"
                                />
                              </Field>
                            </div>

                            <div className="lg:col-span-7">
                              <Field label="Details" multiline hideIcon>
                                <Textarea
                                  rows={5}
                                  value={b.details}
                                  onChange={(e) =>
                                    setDescriptionBlocks((prev) =>
                                      prev.map((x) => (x.id === b.id ? { ...x, details: e.target.value } : x))
                                    )
                                  }
                                  placeholder="Write details…"
                                />
                              </Field>
                            </div>

                            <div className="lg:col-span-1 flex items-start lg:items-end lg:justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setDescriptionBlocks((prev) =>
                                    prev.filter((x) => x.id !== b.id).map((x, i) => ({ ...x, order: i }))
                                  )
                                }
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                style={{
                                  background: "rgba(255,107,107,0.12)",
                                  border: "1px solid rgba(255,107,107,0.22)",
                                  color: PALETTE.navy,
                                }}
                                aria-label="Remove block"
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 text-[11px] font-medium" style={{ color: PALETTE.muted }}>
                            Order: {idx}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <div className="flex justify-end">
                      <SoftButton
                        type="button"
                        icon={Plus}
                        onClick={() =>
                          setDescriptionBlocks((prev) => [...prev, { id: uid(), title: "", details: "", order: prev.length }])
                        }
                      >
                        Add description block
                      </SoftButton>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.06 }}>
              <div className="space-y-5">
                <Card className="overflow-visible">
                  <div className="p-5 sm:p-6">
                    <SectionHeader icon={Tag} title="Tags" subtitle="Keywords for search and filtering." />
                    <div className="mt-6">
                      <Divider />
                    </div>

                    <div className="mt-6 space-y-4">
                      <Field label="Add tag" icon={Tag}>
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                          placeholder="iphone"
                        />
                      </Field>

                      <div className="flex justify-end">
                        <SoftButton
                          type="button"
                          onClick={handleAddTag}
                          disabled={!String(tagInput || "").trim()}
                          className="px-4"
                        >
                          Add tag
                        </SoftButton>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {tags.length ? (
                          tags.map((t) => (
                            <Chip key={t} onRemove={() => removeTag(t)}>
                              {t}
                            </Chip>
                          ))
                        ) : (
                          <div className={TW.helper} style={{ color: PALETTE.muted }}>
                            No tags.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="overflow-visible">
                  <div className="p-5 sm:p-6">
                    <SectionHeader
                      icon={FolderTree}
                      title="Specifications by Group"
                      subtitle="Create groups first, then add specs under each group. Highlighted specs will also appear in product highlights."
                    />

                    <div className="mt-6">
                      <Divider />
                    </div>

                    <div className="mt-6 space-y-4">
                      <AnimatePresence initial={false}>
                        {specGroups.map((group, groupIndex) => (
                          <motion.div
                            key={group.id}
                            {...fadeUp}
                            transition={{ duration: 0.18 }}
                            className="rounded-[24px] p-4"
                            style={{
                              background: "rgba(255,255,255,0.92)",
                              border: `1px solid ${PALETTE.border}`,
                              boxShadow: "0 12px 30px rgba(0,31,63,0.06)",
                            }}
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-flex items-center rounded-2xl px-3 py-2 text-[12px] font-semibold"
                                  style={{
                                    background: PALETTE.soft,
                                    border: `1px solid ${PALETTE.border}`,
                                    color: PALETTE.navy,
                                  }}
                                >
                                  Group #{groupIndex + 1}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeSpecGroup(group.id)}
                                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 text-sm font-semibold"
                                  style={{
                                    background: "rgba(255,107,107,0.14)",
                                    border: "1px solid rgba(255,107,107,0.25)",
                                    color: PALETTE.navy,
                                    boxShadow: "0 12px 28px rgba(0,31,63,.10)",
                                    fontFamily: FONT_STACK,
                                    minHeight: 42,
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove group
                                </button>
                              </div>
                            </div>

                            <div className="mt-4">
                              <Field label="Group name" required icon={ListTree}>
                                <Input
                                  value={group.name}
                                  onChange={(e) => updateSpecGroup(group.id, { name: e.target.value })}
                                  placeholder="Display"
                                />
                              </Field>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <InfoPill>
                                Group: {String(group.name || "").trim() || `Group ${groupIndex + 1}`}
                              </InfoPill>
                              <InfoPill>Specs: {(group.specs || []).length}</InfoPill>
                            </div>

                            <div className="mt-5">
                              <Divider />
                            </div>

                            <div className="mt-5 space-y-3">
                              {(group.specs || []).length ? (
                                group.specs.map((spec, specIndex) => (
                                  <div
                                    key={spec.id}
                                    className="rounded-[20px] p-4"
                                    style={{
                                      background: PALETTE.soft2,
                                      border: `1px solid ${PALETTE.border}`,
                                    }}
                                  >
                                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="inline-flex items-center rounded-2xl px-3 py-2 text-[12px] font-semibold"
                                          style={{
                                            background: "rgba(255,255,255,0.92)",
                                            border: `1px solid ${PALETTE.border}`,
                                            color: PALETTE.navy,
                                          }}
                                        >
                                          Spec #{specIndex + 1}
                                        </span>

                                        <div
                                          className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
                                          style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${PALETTE.border}` }}
                                        >
                                          <span className={TW.helper} style={{ color: PALETTE.navy }}>
                                            Highlight
                                          </span>
                                          <ToggleSwitch
                                            checked={Boolean(spec.isHighlighted)}
                                            onChange={(checked) => updateSpec(group.id, spec.id, { isHighlighted: checked })}
                                          />
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => removeSpec(group.id, spec.id)}
                                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 text-sm font-semibold"
                                        style={{
                                          background: "rgba(255,107,107,0.14)",
                                          border: "1px solid rgba(255,107,107,0.25)",
                                          color: PALETTE.navy,
                                          fontFamily: FONT_STACK,
                                          minHeight: 42,
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Remove
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                                      <div className="lg:col-span-4">
                                        <Field label="Label" required hideIcon>
                                          <Input
                                            value={spec.label}
                                            onChange={(e) => updateSpec(group.id, spec.id, { label: e.target.value })}
                                            placeholder="Screen Size"
                                          />
                                        </Field>
                                      </div>

                                      <div className="lg:col-span-8">
                                        <Field label="Value" required hideIcon>
                                          <Input
                                            value={spec.value}
                                            onChange={(e) => updateSpec(group.id, spec.id, { value: e.target.value })}
                                            placeholder="6.1-inch Super Retina XDR"
                                          />
                                        </Field>
                                      </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <InfoPill>
                                        Group: {String(group.name || "").trim() || `Group ${groupIndex + 1}`}
                                      </InfoPill>
                                      <InfoPill>
                                        Label: {String(spec.label || "").trim() || `Spec ${specIndex + 1}`}
                                      </InfoPill>
                                      <InfoPill>
                                        Value: {String(spec.value || "").trim() || "Not added"}
                                      </InfoPill>
                                      {spec.isHighlighted ? <InfoPill>Highlighted</InfoPill> : null}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className={TW.helper} style={{ color: PALETTE.muted }}>
                                  No specs in this group yet.
                                </div>
                              )}

                              <div className="flex justify-end pt-1">
                                <PrimaryButton
                                  type="button"
                                  icon={Plus}
                                  onClick={() => addSpecToGroup(group.id)}
                                >
                                  Add spec
                                </PrimaryButton>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <div className="flex justify-end">
                        <PrimaryButton type="button" icon={Plus} onClick={addSpecGroup}>
                          Add group
                        </PrimaryButton>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="overflow-visible">
                  <div className="p-5 sm:p-6">
                    <SectionHeader
                      icon={Sparkles}
                      title="Highlighted Features Preview"
                      subtitle="These come from specs with Highlight turned on."
                    />

                    <div className="mt-6">
                      <Divider />
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {highlightedSpecsPreview.length ? (
                        highlightedSpecsPreview.map((item, i) => <Chip key={item + i}>{item}</Chip>)
                      ) : (
                        <div className={TW.helper} style={{ color: PALETTE.muted }}>
                          No highlighted specs yet.
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>

          <div className="space-y-5 lg:col-span-4">
            <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.03 }}>
              <Card className="overflow-visible">
                <div className="p-5 sm:p-6">
                  <SectionHeader icon={ImageIcon} title="Images" subtitle="Primary image is required." />
                  <div className="mt-6">
                    <Divider />
                  </div>

                  <div className="mt-6">
                    <FileDrop
                      label="Primary image (required)"
                      accept="image/*"
                      multiple={false}
                      onFiles={setPrimary}
                      previewUrls={primaryPreview ? [primaryPreview] : []}
                    />
                  </div>

                  <div className="mt-6">
                    <Divider />
                  </div>

                  <div className="mt-6">
                    <FileDrop
                      label="Gallery images (optional)"
                      accept="image/*"
                      multiple
                      onFiles={setGallery}
                      previewUrls={galleryPreviews}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.05 }}>
              <Card className="overflow-visible">
                <div className="p-5 sm:p-6">
                  <SectionHeader icon={Package} title="Submit" subtitle="Review and create product." />
                  <div className="mt-6">
                    <Divider />
                  </div>

                  <div className="mt-6 space-y-3">
                    <div
                      className="rounded-[24px] p-4"
                      style={{
                        background: missingRequired ? "rgba(255,107,107,0.10)" : "rgba(16,185,129,0.10)",
                        border: missingRequired
                          ? "1px solid rgba(255,107,107,0.18)"
                          : "1px solid rgba(16,185,129,0.20)",
                      }}
                    >
                      <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                        {missingRequired ? "Missing" : "Ready"}
                      </div>
                      <div className={TW.helper} style={{ color: PALETTE.muted, marginTop: 6 }}>
                        {missingRequired || "All required fields are filled."}
                      </div>
                      <div className="mt-2 text-[11px] font-medium" style={{ color: PALETTE.muted }}>
                        Slug (auto): <span style={{ color: PALETTE.navy, fontWeight: 600 }}>{finalSlug || "—"}</span>
                      </div>
                    </div>

                    <PrimaryButton
                      icon={Save}
                      loading={busy}
                      disabled={busy}
                      className="w-full justify-center"
                      onClick={() => document.getElementById("createProductForm")?.requestSubmit()}
                    >
                      {busy ? "Creating…" : "Create Product"}
                    </PrimaryButton>

                    <SoftButton
                      className="w-full justify-center"
                      disabled={busy}
                      onClick={() => {
                        if (missingRequired) return showToast("error", missingRequired);
                        showToast("success", "Ready ✅");
                      }}
                    >
                      Validate required
                    </SoftButton>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </form>
      </div>
    </main>
  );
}