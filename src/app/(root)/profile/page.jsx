"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import {
  User2,
  ShieldCheck,
  ShoppingBag,
  Mail,
  Lock,
  Pencil,
  Save,
  RefreshCw,
  Loader2,
  CalendarDays,
  CreditCard,
  CheckCircle2,
  Clock3,
  CircleAlert,
  Package,
  ChevronRight,
  LayoutGrid,
  ArrowRight,
  FileText,
  Truck,
  StickyNote,
} from "lucide-react";

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

function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value, currency = "BDT") {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency}`;
  }
}

function getOrderStatusTheme(status = "") {
  const s = String(status || "").trim().toLowerCase();

  if (["delivered", "completed", "confirmed"].includes(s)) {
    return {
      bg: "rgba(16,185,129,0.12)",
      border: "1px solid rgba(16,185,129,0.24)",
      color: "#065f46",
      icon: CheckCircle2,
      label: status || "Delivered",
      progressBg: "rgba(16,185,129,0.14)",
      progressFill: "linear-gradient(90deg, #10b981, #34d399)",
      progress: 100,
    };
  }

  if (["shipped"].includes(s)) {
    return {
      bg: "rgba(59,130,246,0.12)",
      border: "1px solid rgba(59,130,246,0.24)",
      color: "#1d4ed8",
      icon: Truck,
      label: status || "Shipped",
      progressBg: "rgba(59,130,246,0.14)",
      progressFill: "linear-gradient(90deg, #3b82f6, #60a5fa)",
      progress: 78,
    };
  }

  if (["processing", "placed", "packing"].includes(s)) {
    return {
      bg: "rgba(249,115,22,0.12)",
      border: "1px solid rgba(249,115,22,0.24)",
      color: "#c2410c",
      icon: Package,
      label: status || "Processing",
      progressBg: "rgba(249,115,22,0.14)",
      progressFill: "linear-gradient(90deg, #f97316, #fb923c)",
      progress: 52,
    };
  }

  if (["pending"].includes(s)) {
    return {
      bg: "rgba(234,179,8,0.14)",
      border: "1px solid rgba(234,179,8,0.24)",
      color: "#a16207",
      icon: Clock3,
      label: status || "Pending",
      progressBg: "rgba(234,179,8,0.14)",
      progressFill: "linear-gradient(90deg, #eab308, #facc15)",
      progress: 24,
    };
  }

  return {
    bg: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.24)",
    color: "#b91c1c",
    icon: CircleAlert,
    label: status || "Unknown",
    progressBg: "rgba(239,68,68,0.12)",
    progressFill: "linear-gradient(90deg, #ef4444, #f87171)",
    progress: 10,
  };
}

function getPaymentTheme(status = "") {
  const s = String(status || "").trim().toLowerCase();

  if (["paid", "success", "completed"].includes(s)) {
    return {
      bg: "rgba(16,185,129,0.10)",
      border: "1px solid rgba(16,185,129,0.22)",
      color: "#065f46",
      icon: CheckCircle2,
      label: status || "Paid",
    };
  }

  if (["unpaid", "pending"].includes(s)) {
    return {
      bg: "rgba(234,179,8,0.14)",
      border: "1px solid rgba(234,179,8,0.24)",
      color: "#a16207",
      icon: Clock3,
      label: status || "Unpaid",
    };
  }

  return {
    bg: "rgba(59,130,246,0.12)",
    border: "1px solid rgba(59,130,246,0.24)",
    color: "#1d4ed8",
    icon: CreditCard,
    label: status || "Payment",
  };
}

const Card = React.memo(function Card({ children, className }) {
  return (
    <div
      className={cx("overflow-hidden", className)}
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 18px 42px rgba(0,31,63,0.06)",
        borderRadius: 28,
      }}
    >
      {children}
    </div>
  );
});

const Divider = React.memo(function Divider() {
  return <div style={{ height: 1, width: "100%", background: "rgba(2,10,25,0.06)" }} />;
});

const Badge = React.memo(function Badge({ icon: Icon, children }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
      style={{
        background: "#fff",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.muted,
        boxShadow: "0 8px 18px rgba(0,31,63,.05)",
      }}
    >
      <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
      {children}
    </div>
  );
});

const StatPill = React.memo(function StatPill({ label, value, tone = "default" }) {
  const style =
    tone === "success"
      ? { background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }
      : tone === "danger"
      ? { background: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.18)" }
      : { background: PALETTE.soft, border: `1px solid ${PALETTE.border}` };

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
      style={style}
    >
      <span style={{ color: PALETTE.muted }}>{label}</span>
      <span style={{ color: PALETTE.navy }}>{value}</span>
    </div>
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
        boxShadow: "0 8px 18px rgba(0,31,63,.05)",
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
        boxShadow: "0 12px 24px rgba(0,31,63,.16)",
      }}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.navy}, ${PALETTE.gold})`,
            opacity: 0.28,
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

