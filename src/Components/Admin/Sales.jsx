"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  RefreshCw,
  Search,
  CalendarRange,
  Loader2,
  X,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

const cx = (...c) => c.filter(Boolean).join(" ");

const PALETTE = {
  navy: "#0B1B33",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  emerald: "#10b981",
  blue: "#3b82f6",
  bg: "#f8fafc",
  card: "rgba(255,255,255,0.98)",
  muted: "rgba(11,27,51,0.62)",
  border: "rgba(2, 10, 25, 0.10)",
  border2: "rgba(2, 10, 25, 0.08)",
  soft: "rgba(11,27,51,0.035)",
  soft2: "rgba(11,27,51,0.06)",
  tableHead: "rgba(248,250,252,0.96)",
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
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return data;
}

function formatMoney(n = 0) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function formatNumber(n = 0) {
  return new Intl.NumberFormat("en-BD").format(Number(n || 0));
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dt);
}

function getStatusTone(status) {
  switch (status) {
    case "delivered":
      return {
        background: "rgba(16,185,129,0.12)",
        border: "1px solid rgba(16,185,129,0.22)",
        color: "#065f46",
      };
    case "shipped":
      return {
        background: "rgba(59,130,246,0.12)",
        border: "1px solid rgba(59,130,246,0.22)",
        color: "#1d4ed8",
      };
    case "processing":
      return {
        background: "rgba(234,179,8,0.14)",
        border: "1px solid rgba(234,179,8,0.24)",
        color: "#92400e",
      };
    case "pending":
      return {
        background: "rgba(11,27,51,0.06)",
        border: "1px solid rgba(2,10,25,0.10)",
        color: PALETTE.navy,
      };
    default:
      return {
        background: "rgba(11,27,51,0.06)",
        border: "1px solid rgba(2,10,25,0.10)",
        color: PALETTE.navy,
      };
  }
}

function useDebouncedValue(value, delay = 220) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debounced;
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

