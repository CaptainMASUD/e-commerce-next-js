"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Search,
  Loader2,
  MapPin,
  CreditCard,
  Package,
  CalendarDays,
  Truck,
  CircleAlert,
  CheckCircle2,
  Clock3,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
  danger: "#ef4444",
  border: "rgba(2, 10, 25, 0.08)",
  muted: "rgba(0,31,63,0.62)",
};

const cx = (...c) => c.filter(Boolean).join(" ");

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const formatDate = (value) => {
  if (!value) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

function parseApiError(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  return fallback;
}

function normalizeTracking(data) {
  if (!data || typeof data !== "object") return null;

  const items = Array.isArray(data.items) ? data.items : [];

  return {
    orderNo: String(data.orderNo || ""),
    status: String(data.status || "pending"),
    paymentStatus: String(data.paymentStatus || "unpaid"),
    paymentMethod: String(data.paymentMethod || "cod"),
    subtotal: Number(data.subtotal || 0),
    shippingFee: Number(data.shippingFee || 0),
    discount: Number(data.discount || 0),
    total: Number(data.total || 0),
    deliveryZone: String(data.deliveryZone || ""),
    createdAt: data.createdAt || "",
    shippingAddress:
      data.shippingAddress && typeof data.shippingAddress === "object"
        ? data.shippingAddress
        : {},
    items: items.map((it, idx) => ({
      key: `${String(it?.product || idx)}__${String(it?.variantBarcode || "")}`,
      title: String(it?.title || "Untitled item"),
      image: String(it?.image || "/placeholder.png"),
      qty: Math.max(1, Number(it?.qty || 1)),
      unitPrice: Number(it?.unitPrice || 0),
      lineTotal: Number(it?.lineTotal || 0),
      productBarcode: String(it?.productBarcode || ""),
      variantBarcode: String(it?.variantBarcode || ""),
      attributes:
        it?.attributes && typeof it.attributes === "object" ? it.attributes : {},
    })),
  };
}

function getStatusMeta(status) {
  const s = String(status || "").toLowerCase();

  switch (s) {
    case "pending":
      return {
        label: "Pending",
        icon: Clock3,
        textColor: "#92400e",
        bg: "rgba(245, 158, 11, 0.12)",
        border: "rgba(245, 158, 11, 0.25)",
        progress: 10,
      };
    case "confirmed":
      return {
        label: "Confirmed",
        icon: CheckCircle2,
        textColor: "#0f766e",
        bg: "rgba(20, 184, 166, 0.10)",
        border: "rgba(20, 184, 166, 0.22)",
        progress: 25,
      };
    case "processing":
      return {
        label: "Processing",
        icon: Package,
        textColor: "#1d4ed8",
        bg: "rgba(59, 130, 246, 0.10)",
        border: "rgba(59, 130, 246, 0.22)",
        progress: 45,
      };
    case "shipped":
      return {
        label: "Shipped",
        icon: Truck,
        textColor: "#7c3aed",
        bg: "rgba(124, 58, 237, 0.10)",
        border: "rgba(124, 58, 237, 0.22)",
        progress: 75,
      };
    case "delivered":
      return {
        label: "Delivered",
        icon: CheckCircle2,
        textColor: "#15803d",
        bg: "rgba(34, 197, 94, 0.10)",
        border: "rgba(34, 197, 94, 0.22)",
        progress: 100,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: CircleAlert,
        textColor: "#b91c1c",
        bg: "rgba(239, 68, 68, 0.10)",
        border: "rgba(239, 68, 68, 0.22)",
        progress: 0,
      };
    case "returned":
      return {
        label: "Returned",
        icon: RefreshCw,
        textColor: "#b45309",
        bg: "rgba(245, 158, 11, 0.10)",
        border: "rgba(245, 158, 11, 0.22)",
        progress: 0,
      };
    default:
      return {
        label: status || "Unknown",
        icon: Package,
        textColor: PALETTE.navy,
        bg: "rgba(0, 31, 63, 0.06)",
        border: "rgba(0, 31, 63, 0.16)",
        progress: 0,
      };
  }
}

function prettyDeliveryZone(zone) {
  if (zone === "inside_dhaka") return "Inside Dhaka";
  if (zone === "outside_dhaka") return "Outside Dhaka";
  return zone || "N/A";
}

function prettyPaymentMethod(method) {
  if (String(method).toLowerCase() === "cod") return "Cash on Delivery";
  return method || "N/A";
}

function prettyPaymentStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "unpaid") return "Unpaid";
  if (s === "paid") return "Paid";
  return status || "N/A";
}

function GradientWord({ children }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: `linear-gradient(135deg, ${PALETTE.cta}, ${PALETTE.coral}, ${PALETTE.gold})`,
      }}
    >
      {children}
    </span>
  );
}

