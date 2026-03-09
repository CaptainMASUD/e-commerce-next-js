"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Search,
  RefreshCw,
  Plus,
  ChevronRight,
  MoreHorizontal,
  Activity,
  BadgeCheck,
  Clock3,
  Boxes,
  FolderKanban,
  Layers,
  Settings,
  CalendarDays,
  Eye,
} from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");

const PALETTE = {
  navy: "#0B1B33",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  emerald: "#10b981",
  rose: "#ff6b6b",
  bg: "#ffffff",
  card: "rgba(255,255,255,0.98)",
  muted: "rgba(11,27,51,0.62)",
  border: "rgba(2, 10, 25, 0.10)",
  border2: "rgba(2, 10, 25, 0.08)",
  soft: "rgba(11,27,51,0.035)",
  soft2: "rgba(11,27,51,0.06)",
};

const statsSeed = [
  {
    id: 1,
    title: "Total Revenue",
    value: "$128,420",
    change: "+12.4%",
    positive: true,
    icon: DollarSign,
    sub: "vs last month",
  },
  {
    id: 2,
    title: "Orders",
    value: "2,846",
    change: "+8.1%",
    positive: true,
    icon: ShoppingBag,
    sub: "processed this month",
  },
  {
    id: 3,
    title: "Customers",
    value: "1,284",
    change: "+5.9%",
    positive: true,
    icon: Users,
    sub: "active users",
  },
  {
    id: 4,
    title: "Products",
    value: "486",
    change: "-1.3%",
    positive: false,
    icon: Package,
    sub: "live inventory items",
  },
];

const orderSeed = [
  { id: "#ORD-1902", customer: "Ariana Khan", amount: "$245.00", status: "Paid", date: "Today, 10:24 AM" },
  { id: "#ORD-1901", customer: "Rahim Ahmed", amount: "$98.00", status: "Pending", date: "Today, 09:18 AM" },
  { id: "#ORD-1898", customer: "Nafisa Noor", amount: "$410.00", status: "Paid", date: "Yesterday, 07:42 PM" },
  { id: "#ORD-1893", customer: "Imran Hossain", amount: "$54.00", status: "Shipped", date: "Yesterday, 04:15 PM" },
  { id: "#ORD-1888", customer: "Mim Akter", amount: "$132.00", status: "Cancelled", date: "Yesterday, 11:06 AM" },
];

const activitySeed = [
  {
    id: 1,
    title: "New subcategory created",
    desc: "Running Shoes added under Footwear",
    time: "8 min ago",
    icon: Layers,
  },
  {
    id: 2,
    title: "Inventory updated",
    desc: "14 products restocked in Sports",
    time: "24 min ago",
    icon: Boxes,
  },
  {
    id: 3,
    title: "New user registered",
    desc: "3 new customer accounts created",
    time: "48 min ago",
    icon: Users,
  },
  {
    id: 4,
    title: "Order status changed",
    desc: "#ORD-1893 marked as shipped",
    time: "1 hr ago",
    icon: BadgeCheck,
  },
];

const categorySeed = [
  { name: "Footwear", count: 84, percent: 82 },
  { name: "Electronics", count: 63, percent: 68 },
  { name: "Accessories", count: 41, percent: 52 },
  { name: "Fitness", count: 29, percent: 39 },
];

const chartSeed = [45, 62, 54, 78, 66, 84, 72, 91, 76, 88, 67, 95];

const quickLinks = [
  { label: "Add Product", icon: Plus },
  { label: "Manage Categories", icon: FolderKanban },
  { label: "Subcategories", icon: Layers },
  { label: "View Orders", icon: ShoppingBag },
  { label: "Customers", icon: Users },
  { label: "Settings", icon: Settings },
];

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

const SoftButton = React.memo(function SoftButton({ icon: Icon, children, className, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "cursor-pointer hover:opacity-95 active:scale-[0.99]",
        className
      )}
      style={{
        background: "rgba(255,255,255,0.96)",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
        boxShadow: "0 10px 24px rgba(0,31,63,.06)",
      }}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
});

const PrimaryButton = React.memo(function PrimaryButton({ icon: Icon, children, className, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "group relative overflow-hidden rounded-2xl px-4 py-2.5 text-sm font-semibold text-white",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "cursor-pointer active:scale-[0.99]",
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
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {children}
      </span>
    </button>
  );
});

