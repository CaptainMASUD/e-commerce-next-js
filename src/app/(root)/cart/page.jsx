"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import useNav from "@/Components/Utils/useNav";
import { Trash2, Plus, Minus } from "lucide-react";

const PALETTE = {
  navy: "#0f172a",
  coral: "#ff8a78",
  coralStrong: "#f47c68",
  coralSoft: "rgba(255,138,120,.10)",
  coralBtnStart: "#ff907f",
  coralBtnEnd: "#f07b69",

  gold: "#eab308",

  bg: "#ffffff",
  card: "#ffffff",
  cardTint: "#fbfbfc",
  imageBg: "#f7f8fa",

  text: "#111827",
  muted: "#6b7280",

  border: "#e5e7eb",
  softBorder: "rgba(15,23,42,.055)",

  danger: "#dc2626",
  dangerSoft: "rgba(220,38,38,.08)",

  premiumShadow: "0 10px 26px rgba(15,23,42,.075)",
};

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

function getStoredAuth() {
  if (typeof window === "undefined") return { token: "", user: null };

  try {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token") || "";

    const userRaw =
      localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");

    let user = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw);
      } catch {
        user = null;
      }
    }

    return { token, user };
  } catch {
    return { token: "", user: null };
  }
}

function parseApiError(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  return fallback;
}

function normalizeCartItem(it, idx = 0) {
  const productObj =
    it?.product && typeof it.product === "object" ? it.product : null;

  const productId = productObj?._id || it?.product || it?._id || `row-${idx}`;

  const price =
    Number.isFinite(Number(it?.unitPrice))
      ? Number(it.unitPrice)
      : Number.isFinite(Number(productObj?.price))
      ? Number(productObj.price)
      : 0;

  const image =
    it?.image || productObj?.image || productObj?.thumbnail || "/placeholder.png";

  return {
    key: `${String(productId)}__${String(it?.variantBarcode || "")}`,
    productId: String(productId),
    variantBarcode: String(it?.variantBarcode || ""),
    title:
      it?.title ||
      productObj?.title ||
      it?.name ||
      productObj?.name ||
      "Untitled item",
    image,
    priceBDT: price,
    oldPriceBDT: undefined,
    qty: Math.max(1, Number(it?.qty || 1)),
    raw: it,
  };
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
  };

  const t = map[tone] || map.soft;

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-semibold sm:text-[11px]"
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

function SectionHeader({ title, subtitle, rightSlot, accent = "coral" }) {
  const accentColor = accent === "gold" ? PALETTE.gold : PALETTE.coral;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-[24px] font-bold tracking-tight sm:text-[34px] md:text-[38px] leading-tight"
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
              className="ml-2 truncate text-[11px] font-medium sm:text-[12px]"
              style={{ color: PALETTE.muted }}
            >
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>

      {rightSlot ? <div className="flex shrink-0 gap-2">{rightSlot}</div> : null}
    </div>
  );
}

function SoftButton({
  children,
  onClick,
  disabled = false,
  tone = "default",
  full = false,
  compactMobile = false,
}) {
  const toneStyles =
    tone === "primary"
      ? {
          background: `linear-gradient(135deg, ${PALETTE.coralBtnStart}, ${PALETTE.coralBtnEnd})`,
          color: "#ffffff",
          border: "1px solid rgba(244,124,104,.18)",
          boxShadow: "0 8px 18px rgba(244,124,104,.18)",
        }
      : tone === "danger"
      ? {
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "#ffffff",
          border: "1px solid rgba(220,38,38,.18)",
          boxShadow: "0 8px 18px rgba(220,38,38,.16)",
        }
      : {
          background: "#ffffff",
          color: PALETTE.navy,
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "0 4px 12px rgba(15,23,42,.05)",
        };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.99]",
        compactMobile
          ? "px-3 py-2 text-[12px] sm:px-4 sm:py-2.5 sm:text-sm"
          : "px-4 py-2.5 text-sm",
        full ? "w-full" : "",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-95"
      )}
      style={toneStyles}
    >
      {children}
    </button>
  );
}