function OrderItemCard({ item }) {
  const attrs = item?.attributes ? Object.entries(item.attributes) : [];

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-3 sm:p-4">
      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/5 sm:h-24 sm:w-24">
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.png";
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="line-clamp-2 text-[13px] font-semibold sm:text-[15px]"
            style={{ color: PALETTE.navy }}
          >
            {item.title}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className="inline-flex rounded-xl px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "rgba(0,31,63,0.06)",
                color: PALETTE.navy,
                border: "1px solid rgba(0,31,63,0.08)",
              }}
            >
              Qty: {item.qty}
            </span>

            <span
              className="inline-flex rounded-xl px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "rgba(255,107,107,0.10)",
                color: PALETTE.cta,
                border: "1px solid rgba(255,107,107,0.20)",
              }}
            >
              Unit: {formatBDT(item.unitPrice)}
            </span>
          </div>

          {attrs.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {attrs.map(([k, v]) => (
                <span
                  key={`${k}-${v}`}
                  className="inline-flex rounded-xl px-2.5 py-1 text-[11px] font-medium"
                  style={{
                    background: "rgba(234,179,8,0.10)",
                    color: "#9a6700",
                    border: "1px solid rgba(234,179,8,0.20)",
                  }}
                >
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-black/5 px-3 py-2 ring-1 ring-black/5">
        <div className="text-xs font-medium text-slate-500">Line total</div>
        <div className="text-sm font-bold" style={{ color: PALETTE.navy }}>
          {formatBDT(item.lineTotal)}
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  const [orderNo, setOrderNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");

  const statusMeta = useMemo(
    () => getStatusMeta(tracking?.status),
    [tracking?.status]
  );

  const fetchTracking = useCallback(async (value) => {
    const normalized = String(value || "").trim().toUpperCase();

    if (!normalized) {
      setTracking(null);
      setError("Please enter your order number.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setTracking(null);

      const res = await fetch(
        `/api/order-tracking?orderNo=${encodeURIComponent(normalized)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(parseApiError(data, "Failed to track order."));
        return;
      }

      const normalizedTracking = normalizeTracking(data?.tracking);
      setTracking(normalizedTracking);
    } catch {
      setError("Failed to track order.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTrack = useCallback(async () => {
    await fetchTracking(orderNo);
  }, [fetchTracking, orderNo]);

  const handleTrackAnother = useCallback(() => {
    setOrderNo("");
    setTracking(null);
    setError("");
    setLoading(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleTrack();
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.10), rgba(255,126,105,.10), rgba(234,179,8,.08), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
        <section className="mx-auto max-w-3xl text-center">
          <div
            className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            style={{ color: PALETTE.navy }}
          >
            Track Your <GradientWord>Order</GradientWord>
          </div>

          <div className="mt-3 text-sm font-medium text-slate-600 sm:text-base">
            Enter your order number below to check the latest delivery status
          </div>

          <div
            className="mt-6 rounded-[28px] border border-black/5 bg-white p-4 sm:p-5"
            style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}
          >
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>

                  <input
                    id="orderNo"
                    type="text"
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
                    placeholder="Enter order no. e.g. ORD-20260312-ABCD"
                    className="h-12 w-full rounded-2xl border bg-white pl-11 pr-4 text-sm font-medium outline-none transition"
                    style={{
                      borderColor: "rgba(2, 10, 25, 0.10)",
                      color: PALETTE.navy,
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={cx(
                    "inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white shadow-md active:scale-[0.99]",
                    loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                  )}
                  style={{ backgroundColor: PALETTE.cta }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Track Order
                    </>
                  )}
                </button>
              </div>
            </form>

            {(tracking || error) ? (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleTrackAnother}
                  disabled={loading}
                  className={cx(
                    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-md transition active:scale-[0.99]",
                    loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  )}
                  style={{
                    backgroundColor: PALETTE.navy,
                  }}
                >
                  <Search className="h-4 w-4" />
                  Track Another Order
                </button>
              </div>
            ) : null}

            {error ? (
              <div
                className="mt-4 rounded-2xl px-4 py-3 text-sm font-medium"
                style={{
                  background: "rgba(255,107,107,0.10)",
                  border: "1px solid rgba(255,107,107,0.25)",
                  color: PALETTE.navy,
                }}
              >
                {error}
              </div>
            ) : null}
          </div>
        </section>

        {loading ? (
          <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-black/5 bg-white p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: PALETTE.navy }} />
              <div className="text-sm font-semibold" style={{ color: PALETTE.navy }}>
                Fetching order details...
              </div>
            </div>
          </div>
        ) : null}

        {!loading && tracking ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div
                className="rounded-3xl border border-black/5 bg-white p-5 sm:p-6"
                style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Order Number
                    </div>
                    <div
                      className="mt-1 text-xl font-extrabold sm:text-2xl"
                      style={{ color: PALETTE.navy }}
                    >
                      {tracking.orderNo}
                    </div>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 self-start rounded-2xl px-3 py-2 text-sm font-semibold"
                    style={{
                      background: statusMeta.bg,
                      color: statusMeta.textColor,
                      border: `1px solid ${statusMeta.border}`,
                    }}
                  >
                    <statusMeta.icon className="h-4 w-4" />
                    {statusMeta.label}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-medium text-slate-500">
                      Order Progress
                    </div>
                    <div className="text-xs font-bold" style={{ color: PALETTE.navy }}>
                      {statusMeta.progress}%
                    </div>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-black/5 ring-1 ring-black/5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${statusMeta.progress}%`,
                        background:
                          tracking.status === "cancelled" || tracking.status === "returned"
                            ? PALETTE.danger
                            : PALETTE.cta,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <CalendarDays className="h-4 w-4" />
                      Order Date
                    </div>
                    <div
                      className="mt-2 text-sm font-bold"
                      style={{ color: PALETTE.navy }}
                    >
                      {formatDate(tracking.createdAt)}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <CreditCard className="h-4 w-4" />
                      Payment
                    </div>
                    <div
                      className="mt-2 text-sm font-bold"
                      style={{ color: PALETTE.navy }}
                    >
                      {prettyPaymentMethod(tracking.paymentMethod)}
                    </div>
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      {prettyPaymentStatus(tracking.paymentStatus)}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Truck className="h-4 w-4" />
                      Delivery Zone
                    </div>
                    <div
                      className="mt-2 text-sm font-bold"
                      style={{ color: PALETTE.navy }}
                    >
                      {prettyDeliveryZone(tracking.deliveryZone)}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <ShoppingBag className="h-4 w-4" />
                      Order Total
                    </div>
                    <div
                      className="mt-2 text-sm font-bold"
                      style={{ color: PALETTE.cta }}
                    >
                      {formatBDT(tracking.total)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {tracking.items.map((item) => (
                  <OrderItemCard key={item.key} item={item} />
                ))}
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div
                className="rounded-3xl border border-black/5 bg-white p-5 lg:sticky lg:top-24"
                style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}
              >
                <div className="text-lg font-bold" style={{ color: PALETTE.navy }}>
                  Order Summary
                </div>

                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-600">Subtotal</div>
                    <div className="font-bold" style={{ color: PALETTE.navy }}>
                      {formatBDT(tracking.subtotal)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-600">Shipping Fee</div>
                    <div className="font-bold" style={{ color: PALETTE.navy }}>
                      {formatBDT(tracking.shippingFee)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-600">Discount</div>
                    <div className="font-bold" style={{ color: PALETTE.navy }}>
                      {formatBDT(tracking.discount)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-black/10 pt-3">
                    <div
                      className="text-sm font-semibold"
                      style={{ color: PALETTE.navy }}
                    >
                      Total
                    </div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: PALETTE.cta }}
                    >
                      {formatBDT(tracking.total)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-lg font-bold" style={{ color: PALETTE.navy }}>
                  Shipping Address
                </div>

                <div
                  className="mt-3 rounded-2xl p-4 text-sm"
                  style={{
                    background: "#fff",
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: PALETTE.navy }}
                    />
                    <div className="min-w-0">
                      <div
                        className="font-bold"
                        style={{ color: PALETTE.navy }}
                      >
                        {tracking.shippingAddress?.fullName || "N/A"}
                      </div>
                      <div className="mt-1 text-slate-600">
                        {tracking.shippingAddress?.phone || "N/A"}
                      </div>
                      <div className="text-slate-600">
                        {tracking.shippingAddress?.email || "N/A"}
                      </div>
                      <div className="mt-2 text-slate-600">
                        {tracking.shippingAddress?.addressLine1 || "N/A"}
                      </div>
                      <div className="text-slate-600">
                        {tracking.shippingAddress?.city || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTrackAnother}
                  disabled={loading}
                  className={cx(
                    "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-md transition active:scale-[0.99]",
                    loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  )}
                  style={{
                    backgroundColor: PALETTE.navy,
                  }}
                >
                  <Search className="h-4 w-4" />
                  Track Another Order
                </button>

                <div className="mt-4 text-xs font-medium text-slate-500">
                  No login required for order tracking.
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        {!loading && !tracking && !error ? (
          <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-black/5 bg-white p-8 text-center sm:p-10">
            <div className="text-lg font-bold" style={{ color: PALETTE.navy }}>
              Check your order status anytime
            </div>

            <div className="mt-1 text-sm font-medium text-slate-600">
              Enter your order number above to see the current delivery status.
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}