function StatCard({ item }) {
  const Icon = item.icon;
  const isPositive = item.positive;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="h-full">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
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
                <div
                  className="text-[15px] font-bold leading-[1.15] tracking-tight"
                  style={{ color: PALETTE.navy }}
                >
                  {item.title}
                </div>
              </div>
            </div>

            <div
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
              style={{
                background: isPositive ? "rgba(16,185,129,0.10)" : "rgba(255,107,107,0.10)",
                border: isPositive
                  ? "1px solid rgba(16,185,129,0.20)"
                  : "1px solid rgba(255,107,107,0.20)",
                color: PALETTE.navy,
              }}
            >
              {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {item.change}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[26px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
              {item.value}
            </div>
            <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              {item.sub}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function SearchField({ value, onChange }) {
  return (
    <label
      className="flex h-11 items-center gap-2 rounded-2xl px-3 w-full md:w-[360px]"
      style={{
        background: "rgba(255,255,255,0.96)",
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      <Search className="h-4 w-4 shrink-0" style={{ color: PALETTE.muted }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search dashboard…"
        className="w-full bg-transparent text-sm font-semibold outline-none"
        style={{ color: PALETTE.navy }}
      />
    </label>
  );
}

function SalesChartCard() {
  const max = Math.max(...chartSeed);

  return (
    <Card>
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[16px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
              Revenue Overview
            </div>
            <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              Monthly performance snapshot
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              +18.2% growth
            </span>

            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl"
              style={{ background: "rgba(255,255,255,0.96)", border: `1px solid ${PALETTE.border}` }}
            >
              <MoreHorizontal className="h-4 w-4" style={{ color: PALETTE.navy }} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-12 gap-3 items-end h-[260px]">
          {chartSeed.map((v, i) => {
            const h = Math.max(18, (v / max) * 100);
            return (
              <div key={i} className="col-span-1 flex flex-col items-center justify-end gap-2 h-full">
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${h}%`, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.03 }}
                  className="w-full rounded-[18px]"
                  style={{
                    background:
                      i % 3 === 0
                        ? `linear-gradient(180deg, rgba(255,126,105,0.85), rgba(255,126,105,0.45))`
                        : `linear-gradient(180deg, rgba(11,27,51,0.92), rgba(11,27,51,0.58))`,
                    boxShadow: "0 14px 24px rgba(0,31,63,0.08)",
                    border: `1px solid ${PALETTE.border}`,
                    minHeight: 18,
                  }}
                />
                <span className="text-[10px] font-semibold" style={{ color: PALETTE.muted }}>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function OrdersCard({ orders }) {
  return (
    <Card className="h-full">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[16px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
              Recent Orders
            </div>
            <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              Latest order activity from your store
            </div>
          </div>

          <SoftButton icon={Eye}>View all</SoftButton>
        </div>
      </div>

      <Divider />

      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
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
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const tone =
                order.status === "Paid"
                  ? { bg: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }
                  : order.status === "Pending"
                  ? { bg: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.22)" }
                  : order.status === "Shipped"
                  ? { bg: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.20)" }
                  : { bg: "rgba(255,107,107,0.10)", border: "1px solid rgba(255,107,107,0.20)" };

              return (
                <tr
                  key={order.id}
                  className="transition"
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(11,27,51,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-5 py-4 font-semibold" style={{ color: PALETTE.navy }}>
                    {order.id}
                  </td>
                  <td className="px-5 py-4" style={{ color: PALETTE.navy }}>
                    {order.customer}
                  </td>
                  <td className="px-5 py-4 font-semibold" style={{ color: PALETTE.navy }}>
                    {order.amount}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold"
                      style={{ background: tone.bg, border: tone.border, color: PALETTE.navy }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    {order.date}
                  </td>
                </tr>
              );
            })}

            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm font-medium" style={{ color: PALETTE.muted }}>
                  No matching orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function QuickActionsCard() {
  return (
    <Card className="h-full">
      <div className="p-5">
        <div className="text-[16px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
          Quick Actions
        </div>
        <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
          Jump into common admin tasks
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-3xl px-4 py-3 text-left transition hover:opacity-95 active:scale-[0.99]"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: `1px solid ${PALETTE.border}`,
                  boxShadow: "0 10px 24px rgba(0,31,63,0.05)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-2xl shrink-0"
                    style={{
                      background: PALETTE.soft,
                      border: `1px solid ${PALETTE.border}`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
                  </div>
                  <span className="truncate text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                    {item.label}
                  </span>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0" style={{ color: PALETTE.muted }} />
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function ActivityCard() {
  return (
    <Card className="h-full">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[16px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
              Live Activity
            </div>
            <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              Latest actions across the dashboard
            </div>
          </div>

          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}
          >
            <Activity className="h-3.5 w-3.5" />
            Live
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {activitySeed.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-3xl p-4"
                style={{
                  background: "rgba(255,255,255,0.78)",
                  border: `1px solid ${PALETTE.border}`,
                  boxShadow: "0 10px 24px rgba(0,31,63,0.04)",
                }}
              >
                <div
                  className="grid h-10 w-10 place-items-center rounded-2xl shrink-0"
                  style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                >
                  <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                    {item.title}
                  </div>
                  <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                    {item.desc}
                  </div>
                </div>

                <div className="text-[11px] font-semibold shrink-0" style={{ color: PALETTE.muted }}>
                  {item.time}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function CategoryCard() {
  return (
    <Card className="h-full">
      <div className="p-5">
        <div className="text-[16px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
          Top Categories
        </div>
        <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
          Product distribution by category
        </div>

        <div className="mt-5 grid gap-4">
          {categorySeed.map((item, idx) => (
            <div key={item.name}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      background: idx % 2 === 0 ? PALETTE.coral : PALETTE.navy,
                    }}
                  />
                  <span className="truncate text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                    {item.name}
                  </span>
                </div>

                <span className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
                  {item.count} items
                </span>
              </div>

              <div
                className="h-3 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(11,27,51,0.08)", border: `1px solid ${PALETTE.border2}` }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percent}%` }}
                  transition={{ duration: 0.55, delay: idx * 0.08 }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      idx % 2 === 0
                        ? `linear-gradient(90deg, rgba(255,126,105,0.95), rgba(255,126,105,0.55))`
                        : `linear-gradient(90deg, rgba(11,27,51,0.95), rgba(11,27,51,0.58))`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function MiniCard({ title, value, icon: Icon, badge }) {
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-2xl"
            style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
          >
            <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
          </div>

          {badge ? (
            <span
              className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{
                background: "rgba(255,126,105,0.10)",
                border: "1px solid rgba(255,126,105,0.20)",
                color: PALETTE.navy,
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>

        <div className="mt-4 text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
          {title}
        </div>
        <div className="mt-1 text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
          {value}
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orderSeed;
    return orderSeed.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <main className="w-full min-h-screen" style={{ background: PALETTE.bg, color: PALETTE.navy }}>
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
                      <div className="text-[22px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                        Admin Dashboard
                      </div>

                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
                        style={{
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
                        Store Performance
                      </span>
                    </div>

                    <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                      Monitor sales, orders, customer activity, and category performance in one place.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SoftButton icon={Bell}>Alerts</SoftButton>
                <SoftButton icon={RefreshCw}>Refresh</SoftButton>
                <PrimaryButton icon={Plus}>Add New</PrimaryButton>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <SearchField value={search} onChange={setSearch} />

              <div className="flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold"
                  style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  Updated just now
                </span>
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold"
                  style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  System healthy
                </span>
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold"
                  style={{ background: "rgba(255,126,105,0.10)", border: "1px solid rgba(255,126,105,0.20)" }}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  March Summary
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsSeed.map((item) => (
            <StatCard key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <SalesChartCard />
          </div>

          <div className="xl:col-span-4">
            <QuickActionsCard />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniCard title="Pending Orders" value="48" icon={ShoppingBag} badge="Needs review" />
          <MiniCard title="Low Stock Items" value="17" icon={Boxes} badge="Inventory" />
          <MiniCard title="Active Categories" value="26" icon={FolderKanban} badge="Catalog" />
          <MiniCard title="Subcategories" value="91" icon={Layers} badge="Structure" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <OrdersCard orders={filteredOrders} />
          </div>

          <div className="xl:col-span-4 grid gap-6">
            <CategoryCard />
            <ActivityCard />
          </div>
        </div>

        {!!search && (
          <div className="mt-6">
            <Card>
              <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[13px] font-semibold" style={{ color: PALETTE.navy }}>
                  Search preview for: <span style={{ color: PALETTE.coral }}>{search}</span>
                </div>
                <div className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  Matching recent orders: {filteredOrders.length}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}