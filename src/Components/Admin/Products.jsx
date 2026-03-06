// app/admin/products/page.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Package,
  Search,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Flame,
  Boxes,
  Tags,
  Barcode,
  Layers,
  Loader2,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

/**
 * Admin Products (READ-only table UI)
 * - Fetch: GET /api/admin/products
 * - Shows product details in table
 * - For variable products: dropdown expands variants inside the row
 * - For simple products: no dropdown
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

const Pill = React.memo(function Pill({ tone = "soft", children, title }) {
  const style =
    tone === "good"
      ? { background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }
      : tone === "warn"
      ? { background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.24)" }
      : tone === "bad"
      ? { background: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.18)" }
      : { background: PALETTE.soft, border: `1px solid ${PALETTE.border}` };

  return (
    <span
      title={title}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
      style={{ ...style, color: PALETTE.navy }}
    >
      {children}
    </span>
  );
});

function TableSkeleton({ rows = 10 }) {
  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-3 px-2 py-2">
        <div className="col-span-4 h-5 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
        <div className="col-span-3 h-5 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
        <div className="col-span-2 h-5 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
        <div className="col-span-3 h-5 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
      </div>

      <div className="mt-4 grid gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-12 items-center gap-3 rounded-3xl px-4 py-4"
            style={{
              background: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(2,10,25,0.06)",
              boxShadow: "0 10px 26px rgba(0,31,63,0.04)",
            }}
          >
            <div className="col-span-4 h-4 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
            <div className="col-span-3 h-4 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
            <div className="col-span-2 h-4 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
            <div className="col-span-3 h-4 rounded-xl" style={{ background: "rgba(11,27,51,0.06)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

function money(n) {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(v);
}

function safeText(v) {
  const s = String(v ?? "").trim();
  return s || "—";
}

function attrsToLine(attributes) {
  if (!attributes) return "—";
  const entries = attributes instanceof Map ? Array.from(attributes.entries()) : Object.entries(attributes);
  const cleaned = entries
    .map(([k, v]) => [String(k || "").trim(), String(v ?? "").trim()])
    .filter(([k, v]) => k && v);
  if (!cleaned.length) return "—";
  return cleaned.map(([k, v]) => `${k}: ${v}`).join(" • ");
}

/* ------------------------------ Row UI ------------------------------ */

