"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  Boxes,
  FolderKanban,
  BadgeCheck,
  Clock3,
  RefreshCw,
  Search,
  AlertTriangle,
  ShieldCheck,
  Truck,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Layers,
  Tags,
  Loader2,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

const cx = (...c) => c.filter(Boolean).join(" ");

const PALETTE = {
  navy: "#0F172A",
  slate: "#334155",
  text: "#0F172A",
  muted: "#64748B",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "rgba(15, 23, 42, 0.08)",
  border2: "rgba(15, 23, 42, 0.06)",
  soft: "#F1F5F9",
  softBlue: "#F8FAFC",
  softEmerald: "#F7FAF8",
  softAmber: "#FFFBF5",
  softRose: "#FFF8F8",
  softViolet: "#FAF8FF",
  headerGlow1: "rgba(15, 23, 42, 0.05)",
  headerGlow2: "rgba(148, 163, 184, 0.08)",
  success: "#166534",
  warning: "#92400E",
  danger: "#B91C1C",
  info: "#1D4ED8",
};

const STANDARD_FONT = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const initialData = {
  overview: {
    users: {
      total: 0,
      customers: 0,
      admins: 0,
      active: 0,
      inactive: 0,
      verified: 0,
      unverified: 0,
    },
    categories: {
      total: 0,
      active: 0,
      inactive: 0,
      totalSubcategories: 0,
      activeSubcategories: 0,
      inactiveSubcategories: 0,
    },
    brands: {
      total: 0,
      active: 0,
      inactive: 0,
      totalCategoryLinks: 0,
    },
    products: {
      total: 0,
      simple: 0,
      variable: 0,
      trending: 0,
      new: 0,
      inStock: 0,
      outOfStock: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      simpleWithBarcode: 0,
      variableWithVariants: 0,
      withSpecifications: 0,
      withHighlights: 0,
    },
    orders: {
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
      codOrders: 0,
      insideDhaka: 0,
      outsideDhaka: 0,
    },
    sales: {
      totalRevenue: 0,
      totalSubtotal: 0,
      totalShipping: 0,
      totalDiscount: 0,
      todayRevenue: 0,
      todayOrders: 0,
      monthRevenue: 0,
      monthOrders: 0,
    },
  },
  widgets: {
    recentOrders: [],
  },
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

async function apiFetch(path, opts = {}) {
  const token = getStoredToken();

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  if (!(opts.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, {
    ...opts,
    credentials: "include",
    headers,
    cache: "no-store",
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

function formatMoneyNumber(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(num);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-BD").format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function titleCase(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function isMongoLikeId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

function getCustomerName(order) {
  if (!order) return "Customer";

  const customer = order.customer;

  if (customer && typeof customer === "object") {
    return (
      customer.name ||
      customer.fullName ||
      customer.customerName ||
      [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
      customer.email ||
      "Customer"
    );
  }

  if (typeof customer === "string") {
    if (isMongoLikeId(customer)) {
      return (
        order.customerName ||
        order.name ||
        order.shippingName ||
        order.billingName ||
        order.customerEmail ||
        "Customer"
      );
    }
    return customer;
  }

  return (
    order.customerName ||
    order.name ||
    order.shippingName ||
    order.billingName ||
    order.customerEmail ||
    "Customer"
  );
}

function getCustomerSubline(order) {
  if (!order) return "—";

  const customer = order.customer;

  if (customer && typeof customer === "object") {
    return customer.email || customer.phone || order.customerEmail || "—";
  }

  if (order.customerEmail) return order.customerEmail;
  if (order.customerPhone) return order.customerPhone;

  return "—";
}

const Card = React.memo(function Card({ children, className, style }) {
  return (
    <div
      className={cx("rounded-[24px] overflow-hidden", className)}
      style={{
        ...STANDARD_FONT,
        background: PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 12px 36px rgba(15,23,42,0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
});

const Divider = React.memo(function Divider() {
  return (
    <div
      style={{
        height: 1,
        width: "100%",
        background: "rgba(15,23,42,0.06)",
      }}
    />
  );
});

const SoftButton = React.memo(function SoftButton({
  icon: Icon,
  children,
  className,
  loading,
  disabled,
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
        isDisabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:opacity-95 active:scale-[0.99]",
        className
      )}
      style={{
        ...STANDARD_FONT,
        background: "#FFFFFF",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.text,
        boxShadow: "0 8px 22px rgba(15,23,42,.05)",
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

function SearchField({ value, onChange, placeholder = "Search…" }) {
  return (
    <label
      className="flex h-11 items-center gap-2 rounded-2xl px-3 w-full md:w-[360px]"
      style={{
        ...STANDARD_FONT,
        background: "#FFFFFF",
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <Search className="h-4 w-4 shrink-0" style={{ color: PALETTE.muted }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-semibold outline-none"
        style={{ ...STANDARD_FONT, color: PALETTE.text }}
      />
    </label>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {Icon ? (
            <div
              className="grid h-10 w-10 place-items-center rounded-2xl shrink-0"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${PALETTE.border}`,
                boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
            </div>
          ) : null}

          <div className="min-w-0">
            <div
              className="text-[16px] font-semibold tracking-tight"
              style={{ ...STANDARD_FONT, color: PALETTE.text }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                className="mt-1 text-[12px] font-medium"
                style={{ ...STANDARD_FONT, color: PALETTE.muted }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}

function MoneyValue({
  value,
  size = "lg",
  sub = false,
  iconSize,
  gap = 8,
}) {
  const textSize =
    size === "xl"
      ? "text-[30px]"
      : size === "lg"
      ? "text-[26px]"
      : size === "md"
      ? "text-[20px]"
      : "text-[14px]";

  const resolvedIconSize =
    iconSize || (size === "xl" ? 26 : size === "lg" ? 24 : size === "md" ? 18 : 14);

  return (
    <div className="inline-flex items-center" style={{ gap }}>
      <span
        className="inline-flex items-center justify-center rounded-full"
        style={{
          width: resolvedIconSize + 8,
          height: resolvedIconSize + 8,
          background: "#FFFFFF",
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
        }}
      >
        <Image
          src="/assets/sign/taka.png"
          alt="TK"
          width={resolvedIconSize}
          height={resolvedIconSize}
          className="object-contain"
          priority
        />
      </span>

      <span
        className={cx(
          textSize,
          sub ? "font-medium" : "font-semibold",
          "tracking-tight"
        )}
        style={{ ...STANDARD_FONT, color: PALETTE.text, lineHeight: 1 }}
      >
        {formatMoneyNumber(value)}
      </span>
    </div>
  );
}

function StatCard({ title, value, sub, icon: Icon, tone = "neutral", isMoney = false }) {
  const toneMap = {
    neutral: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
      topBar: "#CBD5E1",
    },
    revenue: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F6FBF7 100%)",
      topBar: "#D1E7D6",
    },
    orders: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #FFFAF5 100%)",
      topBar: "#F4DFC7",
    },
    users: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFD 100%)",
      topBar: "#D9E3F0",
    },
    products: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #FAFAFC 100%)",
      topBar: "#E5E7EB",
    },
  };

  const current = toneMap[tone] || toneMap.neutral;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card
        className="h-full"
        style={{
          background: current.bg,
          boxShadow: "0 14px 34px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            height: 4,
            background: current.topBar,
          }}
        />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="grid h-11 w-11 place-items-center rounded-3xl shrink-0"
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${PALETTE.border}`,
                  boxShadow: "0 8px 18px rgba(15,23,42,.05)",
                }}
              >
                {Icon ? (
                  <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
                ) : null}
              </div>

              <div className="min-w-0">
                <div
                  className="text-[15px] font-bold leading-[1.15] tracking-tight"
                  style={{ ...STANDARD_FONT, color: PALETTE.text }}
                >
                  {title}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            {isMoney ? (
              <MoneyValue value={value} size="lg" />
            ) : (
              <div
                className="text-[26px] font-semibold tracking-tight"
                style={{ ...STANDARD_FONT, color: PALETTE.text }}
              >
                {value}
              </div>
            )}

            {sub ? (
              <div
                className="mt-2 text-[12px] font-medium"
                style={{ ...STANDARD_FONT, color: PALETTE.muted }}
              >
                {sub}
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function MiniMetric({
  title,
  value,
  icon: Icon,
  badge,
  tone = "slate",
  isMoney = false,
}) {
  const toneMap = {
    slate: {
      bg: "#FFFFFF",
      ring: "#E2E8F0",
      badgeBg: "#F8FAFC",
      badgeBorder: "#E2E8F0",
    },
    softBlue: {
      bg: PALETTE.softBlue,
      ring: "#E2E8F0",
      badgeBg: "#FFFFFF",
      badgeBorder: "#E2E8F0",
    },
    softEmerald: {
      bg: PALETTE.softEmerald,
      ring: "#E5E7EB",
      badgeBg: "#FFFFFF",
      badgeBorder: "#E5E7EB",
    },
    softAmber: {
      bg: PALETTE.softAmber,
      ring: "#F3E8D8",
      badgeBg: "#FFFFFF",
      badgeBorder: "#F3E8D8",
    },
    softRose: {
      bg: PALETTE.softRose,
      ring: "#F3DEDE",
      badgeBg: "#FFFFFF",
      badgeBorder: "#F3DEDE",
    },
    softViolet: {
      bg: PALETTE.softViolet,
      ring: "#ECE8F8",
      badgeBg: "#FFFFFF",
      badgeBorder: "#ECE8F8",
    },
  };

  const current = toneMap[tone] || toneMap.slate;

  return (
    <Card
      style={{
        background: current.bg,
        border: `1px solid ${current.ring}`,
        boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-2xl"
            style={{
              background: "#FFFFFF",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 6px 14px rgba(15,23,42,0.04)",
            }}
          >
            <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </div>

          {badge ? (
            <span
              className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{
                ...STANDARD_FONT,
                background: current.badgeBg,
                border: `1px solid ${current.badgeBorder}`,
                color: PALETTE.slate,
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>

        <div
          className="mt-4 text-[12px] font-semibold"
          style={{ ...STANDARD_FONT, color: PALETTE.muted }}
        >
          {title}
        </div>

        <div className="mt-2">
          {isMoney ? (
            <MoneyValue value={value} size="md" iconSize={14} gap={6} />
          ) : (
            <div
              className="text-[20px] font-semibold tracking-tight"
              style={{ ...STANDARD_FONT, color: PALETTE.text }}
            >
              {value}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatusPill({ children, tone = "default" }) {
  const tones = {
    success: {
      bg: "rgba(22, 101, 52, 0.08)",
      border: "1px solid rgba(22, 101, 52, 0.12)",
      color: PALETTE.success,
    },
    warning: {
      bg: "rgba(146, 64, 14, 0.08)",
      border: "1px solid rgba(146, 64, 14, 0.12)",
      color: PALETTE.warning,
    },
    danger: {
      bg: "rgba(185, 28, 28, 0.08)",
      border: "1px solid rgba(185, 28, 28, 0.12)",
      color: PALETTE.danger,
    },
    info: {
      bg: "rgba(29, 78, 216, 0.08)",
      border: "1px solid rgba(29, 78, 216, 0.12)",
      color: PALETTE.info,
    },
    default: {
      bg: "#F8FAFC",
      border: `1px solid ${PALETTE.border}`,
      color: PALETTE.slate,
    },
  };

  const s = tones[tone] || tones.default;

  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold"
      style={{
        ...STANDARD_FONT,
        background: s.bg,
        border: s.border,
        color: s.color,
      }}
    >
      {children}
    </span>
  );
}

function getOrderStatusTone(status) {
  const s = String(status || "").toLowerCase();
  if (["delivered", "confirmed"].includes(s)) return "success";
  if (["pending", "processing"].includes(s)) return "warning";
  if (["shipped"].includes(s)) return "info";
  if (["cancelled", "returned"].includes(s)) return "danger";
  return "default";
}

function OrdersCard({ orders }) {
  return (
    <Card className="h-full">
      <div className="p-5">
        <SectionHeader
          title="Recent Orders"
          subtitle="Latest orders from dashboard API"
          icon={ShoppingBag}
          action={<SoftButton>Recent 8</SoftButton>}
        />
      </div>

      <Divider />

      <div className="overflow-auto">
        <table className="w-full text-left text-sm" style={STANDARD_FONT}>
          <thead
            style={{
              background: "#FCFDFE",
              borderBottom: `1px solid ${PALETTE.border2}`,
            }}
          >
            <tr className="text-[12px]" style={{ color: PALETTE.muted }}>
              <th className="px-5 py-3 font-semibold">Order</th>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Zone</th>
              <th className="px-5 py-3 font-semibold">Payment</th>
              <th className="px-5 py-3 font-semibold">Total</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order._id || order.orderNo}
                className="transition"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(15,23,42,0.02)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td className="px-5 py-4 font-semibold" style={{ color: PALETTE.text }}>
                  {order.orderNo || "—"}
                </td>

                <td className="px-5 py-4" style={{ color: PALETTE.text }}>
                  <div className="font-semibold">{getCustomerName(order)}</div>
                  <div
                    className="mt-1 text-[12px] font-medium"
                    style={{ color: PALETTE.muted }}
                  >
                    {getCustomerSubline(order)}
                  </div>
                </td>

                <td className="px-5 py-4" style={{ color: PALETTE.text }}>
                  {titleCase(order.deliveryZone || "—")}
                </td>

                <td className="px-5 py-4" style={{ color: PALETTE.text }}>
                  <div className="font-semibold">
                    {String(order.paymentMethod || "—").toUpperCase()}
                  </div>
                  <div
                    className="mt-1 text-[12px] font-medium"
                    style={{ color: PALETTE.muted }}
                  >
                    {titleCase(order.paymentStatus || "—")}
                  </div>
                </td>

                <td className="px-5 py-4 font-semibold" style={{ color: PALETTE.text }}>
                  <MoneyValue value={order.total} size="sm" iconSize={12} gap={6} />
                </td>

                <td className="px-5 py-4">
                  <StatusPill tone={getOrderStatusTone(order.status)}>
                    {titleCase(order.status)}
                  </StatusPill>
                </td>

                <td
                  className="px-5 py-4 text-[12px] font-medium"
                  style={{ color: PALETTE.muted }}
                >
                  {formatDate(order.createdAt)}
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-8 text-center text-sm font-medium"
                  style={{ color: PALETTE.muted }}
                >
                  No matching recent orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

  function showToast(kind, message) {
    const base = {
      duration: 3500,
      style: {
        ...STANDARD_FONT,
        background: "rgba(255,255,255,0.96)",
        color: PALETTE.text,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 16px 42px rgba(15,23,42,0.10)",
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
          background: "rgba(255,255,255,0.98)",
        },
      });

    return toast(message, base);
  }

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");

  async function loadDashboard({ showSpinner = false } = {}) {
    if (showSpinner) setRefreshing(true);
    setLoading(true);

    try {
      const result = await apiFetch("/api/admin/dashboard", {
        method: "GET",
      });

      setData({
        overview: result?.overview || initialData.overview,
        widgets: {
          recentOrders: result?.widgets?.recentOrders || [],
        },
      });
    } catch (e) {
      if (e?.status === 401) {
        showToast("error", "Unauthorized. Please login again.");
        router.push("/login");
      } else if (e?.status === 403) {
        showToast("error", "Forbidden. Admin only.");
      } else {
        showToast("error", e.message || "Failed to load dashboard overview");
      }
    } finally {
      setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!getStoredToken()) return;
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = useMemo(() => {
    const orders = data?.widgets?.recentOrders || [];
    const q = orderSearch.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((o) =>
      [
        o.orderNo,
        o.customer,
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        o.status,
        o.paymentMethod,
        o.paymentStatus,
        o.deliveryZone,
      ]
        .filter(Boolean)
        .some((v) =>
          typeof v === "object"
            ? JSON.stringify(v).toLowerCase().includes(q)
            : String(v).toLowerCase().includes(q)
        )
    );
  }, [orderSearch, data]);

  const { overview } = data;

  return (
    <main
      className="w-full min-h-screen"
      style={{ ...STANDARD_FONT, background: PALETTE.bg, color: PALETTE.text }}
    >
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            ...STANDARD_FONT,
            background: "rgba(255,255,255,0.96)",
            color: PALETTE.text,
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 16px 42px rgba(15,23,42,0.10)",
            borderRadius: 18,
            padding: "12px 14px",
            backdropFilter: "blur(10px)",
          },
          success: { iconTheme: { primary: "#0F172A", secondary: "#ffffff" } },
          error: { iconTheme: { primary: "#0F172A", secondary: "#ffffff" } },
        }}
      />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -left-20 -top-20 h-[320px] w-[320px] rounded-full blur-3xl"
          style={{ background: PALETTE.headerGlow1 }}
        />
        <div
          className="absolute right-[-120px] top-[120px] h-[380px] w-[380px] rounded-full blur-3xl"
          style={{ background: PALETTE.headerGlow2 }}
        />
      </div>

      <div className="mx-auto max-w-screen-2xl px-5 pt-6 pb-10 md:px-10 lg:px-12">
        <Card
          className="overflow-visible"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)",
          }}
        >
          <div className="p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-3xl shrink-0"
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid ${PALETTE.border}`,
                      boxShadow: "0 8px 18px rgba(15,23,42,.05)",
                    }}
                  >
                    <LayoutDashboard
                      className="h-5 w-5"
                      style={{ color: PALETTE.navy }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className="text-[22px] font-semibold tracking-tight"
                        style={{ ...STANDARD_FONT, color: PALETTE.text }}
                      >
                        Admin Dashboard
                      </div>

                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                        style={{
                          ...STANDARD_FONT,
                          background: "#FFFFFF",
                          border: `1px solid ${PALETTE.border}`,
                          color: PALETTE.slate,
                        }}
                      >
                        <span
                          className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-bold"
                          style={{
                            background: "#F8FAFC",
                            border: `1px solid ${PALETTE.border}`,
                            color: PALETTE.navy,
                          }}
                        >
                          LIVE
                        </span>
                        Dashboard Overview
                      </span>
                    </div>

                    <div
                      className="mt-1 text-[12px] font-medium"
                      style={{ ...STANDARD_FONT, color: PALETTE.muted }}
                    >
                      Overview of users, catalog, orders, sales, and recent orders.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SoftButton
                  icon={RefreshCw}
                  loading={refreshing}
                  onClick={() => loadDashboard({ showSpinner: true })}
                >
                  Refresh
                </SoftButton>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <SearchField
                value={orderSearch}
                onChange={setOrderSearch}
                placeholder="Search recent orders…"
              />

              <div className="flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold"
                  style={{
                    ...STANDARD_FONT,
                    background: "#FFFFFF",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.slate,
                  }}
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  {loading ? "Loading dashboard…" : "Live API data"}
                </span>

                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold"
                  style={{
                    ...STANDARD_FONT,
                    background: "#FFFFFF",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.slate,
                  }}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Admin overview ready
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={overview.sales.totalRevenue}
            sub={`Today ${formatMoneyNumber(overview.sales.todayRevenue)}`}
            icon={DollarSign}
            tone="revenue"
            isMoney
          />
          <StatCard
            title="Total Orders"
            value={formatNumber(overview.orders.total)}
            sub={`Today ${formatNumber(overview.sales.todayOrders)} orders`}
            icon={ShoppingBag}
            tone="orders"
          />
          <StatCard
            title="Total Users"
            value={formatNumber(overview.users.total)}
            sub={`${formatNumber(overview.users.customers)} customers`}
            icon={Users}
            tone="users"
          />
          <StatCard
            title="Total Products"
            value={formatNumber(overview.products.total)}
            sub={`${formatNumber(overview.products.inStock)} in stock`}
            icon={Package}
            tone="products"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniMetric
            title="Pending Orders"
            value={formatNumber(overview.orders.pending)}
            icon={Clock3}
            badge="Orders"
            tone="softAmber"
          />
          <MiniMetric
            title="Customers"
            value={formatNumber(overview.users.customers)}
            icon={Users}
            badge="Users"
            tone="softBlue"
          />
          <MiniMetric
            title="Total Categories"
            value={formatNumber(overview.categories.total)}
            icon={FolderKanban}
            badge="Catalog"
            tone="softViolet"
          />
          <MiniMetric
            title="Subcategories"
            value={formatNumber(overview.categories.totalSubcategories)}
            icon={Layers}
            badge="Catalog"
            tone="softBlue"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniMetric
            title="Total Brands"
            value={formatNumber(overview.brands.total)}
            icon={Tags}
            badge="Brand"
            tone="slate"
          />
          <MiniMetric
            title="Low Stock Items"
            value={formatNumber(overview.products.lowStockCount)}
            icon={AlertTriangle}
            badge="Inventory"
            tone="softAmber"
          />
          <MiniMetric
            title="Out of Stock"
            value={formatNumber(overview.products.outOfStockCount)}
            icon={Boxes}
            badge="Products"
            tone="softRose"
          />
          <MiniMetric
            title="Verified Users"
            value={formatNumber(overview.users.verified)}
            icon={BadgeCheck}
            badge="Users"
            tone="softEmerald"
          />
        </div>

        <div className="mt-6">
          <Card>
            <div className="p-5">
              <SectionHeader
                title="Sales Summary"
                subtitle="Values directly from overview.sales"
                icon={DollarSign}
              />
            </div>

            <Divider />

            <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MiniMetric
                title="Total Revenue"
                value={overview.sales.totalRevenue}
                icon={DollarSign}
                badge="All Time"
                tone="softEmerald"
                isMoney
              />
              <MiniMetric
                title="Total Subtotal"
                value={overview.sales.totalSubtotal}
                icon={ShoppingBag}
                badge="All Orders"
                tone="softBlue"
                isMoney
              />
              <MiniMetric
                title="Shipping Total"
                value={overview.sales.totalShipping}
                icon={Truck}
                badge="Collected"
                tone="slate"
                isMoney
              />
              <MiniMetric
                title="Discount Total"
                value={overview.sales.totalDiscount}
                icon={Tags}
                badge="Applied"
                tone="softAmber"
                isMoney
              />
              <MiniMetric
                title="Today Revenue"
                value={overview.sales.todayRevenue}
                icon={CheckCircle2}
                badge="Today"
                tone="softEmerald"
                isMoney
              />
              <MiniMetric
                title="Today Orders"
                value={formatNumber(overview.sales.todayOrders)}
                icon={Clock3}
                badge="Today"
                tone="softBlue"
              />
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <div className="p-5">
              <SectionHeader
                title="Order Status Summary"
                subtitle="Values directly from overview.orders"
                icon={ShieldCheck}
              />
            </div>

            <Divider />

            <div className="p-5 grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                <MiniMetric
                  title="Pending"
                  value={formatNumber(overview.orders.pending)}
                  icon={Clock3}
                  tone="softAmber"
                />
                <MiniMetric
                  title="Confirmed"
                  value={formatNumber(overview.orders.confirmed)}
                  icon={BadgeCheck}
                  tone="softEmerald"
                />
                <MiniMetric
                  title="Processing"
                  value={formatNumber(overview.orders.processing)}
                  icon={RefreshCw}
                  tone="softBlue"
                />
                <MiniMetric
                  title="Shipped"
                  value={formatNumber(overview.orders.shipped)}
                  icon={Truck}
                  tone="slate"
                />
                <MiniMetric
                  title="Delivered"
                  value={formatNumber(overview.orders.delivered)}
                  icon={CheckCircle2}
                  tone="softEmerald"
                />
                <MiniMetric
                  title="Cancelled"
                  value={formatNumber(overview.orders.cancelled)}
                  icon={XCircle}
                  tone="softRose"
                />
                <MiniMetric
                  title="Returned"
                  value={formatNumber(overview.orders.returned)}
                  icon={RotateCcw}
                  tone="softRose"
                />
                <MiniMetric
                  title="COD Orders"
                  value={formatNumber(overview.orders.codOrders)}
                  icon={ShoppingBag}
                  tone="softViolet"
                />
                <MiniMetric
                  title="Inside Dhaka"
                  value={formatNumber(overview.orders.insideDhaka)}
                  icon={Truck}
                  tone="softBlue"
                />
                <MiniMetric
                  title="Outside Dhaka"
                  value={formatNumber(overview.orders.outsideDhaka)}
                  icon={Truck}
                  tone="slate"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <OrdersCard orders={filteredOrders} />
        </div>
      </div>
    </main>
  );
}