const Field = React.memo(function Field({ label, icon: Icon, children }) {
  return (
    <label className="grid gap-2">
      {label ? (
        <span className="text-[11px] font-medium tracking-wide" style={{ color: PALETTE.muted }}>
          {label}
        </span>
      ) : null}

      <div
        className={cx(
          "group flex h-12 items-center gap-2 overflow-hidden rounded-2xl px-3 transition",
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
      </div>
    </label>
  );
});

const InfoTile = React.memo(function InfoTile({ icon: Icon, title, value, subtle }) {
  return (
    <div
      className="p-4"
      style={{
        background: "rgba(255,255,255,0.96)",
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 10px 20px rgba(0,31,63,.04)",
        borderRadius: 24,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.16), rgba(11,27,51,0.05) 60%), #fff",
            border: `1px solid ${PALETTE.border}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
        </div>

        <div className="min-w-0">
          <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
            {title}
          </div>
          <div className="mt-1 text-sm font-extrabold break-words" style={{ color: PALETTE.navy }}>
            {value || "—"}
          </div>
          {subtle ? (
            <div className="mt-1 text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
              {subtle}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

function ProfileSkeleton() {
  return (
    <div className="grid gap-6">
      <Card>
        <div className="p-6">
          <div className="h-8 w-52 rounded-2xl bg-black/5 animate-pulse" />
          <div className="mt-5 h-32 rounded-[28px] bg-black/5 animate-pulse" />
          <div className="mt-5 h-12 rounded-2xl bg-black/5 animate-pulse" />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="h-24 rounded-[24px] bg-black/5 animate-pulse" />
            <div className="h-24 rounded-[24px] bg-black/5 animate-pulse" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="h-8 w-44 rounded-2xl bg-black/5 animate-pulse" />
          <div className="mt-5 h-44 rounded-[28px] bg-black/5 animate-pulse" />
          <div className="mt-4 h-44 rounded-[28px] bg-black/5 animate-pulse" />
        </div>
      </Card>
    </div>
  );
}

const OrderDetailBlock = React.memo(function OrderDetailBlock({ icon: Icon, title, children }) {
  return (
    <div
      className="p-4"
      style={{
        background: "#fff",
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 6px 16px rgba(0,31,63,.04)",
        borderRadius: 22,
      }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-2xl shrink-0"
          style={{
            background: PALETTE.soft,
            border: `1px solid ${PALETTE.border}`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
        </div>

        <div className="text-sm font-extrabold" style={{ color: PALETTE.navy }}>
          {title}
        </div>
      </div>

      {children}
    </div>
  );
});

const OrderCard = React.memo(function OrderCard({ order }) {
  const orderStatus = getOrderStatusTheme(order?.status);
  const paymentStatus = getPaymentTheme(order?.paymentStatus);
  const OrderIcon = orderStatus.icon;
  const PaymentIcon = paymentStatus.icon;

  const address = order?.shippingAddress || {};
  const fullAddress = [
    address.addressLine1,
    address.addressLine2,
    address.area,
    address.city,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  const items = Array.isArray(order?.items) ? order.items : [];

  return (
    <div
      className="p-4 sm:p-5"
      style={{
        background: "rgba(255,255,255,0.98)",
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 10px 26px rgba(0,31,63,0.05)",
        borderRadius: 26,
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[16px] font-extrabold" style={{ color: PALETTE.navy }}>
              {order?.orderNo ? `Order #${order.orderNo}` : "Order"}
            </div>

            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ background: orderStatus.bg, border: orderStatus.border, color: orderStatus.color }}
            >
              <OrderIcon className="h-3.5 w-3.5" />
              {orderStatus.label}
            </span>

            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ background: paymentStatus.bg, border: paymentStatus.border, color: paymentStatus.color }}
            >
              <PaymentIcon className="h-3.5 w-3.5" />
              {paymentStatus.label}
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
              <span>Order progress</span>
              <span>{orderStatus.progress}%</span>
            </div>

            <div
              className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: orderStatus.progressBg }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${orderStatus.progress}%`,
                  background: orderStatus.progressFill,
                }}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(order?.createdAt)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              {order?.paymentMethod || "COD"}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              {items.length ? `${items.length} items` : "Order details"}
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl px-4 py-3 self-start"
          style={{
            background: PALETTE.soft,
            border: `1px solid ${PALETTE.border}`,
            minWidth: 160,
          }}
        >
          <div className="text-[11px] font-semibold" style={{ color: PALETTE.muted }}>
            Total
          </div>
          <div className="mt-1 text-[18px] font-black" style={{ color: PALETTE.navy }}>
            {formatMoney(order?.total, "BDT")}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <OrderDetailBlock icon={FileText} title="Order summary">
          <div className="grid gap-2 text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
            <div className="flex items-center justify-between gap-3">
              <span style={{ color: PALETTE.muted }}>Subtotal</span>
              <span>{formatMoney(order?.subtotal, "BDT")}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span style={{ color: PALETTE.muted }}>Shipping</span>
              <span>{formatMoney(order?.shippingFee, "BDT")}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span style={{ color: PALETTE.muted }}>Discount</span>
              <span>{formatMoney(order?.discount, "BDT")}</span>
            </div>

            {items.length ? (
              <div
                className="mt-2 p-3"
                style={{
                  background: PALETTE.soft,
                  borderRadius: 16,
                }}
              >
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: PALETTE.muted }}>
                  Items
                </div>
                <div className="grid gap-2">
                  {items.map((item, idx) => (
                    <div key={String(item?._id || item?.id || idx)} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold" style={{ color: PALETTE.navy }}>
                          {item?.name || item?.productName || "Product"}
                        </div>
                        <div className="text-[12px]" style={{ color: PALETTE.muted }}>
                          Qty: {item?.quantity || 1}
                        </div>
                      </div>
                      <div className="shrink-0 font-bold" style={{ color: PALETTE.navy }}>
                        {formatMoney(item?.total ?? item?.price, "BDT")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </OrderDetailBlock>

        <OrderDetailBlock icon={Truck} title="Shipping">
          <div className="grid gap-2 text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
            <div>{address.fullName || "Customer"}</div>
            <div style={{ color: PALETTE.muted }}>{address.phone || "—"}</div>
            <div style={{ color: PALETTE.muted }}>{address.email || "—"}</div>
            <div style={{ color: PALETTE.muted, lineHeight: 1.5 }}>{fullAddress || "Address not available"}</div>
          </div>
        </OrderDetailBlock>

        <OrderDetailBlock icon={StickyNote} title="Notes">
          <div className="text-[13px] font-semibold leading-6" style={{ color: PALETTE.navy }}>
            {order?.noteFromCustomer || address?.notes || "No note added for this order."}
          </div>
        </OrderDetailBlock>
      </div>
    </div>
  );
});

const TabButton = React.memo(function TabButton({ active, icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        active ? "cursor-default text-white" : "cursor-pointer hover:opacity-95 active:scale-[0.99]"
      )}
      style={{
        background: active
          ? `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`
          : "transparent",
        border: `1px solid ${PALETTE.border}`,
        color: active ? "#ffffff" : PALETTE.navy,
        boxShadow: active ? "0 12px 24px rgba(0,31,63,.16)" : "none",
      }}
    >
      <span className="inline-flex items-center justify-center gap-2">
        <Icon className="h-4 w-4" />
        {children}
      </span>
    </button>
  );
});

export default function ProfilePage() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [tab, setTab] = useState("account");
  const [editMode, setEditMode] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  const [form, setForm] = useState({
    name: "",
    password: "",
  });

  function showToast(kind, message) {
    const base = {
      duration: 3500,
      style: {
        background: "rgba(255,255,255,0.92)",
        color: PALETTE.navy,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 14px 30px rgba(0,31,63,0.10)",
        borderRadius: 18,
        padding: "12px 14px",
        backdropFilter: "blur(10px)",
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

  async function loadMe() {
    setUserLoading(true);
    try {
      const data = await apiFetchJson("/api/auth/me");
      const u = data?.user || null;
      setUser(u);
      setForm((f) => ({
        ...f,
        name: u?.name || "",
      }));
    } catch (e) {
      if (e?.status === 401) {
        router.push("/login");
        return;
      }
      showToast("error", e.message || "Failed to load profile");
    } finally {
      setUserLoading(false);
    }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const data = await apiFetchJson("/api/customer/order");
      const list = Array.isArray(data?.orders) ? data.orders : [];
      setOrders(list);
    } catch (e) {
      if (e?.status === 401) {
        router.push("/login");
        return;
      }
      showToast("error", e.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function refreshAll() {
    setRefreshing(true);
    await Promise.all([loadMe(), loadOrders()]);
    setRefreshing(false);
  }

  async function saveAccount(e) {
    e.preventDefault();

    const payload = {};
    if (String(form.name || "").trim() !== String(user?.name || "").trim()) payload.name = form.name.trim();
    if (String(form.password || "").trim()) payload.password = form.password.trim();

    if (!Object.keys(payload).length) {
      showToast("error", "No changes to save");
      return;
    }

    try {
      setSavingAccount(true);

      const data = await apiFetchJson("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setUser(data?.user || user);
      setForm((f) => ({ ...f, password: "" }));
      setEditMode(false);
      showToast("success", "Account updated");
    } catch (e2) {
      showToast("error", e2.message || "Failed to update account");
    } finally {
      setSavingAccount(false);
    }
  }

  function handleEditClick() {
    setTab("account");
    setEditMode(true);
  }

  function handleCancelEdit() {
    setEditMode(false);
    setForm({
      name: user?.name || "",
      password: "",
    });
  }

  useEffect(() => {
    const t = getStoredToken();
    if (!t) {
      router.push("/login");
      return;
    }

    (async () => {
      await Promise.all([loadMe(), loadOrders()]);
      setBooting(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const orderStats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) =>
      ["pending", "processing", "placed", "packing", "shipped"].includes(String(o?.status || "").toLowerCase())
    ).length;
    const delivered = orders.filter((o) =>
      ["delivered", "completed", "confirmed"].includes(String(o?.status || "").toLowerCase())
    ).length;

    return { total, active, delivered };
  }, [orders]);

  if (booting || userLoading) {
    return (
      <main className="w-full min-h-screen" style={{ background: PALETTE.bg, color: PALETTE.navy }}>
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div
            className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full blur-3xl"
            style={{ background: "rgba(255,126,105,0.08)" }}
          />
          <div
            className="absolute right-[-140px] top-[120px] h-[360px] w-[360px] rounded-full blur-3xl"
            style={{ background: "rgba(11,27,51,0.04)" }}
          />
        </div>

        <div className="mx-auto max-w-screen-xl px-5 pt-6 pb-10 md:px-10 lg:px-12">
          <ProfileSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen" style={{ background: PALETTE.bg, color: PALETTE.navy }}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "rgba(255,255,255,0.92)",
            color: PALETTE.navy,
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 14px 30px rgba(0,31,63,0.10)",
            borderRadius: 18,
            padding: "12px 14px",
            backdropFilter: "blur(10px)",
          },
        }}
      />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full blur-3xl"
          style={{ background: "rgba(255,126,105,0.08)" }}
        />
        <div
          className="absolute right-[-140px] top-[120px] h-[360px] w-[360px] rounded-full blur-3xl"
          style={{ background: "rgba(11,27,51,0.04)" }}
        />
      </div>

      <div className="mx-auto max-w-screen-xl px-5 pt-6 pb-10 md:px-10 lg:px-12">
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
                      boxShadow: "0 10px 22px rgba(0,31,63,.05)",
                    }}
                  >
                    <User2 className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                        My Profile
                      </div>
                      <Badge icon={ShieldCheck}>Secure account • Customer area</Badge>
                    </div>

                    <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                      Manage your account details and view all orders from your profile.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatPill label="Orders" value={orderStats.total} />
                <StatPill label="Active" value={orderStats.active} />
                <StatPill label="Delivered" value={orderStats.delivered} tone="success" />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <TabButton
                  active={tab === "account"}
                  icon={User2}
                  onClick={() => {
                    setTab("account");
                    setEditMode(false);
                  }}
                >
                  Account
                </TabButton>

                <TabButton
                  active={tab === "orders"}
                  icon={ShoppingBag}
                  onClick={() => {
                    setTab("orders");
                    setEditMode(false);
                  }}
                >
                  Orders
                </TabButton>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SoftButton icon={RefreshCw} loading={refreshing} onClick={refreshAll}>
                  Refresh
                </SoftButton>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-95"
                  style={{
                    background: "rgba(255,255,255,0.96)",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.navy,
                    boxShadow: "0 8px 18px rgba(0,31,63,.05)",
                  }}
                >
                  Back to store
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6">
          {tab === "account" ? (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="grid gap-6"
            >
              <Card>
                <div className="p-6">
                  {!editMode ? (
                    <>
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div
                          className="flex-1 rounded-[28px] p-5"
                          style={{
                            background:
                              "radial-gradient(circle at 30% 20%, rgba(255,126,105,0.10), rgba(11,27,51,0.04) 55%), #fff",
                            border: `1px solid ${PALETTE.border}`,
                            boxShadow: "0 12px 26px rgba(0,31,63,0.04)",
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="grid h-16 w-16 place-items-center rounded-full text-xl font-black"
                              style={{
                                background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
                                color: "#fff",
                                boxShadow: "0 14px 28px rgba(0,31,63,.16)",
                              }}
                            >
                              {String(user?.name || user?.email || "U").trim().charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="text-[20px] font-black truncate" style={{ color: PALETTE.navy }}>
                                {user?.name || "Customer"}
                              </div>

                              <div className="mt-1 text-sm font-semibold truncate" style={{ color: PALETTE.muted }}>
                                {user?.email || "No email"}
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <span
                                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
                                  style={{
                                    background: "rgba(16,185,129,0.10)",
                                    border: "1px solid rgba(16,185,129,0.20)",
                                    color: PALETTE.navy,
                                  }}
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Logged in
                                </span>

                                <span
                                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
                                  style={{
                                    background: PALETTE.soft,
                                    border: `1px solid ${PALETTE.border}`,
                                    color: PALETTE.navy,
                                  }}
                                >
                                  <LayoutGrid className="h-3.5 w-3.5" />
                                  {user?.role || "customer"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <SoftButton icon={Pencil} onClick={handleEditClick}>
                            Edit account
                          </SoftButton>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <InfoTile
                          icon={User2}
                          title="Full name"
                          value={user?.name || "—"}
                          subtle="This is shown on your account"
                        />
                        <InfoTile
                          icon={Mail}
                          title="Email"
                          value={user?.email || "—"}
                          subtle="Used for login and order updates"
                        />
                      </div>
                    </>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      onSubmit={saveAccount}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[18px] font-extrabold" style={{ color: PALETTE.navy }}>
                            Edit account
                          </div>
                          <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                            Update your name or password here.
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <Field label="Full name" icon={User2}>
                          <input
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full bg-transparent text-sm font-semibold outline-none"
                            style={{ color: PALETTE.navy, height: 42 }}
                            placeholder="Enter your full name"
                          />
                        </Field>

                        <Field label="New password (optional)" icon={Lock}>
                          <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                            className="w-full bg-transparent text-sm font-semibold outline-none"
                            style={{ color: PALETTE.navy, height: 42 }}
                            placeholder="Minimum 8 characters"
                          />
                        </Field>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <PrimaryButton type="submit" icon={Save} loading={savingAccount}>
                          Save changes
                        </PrimaryButton>

                        <SoftButton type="button" disabled={savingAccount} onClick={handleCancelEdit}>
                          Cancel
                        </SoftButton>
                      </div>
                    </motion.form>
                  )}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="grid gap-6"
            >
              <Card>
                <div className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-[18px] font-extrabold" style={{ color: PALETTE.navy }}>
                        My Orders
                      </div>
                      <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                        These are the orders placed by your logged-in account.
                      </div>
                    </div>

                    <div
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                      style={{
                        background: "#fff",
                        border: `1px solid ${PALETTE.border}`,
                        boxShadow: "0 8px 18px rgba(0,31,63,.04)",
                      }}
                    >
                      <ShoppingBag className="h-4 w-4" style={{ color: PALETTE.navy }} />
                      <span style={{ color: PALETTE.muted }}>
                        Showing <span style={{ color: PALETTE.navy }}>{orders.length}</span> order
                        {orders.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <Divider />

                  <div className="pt-5">
                    {ordersLoading ? (
                      <div className="grid place-items-center py-14">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: PALETTE.navy }} />
                        <div className="mt-3 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                          Loading orders…
                        </div>
                      </div>
                    ) : orders.length ? (
                      <div className="grid gap-4">
                        {orders.map((order) => (
                          <OrderCard key={String(order?._id || order?.id || order?.orderNo)} order={order} />
                        ))}
                      </div>
                    ) : (
                      <div
                        className="rounded-[28px] p-8 text-center"
                        style={{
                          background:
                            "radial-gradient(circle at 30% 20%, rgba(255,126,105,0.10), rgba(11,27,51,0.04) 55%), #fff",
                          border: `1px dashed ${PALETTE.border}`,
                          boxShadow: "0 12px 26px rgba(0,31,63,0.04)",
                        }}
                      >
                        <div
                          className="mx-auto grid h-12 w-12 place-items-center rounded-3xl"
                          style={{ background: "rgba(11,27,51,0.05)", border: `1px solid ${PALETTE.border}` }}
                        >
                          <ShoppingBag className="h-5 w-5" style={{ color: PALETTE.navy }} />
                        </div>

                        <div className="mt-4 text-[15px] font-semibold" style={{ color: PALETTE.navy }}>
                          No orders found
                        </div>
                        <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                          Orders placed from this account will appear here automatically.
                        </div>

                        <div className="mt-5 flex justify-center">
                          <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-95"
                            style={{
                              background: "rgba(255,255,255,0.96)",
                              border: `1px solid ${PALETTE.border}`,
                              color: PALETTE.navy,
                              boxShadow: "0 8px 18px rgba(0,31,63,.05)",
                            }}
                          >
                            Continue shopping
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}