const VariantsPanel = React.memo(function VariantsPanel({ product }) {
  const vars = Array.isArray(product?.variants) ? product.variants : [];
  const activeCount = vars.filter((v) => v?.isActive !== false).length;

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-2xl"
            style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
          >
            <Layers className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </div>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
              Variants
            </div>
            <div className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              {vars.length} total • {activeCount} active
            </div>
          </div>
        </div>

        <Pill tone="soft" title="Variant barcode is used as SKU">
          <Barcode className="h-4 w-4" />
          Barcode = SKU
        </Pill>
      </div>

      <div className="mt-3 overflow-auto rounded-3xl" style={{ border: `1px solid ${PALETTE.border}` }}>
        <table className="w-full text-left text-sm">
          <thead
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(10px)",
              borderBottom: `1px solid ${PALETTE.border2}`,
            }}
          >
            <tr className="text-[12px]" style={{ color: PALETTE.muted }}>
              <th className="px-4 py-3 font-semibold">Attributes</th>
              <th className="px-4 py-3 font-semibold">Barcode/SKU</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Sale</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody>
            {vars.map((v, idx) => {
              const active = v?.isActive !== false;
              return (
                <tr
                  key={String(v?.variantId || v?._id || idx)}
                  style={{ background: idx % 2 ? "rgba(11,27,51,0.012)" : "transparent" }}
                >
                  <td className="px-4 py-3 align-middle">
                    <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                      {attrsToLine(v?.attributes)}
                    </div>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                      {safeText(v?.barcode || v?.sku)}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                      {money(v?.price)}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                      {typeof v?.salePrice === "number" ? money(v.salePrice) : "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span
                      className="inline-flex min-w-[52px] justify-center rounded-xl px-2 py-1 text-[12px] font-semibold"
                      style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                    >
                      {Number(v?.stockQty) || 0}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                      style={{
                        background: active ? "rgba(16,185,129,0.10)" : "rgba(255,107,107,0.10)",
                        border: active ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(255,107,107,0.18)",
                        color: PALETTE.navy,
                      }}
                    >
                      {active ? <BadgeCheck className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                      {active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!vars.length ? (
              <tr>
                <td className="px-4 py-4 text-[12px] font-semibold" style={{ color: PALETTE.muted }} colSpan={6}>
                  No variants.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const ProductRow = React.memo(function ProductRow({ p, expanded, onToggleExpand }) {
  const isVariable = p?.productType === "variable";
  const priceText = isVariable ? money(p?.finalPrice ?? p?.price) : money(p?.price);
  const saleText =
    typeof p?.salePrice === "number" && p.salePrice !== null && p.productType === "simple" ? money(p.salePrice) : "—";

  const categoryName = p?.category?.name || p?.category?.slug || "—";
  const brandName = p?.brand?.name || p?.brand?.slug || "—";

  const stock =
    typeof p?.availableStock === "number"
      ? p.availableStock
      : typeof p?.stockQty === "number"
      ? p.stockQty
      : 0;

  return (
    <>
      <tr
        className="transition"
        style={{
          cursor: isVariable ? "pointer" : "default",
          background: expanded ? "rgba(11,27,51,0.05)" : "transparent",
        }}
        onClick={() => {
          if (isVariable) onToggleExpand();
        }}
        onMouseEnter={(e) => {
          if (!expanded && isVariable) e.currentTarget.style.background = "rgba(11,27,51,0.035)";
        }}
        onMouseLeave={(e) => {
          if (!expanded) e.currentTarget.style.background = "transparent";
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
              <Package className="h-4 w-4" style={{ color: PALETTE.navy }} />
            </div>

            <div className="min-w-0">
              <div className="font-semibold leading-snug truncate" style={{ color: PALETTE.navy }}>
                {safeText(p?.title)}
              </div>
              <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                /{safeText(p?.slug)}
              </div>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 align-middle">
          <div className="grid gap-1">
            <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
              {categoryName}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              {brandName}
            </span>
          </div>
        </td>

        <td className="px-6 py-4 align-middle">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{
              background: isVariable ? "rgba(234,179,8,0.12)" : PALETTE.soft,
              border: isVariable ? "1px solid rgba(234,179,8,0.24)" : `1px solid ${PALETTE.border}`,
              color: PALETTE.navy,
            }}
          >
            {isVariable ? <Layers className="h-4 w-4" /> : <Boxes className="h-4 w-4" />}
            {isVariable ? "Variable" : "Simple"}
          </span>
        </td>

        <td className="px-6 py-4 align-middle">
          <div className="grid gap-1">
            <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
              {priceText}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              Sale: {saleText}
            </span>
          </div>
        </td>

        <td className="px-6 py-4 align-middle">
          <span
            className="inline-flex min-w-[52px] justify-center rounded-xl px-2 py-1 text-[12px] font-semibold"
            style={{
              background: stock > 0 ? "rgba(16,185,129,0.10)" : "rgba(255,107,107,0.10)",
              border: stock > 0 ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(255,107,107,0.18)",
              color: PALETTE.navy,
            }}
            title="Available stock (simple=product stock, variable=sum active variants)"
          >
            {stock}
          </span>
        </td>

        <td className="px-6 py-4 align-middle">
          <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
            {isVariable ? "—" : safeText(p?.barcode)}
          </span>
        </td>

        <td className="px-6 py-4 align-middle">
          <div className="flex flex-wrap gap-2">
            {p?.isNew ? (
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}
              >
                <BadgeCheck className="h-4 w-4" style={{ color: PALETTE.navy }} />
                New
              </span>
            ) : null}
            {p?.isTrending ? (
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ background: "rgba(255,126,105,0.12)", border: "1px solid rgba(255,126,105,0.22)" }}
              >
                <Flame className="h-4 w-4" style={{ color: PALETTE.navy }} />
                Trending
              </span>
            ) : null}
            {!p?.isNew && !p?.isTrending ? (
              <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                —
              </span>
            ) : null}
          </div>
        </td>

        <td className="px-6 py-4 align-middle text-right">
          {isVariable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[12px] font-semibold transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                "hover:opacity-95 active:scale-[0.99]"
              )}
              style={{
                background: "rgba(255,255,255,0.96)",
                border: `1px solid ${PALETTE.border}`,
                color: PALETTE.navy,
                boxShadow: "0 10px 22px rgba(0,31,63,.04)",
              }}
              title="Show variants"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Variants
            </button>
          ) : (
            <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              —
            </span>
          )}
        </td>
      </tr>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.tr
            key="panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <td colSpan={8} style={{ padding: 0 }}>
              <div style={{ background: "rgba(11,27,51,0.02)", borderTop: `1px solid ${PALETTE.border2}` }}>
                <VariantsPanel product={p} />
              </div>
            </td>
          </motion.tr>
        ) : null}
      </AnimatePresence>
    </>
  );
});

/* -------------------------------- Page --------------------------------- */

export default function AdminProductsPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  // toast helper
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

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 220);

  const [typeFilter, setTypeFilter] = useState("all"); // all|simple|variable
  const [stockFilter, setStockFilter] = useState("all"); // all|in|out

  const expandedRef = useRef(new Set()); // productId expanded
  const [, force] = useState(0);
  const bump = () => force((x) => x + 1);

  const isExpanded = (id) => expandedRef.current.has(String(id));
  const toggleExpanded = (id) => {
    const k = String(id);
    if (expandedRef.current.has(k)) expandedRef.current.delete(k);
    else expandedRef.current.add(k);
    bump();
  };

  const stats = useMemo(() => {
    const total = items.length;
    const simple = items.filter((p) => p?.productType !== "variable").length;
    const variable = total - simple;
    const inStock = items.filter((p) => (typeof p?.availableStock === "number" ? p.availableStock : p?.stockQty) > 0).length;
    return { total, simple, variable, inStock };
  }, [items]);

  async function loadProducts({ showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/products");
      const products = Array.isArray(data?.products) ? data.products : [];
      setItems(products);
    } catch (e) {
      if (e?.status === 401) showToast("error", "Unauthorized. Please login again.");
      else if (e?.status === 403) showToast("error", "Forbidden. Admin only.");
      else showToast("error", e.message || "Failed to load products");
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = items;

    if (typeFilter !== "all") {
      list = list.filter((p) => (typeFilter === "variable" ? p?.productType === "variable" : p?.productType !== "variable"));
    }

    if (stockFilter !== "all") {
      const wantIn = stockFilter === "in";
      list = list.filter((p) => {
        const s = typeof p?.availableStock === "number" ? p.availableStock : typeof p?.stockQty === "number" ? p.stockQty : 0;
        return wantIn ? s > 0 : s <= 0;
      });
    }

    if (!q) return list;

    return list.filter((p) => {
      const title = String(p?.title || "").toLowerCase();
      const slug = String(p?.slug || "").toLowerCase();
      const barcode = String(p?.barcode || "").toLowerCase();
      const category = String(p?.category?.name || p?.category?.slug || "").toLowerCase();
      const brand = String(p?.brand?.name || p?.brand?.slug || "").toLowerCase();
      const tags = Array.isArray(p?.tags) ? p.tags.join(" ").toLowerCase() : "";
      return (
        title.includes(q) ||
        slug.includes(q) ||
        barcode.includes(q) ||
        category.includes(q) ||
        brand.includes(q) ||
        tags.includes(q)
      );
    });
  }, [items, debouncedSearch, typeFilter, stockFilter]);

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
        <div className="absolute -left-20 -top-20 h-[340px] w-[340px] rounded-full blur-3xl" style={{ background: "rgba(255,126,105,0.10)" }} />
        <div className="absolute right-[-140px] top-[120px] h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: "rgba(11,27,51,0.05)" }} />
      </div>

      {/* Header card */}
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
                    <Package className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                        Products
                      </div>

                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${PALETTE.border}`, color: PALETTE.muted }}
                        title="Loaded products"
                      >
                        {items.length} loaded
                      </span>
                    </div>

                    <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                      View product details. Variable products expand to show variants (barcode = SKU).
                    </div>
                  </div>
                </div>

                {/* micro-stats */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill tone="soft" title="All products">
                    <Tags className="h-4 w-4" />
                    Total <span style={{ marginLeft: 6, fontWeight: 800 }}>{stats.total}</span>
                  </Pill>

                  <Pill tone="soft" title="Simple products">
                    <Boxes className="h-4 w-4" />
                    Simple <span style={{ marginLeft: 6, fontWeight: 800 }}>{stats.simple}</span>
                  </Pill>

                  <Pill tone="warn" title="Variable products">
                    <Layers className="h-4 w-4" />
                    Variable <span style={{ marginLeft: 6, fontWeight: 800 }}>{stats.variable}</span>
                  </Pill>

                  <Pill tone="good" title="Products with stock">
                    <BadgeCheck className="h-4 w-4" />
                    In stock <span style={{ marginLeft: 6, fontWeight: 800 }}>{stats.inStock}</span>
                  </Pill>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SoftButton icon={RefreshCw} loading={refreshing} onClick={() => loadProducts({ showSpinner: true })}>
                  Refresh
                </SoftButton>
              </div>
            </div>

            {/* Search/Filter row */}
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
              <div className="md:col-span-7">
                <Field label="Search" icon={Search}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                    placeholder="Search by title, slug, barcode, category, brand, tags…"
                  />
                </Field>
              </div>

              <div className="md:col-span-3">
                <Field
                  label="Type"
                  icon={Filter}
                  rightSlot={
                    <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                      {typeFilter.toUpperCase()}
                    </span>
                  }
                >
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                    style={{ color: PALETTE.navy, height: 42 }}
                  >
                    <option value="all">All</option>
                    <option value="simple">Simple</option>
                    <option value="variable">Variable</option>
                  </select>
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Stock"
                  icon={Barcode}
                  rightSlot={
                    <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                      {stockFilter.toUpperCase()}
                    </span>
                  }
                >
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                    style={{ color: PALETTE.navy, height: 42 }}
                  >
                    <option value="all">All</option>
                    <option value="in">In</option>
                    <option value="out">Out</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Table card */}
      <div className="mx-auto max-w-screen-xl px-5 pb-10 md:px-10 lg:px-12">
        <Card>
          <div className="overflow-auto" style={{ height: "min(62vh, 720px)" }}>
            {loading ? (
              <TableSkeleton rows={10} />
            ) : filtered.length ? (
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
                    <th className="px-6 py-3 font-semibold">Product</th>
                    <th className="px-6 py-3 font-semibold">Category / Brand</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Price</th>
                    <th className="px-6 py-3 font-semibold">Stock</th>
                    <th className="px-6 py-3 font-semibold">Barcode</th>
                    <th className="px-6 py-3 font-semibold">Flags</th>
                    <th className="px-6 py-3 font-semibold text-right">Variants</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((p) => {
                    const id = p?._id || p?.id || p?.slug;
                    const expanded = p?.productType === "variable" ? isExpanded(id) : false;
                    return (
                      <ProductRow
                        key={String(id)}
                        p={p}
                        expanded={expanded}
                        onToggleExpand={() => toggleExpanded(id)}
                      />
                    );
                  })}
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
                    <Package className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="mt-4 text-[15px] font-semibold" style={{ color: PALETTE.navy }}>
                    No products found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Adjust search or filters and try again.
                  </div>

                  <div className="mt-5 flex justify-center">
                    <SoftButton icon={RefreshCw} loading={refreshing} onClick={() => loadProducts({ showSpinner: true })}>
                      Refresh
                    </SoftButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* Footer */}
          <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              Showing <span style={{ color: PALETTE.navy, fontWeight: 800 }}>{filtered.length}</span> of{" "}
              <span style={{ color: PALETTE.navy, fontWeight: 800 }}>{items.length}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="soft">
                <Tags className="h-4 w-4" />
                Tip: click “Variants” on variable products
              </Pill>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}