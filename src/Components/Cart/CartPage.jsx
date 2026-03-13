"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const PALETTE = {
  navy: "#0f172a",
  navySoft: "#1e293b",

  coral: "#ff8a78",
  coralStrong: "#f47c68",
  coralSoft: "rgba(255,138,120,.10)",
  coralBtnStart: "#ff907f",
  coralBtnEnd: "#f07b69",

  gold: "#eab308",
  goldDeep: "#ca8a04",

  danger: "#dc2626",
  dangerSoft: "rgba(220,38,38,.08)",

  bg: "#ffffff",
  bgTint: "#fcfcfd",
  card: "#ffffff",
  cardTint: "#fbfbfc",
  imageBg: "#f7f8fa",

  text: "#111827",
  muted: "#6b7280",

  border: "#e5e7eb",
  softBorder: "rgba(15,23,42,.055)",

  shadow: "0 8px 24px rgba(15,23,42,.05)",
  premiumShadow: "0 10px 26px rgba(15,23,42,.075)",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const TAKA_IMAGE_SRC = "/assets/sign/taka.png";

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

function formatPriceNumber(n) {
  return new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function MoneyWithTk({
  amount,
  size = "md",
  weight = 700,
  color = PALETTE.navy,
  faded = false,
  lineThrough = false,
}) {
  const sizeMap = {
    xs: {
      wrap: "gap-1",
      img: "h-[10px] w-[10px]",
      text: "text-[10px]",
    },
    sm: {
      wrap: "gap-1",
      img: "h-[11px] w-[11px]",
      text: "text-[11px]",
    },
    md: {
      wrap: "gap-1.5",
      img: "h-[13px] w-[13px]",
      text: "text-[13px] sm:text-[15px]",
    },
    lg: {
      wrap: "gap-1.5",
      img: "h-[14px] w-[14px]",
      text: "text-[14px] sm:text-[16px]",
    },
    xl: {
      wrap: "gap-2",
      img: "h-[15px] w-[15px]",
      text: "text-[16px] sm:text-[20px]",
    },
  };

  const cfg = sizeMap[size] || sizeMap.md;

  return (
    <span
      className={cn(
        "inline-flex items-center leading-none",
        cfg.wrap,
        lineThrough ? "line-through" : ""
      )}
      style={{
        color,
        fontWeight: weight,
        opacity: faded ? 0.68 : 1,
      }}
    >
      <img
        src={TAKA_IMAGE_SRC}
        alt="Tk"
        className={cn("object-contain select-none", cfg.img)}
        draggable="false"
      />
      <span className={cfg.text}>{formatPriceNumber(amount)}</span>
    </span>
  );
}

function FlatBadge({ children, tone = "soft" }) {
  const map = {
    soft: {
      bg: "#f8fafc",
      fg: PALETTE.navy,
      border: PALETTE.border,
    },
    coral: {
      bg: PALETTE.coralSoft,
      fg: PALETTE.navy,
      border: "rgba(255,138,120,.18)",
    },
    gold: {
      bg: "rgba(234,179,8,.10)",
      fg: "#8a6700",
      border: "rgba(234,179,8,.18)",
    },
    navy: {
      bg: "#f8fafc",
      fg: PALETTE.navy,
      border: PALETTE.border,
    },
  };

  const t = map[tone] || map.soft;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
      style={{
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.border}`,
      }}
    >
      {children}
    </span>
  );
}

function SaveTag({ amount }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px]"
      style={{
        background: "#f8fafc",
        color: PALETTE.muted,
        border: `1px solid ${PALETTE.border}`,
        fontWeight: 500,
      }}
    >
      <span>Save</span>
      <MoneyWithTk amount={amount} size="xs" weight={600} color={PALETTE.navySoft} />
    </span>
  );
}

function SectionHeader({ title, accent = "coral", subtitle, rightSlot }) {
  const accentColor = accent === "gold" ? PALETTE.gold : PALETTE.coral;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-[28px] font-bold tracking-tight sm:text-[36px] md:text-[40px] leading-tight"
            style={{ color: PALETTE.navy }}
          >
            {title}
          </h1>

          <span
            className="hidden h-2 w-2 rounded-full sm:inline-block"
            style={{ background: accentColor }}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className="h-[3px] w-10 rounded-full"
            style={{ background: accentColor }}
          />
          <span
            className="h-[3px] w-6 rounded-full"
            style={{ background: "rgba(15,23,42,0.10)" }}
          />
          {subtitle ? (
            <span
              className="ml-2 truncate text-[12px] font-medium"
              style={{ color: PALETTE.muted }}
            >
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>

      {rightSlot ? <div className="flex shrink-0">{rightSlot}</div> : null}
    </div>
  );
}

function QtyStepper({ value, onDec, onInc }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full p-1"
      style={{
        background: "#f8fafc",
        border: `1px solid ${PALETTE.border}`,
      }}
    >
      <button
        type="button"
        onClick={onDec}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[18px] font-semibold transition hover:bg-slate-50 active:scale-[0.98]"
        style={{
          color: PALETTE.navy,
          border: `1px solid ${PALETTE.border}`,
        }}
        aria-label="Decrease quantity"
      >
        -
      </button>

      <div
        className="min-w-[2.5rem] px-1 text-center text-[14px] font-bold"
        style={{ color: PALETTE.navy }}
      >
        {value}
      </div>

      <button
        type="button"
        onClick={onInc}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[18px] font-semibold transition hover:bg-slate-50 active:scale-[0.98]"
        style={{
          color: PALETTE.navy,
          border: `1px solid ${PALETTE.border}`,
        }}
        aria-label="Increase quantity"
      >
        +
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
  const saveAmount = hasDiscount ? Math.max(0, old - price) : 0;

  return (
    <div
      className="group rounded-[1.5rem] p-3 sm:p-4"
      style={{
        border: `1px solid ${PALETTE.softBorder}`,
        boxShadow: PALETTE.premiumShadow,
        background: `linear-gradient(180deg, ${PALETTE.card} 0%, ${PALETTE.cardTint} 100%)`,
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.15rem] sm:h-28 sm:w-28"
          style={{
            background: PALETTE.imageBg,
            border: `1px solid rgba(15,23,42,.05)`,
          }}
        >
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "#94a3b8" }}
              >
                {item.category || "Product"}
              </div>

              <h3
                className="mt-1 line-clamp-2 text-[15px] font-semibold leading-[1.35] sm:text-[17px]"
                style={{
                  color: PALETTE.navy,
                  letterSpacing: "-0.014em",
                }}
              >
                {item.title || "Untitled item"}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {hasDiscount ? <SaveTag amount={saveAmount} /> : null}
                <FlatBadge tone="navy">Premium pick</FlatBadge>
              </div>
            </div>

            <div
              className="rounded-full px-3 py-1 text-[10px] font-semibold"
              style={{
                background: "#f8fafc",
                color: PALETTE.muted,
                border: `1px solid ${PALETTE.border}`,
              }}
            >
              Qty {qty}
            </div>
          </div>

          <div
            className="my-3 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(15,23,42,.07), rgba(15,23,42,.025), transparent)",
            }}
          />

          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            <MoneyWithTk amount={price} size="lg" weight={700} color={PALETTE.navy} />

            {hasDiscount ? (
              <MoneyWithTk
                amount={old}
                size="xs"
                weight={500}
                color="#94a3b8"
                faded
                lineThrough
              />
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <QtyStepper
                value={qty}
                onDec={() => onQty(item.id, Math.max(1, qty - 1))}
                onInc={() => onQty(item.id, qty + 1)}
              />

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition active:scale-[0.98]"
                style={{
                  background: PALETTE.dangerSoft,
                  color: PALETTE.danger,
                  border: `1px solid rgba(220,38,38,.14)`,
                }}
              >
                Remove
              </button>
            </div>

            <div
              className="inline-flex items-center gap-3 rounded-full px-4 py-2"
              style={{
                background: "#f8fafc",
                border: `1px solid ${PALETTE.border}`,
              }}
            >
              <span
                className="text-[11px] font-medium"
                style={{ color: PALETTE.muted }}
              >
                Line total
              </span>
              <MoneyWithTk amount={lineTotal} size="md" weight={700} color={PALETTE.navy} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const totalItems = useMemo(
    () => items.reduce((sum, it) => sum + Math.max(1, Number(it.qty || 1)), 0),
    [items]
  );

  const updateQty = (id, qty) =>
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)));

  const removeItem = (id) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  const clearCart = () => setItems([]);

  return (
    <div
      className="min-h-screen overflow-x-hidden font-sans"
      style={{ background: PALETTE.bg, color: PALETTE.text }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
        style={{
          background:
            "linear-gradient(to bottom, rgba(15,23,42,.07), rgba(255,138,120,.04), rgba(234,179,8,.025), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mt-1">
          <SectionHeader
            title="Your Cart"
            accent="coral"
            subtitle={
              items.length
                ? `${totalItems} item${totalItems > 1 ? "s" : ""} selected for checkout`
                : "Your cart is currently empty"
            }
            rightSlot={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/product")}
                  className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold transition hover:bg-slate-50 active:scale-[0.98]"
                  style={{
                    color: PALETTE.navy,
                    border: `1px solid ${PALETTE.border}`,
                    boxShadow: "0 4px 12px rgba(15,23,42,.05)",
                  }}
                >
                  Continue Shopping
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  disabled={!items.length}
                  className={cn(
                    "rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-[0.98]",
                    !items.length ? "cursor-not-allowed opacity-55" : "hover:opacity-95"
                  )}
                  style={{
                    color: items.length ? PALETTE.danger : PALETTE.muted,
                    background: items.length ? PALETTE.dangerSoft : "#f8fafc",
                    border: `1px solid ${
                      items.length ? "rgba(220,38,38,.14)" : PALETTE.border
                    }`,
                  }}
                >
                  Clear Cart
                </button>
              </div>
            }
          />
        </section>

        <section className="mt-5">
          <div className="flex flex-wrap gap-2">
            <FlatBadge tone="coral">
              {items.length ? `${items.length} product${items.length > 1 ? "s" : ""}` : "No products"}
            </FlatBadge>
            <FlatBadge tone="gold">Fast checkout</FlatBadge>
            <FlatBadge tone="navy">Secure order summary</FlatBadge>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            {items.length ? (
              <div className="grid gap-4">
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
              <div
                className="rounded-[1.6rem] p-8 text-center sm:p-10"
                style={{
                  border: `1px solid ${PALETTE.softBorder}`,
                  boxShadow: PALETTE.premiumShadow,
                  background: `linear-gradient(180deg, ${PALETTE.card} 0%, ${PALETTE.cardTint} 100%)`,
                }}
              >
                <div
                  className="mx-auto h-14 w-14 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,138,120,.18), rgba(234,179,8,.14))",
                    border: `1px solid rgba(15,23,42,.05)`,
                  }}
                />

                <h2
                  className="mt-4 text-[22px] font-bold tracking-tight"
                  style={{ color: PALETTE.navy }}
                >
                  Your cart is empty
                </h2>

                <p
                  className="mt-2 text-[14px] font-medium"
                  style={{ color: PALETTE.muted }}
                >
                  Browse the collection and add your favorite premium products.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/product")}
                  className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-[14px] font-semibold text-white transition active:scale-[0.99]"
                  style={{
                    background: `linear-gradient(135deg, ${PALETTE.coralBtnStart}, ${PALETTE.coralBtnEnd})`,
                    boxShadow: "0 8px 18px rgba(244,124,104,.18)",
                  }}
                >
                  Start Shopping
                </button>
              </div>
            )}
          </section>

          <aside className="lg:col-span-4">
            <div
              className="rounded-[1.6rem] p-5 lg:sticky lg:top-24"
              style={{
                border: `1px solid ${PALETTE.softBorder}`,
                boxShadow: PALETTE.premiumShadow,
                background: `linear-gradient(180deg, ${PALETTE.card} 0%, ${PALETTE.cardTint} 100%)`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2
                    className="text-[22px] font-bold tracking-tight"
                    style={{ color: PALETTE.navy }}
                  >
                    Order Summary
                  </h2>
                  <p
                    className="mt-1 text-[12px] font-medium"
                    style={{ color: PALETTE.muted }}
                  >
                    Review your totals before checkout
                  </p>
                </div>

                <FlatBadge tone="gold">Ready</FlatBadge>
              </div>

              <div
                className="my-5 h-px w-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(15,23,42,.07), rgba(15,23,42,.025), transparent)",
                }}
              />

              <div className="grid gap-3">
                <div
                  className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{
                    background: "#f8fafc",
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: PALETTE.muted }}
                  >
                    Subtotal
                  </span>
                  <MoneyWithTk amount={subtotal} size="md" weight={700} color={PALETTE.navy} />
                </div>

                <div
                  className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{
                    background: "#f8fafc",
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: PALETTE.muted }}
                  >
                    Shipping
                  </span>
                  <MoneyWithTk amount={shipping} size="md" weight={700} color={PALETTE.navy} />
                </div>

                <div
                  className="rounded-[1.25rem] px-4 py-4"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,138,120,.10), rgba(255,255,255,1))",
                    border: `1px solid rgba(255,138,120,.16)`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="text-[14px] font-semibold"
                      style={{ color: PALETTE.navy }}
                    >
                      Total
                    </span>
                    <MoneyWithTk amount={total} size="xl" weight={800} color={PALETTE.coralStrong} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!items.length}
                onClick={() => router.push("/checkout")}
                className={cn(
                  "mt-5 w-full rounded-full px-5 py-3 text-[14px] font-semibold text-white transition active:scale-[0.99]",
                  !items.length ? "cursor-not-allowed opacity-60" : "hover:opacity-95"
                )}
                style={{
                  background: `linear-gradient(135deg, ${PALETTE.coralBtnStart}, ${PALETTE.coralBtnEnd})`,
                  boxShadow: "0 8px 18px rgba(244,124,104,.18)",
                }}
              >
                Proceed to Checkout
              </button>

              <button
                type="button"
                onClick={() => router.push("/product")}
                className="mt-3 w-full rounded-full bg-white px-5 py-3 text-[13px] font-semibold transition hover:bg-slate-50 active:scale-[0.99]"
                style={{
                  color: PALETTE.navy,
                  border: `1px solid ${PALETTE.border}`,
                }}
              >
                Continue Shopping
              </button>

              <p
                className="mt-4 text-[12px] font-medium leading-6"
                style={{ color: PALETTE.muted }}
              >
                Cash on delivery available. Taxes and delivery charges will be confirmed at checkout.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}