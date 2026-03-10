"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Loader2,
  User,
  Mail,
  Hash,
  Truck,
  BadgeCheck,
  PackageCheck,
  Ban,
  RotateCcw,
  Clock,
  DollarSign,
  Pencil,
  Save,
  MapPinned,
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

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const PAYMENT_STATUS_OPTIONS = ["unpaid"];
const DELIVERY_ZONE_OPTIONS = ["inside_dhaka", "outside_dhaka"];

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
          <div className="absolute inset-0" style={{ background: "rgba(11,27,51,0.18)" }} onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="relative w-full max-w-4xl overflow-hidden"
            style={{
              height: "min(78vh, 700px)",
              borderRadius: 28,
              background: "rgba(255,255,255,0.98)",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 28px 80px rgba(0,31,63,0.16)",
            }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4 p-6">
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                    {title}
                  </div>
                  {subtitle ? (
                    <div className="mt-1 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
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
              <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>

              {footer ? (
                <>
                  <Divider />
                  <div className="flex flex-wrap items-center justify-end gap-3 p-6">{footer}</div>
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function formatMoney(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function zoneLabel(v) {
  return v === "inside_dhaka" ? "Inside Dhaka" : v === "outside_dhaka" ? "Outside Dhaka" : "—";
}

function StatusPill({ value }) {
  const v = String(value || "pending");
  const map = {
    pending: { bg: "rgba(234,179,8,0.12)", bd: "rgba(234,179,8,0.22)", icon: Clock },
    confirmed: { bg: "rgba(59,130,246,0.10)", bd: "rgba(59,130,246,0.20)", icon: BadgeCheck },
    processing: { bg: "rgba(255,126,105,0.10)", bd: "rgba(255,126,105,0.20)", icon: PackageCheck },
    shipped: { bg: "rgba(14,165,233,0.10)", bd: "rgba(14,165,233,0.20)", icon: Truck },
    delivered: { bg: "rgba(16,185,129,0.10)", bd: "rgba(16,185,129,0.20)", icon: BadgeCheck },
    cancelled: { bg: "rgba(255,107,107,0.12)", bd: "rgba(255,107,107,0.22)", icon: Ban },
    returned: { bg: "rgba(168,85,247,0.10)", bd: "rgba(168,85,247,0.20)", icon: RotateCcw },
  };

  const s = map[v] || map.pending;
  const Icon = s.icon;

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
      style={{ background: s.bg, border: `1px solid ${s.bd}`, color: PALETTE.navy }}
    >
      <Icon className="h-4 w-4" />
      {v}
    </span>
  );
}

function PaymentPill({ value }) {
  const v = String(value || "unpaid");
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
      style={{
        background: v === "unpaid" ? "rgba(255,107,107,0.10)" : "rgba(16,185,129,0.10)",
        border: v === "unpaid" ? "1px solid rgba(255,107,107,0.18)" : "1px solid rgba(16,185,129,0.20)",
        color: PALETTE.navy,
      }}
    >
      <DollarSign className="h-4 w-4" />
      {v}
    </span>
  );
}

function DeliveryZonePill({ value }) {
  const v = String(value || "");
  const isInside = v === "inside_dhaka";

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
      style={{
        background: isInside ? "rgba(59,130,246,0.10)" : "rgba(255,126,105,0.10)",
        border: isInside ? "1px solid rgba(59,130,246,0.20)" : "1px solid rgba(255,126,105,0.20)",
        color: PALETTE.navy,
      }}
    >
      <MapPinned className="h-4 w-4" />
      {zoneLabel(v)}
    </span>
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
        <Shimmer className="col-span-3 h-5 rounded-xl" />
        <Shimmer className="col-span-3 h-5 rounded-xl" />
        <Shimmer className="col-span-2 h-5 rounded-xl" />
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
            <div className="col-span-3 grid gap-2">
              <Shimmer className="h-4 rounded-xl" style={{ width: "60%", border: "none" }} />
              <Shimmer className="h-3 rounded-xl" style={{ width: "40%", border: "none" }} />
            </div>
            <div className="col-span-3 grid gap-2">
              <Shimmer className="h-4 rounded-xl" style={{ width: "70%", border: "none" }} />
              <Shimmer className="h-3 rounded-xl" style={{ width: "50%", border: "none" }} />
            </div>
            <div className="col-span-2">
              <Shimmer className="h-7 rounded-full" style={{ width: 120, border: "none" }} />
            </div>
            <div className="col-span-2">
              <Shimmer className="h-7 rounded-full" style={{ width: 120, border: "none" }} />
            </div>
            <div className="col-span-2 flex justify-end">
              <Shimmer className="h-7 rounded-xl" style={{ width: "70%", border: "none" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  const PAGE_SIZE = 25;
  const [skip, setSkip] = useState(0);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 220);

  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [deliveryZone, setDeliveryZone] = useState("");

  const [data, setData] = useState({ total: 0, orders: [] });

  const [selectedId, setSelectedId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const selectReqIdRef = useRef(0);

  const [editStatus, setEditStatus] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [editDeliveryZone, setEditDeliveryZone] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function loadOrders({ reset = false, showSpinner = false, forceSkip } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoading(true);

    try {
      const nextSkip = typeof forceSkip === "number" ? forceSkip : reset ? 0 : skip;

      const qs = new URLSearchParams();
      if (debouncedQ.trim()) qs.set("q", debouncedQ.trim());
      if (status) qs.set("status", status);
      if (paymentStatus) qs.set("paymentStatus", paymentStatus);
      if (deliveryZone) qs.set("deliveryZone", deliveryZone);
      qs.set("limit", String(PAGE_SIZE));
      qs.set("skip", String(nextSkip));

      const res = await apiFetch(`/api/admin/order?${qs.toString()}`);

      setData({
        total: Number(res.total || 0),
        orders: Array.isArray(res.orders) ? res.orders : [],
      });

      if (reset) setSkip(0);
    } catch (e) {
      if (e?.status === 401) showToast("error", "Unauthorized. Please login again.");
      else if (e?.status === 403) showToast("error", "Forbidden. Admin only.");
      else showToast("error", e.message || "Failed to load orders");
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  async function loadOrderById(orderId) {
    if (!orderId) return;

    setSelectedId(String(orderId));
    setOrder((prev) => (prev?._id === orderId ? prev : { _id: orderId }));
    setDetailsOpen(true);

    const reqId = ++selectReqIdRef.current;

    try {
      const res = await apiFetch(`/api/admin/order/${orderId}`);
      if (reqId !== selectReqIdRef.current) return;

      const o = res.order || null;
      setOrder(o);
      setEditStatus(String(o?.status || "pending"));
      setEditPaymentStatus(String(o?.paymentStatus || "unpaid"));
      setEditDeliveryZone(String(o?.deliveryZone || "inside_dhaka"));
      setAdminNote(String(o?.adminNote || ""));
    } catch (e) {
      if (reqId !== selectReqIdRef.current) return;
      setDetailsOpen(false);
      showToast("error", e.message || "Failed to load order");
    }
  }

  useEffect(() => {
    loadOrders({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOrders({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, status, paymentStatus, deliveryZone]);

  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil((Number(data.total || 0) || 0) / PAGE_SIZE));
  const canPrev = skip > 0 && !loading;
  const canNext = skip + PAGE_SIZE < Number(data.total || 0) && !loading;

  const headerStats = useMemo(() => {
    const list = data.orders || [];
    const total = Number(data.total || 0);
    const onPage = list.length;
    const pending = list.filter((x) => String(x.status) === "pending").length;
    const delivered = list.filter((x) => String(x.status) === "delivered").length;
    return { total, onPage, pending, delivered };
  }, [data]);

  const lineSummary = useMemo(() => {
    const items = order?.items || [];
    const qty = items.reduce((s, it) => s + Number(it.qty || 0), 0);
    return { lines: items.length, qty };
  }, [order]);

  async function saveOrderUpdates() {
    if (!order?._id) return;

    setSaving(true);
    try {
      await apiFetch(`/api/admin/order/${order._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: editStatus,
          paymentStatus: editPaymentStatus,
          deliveryZone: editDeliveryZone,
          adminNote,
        }),
      });

      showToast("success", "Order updated");
      await loadOrderById(order._id);
      await loadOrders({ reset: false, forceSkip: skip });
    } catch (e) {
      showToast("error", e.message || "Failed to update order");
    } finally {
      setSaving(false);
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
                    <ClipboardList className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                        Orders
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
                      Search, filter, inspect and update order status.
                    </div>
                  </div>
                </div>

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
                    style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.22)" }}
                  >
                    <span style={{ color: PALETTE.muted }}>Pending (page)</span>
                    <span style={{ color: PALETTE.navy }}>{headerStats.pending}</span>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}
                  >
                    <span style={{ color: PALETTE.muted }}>Delivered (page)</span>
                    <span style={{ color: PALETTE.navy }}>{headerStats.delivered}</span>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: "rgba(11,27,51,0.05)", border: `1px solid ${PALETTE.border}` }}
                  >
                    <span style={{ color: PALETTE.muted }}>Showing</span>
                    <span style={{ color: PALETTE.navy }}>{headerStats.onPage}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SoftButton
                  icon={RefreshCw}
                  loading={refreshing}
                  onClick={() => loadOrders({ reset: true, showSpinner: true })}
                >
                  Refresh
                </SoftButton>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
              <div className="md:col-span-4">
                <Field label="Search" icon={Search}>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                    placeholder="Order no, email, name, phone, city…"
                  />
                </Field>
              </div>

              <div className="md:col-span-3">
                <Field
                  label="Status"
                  icon={Filter}
                  rightSlot={
                    <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                      {(status || "all").toUpperCase()}
                    </span>
                  }
                >
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                    style={{ color: PALETTE.navy, height: 42 }}
                  >
                    <option value="">All</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="md:col-span-3">
                <Field
                  label="Payment"
                  icon={Filter}
                  rightSlot={
                    <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                      {(paymentStatus || "all").toUpperCase()}
                    </span>
                  }
                >
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                    style={{ color: PALETTE.navy, height: 42 }}
                  >
                    <option value="">All</option>
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Zone"
                  icon={MapPinned}
                  rightSlot={
                    <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                      {deliveryZone ? zoneLabel(deliveryZone).toUpperCase() : "ALL"}
                    </span>
                  }
                >
                  <select
                    value={deliveryZone}
                    onChange={(e) => setDeliveryZone(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                    style={{ color: PALETTE.navy, height: 42 }}
                  >
                    <option value="">All</option>
                    {DELIVERY_ZONE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {zoneLabel(s)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mx-auto max-w-screen-xl px-5 pb-10 md:px-10 lg:px-12">
        <Card>
          <div className="overflow-auto" style={{ height: "min(58vh, 640px)" }}>
            {loading ? (
              <TableSkeleton rows={10} />
            ) : data.orders?.length ? (
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
                    <th className="px-6 py-3 font-semibold">Order</th>
                    <th className="px-6 py-3 font-semibold">Customer</th>
                    <th className="px-6 py-3 font-semibold">Zone</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Payment</th>
                    <th className="px-6 py-3 font-semibold text-right">Total</th>
                    <th className="px-6 py-3 font-semibold text-right">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {data.orders.map((o) => {
                    const isSel = selectedId && String(selectedId) === String(o._id);
                    const orderNo = o.orderNo || "—";
                    const email = o.customerEmail || o?.shippingAddress?.email || o?.customer?.email || "—";
                    const name = o?.shippingAddress?.fullName || o?.customer?.name || "—";

                    return (
                      <tr
                        key={String(o._id)}
                        onClick={() => loadOrderById(o._id)}
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
                              <Hash className="h-4 w-4" style={{ color: PALETTE.navy }} />
                            </div>

                            <div className="min-w-0">
                              <div className="font-semibold leading-snug" style={{ color: PALETTE.navy }}>
                                {orderNo}
                              </div>
                              <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                                {String(o._id)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 font-semibold" style={{ color: PALETTE.navy }}>
                              <User className="h-4 w-4" />
                              <span className="truncate">{name}</span>
                            </div>
                            <div
                              className="mt-0.5 flex items-center gap-2 text-[12px] font-medium truncate"
                              style={{ color: PALETTE.muted }}
                            >
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <DeliveryZonePill value={o.deliveryZone} />
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <StatusPill value={o.status} />
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <PaymentPill value={o.paymentStatus} />
                        </td>

                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                            {formatMoney(o.total)}{" "}
                            <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                              BDT
                            </span>
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle text-right">
                          <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                            {o?.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
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
                    <ClipboardList className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="mt-4 text-[15px] font-semibold" style={{ color: PALETTE.navy }}>
                    No orders found
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    Try adjusting filters or search text.
                  </div>

                  <div className="mt-5 flex justify-center">
                    <SoftButton icon={RefreshCw} onClick={() => loadOrders({ reset: true, showSpinner: true })}>
                      Refresh
                    </SoftButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Divider />

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
                  loadOrders({ reset: false, forceSkip: next });
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
                  loadOrders({ reset: false, forceSkip: next });
                }}
              >
                Next
              </SoftButton>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={detailsOpen}
        title="Order details"
        subtitle={order ? `${order.orderNo || "—"} • ${String(order._id || "")}` : "Loading…"}
        onClose={() => (saving ? null : setDetailsOpen(false))}
        footer={
          <>
            <SoftButton disabled={saving} onClick={() => setDetailsOpen(false)}>
              Close
            </SoftButton>

            <PrimaryButton icon={Save} loading={saving} onClick={saveOrderUpdates}>
              Save changes
            </PrimaryButton>
          </>
        }
      >
        {!order || !order.orderNo ? (
          <div className="grid gap-3">
            <Shimmer className="h-10 rounded-2xl" />
            <Shimmer className="h-10 rounded-2xl" />
            <Shimmer className="h-10 rounded-2xl" />
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div className="rounded-[22px] p-4" style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}>
                <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                  <User className="h-4 w-4" /> Customer
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {order?.shippingAddress?.fullName || order?.customer?.name || "—"}
                </div>
                <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  {order?.customerEmail || order?.shippingAddress?.email || order?.customer?.email || "—"}
                </div>
              </div>

              <div className="rounded-[22px] p-4" style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}>
                <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                  <ClipboardList className="h-4 w-4" /> Totals
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {formatMoney(order.total)} BDT
                </div>
                <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  Subtotal {formatMoney(order.subtotal)} • Shipping {formatMoney(order.shippingFee)} • Discount{" "}
                  {formatMoney(order.discount)}
                </div>
              </div>

              <div className="rounded-[22px] p-4" style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}>
                <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                  <MapPinned className="h-4 w-4" /> Delivery zone
                </div>
                <div className="mt-1">
                  <DeliveryZonePill value={order.deliveryZone} />
                </div>
                <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  Shipping fee: {formatMoney(order.shippingFee)} BDT
                </div>
              </div>

              <div className="rounded-[22px] p-4" style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}>
                <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                  <Clock className="h-4 w-4" /> Created
                </div>
                <div className="mt-1 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                  {order?.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
                </div>
                <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  Updated {order?.updatedAt ? new Date(order.updatedAt).toLocaleString() : "—"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Field
                label="Order status"
                icon={Pencil}
                rightSlot={
                  <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                    {String(editStatus || "").toUpperCase()}
                  </span>
                }
              >
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                  style={{ color: PALETTE.navy, height: 42 }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Payment status"
                icon={DollarSign}
                rightSlot={
                  <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                    {String(editPaymentStatus || "").toUpperCase()}
                  </span>
                }
              >
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                  style={{ color: PALETTE.navy, height: 42 }}
                >
                  {PAYMENT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Delivery zone"
                icon={MapPinned}
                rightSlot={
                  <span className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
                    {zoneLabel(editDeliveryZone).toUpperCase()}
                  </span>
                }
              >
                <select
                  value={editDeliveryZone}
                  onChange={(e) => setEditDeliveryZone(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                  style={{ color: PALETTE.navy, height: 42 }}
                >
                  {DELIVERY_ZONE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {zoneLabel(s)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div
              className="rounded-[22px] p-5"
              style={{
                background: "rgba(255,255,255,0.92)",
                border: `1px solid ${PALETTE.border}`,
                boxShadow: "0 12px 26px rgba(0,31,63,0.05)",
              }}
            >
              <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                <Truck className="h-4 w-4" /> Shipping address
              </div>
              <div className="mt-2 text-[14px] font-semibold" style={{ color: PALETTE.navy }}>
                {order?.shippingAddress?.fullName || "—"}
              </div>
              <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                {order?.shippingAddress?.phone || "—"} • {order?.shippingAddress?.email || "—"}
              </div>
              <div className="mt-2 text-[12px] font-medium" style={{ color: PALETTE.navy }}>
                {order?.shippingAddress?.addressLine1 || "—"}
              </div>
              <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                {order?.shippingAddress?.city || "—"}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                  Items
                </div>
                <div className="flex gap-2">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                  >
                    Lines <span style={{ color: PALETTE.navy }}>{lineSummary.lines}</span>
                  </span>
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: "rgba(11,27,51,0.05)", border: `1px solid ${PALETTE.border}` }}
                  >
                    Qty <span style={{ color: PALETTE.navy }}>{lineSummary.qty}</span>
                  </span>
                </div>
              </div>

              {(order.items || []).map((it, idx) => {
                const title = it.title || "Untitled";
                const img = it.image || "";
                const qty = Number(it.qty || 0);
                const unitPrice = Number(it.unitPrice || 0);
                const total = Number(it.lineTotal || unitPrice * qty || 0);

                return (
                  <div
                    key={idx}
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
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <PackageCheck className="h-5 w-5" style={{ color: PALETTE.navy }} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold truncate" style={{ color: PALETTE.navy }}>
                          {title}
                        </div>
                        <div className="mt-0.5 text-[12px] font-medium truncate" style={{ color: PALETTE.muted }}>
                          Product: {typeof it.product === "object" ? it.product?._id || "—" : String(it.product || "—")}
                          {it.variantBarcode ? ` • Variant: ${it.variantBarcode}` : ""}
                          {it.productBarcode ? ` • Barcode: ${it.productBarcode}` : ""}
                        </div>
                        <div className="mt-1 text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
                          {formatMoney(unitPrice)} BDT{" "}
                          <span className="font-medium" style={{ color: PALETTE.muted }}>
                            × {qty} = {formatMoney(total)} BDT
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <StatusPill value={order.status} />
                      <PaymentPill value={order.paymentStatus} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-2">
              <Label>Admin note</Label>
              <div
                className="rounded-[22px] p-4"
                style={{ background: "rgba(255,255,255,0.96)", border: `1px solid ${PALETTE.border}` }}
              >
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={4}
                  className="w-full bg-transparent text-sm font-semibold outline-none resize-none"
                  style={{ color: PALETTE.navy }}
                  placeholder="Internal note for admin/team…"
                />
              </div>
            </div>

            {order?.noteFromCustomer ? (
              <div
                className="rounded-[22px] p-5"
                style={{ background: "rgba(255,126,105,0.08)", border: "1px solid rgba(255,126,105,0.18)" }}
              >
                <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                  Customer note
                </div>
                <div className="mt-1 text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                  {order.noteFromCustomer}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </main>
  );
}