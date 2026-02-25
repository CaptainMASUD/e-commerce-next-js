"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
  danger: "#ef4444",
  dangerBg: "rgba(239, 68, 68, 0.10)",
};

const cx = (...c) => c.filter(Boolean).join(" ");

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

// --- Demo items (replace with your cart state/store) ---
const seedCart = [
  {
    id: "p2",
    title: "iPhone 17 Pro Max (Cosmic Orange)",
    image:
      "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FiPhone-17-Pro-Max-cosmic-orange-8534.jpg&w=3840&q=100",
    priceBDT: 289990,
    oldPriceBDT: 309990,
    qty: 1,
    category: "Phones",
  },
  {
    id: "p12",
    title: "AirPods Pro",
    image:
      "https://img.drz.lazcdn.com/static/bd/p/e5b23c70b92d51ac06d54b59f4ebddf5.jpg_720x720q80.jpg",
    priceBDT: 27990,
    oldPriceBDT: 31990,
    qty: 2,
    category: "Audio",
  },
];

function QtyStepper({ value, onDec, onInc }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-2xl bg-black/5 p-1 ring-1 ring-black/5">
      <button
        type="button"
        onClick={onDec}
        className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99]"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4 text-slate-700" />
      </button>

      <div
        className="min-w-[2.25rem] px-1 text-center text-sm font-black"
        style={{ color: PALETTE.navy }}
      >
        {value}
      </div>

      <button
        type="button"
        onClick={onInc}
        className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99]"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4 text-slate-700" />
      </button>
    </div>
  );
}

function CartItemRow({ item, onRemove, onQty }) {
  const price = Number(item.priceBDT || 0);
  const old =
    typeof item.oldPriceBDT === "number" ? item.oldPriceBDT : undefined;
  const qty = Math.max(1, Number(item.qty || 1));
  const hasDiscount = typeof old === "number" && old > price;
  const lineTotal = price * qty;

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-3 sm:p-4">
      <div className="flex gap-3">
        <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/5">
          {/* If you want Next/Image, replace with next/image and configure remotePatterns */}
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="text-[11px] font-extrabold"
            style={{ color: PALETTE.coral }}
          >
            {item.category || "Product"}
          </div>

          <div
            className="mt-1 line-clamp-2 text-[13px] sm:text-[15px] font-semibold"
            style={{ color: PALETTE.navy }}
          >
            {item.title || "Untitled item"}
          </div>

          <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
            <div
              className="text-sm sm:text-[15px] font-black"
              style={{ color: PALETTE.cta }}
            >
              {formatBDT(price)}
            </div>
            {hasDiscount ? (
              <div className="text-xs font-semibold text-slate-500 line-through">
                {formatBDT(old)}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <QtyStepper
            value={qty}
            onDec={() => onQty(item.id, Math.max(1, qty - 1))}
            onInc={() => onQty(item.id, qty + 1)}
          />

          {/* Remove button RED */}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className={cx(
              "cursor-pointer inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black",
              "ring-1 active:scale-[0.99] transition"
            )}
            style={{
              background: PALETTE.dangerBg,
              color: PALETTE.danger,
              borderColor: "rgba(239, 68, 68, 0.25)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(239, 68, 68, 0.16)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = PALETTE.dangerBg)
            }
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 rounded-2xl bg-black/5 px-3 py-2 ring-1 ring-black/5">
          <div className="text-xs font-semibold text-slate-500">Line total</div>
          <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
            {formatBDT(lineTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ✅ Next.js App Router page/component
 * - removed react-router-dom useNavigate
 * - uses next/navigation useRouter + router.push(...)
 * - added "use client" (hooks)
 */
export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState(seedCart);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) =>
          sum + Number(it.priceBDT || 0) * Math.max(1, Number(it.qty || 1)),
        0
      ),
    [items]
  );

  const shipping = useMemo(() => (items.length ? 120 : 0), [items]);
  const total = Math.max(0, subtotal + shipping);

  const updateQty = (id, qty) =>
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)));
  const removeItem = (id) =>
    setItems((prev) => prev.filter((p) => p.id !== id));
  const clearCart = () => setItems([]);

  return (
    <div
      className="min-h-screen"
      style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.10), rgba(255,126,105,.08), rgba(234,179,8,.05), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-black/10">
              <ShoppingCart className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </span>

            <div>
              <div
                className="text-2xl sm:text-[30px] font-black tracking-tight"
                style={{ color: PALETTE.navy }}
              >
                Your Cart
              </div>
              <div className="text-sm font-semibold text-slate-600">
                {items.length
                  ? `${items.length} item(s) in your cart`
                  : "Your cart is empty"}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
            <button
              type="button"
              onClick={() => router.push("/product")}
              className="cursor-pointer rounded-2xl bg-white px-4 py-2 text-sm font-black ring-1 ring-black/10 hover:bg-slate-50"
              style={{ color: PALETTE.navy }}
            >
              Continue
            </button>

            <button
              type="button"
              onClick={clearCart}
              disabled={!items.length}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-black ring-1 ring-black/10",
                items.length
                  ? "cursor-pointer bg-white hover:bg-slate-50"
                  : "bg-white/60 cursor-not-allowed"
              )}
              style={{ color: PALETTE.navy }}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Items */}
          <section className="lg:col-span-8">
            {items.length ? (
              <div className="grid gap-3">
                {items.map((it) => (
                  <CartItemRow
                    key={it.id}
                    item={it}
                    onRemove={removeItem}
                    onQty={updateQty}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-black/5 bg-white p-8 sm:p-10 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-black/5 ring-1 ring-black/10">
                  <ShoppingCart className="h-6 w-6" style={{ color: PALETTE.navy }} />
                </div>
                <div className="mt-3 text-lg font-black" style={{ color: PALETTE.navy }}>
                  Your cart is empty
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-600">
                  Browse products and add your favorites.
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/product")}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-white shadow-md active:scale-[0.99]"
                  style={{ backgroundColor: PALETTE.navy }}
                >
                  Shop Now <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>

          {/* Summary */}
          <aside className="lg:col-span-4">
            <div
              className="rounded-3xl border border-black/5 bg-white p-5 lg:sticky lg:top-24"
              style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}
            >
              <div className="text-lg font-black" style={{ color: PALETTE.navy }}>
                Order Summary
              </div>

              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-600">Subtotal</div>
                  <div className="font-black" style={{ color: PALETTE.navy }}>
                    {formatBDT(subtotal)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-600">Shipping</div>
                  <div className="font-black" style={{ color: PALETTE.navy }}>
                    {formatBDT(shipping)}
                  </div>
                </div>

                <div className="border-t border-black/10 pt-3 flex items-center justify-between">
                  <div className="text-sm font-extrabold" style={{ color: PALETTE.navy }}>
                    Total
                  </div>
                  <div className="text-lg font-black" style={{ color: PALETTE.cta }}>
                    {formatBDT(total)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!items.length}
                onClick={() => router.push("/checkout")}
                className={cx(
                  "mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-md active:scale-[0.99]",
                  !items.length && "opacity-60 cursor-not-allowed"
                )}
                style={{ backgroundColor: PALETTE.cta }}
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-3 text-xs font-semibold text-slate-500">
                Cash on Delivery available • Taxes & delivery calculated at
                checkout
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
