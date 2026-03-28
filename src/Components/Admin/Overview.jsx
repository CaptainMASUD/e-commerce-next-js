"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  UserCheck,
  UserX,
  Layers,
  Tags,
  Sparkles,
  TrendingUp,
  Eye,
  Loader2,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

const cx = (...c) => c.filter(Boolean).join(" ");

const PALETTE = {
  navy: "#0B1B33",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  emerald: "#10b981",
  rose: "#ff6b6b",
  sky: "#3b82f6",
  bg: "#ffffff",
  card: "rgba(255,255,255,0.98)",
  muted: "rgba(11,27,51,0.62)",
  border: "rgba(2, 10, 25, 0.10)",
  border2: "rgba(2, 10, 25, 0.08)",
  soft: "rgba(11,27,51,0.035)",
  soft2: "rgba(11,27,51,0.06)",
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
    lowStockProducts: [],
    outOfStockProducts: [],
    recentOrders: [],
    recentUsers: [],
    trendingProducts: [],
    newProducts: [],
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

function formatMoney(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
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

const Card = React.memo(function Card({ children, className }) {
  return (
    <div
      className={cx("rounded-[24px] overflow-hidden", className)}
      style={{
        ...STANDARD_FONT,
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
  return (
    <div
      style={{
        height: 1,
        width: "100%",
        background: "rgba(2,10,25,0.06)",
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

function SearchField({ value, onChange, placeholder = "Search…" }) {
  return (
    <label
      className="flex h-11 items-center gap-2 rounded-2xl px-3 w-full md:w-[360px]"
      style={{
        ...STANDARD_FONT,
        background: "rgba(255,255,255,0.96)",
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
        style={{ ...STANDARD_FONT, color: PALETTE.navy }}
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
                background: PALETTE.soft,
                border: `1px solid ${PALETTE.border}`,
              }}
            >
              <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
            </div>
          ) : null}

          <div className="min-w-0">
            <div
              className="text-[16px] font-semibold tracking-tight"
              style={{ ...STANDARD_FONT, color: PALETTE.navy }}
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

function StatCard({ title, value, sub, icon: Icon, tone = "navy" }) {
  const bgMap = {
    navy: "radial-gradient(circle at 30% 25%, rgba(11,27,51,0.14), rgba(11,27,51,0.05) 65%), #fff",
    coral:
      "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.18), rgba(11,27,51,0.05) 65%), #fff",
    emerald:
      "radial-gradient(circle at 30% 25%, rgba(16,185,129,0.16), rgba(11,27,51,0.05) 65%), #fff",
    gold: "radial-gradient(circle at 30% 25%, rgba(234,179,8,0.18), rgba(11,27,51,0.05) 65%), #fff",
    rose: "radial-gradient(circle at 30% 25%, rgba(255,107,107,0.18), rgba(11,27,51,0.05) 65%), #fff",
    sky: "radial-gradient(circle at 30% 25%, rgba(59,130,246,0.18), rgba(11,27,51,0.05) 65%), #fff",
  };

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="h-full">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="grid h-11 w-11 place-items-center rounded-3xl shrink-0"
                style={{
                  background: bgMap[tone] || bgMap.navy,
                  border: `1px solid ${PALETTE.border}`,
                  boxShadow: "0 12px 26px rgba(0,31,63,.07)",
                }}
              >
                {Icon ? (
                  <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
                ) : null}
              </div>

              <div className="min-w-0">
                <div
                  className="text-[15px] font-bold leading-[1.15] tracking-tight"
                  style={{ ...STANDARD_FONT, color: PALETTE.navy }}
                >
                  {title}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div
              className="text-[26px] font-semibold tracking-tight"
              style={{ ...STANDARD_FONT, color: PALETTE.navy }}
            >
              {value}
            </div>
            {sub ? (
              <div
                className="mt-1 text-[12px] font-medium"
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

function MiniMetric({ title, value, icon: Icon, badge }) {
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-2xl"
            style={{
              background: PALETTE.soft,
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </div>

          {badge ? (
            <span
              className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{
                ...STANDARD_FONT,
                background: "rgba(255,126,105,0.10)",
                border: "1px solid rgba(255,126,105,0.20)",
                color: PALETTE.navy,
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
        <div
          className="mt-1 text-[20px] font-semibold tracking-tight"
          style={{ ...STANDARD_FONT, color: PALETTE.navy }}
        >
          {value}
        </div>
      </div>
    </Card>
  );
}

function StatusPill({ children, tone = "default" }) {
  const tones = {
    success: {
      bg: "rgba(16,185,129,0.10)",
      border: "1px solid rgba(16,185,129,0.20)",
    },
    warning: {
      bg: "rgba(234,179,8,0.12)",
      border: "1px solid rgba(234,179,8,0.22)",
    },
    danger: {
      bg: "rgba(255,107,107,0.10)",
      border: "1px solid rgba(255,107,107,0.20)",
    },
    info: {
      bg: "rgba(59,130,246,0.10)",
      border: "1px solid rgba(59,130,246,0.20)",
    },
    default: {
      bg: "rgba(11,27,51,0.06)",
      border: `1px solid ${PALETTE.border}`,
    },
  };

  const s = tones[tone] || tones.default;

  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold"
      style={{ ...STANDARD_FONT, background: s.bg, border: s.border, color: PALETTE.navy }}
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

function getUserStatusTone(status, verified) {
  if (status === "active" && verified) return "success";
  if (status === "inactive") return "danger";
  if (!verified) return "warning";
  return "default";
}

function InventoryTableCard({ title, subtitle, items, badgeTone = "warning" }) {
  return (
    <Card className="h-full">
      <div className="p-5">
        <SectionHeader title={title} subtitle={subtitle} icon={Boxes} />
      </div>

      <Divider />

      <div className="overflow-auto">
        <table className="w-full text-left text-sm" style={STANDARD_FONT}>
          <thead
            style={{
              background: "rgba(255,255,255,0.86)",
              backdropFilter: "blur(10px)",
              borderBottom: `1px solid ${PALETTE.border2}`,
            }}
          >
            <tr className="text-[12px]" style={{ color: PALETTE.muted }}>
              <th className="px-5 py-3 font-semibold">Product</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Barcode</th>
              <th className="px-5 py-3 font-semibold">Available Stock</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr
                key={item._id}
                className="transition"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(11,27,51,0.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td className="px-5 py-4">
                  <div className="font-semibold" style={{ color: PALETTE.navy }}>
                    {item.title}
                  </div>
                  <div
                    className="mt-1 text-[12px] font-medium"
                    style={{ color: PALETTE.muted }}
                  >
                    /{item.slug}
                  </div>
                </td>
                <td className="px-5 py-4" style={{ color: PALETTE.navy }}>
                  {titleCase(item.productType)}
                </td>
                <td className="px-5 py-4" style={{ color: PALETTE.navy }}>
                  {item.barcode || "—"}
                </td>
                <td className="px-5 py-4">
                  <StatusPill tone={badgeTone}>
                    {formatNumber(item.availableStock)}
                  </StatusPill>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-sm font-medium"
                  style={{ color: PALETTE.muted }}
                >
                  No products available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function OrdersCard({ orders }) {
  return (
    <Card className="h-full">
      <div className="p-5">
        <SectionHeader
          title="Recent Orders"
          subtitle="Latest orders from dashboard API"
          icon={ShoppingBag}
          action={<SoftButton icon={Eye}>Recent 8</SoftButton>}
        />
      </div>

      <Divider />

      <div className="overflow-auto">
        <table className="w-full text-left text-sm" style={STANDARD_FONT}>
          <thead
            style={{
              background: "rgba(255,255,255,0.86)",
              backdropFilter: "blur(10px)",
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
                  (e.currentTarget.style.background = "rgba(11,27,51,0.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td className="px-5 py-4 font-semibold" style={{ color: PALETTE.navy }}>
                  {order.orderNo || "—"}
                </td>

                <td className="px-5 py-4" style={{ color: PALETTE.navy }}>
                  <div className="font-semibold">{order.customer || "—"}</div>
                  <div
                    className="mt-1 text-[12px] font-medium"
                    style={{ color: PALETTE.muted }}
                  >
                    {order.customerEmail || "—"}
                  </div>
                </td>

                <td className="px-5 py-4" style={{ color: PALETTE.navy }}>
                  {titleCase(order.deliveryZone || "—")}
                </td>

                <td className="px-5 py-4" style={{ color: PALETTE.navy }}>
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

                <td className="px-5 py-4 font-semibold" style={{ color: PALETTE.navy }}>
                  {formatMoney(order.total)}
                </td>

                <td className="px-5 py-4">
                  <StatusPill tone={getOrderStatusTone(order.status)}>
                    {titleCase(order.status)}
                  </StatusPill>
                </td>

                <td className="px-5 py-4 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
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

function UsersCard({ users }) {
  return (
    <Card className="h-full">
      <div className="p-5">
        <SectionHeader
          title="Recent Users"
          subtitle="Latest users from dashboard API"
          icon={Users}
          action={<SoftButton icon={Eye}>Recent 8</SoftButton>}
        />
      </div>

      <Divider />

      <div className="overflow-auto">
        <table className="w-full text-left text-sm" style={STANDARD_FONT}>
          <thead
            style={{
              background: "rgba(255,255,255,0.86)",
              backdropFilter: "blur(10px)",
              borderBottom: `1px solid ${PALETTE.border2}`,
            }}
          >
            <tr className="text-[12px]" style={{ color: PALETTE.muted }}>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Verified</th>
              <th className="px-5 py-3 font-semibold">Created</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user._id || user.email}
                className="transition"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(11,27,51,0.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td className="px-5 py-4 font-semibold" style={{ color: PALETTE.navy }}>
                  {user.name || "—"}
                </td>

                <td className="px-5 py-4" style={{ color: PALETTE.navy }}>
                  {user.email || "—"}
                </td>

                <td className="px-5 py-4" style={{ color: PALETTE.navy }}>
                  {titleCase(user.role)}
                </td>

                <td className="px-5 py-4">
                  <StatusPill tone={getUserStatusTone(user.status, user.isVerified)}>
                    {titleCase(user.status)}
                  </StatusPill>
                </td>

                <td className="px-5 py-4">
                  <StatusPill tone={user.isVerified ? "success" : "warning"}>
                    {user.isVerified ? "Verified" : "Unverified"}
                  </StatusPill>
                </td>

                <td className="px-5 py-4 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-sm font-medium"
                  style={{ color: PALETTE.muted }}
                >
                  No recent users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ProductCardsSection({ title, subtitle, items, icon: Icon, badgeLabel }) {
  return (
    <Card className="h-full">
      <div className="p-5">
        <SectionHeader title={title} subtitle={subtitle} icon={Icon} />
      </div>

      <Divider />

      <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <motion.div
            key={item._id || item.slug}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="rounded-[22px] p-4 h-full"
              style={{
                background: "rgba(255,255,255,0.90)",
                border: `1px solid ${PALETTE.border}`,
                boxShadow: "0 12px 28px rgba(0,31,63,0.05)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-2xl shrink-0"
                  style={{
                    background: PALETTE.soft,
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <Package className="h-4 w-4" style={{ color: PALETTE.navy }} />
                </div>

                <StatusPill tone="info">{badgeLabel}</StatusPill>
              </div>

              <div className="mt-4">
                <div
                  className="text-[14px] font-semibold leading-5"
                  style={{ ...STANDARD_FONT, color: PALETTE.navy }}
                >
                  {item.title}
                </div>

                <div
                  className="mt-1 text-[12px] font-medium"
                  style={{ ...STANDARD_FONT, color: PALETTE.muted }}
                >
                  /{item.slug}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div
                    className="text-[11px] font-semibold"
                    style={{ ...STANDARD_FONT, color: PALETTE.muted }}
                  >
                    Final Price
                  </div>
                  <div
                    className="mt-1 text-[14px] font-semibold"
                    style={{ ...STANDARD_FONT, color: PALETTE.navy }}
                  >
                    {formatMoney(item.finalPrice)}
                  </div>
                </div>

                <div>
                  <div
                    className="text-[11px] font-semibold"
                    style={{ ...STANDARD_FONT, color: PALETTE.muted }}
                  >
                    Stock
                  </div>
                  <div
                    className="mt-1 text-[14px] font-semibold"
                    style={{ ...STANDARD_FONT, color: PALETTE.navy }}
                  >
                    {formatNumber(item.availableStock)}
                  </div>
                </div>

                <div>
                  <div
                    className="text-[11px] font-semibold"
                    style={{ ...STANDARD_FONT, color: PALETTE.muted }}
                  >
                    Discount
                  </div>
                  <div
                    className="mt-1 text-[14px] font-semibold"
                    style={{ ...STANDARD_FONT, color: PALETTE.navy }}
                  >
                    {formatMoney(item.discountAmount)}
                  </div>
                </div>

                <div>
                  <div
                    className="text-[11px] font-semibold"
                    style={{ ...STANDARD_FONT, color: PALETTE.muted }}
                  >
                    Type
                  </div>
                  <div
                    className="mt-1 text-[14px] font-semibold"
                    style={{ ...STANDARD_FONT, color: PALETTE.navy }}
                  >
                    {titleCase(item.productType)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {items.length === 0 && (
          <div
            className="sm:col-span-2 xl:col-span-4 rounded-[22px] p-8 text-center text-sm font-medium"
            style={{
              ...STANDARD_FONT,
              background: "rgba(255,255,255,0.90)",
              border: `1px solid ${PALETTE.border}`,
              color: PALETTE.muted,
            }}
          >
            No items available.
          </div>
        )}
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
        widgets: result?.widgets || initialData.widgets,
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
        o.customerEmail,
        o.status,
        o.paymentMethod,
        o.paymentStatus,
        o.deliveryZone,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [orderSearch, data]);

  const { overview, widgets } = data;

  return (
    <main
      className="w-full min-h-screen"
      style={{ ...STANDARD_FONT, background: PALETTE.bg, color: PALETTE.navy }}
    >
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            ...STANDARD_FONT,
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

      <div className="mx-auto max-w-screen-2xl px-5 pt-6 pb-10 md:px-10 lg:px-12">
        <Card className="overflow-visible">
          <div className="p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-3xl shrink-0"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.18), rgba(11,27,51,0.05) 65%), #fff",
                      border: `1px solid ${PALETTE.border}`,
                      boxShadow: "0 12px 26px rgba(0,31,63,.07)",
                    }}
                  >
                    <LayoutDashboard className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className="text-[22px] font-semibold tracking-tight"
                        style={{ ...STANDARD_FONT, color: PALETTE.navy }}
                      >
                        Admin Dashboard
                      </div>

                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                        style={{
                          ...STANDARD_FONT,
                          background: "rgba(255,255,255,0.92)",
                          border: `1px solid ${PALETTE.border}`,
                          boxShadow: "0 10px 20px rgba(0,31,63,0.05)",
                        }}
                      >
                        <span
                          className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-bold"
                          style={{
                            background: "rgba(255,126,105,0.12)",
                            border: "1px solid rgba(255,126,105,0.22)",
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
                      Overview of users, catalog, orders, sales, stock, recent users,
                      recent orders, trending products, and new products.
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
                    background: PALETTE.soft,
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  {loading ? "Loading dashboard…" : "Live API data"}
                </span>

                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold"
                  style={{
                    ...STANDARD_FONT,
                    background: "rgba(16,185,129,0.10)",
                    border: "1px solid rgba(16,185,129,0.20)",
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
            value={formatMoney(overview.sales.totalRevenue)}
            sub={`Today ${formatMoney(overview.sales.todayRevenue)}`}
            icon={DollarSign}
            tone="emerald"
          />
          <StatCard
            title="Total Orders"
            value={formatNumber(overview.orders.total)}
            sub={`Today ${formatNumber(overview.sales.todayOrders)} orders`}
            icon={ShoppingBag}
            tone="coral"
          />
          <StatCard
            title="Total Users"
            value={formatNumber(overview.users.total)}
            sub={`${formatNumber(overview.users.verified)} verified users`}
            icon={Users}
            tone="sky"
          />
          <StatCard
            title="Total Products"
            value={formatNumber(overview.products.total)}
            sub={`${formatNumber(overview.products.inStock)} in stock`}
            icon={Package}
            tone="gold"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniMetric
            title="Pending Orders"
            value={formatNumber(overview.orders.pending)}
            icon={Clock3}
            badge="Orders"
          />
          <MiniMetric
            title="Low Stock Items"
            value={formatNumber(overview.products.lowStockCount)}
            icon={AlertTriangle}
            badge="Inventory"
          />
          <MiniMetric
            title="Out of Stock"
            value={formatNumber(overview.products.outOfStockCount)}
            icon={Boxes}
            badge="Products"
          />
          <MiniMetric
            title="Monthly Revenue"
            value={formatMoney(overview.sales.monthRevenue)}
            icon={TrendingUp}
            badge="This Month"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <Card className="h-full">
              <div className="p-5">
                <SectionHeader
                  title="Sales Summary"
                  subtitle="Values directly from overview.sales"
                  icon={DollarSign}
                />
              </div>

              <Divider />

              <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MiniMetric
                  title="Total Revenue"
                  value={formatMoney(overview.sales.totalRevenue)}
                  icon={DollarSign}
                  badge="All Time"
                />
                <MiniMetric
                  title="Total Subtotal"
                  value={formatMoney(overview.sales.totalSubtotal)}
                  icon={ShoppingBag}
                  badge="All Orders"
                />
                <MiniMetric
                  title="Shipping Total"
                  value={formatMoney(overview.sales.totalShipping)}
                  icon={Truck}
                  badge="Collected"
                />
                <MiniMetric
                  title="Discount Total"
                  value={formatMoney(overview.sales.totalDiscount)}
                  icon={Tags}
                  badge="Applied"
                />
                <MiniMetric
                  title="Today Revenue"
                  value={formatMoney(overview.sales.todayRevenue)}
                  icon={CheckCircle2}
                  badge="Today"
                />
                <MiniMetric
                  title="Today Orders"
                  value={formatNumber(overview.sales.todayOrders)}
                  icon={Clock3}
                  badge="Today"
                />
                <MiniMetric
                  title="Month Revenue"
                  value={formatMoney(overview.sales.monthRevenue)}
                  icon={TrendingUp}
                  badge="Month"
                />
                <MiniMetric
                  title="Month Orders"
                  value={formatNumber(overview.sales.monthOrders)}
                  icon={ShoppingBag}
                  badge="Month"
                />
              </div>
            </Card>
          </div>

          <div className="xl:col-span-4">
            <Card className="h-full">
              <div className="p-5">
                <SectionHeader
                  title="Order Status Summary"
                  subtitle="Values directly from overview.orders"
                  icon={ShieldCheck}
                />
              </div>

              <Divider />

              <div className="p-5 grid grid-cols-1 gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <MiniMetric title="Pending" value={formatNumber(overview.orders.pending)} icon={Clock3} />
                  <MiniMetric title="Confirmed" value={formatNumber(overview.orders.confirmed)} icon={BadgeCheck} />
                  <MiniMetric title="Processing" value={formatNumber(overview.orders.processing)} icon={RefreshCw} />
                  <MiniMetric title="Shipped" value={formatNumber(overview.orders.shipped)} icon={Truck} />
                  <MiniMetric title="Delivered" value={formatNumber(overview.orders.delivered)} icon={CheckCircle2} />
                  <MiniMetric title="Cancelled" value={formatNumber(overview.orders.cancelled)} icon={XCircle} />
                  <MiniMetric title="Returned" value={formatNumber(overview.orders.returned)} icon={RotateCcw} />
                  <MiniMetric title="COD Orders" value={formatNumber(overview.orders.codOrders)} icon={ShoppingBag} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MiniMetric title="Inside Dhaka" value={formatNumber(overview.orders.insideDhaka)} icon={Truck} />
                  <MiniMetric title="Outside Dhaka" value={formatNumber(overview.orders.outsideDhaka)} icon={Truck} />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <Card className="h-full">
              <div className="p-5">
                <SectionHeader
                  title="User Summary"
                  subtitle="Values directly from overview.users"
                  icon={Users}
                />
              </div>

              <Divider />

              <div className="p-5 grid grid-cols-2 gap-4">
                <MiniMetric title="Total Users" value={formatNumber(overview.users.total)} icon={Users} />
                <MiniMetric title="Customers" value={formatNumber(overview.users.customers)} icon={Users} />
                <MiniMetric title="Admins" value={formatNumber(overview.users.admins)} icon={ShieldCheck} />
                <MiniMetric title="Active" value={formatNumber(overview.users.active)} icon={UserCheck} />
                <MiniMetric title="Inactive" value={formatNumber(overview.users.inactive)} icon={UserX} />
                <MiniMetric title="Verified" value={formatNumber(overview.users.verified)} icon={BadgeCheck} />
                <MiniMetric title="Unverified" value={formatNumber(overview.users.unverified)} icon={AlertTriangle} />
              </div>
            </Card>
          </div>

          <div className="xl:col-span-4">
            <Card className="h-full">
              <div className="p-5">
                <SectionHeader
                  title="Category Summary"
                  subtitle="Values directly from overview.categories"
                  icon={FolderKanban}
                />
              </div>

              <Divider />

              <div className="p-5 grid grid-cols-2 gap-4">
                <MiniMetric title="Total Categories" value={formatNumber(overview.categories.total)} icon={FolderKanban} />
                <MiniMetric title="Active" value={formatNumber(overview.categories.active)} icon={BadgeCheck} />
                <MiniMetric title="Inactive" value={formatNumber(overview.categories.inactive)} icon={XCircle} />
                <MiniMetric
                  title="Total Subcategories"
                  value={formatNumber(overview.categories.totalSubcategories)}
                  icon={Layers}
                />
                <MiniMetric
                  title="Active Subcategories"
                  value={formatNumber(overview.categories.activeSubcategories)}
                  icon={BadgeCheck}
                />
                <MiniMetric
                  title="Inactive Subcategories"
                  value={formatNumber(overview.categories.inactiveSubcategories)}
                  icon={XCircle}
                />
              </div>
            </Card>
          </div>

          <div className="xl:col-span-4">
            <Card className="h-full">
              <div className="p-5">
                <SectionHeader
                  title="Brand Summary"
                  subtitle="Values directly from overview.brands"
                  icon={Tags}
                />
              </div>

              <Divider />

              <div className="p-5 grid grid-cols-2 gap-4">
                <MiniMetric title="Total Brands" value={formatNumber(overview.brands.total)} icon={Tags} />
                <MiniMetric title="Active" value={formatNumber(overview.brands.active)} icon={BadgeCheck} />
                <MiniMetric title="Inactive" value={formatNumber(overview.brands.inactive)} icon={XCircle} />
                <MiniMetric
                  title="Category Links"
                  value={formatNumber(overview.brands.totalCategoryLinks)}
                  icon={Layers}
                />
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <Card>
            <div className="p-5">
              <SectionHeader
                title="Product Summary"
                subtitle="Values directly from overview.products"
                icon={Package}
              />
            </div>

            <Divider />

            <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MiniMetric title="Total Products" value={formatNumber(overview.products.total)} icon={Package} />
              <MiniMetric title="Simple Products" value={formatNumber(overview.products.simple)} icon={Package} />
              <MiniMetric title="Variable Products" value={formatNumber(overview.products.variable)} icon={Boxes} />
              <MiniMetric title="Trending Products" value={formatNumber(overview.products.trending)} icon={TrendingUp} />
              <MiniMetric title="New Products" value={formatNumber(overview.products.new)} icon={Sparkles} />
              <MiniMetric title="In Stock" value={formatNumber(overview.products.inStock)} icon={CheckCircle2} />
              <MiniMetric title="Out of Stock" value={formatNumber(overview.products.outOfStock)} icon={XCircle} />
              <MiniMetric title="Low Stock" value={formatNumber(overview.products.lowStockCount)} icon={AlertTriangle} />
              <MiniMetric
                title="Simple w/ Barcode"
                value={formatNumber(overview.products.simpleWithBarcode)}
                icon={Tags}
              />
              <MiniMetric
                title="Variable w/ Variants"
                value={formatNumber(overview.products.variableWithVariants)}
                icon={Layers}
              />
              <MiniMetric
                title="With Specifications"
                value={formatNumber(overview.products.withSpecifications)}
                icon={BadgeCheck}
              />
              <MiniMetric
                title="With Highlights"
                value={formatNumber(overview.products.withHighlights)}
                icon={Sparkles}
              />
            </div>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-6">
            <InventoryTableCard
              title="Low Stock Products"
              subtitle="From widgets.lowStockProducts"
              items={widgets.lowStockProducts || []}
              badgeTone="warning"
            />
          </div>

          <div className="xl:col-span-6">
            <InventoryTableCard
              title="Out of Stock Products"
              subtitle="From widgets.outOfStockProducts"
              items={widgets.outOfStockProducts || []}
              badgeTone="danger"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <OrdersCard orders={filteredOrders} />
          </div>

          <div className="xl:col-span-4">
            <UsersCard users={widgets.recentUsers || []} />
          </div>
        </div>

        <div className="mt-6">
          <ProductCardsSection
            title="Trending Products"
            subtitle="From widgets.trendingProducts"
            items={widgets.trendingProducts || []}
            icon={TrendingUp}
            badgeLabel="Trending"
          />
        </div>

        <div className="mt-6">
          <ProductCardsSection
            title="New Products"
            subtitle="From widgets.newProducts"
            items={widgets.newProducts || []}
            icon={Sparkles}
            badgeLabel="New"
          />
        </div>
      </div>
    </main>
  );
}