const Field = React.memo(function Field({ label, icon: Icon, children, rightSlot }) {
  return (
    <label className="grid gap-2">
      {label ? <Label>{label}</Label> : null}
      <div
        className="flex h-11 items-center gap-2 overflow-hidden rounded-2xl px-3"
        style={{
          background: "rgba(255,255,255,0.98)",
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
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-95 active:scale-[0.99]",
        className
      )}
      style={{
        background: "rgba(255,255,255,0.98)",
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

function Shimmer({ className, style }) {
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
}

function MetricCard({ icon: Icon, label, value, hint, tone = "default" }) {
  const tones = {
    default: { bg: PALETTE.soft, border: `1px solid ${PALETTE.border}` },
    success: { bg: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.18)" },
    accent: { bg: "rgba(255,126,105,0.10)", border: "1px solid rgba(255,126,105,0.18)" },
    gold: { bg: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.18)" },
  };

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[12px] font-semibold" style={{ color: PALETTE.muted }}>
              {label}
            </div>
            <div className="mt-2 text-[24px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
              {value}
            </div>
            <div className="mt-2 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              {hint}
            </div>
          </div>

          <div
            className="grid h-11 w-11 place-items-center rounded-3xl"
            style={{
              background: tones[tone].bg,
              border: tones[tone].border,
              boxShadow: "0 12px 26px rgba(0,31,63,.05)",
            }}
          >
            <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function LoadingTable() {
  return (
    <Card>
      <div className="p-4 sm:p-5">
        <div className="grid gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Shimmer key={i} className="h-16 rounded-[18px]" />
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function AdminSalesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchSales, setSearchSales] = useState("");
  const debouncedSearchSales = useDebouncedValue(searchSales, 220);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [data, setData] = useState({
    sales: {
      totalOrders: 0,
      grossSales: 0,
      totalItemsSold: 0,
      avgOrderValue: 0,
    },
    recentOrders: [],
  });

  const firstLoadRef = useRef(true);

  useEffect(() => {
    const t = getStoredToken();
    if (!t) router.push("/login");
  }, [router]);

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
    if (kind === "error") return toast.error(message, base);
    return toast(message, base);
  }

  async function loadSales({ soft = false } = {}) {
    if (soft) setRefreshing(true);
    else setLoading(true);

    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);

      const res = await apiFetch(`/api/admin/sales${qs.toString() ? `?${qs.toString()}` : ""}`);

      setData({
        sales: {
          totalOrders: Number(res?.sales?.totalOrders || 0),
          grossSales: Number(res?.sales?.grossSales || 0),
          totalItemsSold: Number(res?.sales?.totalItemsSold || 0),
          avgOrderValue: Number(res?.sales?.avgOrderValue || 0),
        },
        recentOrders: Array.isArray(res?.recentOrders) ? res.recentOrders : [],
      });
    } catch (e) {
      if (e?.status === 401) showToast("error", "Unauthorized. Please login again.");
      else if (e?.status === 403) showToast("error", "Forbidden. Admin only.");
      else showToast("error", e.message || "Failed to load sales data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }

    loadSales({ soft: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const hasActiveDateFilters = Boolean(from || to);
  const hasAnyActiveFilters = Boolean(from || to || debouncedSearchSales.trim());

  const filteredSales = useMemo(() => {
    const q = debouncedSearchSales.trim().toLowerCase();
    if (!q) return data.recentOrders;

    return data.recentOrders.filter((order) => {
      const orderNo = String(order.orderNo || "").toLowerCase();
      const email = String(order.customerEmail || "").toLowerCase();
      const status = String(order.status || "").toLowerCase();
      const payment = String(order.paymentMethod || "").toLowerCase();
      return orderNo.includes(q) || email.includes(q) || status.includes(q) || payment.includes(q);
    });
  }, [data.recentOrders, debouncedSearchSales]);

  function clearFilters() {
    setSearchSales("");
    setFrom("");
    setTo("");
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
          style={{ background: "rgba(59,130,246,0.06)" }}
        />
      </div>

      <div className="mx-auto max-w-screen-xl px-4 pt-6 pb-4 sm:px-6 md:px-10 lg:px-12">
        <Card className="overflow-visible">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                    <BarChart3 className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-[20px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
                        Sales Dashboard
                      </div>

                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: "rgba(255,255,255,0.92)",
                          border: `1px solid ${PALETTE.border}`,
                          color: PALETTE.muted,
                        }}
                      >
                        Admin
                      </span>
                    </div>

                    <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                      Clean summary, instant filters, and a fixed-height responsive sales table.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SoftButton icon={RefreshCw} loading={refreshing} onClick={() => loadSales({ soft: true })}>
                  Refresh
                </SoftButton>

                {hasAnyActiveFilters ? (
                  <SoftButton icon={X} onClick={clearFilters}>
                    Clear Filters
                  </SoftButton>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-3">
                <Field label="From date" icon={CalendarRange}>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                  />
                </Field>
              </div>

              <div className="lg:col-span-3">
                <Field label="To date" icon={CalendarRange}>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                  />
                </Field>
              </div>

              <div className="lg:col-span-6">
                <Field
                  label="Search sales"
                  icon={Search}
                  rightSlot={
                    debouncedSearchSales || searchSales ? (
                      <button
                        type="button"
                        onClick={() => setSearchSales("")}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:opacity-90"
                        style={{
                          background: PALETTE.soft,
                          border: `1px solid ${PALETTE.border}`,
                          color: PALETTE.navy,
                        }}
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null
                  }
                >
                  <input
                    value={searchSales}
                    onChange={(e) => setSearchSales(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                    style={{ color: PALETTE.navy, height: 42 }}
                    placeholder="Search order, email, status..."
                  />
                </Field>
              </div>
            </div>

            {hasActiveDateFilters ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {from ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{
                      background: "rgba(59,130,246,0.10)",
                      border: "1px solid rgba(59,130,246,0.18)",
                      color: PALETTE.navy,
                    }}
                  >
                    From: {formatDate(from)}
                  </span>
                ) : null}

                {to ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                    style={{
                      background: "rgba(255,126,105,0.10)",
                      border: "1px solid rgba(255,126,105,0.18)",
                      color: PALETTE.navy,
                    }}
                  >
                    To: {formatDate(to)}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="mx-auto max-w-screen-xl px-4 pb-10 sm:px-6 md:px-10 lg:px-12">
        <div className="grid gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={DollarSign}
              label="Gross Sales"
              value={formatMoney(data.sales.grossSales)}
              hint="Total sales amount"
              tone="accent"
            />

            <MetricCard
              icon={ShoppingCart}
              label="Total Orders"
              value={formatNumber(data.sales.totalOrders)}
              hint="All successful counted orders"
              tone="default"
            />

            <MetricCard
              icon={Package}
              label="Items Sold"
              value={formatNumber(data.sales.totalItemsSold)}
              hint="Total quantity sold"
              tone="gold"
            />

            <MetricCard
              icon={BarChart3}
              label="Average Order"
              value={formatMoney(data.sales.avgOrderValue)}
              hint="Average order value"
              tone="success"
            />
          </div>

          {loading ? (
            <LoadingTable />
          ) : (
            <Card>
              <div
                className="overflow-auto"
                style={{
                  height: "min(62vh, 680px)",
                }}
              >
                {filteredSales.length ? (
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead
                      className="sticky top-0 z-10"
                      style={{
                        background: PALETTE.tableHead,
                        backdropFilter: "blur(10px)",
                        borderBottom: `1px solid ${PALETTE.border2}`,
                      }}
                    >
                      <tr className="text-[12px]" style={{ color: PALETTE.muted }}>
                        <th className="px-4 py-4 font-semibold sm:px-6">Order</th>
                        <th className="px-4 py-4 font-semibold sm:px-6">Customer</th>
                        <th className="px-4 py-4 font-semibold sm:px-6">Status</th>
                        <th className="px-4 py-4 font-semibold sm:px-6">Payment</th>
                        <th className="px-4 py-4 font-semibold sm:px-6">Items</th>
                        <th className="px-4 py-4 font-semibold sm:px-6">Date</th>
                        <th className="px-4 py-4 font-semibold text-right sm:px-6">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredSales.map((order) => {
                        const tone = getStatusTone(order.status);

                        return (
                          <tr
                            key={order.id}
                            style={{ borderBottom: `1px solid ${PALETTE.border2}` }}
                            className="transition hover:bg-[rgba(11,27,51,0.025)]"
                          >
                            <td className="px-4 py-4 align-middle sm:px-6">
                              <div className="font-semibold" style={{ color: PALETTE.navy }}>
                                {order.orderNo || "Order"}
                              </div>
                              <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                                {order.deliveryZone || "—"}
                              </div>
                            </td>

                            <td className="px-4 py-4 align-middle sm:px-6">
                              <div className="max-w-[220px] truncate font-medium" style={{ color: PALETTE.navy }}>
                                {order.customerEmail || "No email"}
                              </div>
                            </td>

                            <td className="px-4 py-4 align-middle sm:px-6">
                              <span
                                className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                                style={tone}
                              >
                                {order.status}
                              </span>
                            </td>

                            <td className="px-4 py-4 align-middle sm:px-6">
                              <div className="font-medium capitalize" style={{ color: PALETTE.navy }}>
                                {order.paymentMethod || "—"}
                              </div>
                              <div className="mt-1 text-[12px] font-medium capitalize" style={{ color: PALETTE.muted }}>
                                {order.paymentStatus || "—"}
                              </div>
                            </td>

                            <td className="px-4 py-4 align-middle sm:px-6">
                              <span
                                className="inline-flex rounded-xl px-2.5 py-1 text-[12px] font-semibold"
                                style={{
                                  background: "rgba(59,130,246,0.08)",
                                  border: "1px solid rgba(59,130,246,0.16)",
                                  color: PALETTE.navy,
                                }}
                              >
                                {formatNumber(order.itemCount)}
                              </span>
                            </td>

                            <td className="px-4 py-4 align-middle sm:px-6">
                              <div className="font-medium" style={{ color: PALETTE.navy }}>
                                {formatDate(order.createdAt)}
                              </div>
                            </td>

                            <td className="px-4 py-4 align-middle text-right sm:px-6">
                              <div className="font-semibold" style={{ color: PALETTE.navy }}>
                                {formatMoney(order.total)}
                              </div>
                              <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                                Subtotal {formatMoney(order.subtotal)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="grid h-full min-h-[420px] place-items-center p-8">
                    <div
                      className="mx-auto w-full max-w-lg rounded-[28px] p-8 text-center"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 20%, rgba(255,126,105,0.10), rgba(11,27,51,0.04) 55%), #fff",
                        border: `1px dashed ${PALETTE.border}`,
                        boxShadow: "0 16px 44px rgba(0,31,63,0.06)",
                      }}
                    >
                      <div
                        className="mx-auto grid h-12 w-12 place-items-center rounded-3xl"
                        style={{
                          background: "rgba(59,130,246,0.08)",
                          border: "1px solid rgba(59,130,246,0.16)",
                        }}
                      >
                        <BarChart3 className="h-5 w-5" style={{ color: PALETTE.navy }} />
                      </div>

                      <div className="mt-4 text-[15px] font-semibold" style={{ color: PALETTE.navy }}>
                        No sales found
                      </div>
                      <div className="mt-1 text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                        Adjust search or date filter to see matching sales.
                      </div>

                      {hasAnyActiveFilters ? (
                        <div className="mt-5 flex justify-center">
                          <SoftButton icon={X} onClick={clearFilters}>
                            Clear Filters
                          </SoftButton>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}