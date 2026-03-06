// app/admin/carts/page.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingCart,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Trash2,
  Pencil,
  Plus,
  Loader2,
  User,
  Ghost,
  Package,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

/**
 * Admin Carts UI (Premium-style)
 *
 * Backend (as provided earlier):
 * - GET    /api/admin/customer/cart?q=&type=all|user|guest&limit=&skip=
 * - GET    /api/admin/customer/cart/[id]
 * - PATCH  /api/admin/customer/cart/[id]   body: { action: add|setQty|remove, productId, variantBarcode?, qty?, snapshot? }
 * - DELETE /api/admin/customer/cart/[id]   clears cart
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
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
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
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : Icon ? (
          <Icon className="h-4 w-4" />
        ) : null}
        {children}
      </span>
    </button>
  );
});

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
          {/* no blur -> single dim */}
          <div className="absolute inset-0" style={{ background: "rgba(11,27,51,0.18)" }} onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="relative w-full max-w-3xl overflow-hidden"
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

/* ------------------------------ Utilities ------------------------------ */

function formatMoney(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function cartLabel(c) {
  const user = c?.user;
  if (user?.email) return user.email;
  if (c?.guestId) return `Guest: ${c.guestId}`;
  return "—";
}

function cartType(c) {
  return c?.user ? "user" : c?.guestId ? "guest" : "unknown";
}

function sumCart(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  let qty = 0;
  let subtotal = 0;
  for (const it of items) {
    const q = Number(it.qty || 0);
    const p = Number(it.unitPrice || 0);
    qty += q;
    subtotal += q * p;
  }
  return { lines: items.length, qty, subtotal };
}

/* ----------------------------- Skeletons ------------------------------ */

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
        <Shimmer className="col-span-2 h-5 rounded-xl" />
        <Shimmer className="col-span-2 h-5 rounded-xl" />
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
            <div className="col-span-5 flex items-center gap-3">
              <Shimmer className="h-9 w-9 rounded-2xl" style={{ border: "none" }} />
              <div className="flex-1 grid gap-2">
                <Shimmer className="h-4 rounded-xl" style={{ width: "62%", border: "none" }} />
                <Shimmer className="h-3 rounded-xl" style={{ width: "40%", border: "none" }} />
              </div>
            </div>
            <div className="col-span-2">
              <Shimmer className="h-7 rounded-xl" style={{ width: "70%", border: "none" }} />
            </div>
            <div className="col-span-2">
              <Shimmer className="h-7 rounded-xl" style={{ width: "70%", border: "none" }} />
            </div>
            <div className="col-span-3 flex justify-end gap-2">
              <Shimmer className="h-9 w-24 rounded-2xl" style={{ border: "none" }} />
              <Shimmer className="h-9 w-24 rounded-2xl" style={{ border: "none" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Page -------------------------------- */

export default function AdminCartsPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  // pagination (skip/limit)
  const PAGE_SIZE = 25;
  const [skip, setSkip] = useState(0);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 220);

  const [type, setType] = useState("all"); // all|user|guest

  const [data, setData] = useState({ total: 0, carts: [] });

  // selection + details
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCart, setSelectedCart] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const selectReqIdRef = useRef(0);

  // modals for editing
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null); // { productId, variantBarcode, qty }
  const [savingItem, setSavingItem] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    productId: "",
    variantBarcode: "",
    qty: 1,
    title: "",
    image: "",
    unitPrice: "",
  });
  const [adding, setAdding] = useState(false);

  const [clearing, setClearing] = useState(false);
  const [removingKey, setRemovingKey] = useState(""); // productId|variantBarcode

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

  async function loadCarts({ reset = false, showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoading(true);

    try {
      const nextSkip = reset ? 0 : skip;

      const qs = new URLSearchParams();
      if (debouncedQ.trim()) qs.set("q", debouncedQ.trim());
      qs.set("type", type);
      qs.set("limit", String(PAGE_SIZE));
      qs.set("skip", String(nextSkip));

      const res = await apiFetch(`/api/admin/customer/cart?${qs.toString()}`);

      setData({
        total: Number(res.total || 0),
        carts: Array.isArray(res.carts) ? res.carts : [],
      });

      if (reset) setSkip(0);
    } catch (e) {
      if (e?.status === 401) showToast("error", "Unauthorized. Please login again.");
      else if (e?.status === 403) showToast("error", "Forbidden. Admin only.");
      else showToast("error", e.message || "Failed to load carts");
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  async function loadCartById(cartId, { open = true } = {}) {
    if (!cartId) return;

    setSelectedId(String(cartId));
    setSelectedCart((prev) => (prev?._id === cartId ? prev : { _id: cartId }));

    const reqId = ++selectReqIdRef.current;

    try {
      const res = await apiFetch(`/api/admin/customer/cart/${cartId}`);
      if (reqId !== selectReqIdRef.current) return;
      setSelectedCart(res.cart || null);
      if (open) setDetailsOpen(true);
    } catch (e) {
      if (reqId !== selectReqIdRef.current) return;
      showToast("error", e.message || "Failed to load cart");
    }
  }

  useEffect(() => {
    loadCarts({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // whenever search/type changes, reset to page 1
    loadCarts({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, type]);

  const stats = useMemo(() => {
    const carts = data.carts || [];
    const totalCarts = Number(data.total || 0);
    const onPage = carts.length;
    const userCarts = carts.filter((c) => !!c.user).length;
    const guestCarts = carts.filter((c) => !c.user && c.guestId).length;
    return { totalCarts, onPage, userCarts, guestCarts };
  }, [data]);

  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil((Number(data.total || 0) || 0) / PAGE_SIZE));
  const canPrev = skip > 0 && !loading;
  const canNext = skip + PAGE_SIZE < Number(data.total || 0) && !loading;

  async function clearSelectedCart() {
    const id = selectedCart?._id;
    if (!id) return;

    setClearing(true);
    try {
      await apiFetch(`/api/admin/customer/cart/${id}`, { method: "DELETE" });
      showToast("success", "Cart cleared");
      await loadCartById(id, { open: true });
      await loadCarts({ reset: false });
    } catch (e) {
      showToast("error", e.message || "Failed to clear cart");
    } finally {
      setClearing(false);
    }
  }

  function openEditQty(it) {
    const pid = String(it?.product?._id || it?.product || "");
    setEditItem({
      productId: pid,
      variantBarcode: it?.variantBarcode || "",
      qty: Number(it?.qty || 1),
      title: it?.title || it?.product?.title || "",
    });
    setEditOpen(true);
  }

  async function submitEditQty() {
    const cartId = selectedCart?._id;
    if (!cartId) return;
    const productId = String(editItem?.productId || "").trim();
    if (!productId) return showToast("error", "Missing productId");
    const qty = Number(editItem?.qty);
    if (!Number.isFinite(qty)) return showToast("error", "Qty must be a number");

    setSavingItem(true);
    try {
      await apiFetch(`/api/admin/customer/cart/${cartId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "setQty",
          productId,
          variantBarcode: editItem?.variantBarcode || "",
          qty,
        }),
      });
      showToast("success", "Quantity updated");
      setEditOpen(false);
      await loadCartById(cartId, { open: true });
      await loadCarts({ reset: false });
    } catch (e) {
      showToast("error", e.message || "Failed to update qty");
    } finally {
      setSavingItem(false);
    }
  }

  async function removeItem(it) {
    const cartId = selectedCart?._id;
    if (!cartId) return;
    const productId = String(it?.product?._id || it?.product || "");
    const variantBarcode = String(it?.variantBarcode || "");
    const key = `${productId}|${variantBarcode}`;
    if (!productId) return;

    setRemovingKey(key);
    try {
      await apiFetch(`/api/admin/customer/cart/${cartId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "remove",
          productId,
          variantBarcode,
        }),
      });
      showToast("success", "Item removed");
      await loadCartById(cartId, { open: true });
      await loadCarts({ reset: false });
    } catch (e) {
      showToast("error", e.message || "Failed to remove item");
    } finally {
      setRemovingKey("");
    }
  }

  function openAddItem() {
    setAddForm({ productId: "", variantBarcode: "", qty: 1, title: "", image: "", unitPrice: "" });
    setAddOpen(true);
  }

  async function submitAddItem() {
    const cartId = selectedCart?._id;
    if (!cartId) return;
    const productId = String(addForm.productId || "").trim();
    if (!productId) return showToast("error", "ProductId is required");
    const qty = Number(addForm.qty);
    if (!Number.isFinite(qty) || qty <= 0) return showToast("error", "Qty must be a valid number");

    const snapshot = {};
    if (String(addForm.title || "").trim()) snapshot.title = String(addForm.title).trim();
    if (String(addForm.image || "").trim()) snapshot.image = String(addForm.image).trim();
    if (String(addForm.unitPrice || "").trim() !== "") {
      const p = Number(addForm.unitPrice);
      if (!Number.isFinite(p) || p < 0) return showToast("error", "unitPrice must be a non-negative number");
      snapshot.unitPrice = p;
    }

    setAdding(true);
    try {
      await apiFetch(`/api/admin/customer/cart/${cartId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "add",
          productId,
          variantBarcode: String(addForm.variantBarcode || ""),
          qty,
          snapshot: Object.keys(snapshot).length ? snapshot : undefined,
        }),
      });
      showToast("success", "Item added");
      setAddOpen(false);
      await loadCartById(cartId, { open: true });
      await loadCarts({ reset: false });
    } catch (e) {
      showToast("error", e.message || "Failed to add item");
    } finally {
      setAdding(false);
    }
  }

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
        <div
          className="absolute -left-20 -top-20 h-[340px] w-[340px] rounded-full blur-3xl"
          style={{ background: "rgba(255,126,105,0.10)" }}
        />
        <div
          className="absolute right-[-140px] top-[120px] h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: "rgba(11,27,51,0.05)" }}
        />
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
                    <ShoppingCart className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                        Carts
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
                      View and manage customer/guest carts. Open a cart to edit items or clear it.
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
                    <span style={{ color: PALETTE.navy }}>{stats.totalCarts}</span>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}
                  >
                    <span style={{ color: PALETTE.muted }}>User on page</span>
                    <span style={{ color: PALETTE.navy }}>{stats.userCarts}</span>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: "rgba(255,126,105,0.10)", border: "1px solid rgba(255,126,105,0.20)" }}
                  >
                    <span style={{ color: PALETTE.muted }}>Guest on page</span>
                    <span style={{ color: PALETTE.navy }}>{stats.guestCarts}</span>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: "rgba(11,27,51,0.05)", border: `1px solid ${PALETTE.border}` }}
                  >
                    <span style={{ color: PALETTE.muted }}>Showing</span>
                    <span style={{ color: PALETTE.navy }}>{stats.onPage}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SoftButton
                  icon={RefreshCw}
                  loading={refreshing}
                  onClick={() => loadCarts({ reset: true, showSpinner: true })}
                >
                  Refresh
                </SoftButton>
              </div>
            </div>

            {/* Search / Filter row */}
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
              <div className="md:col-span-8">
                <Field label="Search" icon={Search}>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                    placeholder="Search by customer email/name or guestId…"
                  />
                </Field>
              </div>

              <div className="md:col-span-4">
                <Field
                  label="Type"
                  icon={Filter}
                  rightSlot={
                    <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                      {type.toUpperCase()}
                    </span>
                  }
                >
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                    style={{ color: PALETTE.navy, height: 42 }}
                  >
                    <option value="all">All</option>
                    <option value="user">User</option>
                    <option value="guest">Guest</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Table Card */}
      <div className="mx-auto max-w-screen-xl px-5 pb-10 md:px-10 lg:px-12">
        <Card>
          <div className="overflow-auto" style={{ height: "min(58vh, 620px)" }}>
            {loading ? (
              <TableSkeleton rows={10} />
            ) : data.carts?.length ? (
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
                    <th className="px-6 py-3 font-semibold">Cart</th>
                    <th className="px-6 py-3 font-semibold">Items</th>
                    <th className="px-6 py-3 font-semibold">Qty</th>
                    <th className="px-6 py-3 font-semibold">Subtotal</th>
                    <th className="px-6 py-3 font-semibold text-right">Updated</th>
                  </tr>
                </thead>

                <tbody>
                  {data.carts.map((c) => {
                    const isSel = selectedId && String(selectedId) === String(c._id);
                    const t = cartType(c);
                    const sums = sumCart(c);

                    return (
                      <tr
                        key={String(c._id)}
                        onClick={() => loadCartById(c._id, { open: true })}
                        className="transition"
                        style={{
                          cursor: "pointer",
                          background: isSel ? "rgba(11,27,51,0.05)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSel) e.currentTarget.style.background = "rgba(11,27,51,0.035)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSel) e.currentTarget.style.background = "transparent";
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
                              {t === "user" ? (
                                <User className="h-4 w-4" style={{ color: PALETTE.navy }} />
                              ) : t === "guest" ? (
                                <Ghost className="h-4 w-4" style={{ color: PALETTE.navy }} />
                              ) : (
                                <ShoppingCart className="h-4 w-4" style={{ color: PALETTE.navy }} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="font-semibold leading-snug" style={{ color: PALETTE.navy }}>
                                {cartLabel(c)}
                              </div>
                              <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                                {t === "user"
                                  ? `User cart • ${c?.user?.name ? c.user.name : "—"}`
                                  : t === "guest"
                                  ? `Guest cart`
                                  : "Cart"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <span
                            className="inline-flex min-w-[44px] justify-center rounded-xl px-2 py-1 text-[12px] font-semibold"
                            style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}`, color: PALETTE.navy }}
                          >
                            {sums.lines}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                            {sums.qty}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                            {formatMoney(sums.subtotal)}
                          </span>
                          <span className="ml-1 text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                            BDT
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                            {c?.updatedAt ? new Date(c.updatedAt).toLocaleString() : "—"}
                          </span>
                        </td>
                      </tr>
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
                    <ShoppingCart className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="mt-4 text-[15px] font-semibold" style={{ color: PALETTE.navy }}>
                    No carts found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Try adjusting filters or search text.
                  </div>

                  <div className="mt-5 flex justify-center">
                    <SoftButton icon={RefreshCw} onClick={() => loadCarts({ reset: true, showSpinner: true })}>
                      Refresh
                    </SoftButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Divider />

          {/* Footer: pagination */}
          <div className="flex items-center justify-between p-4">
            <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              Page <span style={{ color: PALETTE.navy, fontWeight: 800 }}>{page}</span> / {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <SoftButton
                disabled={!canPrev}
                icon={ChevronLeft}
                onClick={() => {
                  const next = Math.max(0, skip - PAGE_SIZE);
                  setSkip(next);
                  setTimeout(() => loadCarts({ reset: false }), 0);
                }}
              >
                Prev
              </SoftButton>

              <SoftButton
                disabled={!canNext}
                icon={ChevronRight}
                onClick={() => {
                  const next = skip + PAGE_SIZE;
                  setSkip(next);
                  setTimeout(() => loadCarts({ reset: false }), 0);
                }}
              >
                Next
              </SoftButton>
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------ Cart Details Modal ------------------------ */}
      <Modal
        open={detailsOpen}
        title="Cart details"
        subtitle={selectedCart ? `${cartLabel(selectedCart)} • ${String(selectedCart._id || "")}` : "Loading…"}
        onClose={() => setDetailsOpen(false)}
        footer={
          <>
            <SoftButton onClick={() => setDetailsOpen(false)}>Close</SoftButton>

            <SoftButton icon={Plus} disabled={!selectedCart?._id} onClick={openAddItem}>
              Add item
            </SoftButton>

            <button
              type="button"
              onClick={clearSelectedCart}
              disabled={!selectedCart?._id || clearing}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                !selectedCart?._id || clearing ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-95"
              )}
              style={{
                background: "rgba(255,107,107,0.14)",
                border: "1px solid rgba(255,107,107,0.25)",
                color: PALETTE.navy,
                boxShadow: "0 12px 28px rgba(0,31,63,.10)",
              }}
            >
              {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Clear cart
            </button>
          </>
        }
      >
        {!selectedCart || !selectedCart.items ? (
          <div className="grid gap-3">
            <Shimmer className="h-10 rounded-2xl" />
            <Shimmer className="h-10 rounded-2xl" />
            <Shimmer className="h-10 rounded-2xl" />
          </div>
        ) : (
          <div className="grid gap-5">
            {/* Summary chips */}
            <div className="flex flex-wrap gap-2">
              {(() => {
                const s = sumCart(selectedCart);
                return (
                  <>
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                    >
                      <span style={{ color: PALETTE.muted }}>Lines</span>
                      <span style={{ color: PALETTE.navy }}>{s.lines}</span>
                    </div>
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{ background: "rgba(11,27,51,0.05)", border: `1px solid ${PALETTE.border}` }}
                    >
                      <span style={{ color: PALETTE.muted }}>Qty</span>
                      <span style={{ color: PALETTE.navy }}>{s.qty}</span>
                    </div>
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}
                    >
                      <span style={{ color: PALETTE.muted }}>Subtotal</span>
                      <span style={{ color: PALETTE.navy }}>{formatMoney(s.subtotal)} BDT</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Items list */}
            <div className="grid gap-3">
              {selectedCart.items.length ? (
                selectedCart.items.map((it, idx) => {
                  const pid = String(it?.product?._id || it?.product || "");
                  const v = String(it?.variantBarcode || "");
                  const key = `${pid}|${v}`;
                  const title = it?.title || it?.product?.title || "Untitled product";
                  const img = it?.image || it?.product?.image || "";
                  const unitPrice = Number(it?.unitPrice || 0);
                  const qty = Number(it?.qty || 0);
                  const lineTotal = unitPrice * qty;

                  return (
                    <div
                      key={key || idx}
                      className="flex flex-col gap-3 rounded-[22px] p-4 sm:flex-row sm:items-center sm:justify-between"
                      style={{
                        background: "rgba(255,255,255,0.92)",
                        border: `1px solid ${PALETTE.border}`,
                        boxShadow: "0 12px 26px rgba(0,31,63,0.05)",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="grid h-11 w-11 place-items-center rounded-3xl overflow-hidden"
                          style={{
                            background:
                              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.14), rgba(11,27,51,0.05) 60%), #fff",
                            border: `1px solid ${PALETTE.border}`,
                          }}
                        >
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5" style={{ color: PALETTE.navy }} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold truncate" style={{ color: PALETTE.navy }}>
                            {title}
                          </div>
                          <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                            Product: {pid || "—"} {v ? `• Variant: ${v}` : ""}
                          </div>
                          <div className="mt-1 text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                            {formatMoney(unitPrice)} BDT{" "}
                            <span className="font-medium" style={{ color: PALETTE.muted }}>
                              × {qty} = {formatMoney(lineTotal)} BDT
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <SoftButton
                          icon={Pencil}
                          onClick={() => openEditQty(it)}
                          className="px-3"
                        >
                          Edit qty
                        </SoftButton>

                        <button
                          type="button"
                          onClick={() => removeItem(it)}
                          disabled={removingKey === key}
                          className={cx(
                            "inline-flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                            removingKey === key ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-95"
                          )}
                          style={{
                            background: "rgba(255,107,107,0.14)",
                            border: "1px solid rgba(255,107,107,0.25)",
                            color: PALETTE.navy,
                            boxShadow: "0 12px 28px rgba(0,31,63,.10)",
                          }}
                        >
                          {removingKey === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  className="rounded-[24px] p-6 text-center"
                  style={{ background: PALETTE.soft, border: `1px dashed ${PALETTE.border}` }}
                >
                  <div className="text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                    Cart is empty
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Add an item to this cart if needed.
                  </div>
                  <div className="mt-4 flex justify-center">
                    <PrimaryButton icon={Plus} onClick={openAddItem}>
                      Add item
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ---------------------------- Edit Qty ---------------------------- */}
      <Modal
        open={editOpen}
        title="Edit quantity"
        subtitle={editItem?.title ? editItem.title : "Update item quantity (0 removes it)"}
        onClose={() => (savingItem ? null : setEditOpen(false))}
        footer={
          <>
            <SoftButton disabled={savingItem} onClick={() => setEditOpen(false)}>
              Cancel
            </SoftButton>
            <PrimaryButton loading={savingItem} onClick={submitEditQty}>
              Save
            </PrimaryButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ProductId" icon={Package}>
            <input
              value={editItem?.productId || ""}
              onChange={(e) => setEditItem((x) => ({ ...(x || {}), productId: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="Mongo ObjectId"
            />
          </Field>

          <Field label="Variant barcode (optional)" icon={Filter}>
            <input
              value={editItem?.variantBarcode || ""}
              onChange={(e) => setEditItem((x) => ({ ...(x || {}), variantBarcode: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="e.g. VAR-XL-RED"
            />
          </Field>

          <Field label="Qty (0 removes)" icon={Pencil}>
            <input
              type="number"
              value={Number(editItem?.qty ?? 1)}
              onChange={(e) => setEditItem((x) => ({ ...(x || {}), qty: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="1"
            />
          </Field>

          <div className="rounded-2xl p-4" style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}>
            <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
              Tip
            </div>
            <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              Set qty to <b>0</b> to remove the item from the cart.
            </div>
          </div>
        </div>
      </Modal>

      {/* ---------------------------- Add Item ---------------------------- */}
      <Modal
        open={addOpen}
        title="Add item"
        subtitle="Provide productId and qty. Snapshot fields are optional."
        onClose={() => (adding ? null : setAddOpen(false))}
        footer={
          <>
            <SoftButton disabled={adding} onClick={() => setAddOpen(false)}>
              Cancel
            </SoftButton>
            <PrimaryButton icon={Plus} loading={adding} onClick={submitAddItem}>
              Add
            </PrimaryButton>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ProductId" icon={Package}>
            <input
              value={addForm.productId}
              onChange={(e) => setAddForm((f) => ({ ...f, productId: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="Mongo ObjectId"
            />
          </Field>

          <Field label="Variant barcode (optional)" icon={Filter}>
            <input
              value={addForm.variantBarcode}
              onChange={(e) => setAddForm((f) => ({ ...f, variantBarcode: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="e.g. VAR-XL-RED"
            />
          </Field>

          <Field label="Qty" icon={Pencil}>
            <input
              type="number"
              value={addForm.qty}
              onChange={(e) => setAddForm((f) => ({ ...f, qty: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="1"
            />
          </Field>

          <div className="rounded-2xl p-4" style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}>
            <div className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
              Optional snapshots
            </div>
            <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              If you set these, cart UI can render faster (title/image/unitPrice).
            </div>
          </div>

          <Field label="Title (optional)" icon={ShoppingCart}>
            <input
              value={addForm.title}
              onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="Product title"
            />
          </Field>

          <Field label="Image URL (optional)" icon={Ghost}>
            <input
              value={addForm.image}
              onChange={(e) => setAddForm((f) => ({ ...f, image: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="https://..."
            />
          </Field>

          <Field label="Unit price (optional)" icon={User}>
            <input
              value={addForm.unitPrice}
              onChange={(e) => setAddForm((f) => ({ ...f, unitPrice: e.target.value }))}
              className="w-full bg-transparent text-sm font-semibold outline-none"
              style={{ color: PALETTE.navy, height: 42 }}
              placeholder="e.g. 1299"
            />
          </Field>
        </div>
      </Modal>
    </main>
  );
}