function QtyStepper({ value, onDec, onInc, disabled }) {
  return (
    <div
      className="inline-flex items-center rounded-full p-0.5 sm:p-1"
      style={{
        background: "#f8fafc",
        border: `1px solid ${PALETTE.border}`,
      }}
    >
      <button
        type="button"
        onClick={onDec}
        disabled={disabled}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full transition sm:h-8 sm:w-8",
          disabled
            ? "cursor-not-allowed opacity-55"
            : "cursor-pointer hover:bg-white"
        )}
        style={{ color: PALETTE.navy }}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.4} />
      </button>

      <div
        className="min-w-[1.75rem] px-1 text-center text-[13px] font-bold sm:min-w-[2rem] sm:text-[15px]"
        style={{ color: PALETTE.navy }}
      >
        {value}
      </div>

      <button
        type="button"
        onClick={onInc}
        disabled={disabled}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full transition sm:h-8 sm:w-8",
          disabled
            ? "cursor-not-allowed opacity-55"
            : "cursor-pointer hover:bg-white"
        )}
        style={{ color: PALETTE.navy }}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="animate-pulse overflow-hidden rounded-[1.35rem] bg-white"
          style={{
            border: `1px solid ${PALETTE.softBorder}`,
            boxShadow: PALETTE.premiumShadow,
          }}
        >
          <div className="flex gap-3 p-4">
            <div className="h-20 w-20 rounded-[1rem] bg-slate-100 sm:h-24 sm:w-24" />
            <div className="min-w-0 flex-1">
              <div className="h-5 w-3/4 rounded bg-slate-100" />
              <div className="mt-3 h-4 w-28 rounded bg-slate-100" />
              <div className="mt-5 ml-auto h-8 w-32 rounded-full bg-slate-100 sm:w-40" />
              <div className="mt-3 ml-auto h-8 w-36 rounded-full bg-slate-100 sm:h-9 sm:w-44" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CartItemRow({ item, busy, onRemove, onQty }) {
  const price = Number(item.priceBDT || 0);
  const old =
    typeof item.oldPriceBDT === "number" ? Number(item.oldPriceBDT) : undefined;
  const qty = Math.max(1, Number(item.qty || 1));
  const hasDiscount = typeof old === "number" && old > price;
  const lineTotal = price * qty;

  return (
    <div
      className="overflow-hidden rounded-[1.2rem] sm:rounded-[1.35rem]"
      style={{
        border: `1px solid ${PALETTE.softBorder}`,
        boxShadow: PALETTE.premiumShadow,
        background: `linear-gradient(180deg, ${PALETTE.card} 0%, ${PALETTE.cardTint} 100%)`,
      }}
    >
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-5">
        <div
          className="flex h-[74px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] sm:h-24 sm:w-24 sm:rounded-[1rem]"
          style={{
            background: PALETTE.imageBg,
            border: "1px solid rgba(15,23,42,.05)",
          }}
        >
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
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1 pr-1">
              <div
                className="line-clamp-2 font-semibold"
                style={{
                  color: PALETTE.navy,
                  fontSize: "clamp(14px, 4vw, 18px)",
                  lineHeight: 1.32,
                  letterSpacing: "-0.014em",
                }}
              >
                {item.title || "Untitled item"}
              </div>

              <div className="mt-2.5 flex flex-wrap items-end gap-x-2 gap-y-1">
                <div
                  className="text-[14px] font-bold sm:text-[17px]"
                  style={{ color: PALETTE.navy }}
                >
                  {formatBDT(price)}
                </div>

                {hasDiscount ? (
                  <div className="text-[11px] font-medium text-slate-400 line-through sm:text-[12px]">
                    {formatBDT(old)}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="shrink-0">
              <FlatBadge tone="coral">Line total {formatBDT(lineTotal)}</FlatBadge>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <QtyStepper
                value={qty}
                disabled={busy}
                onDec={() => onQty(item, Math.max(1, qty - 1))}
                onInc={() => onQty(item, qty + 1)}
              />

              <SoftButton
                onClick={() => onRemove(item)}
                disabled={busy}
                tone="danger"
                compactMobile
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.2} />
                <span className="sm:hidden">Remove</span>
                <span className="hidden sm:inline">
                  {busy ? "Removing..." : "Remove item"}
                </span>
              </SoftButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const router = useNav();

  const [items, setItems] = useState([]);
  const [cartUser, setCartUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [bootChecked, setBootChecked] = useState(false);

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

  const fetchCart = useCallback(async () => {
    const { token, user } = getStoredAuth();
    setCartUser(user || null);

    if (!token) {
      setItems([]);
      setLoading(false);
      setBootChecked(true);
      setError("Please sign in to view your cart.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/customer/cart", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setItems([]);
        setError(parseApiError(data, "Failed to load cart."));
        return;
      }

      const apiItems = Array.isArray(data?.cart?.items) ? data.cart.items : [];
      setItems(apiItems.map((it, idx) => normalizeCartItem(it, idx)));
    } catch {
      setError("Failed to load cart.");
    } finally {
      setLoading(false);
      setBootChecked(true);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const mutateCart = useCallback(
    async (payload, options = {}) => {
      const { token } = getStoredAuth();

      if (!token) {
        setError("Please sign in first.");
        router.push("/login");
        return false;
      }

      try {
        const res = await fetch("/api/customer/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setError(
            parseApiError(data, options.fallbackError || "Cart update failed.")
          );
          return false;
        }

        const nextItems = Array.isArray(data?.cart?.items) ? data.cart.items : [];
        setItems(nextItems.map((it, idx) => normalizeCartItem(it, idx)));
        setError("");
        return true;
      } catch {
        setError(options.fallbackError || "Cart update failed.");
        return false;
      }
    },
    [router]
  );

  const updateQty = useCallback(
    async (item, qty) => {
      const nextQty = Math.max(1, Number(qty || 1));
      setBusyKey(item.key);

      await mutateCart(
        {
          action: "setQty",
          productId: item.productId,
          variantBarcode: item.variantBarcode,
          qty: nextQty,
        },
        { fallbackError: "Failed to update quantity." }
      );

      setBusyKey("");
    },
    [mutateCart]
  );

  const removeItem = useCallback(
    async (item) => {
      setBusyKey(item.key);

      await mutateCart(
        {
          action: "remove",
          productId: item.productId,
          variantBarcode: item.variantBarcode,
        },
        { fallbackError: "Failed to remove item." }
      );

      setBusyKey("");
    },
    [mutateCart]
  );

  const clearCart = useCallback(async () => {
    setClearing(true);

    await mutateCart(
      { action: "clear" },
      { fallbackError: "Failed to clear cart." }
    );

    setClearing(false);
  }, [mutateCart]);

  const goCheckout = () => {
    if (!items.length) return;
    router.push("/checkout");
  };

  const goHome = () => {
    router.push("/");
  };

  const goLogin = () => {
    router.push("/login");
  };

  const headerSubtitle = loading
    ? "Loading your cart..."
    : items.length
    ? `${items.length} item(s) in your cart`
    : "Your cart is empty";

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: PALETTE.bg,
        color: PALETTE.text,
      }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
        style={{
          background:
            "linear-gradient(to bottom, rgba(15,23,42,.07), rgba(255,138,120,.04), rgba(234,179,8,.025), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <SectionHeader
          title="Your Cart"
          accent="coral"
          subtitle={headerSubtitle}
          rightSlot={
            <div className="flex flex-wrap items-center gap-2">
              <SoftButton onClick={goHome} compactMobile>
                Continue Shopping
              </SoftButton>
              <SoftButton
                onClick={clearCart}
                disabled={!items.length || clearing || loading}
                compactMobile
              >
                {clearing ? "Clearing..." : "Clear Cart"}
              </SoftButton>
            </div>
          }
        />

        {cartUser?.name || cartUser?.email ? (
          <div className="mt-5">
            <FlatBadge tone="soft">
              Cart for: {cartUser?.name || cartUser?.email}
            </FlatBadge>
          </div>
        ) : null}

        {error ? (
          <div
            className="mt-5 rounded-[1.1rem] px-4 py-3 text-sm font-medium"
            style={{
              background: PALETTE.dangerSoft,
              border: "1px solid rgba(220,38,38,.15)",
              color: PALETTE.navy,
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            {loading ? (
              <LoadingRows />
            ) : !bootChecked ? null : items.length ? (
              <div className="grid gap-3 sm:gap-4">
                {items.map((it) => (
                  <CartItemRow
                    key={it.key}
                    item={it}
                    busy={busyKey === it.key}
                    onRemove={removeItem}
                    onQty={updateQty}
                  />
                ))}
              </div>
            ) : (
              <div
                className="rounded-[1.35rem] px-6 py-10 text-center sm:px-8"
                style={{
                  border: `1px solid ${PALETTE.softBorder}`,
                  boxShadow: PALETTE.premiumShadow,
                  background: `linear-gradient(180deg, ${PALETTE.card} 0%, ${PALETTE.cardTint} 100%)`,
                }}
              >
                <div
                  className="text-[22px] font-bold tracking-tight sm:text-[24px]"
                  style={{ color: PALETTE.navy }}
                >
                  {error === "Please sign in to view your cart."
                    ? "Please sign in first"
                    : "Your cart is empty"}
                </div>

                <div
                  className="mx-auto mt-2 max-w-md text-sm font-medium"
                  style={{ color: PALETTE.muted }}
                >
                  {error === "Please sign in to view your cart."
                    ? "Your cart is linked to your account."
                    : "Browse products and add your favorite items to start building your order."}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {error === "Please sign in to view your cart." ? (
                    <SoftButton onClick={goLogin} tone="primary" compactMobile>
                      Sign In
                    </SoftButton>
                  ) : (
                    <SoftButton onClick={goHome} tone="primary" compactMobile>
                      Continue Shopping
                    </SoftButton>
                  )}

                  <SoftButton onClick={fetchCart} compactMobile>
                    Refresh
                  </SoftButton>
                </div>
              </div>
            )}
          </section>

          <aside className="lg:col-span-4">
            <div
              className="rounded-[1.35rem] p-5 lg:sticky lg:top-24"
              style={{
                border: `1px solid ${PALETTE.softBorder}`,
                boxShadow: PALETTE.premiumShadow,
                background: `linear-gradient(180deg, ${PALETTE.card} 0%, ${PALETTE.cardTint} 100%)`,
              }}
            >
              <div
                className="text-[22px] font-bold tracking-tight sm:text-[24px]"
                style={{ color: PALETTE.navy }}
              >
                Order Summary
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className="h-[3px] w-8 rounded-full"
                  style={{ background: PALETTE.coral }}
                />
                <span
                  className="h-[3px] w-5 rounded-full"
                  style={{ background: "rgba(15,23,42,0.10)" }}
                />
              </div>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium" style={{ color: PALETTE.muted }}>
                    Subtotal
                  </div>
                  <div className="font-bold" style={{ color: PALETTE.navy }}>
                    {formatBDT(subtotal)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="font-medium" style={{ color: PALETTE.muted }}>
                    Estimated Shipping
                  </div>
                  <div className="font-bold" style={{ color: PALETTE.navy }}>
                    {formatBDT(shipping)}
                  </div>
                </div>

                <div
                  className="my-1 h-px w-full"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(15,23,42,.07), rgba(15,23,42,.025), transparent)",
                  }}
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold" style={{ color: PALETTE.navy }}>
                    Estimated Total
                  </div>
                  <div
                    className="text-[20px] font-bold tracking-tight sm:text-[22px]"
                    style={{ color: PALETTE.coralStrong }}
                  >
                    {formatBDT(total)}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <SoftButton
                  full
                  tone="primary"
                  disabled={!items.length || loading}
                  onClick={goCheckout}
                  compactMobile
                >
                  Proceed to Checkout
                </SoftButton>
              </div>

              <div
                className="mt-3 text-[11px] font-medium leading-5 sm:text-xs"
                style={{ color: PALETTE.muted }}
              >
                Cash on Delivery available • Final delivery charge calculated at
                checkout
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}