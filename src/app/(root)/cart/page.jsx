"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
  danger: "#ef4444",
  dangerBg: "rgba(239, 68, 68, 0.10)",
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

  const image = it?.image || productObj?.image || "/placeholder.png";

  return {
    key: `${String(productId)}__${String(it?.variantBarcode || "")}`,
    productId: String(productId),
    variantBarcode: String(it?.variantBarcode || ""),
    title: it?.title || productObj?.title || "Untitled item",
    image,
    priceBDT: price,
    oldPriceBDT: undefined,
    qty: Math.max(1, Number(it?.qty || 1)),
    category: productObj?.category || "Product",
    raw: it,
  };
}

function QtyStepper({ value, onDec, onInc, disabled }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-2xl bg-black/5 p-1 ring-1 ring-black/5">
      <button
        type="button"
        onClick={onDec}
        disabled={disabled}
        className={cx(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-slate-50 active:scale-[0.99]"
        )}
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
        disabled={disabled}
        className={cx(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-slate-50 active:scale-[0.99]"
        )}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4 text-slate-700" />
      </button>
    </div>
  );
}

function CartItemRow({ item, busy, onRemove, onQty }) {
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
            className="line-clamp-2 text-[13px] sm:text-[15px] font-semibold"
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
            disabled={busy}
            onDec={() => onQty(item, Math.max(1, qty - 1))}
            onInc={() => onQty(item, qty + 1)}
          />

          <button
            type="button"
            onClick={() => onRemove(item)}
            disabled={busy}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black ring-1 active:scale-[0.99] transition",
              busy ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            )}
            style={{
              background: PALETTE.dangerBg,
              color: PALETTE.danger,
              borderColor: "rgba(239, 68, 68, 0.25)",
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.16)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = PALETTE.dangerBg;
            }}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
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

export default function CartPage() {
  const router = useRouter();

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
      const key = item.key;
      setBusyKey(key);

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
      const key = item.key;
      setBusyKey(key);

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

  const goShop = () => {
    router.push("/product");
  };

  const goLogin = () => {
    router.push("/login");
  };

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
                {loading
                  ? "Loading your cart..."
                  : items.length
                  ? `${items.length} item(s) in your cart`
                  : "Your cart is empty"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
            <button
              type="button"
              onClick={goShop}
              className="cursor-pointer rounded-2xl bg-white px-4 py-2 text-sm font-black ring-1 ring-black/10 hover:bg-slate-50"
              style={{ color: PALETTE.navy }}
            >
              Continue
            </button>

            <button
              type="button"
              onClick={clearCart}
              disabled={!items.length || clearing || loading}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-black ring-1 ring-black/10",
                items.length && !clearing && !loading
                  ? "cursor-pointer bg-white hover:bg-slate-50"
                  : "bg-white/60 cursor-not-allowed"
              )}
              style={{ color: PALETTE.navy }}
            >
              {clearing ? "Clearing..." : "Clear"}
            </button>
          </div>
        </div>

        {cartUser?.name || cartUser?.email ? (
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-extrabold"
            style={{
              background: "#fff",
              border: `1px solid ${PALETTE.border}`,
              color: PALETTE.muted,
              boxShadow: "0 10px 24px rgba(0,31,63,.05)",
            }}
          >
            Cart for: {cartUser?.name || cartUser?.email}
          </div>
        ) : null}

        {error ? (
          <div
            className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{
              background: "rgba(255,107,107,0.10)",
              border: "1px solid rgba(255,107,107,0.25)",
              color: PALETTE.navy,
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            {loading ? (
              <div className="rounded-3xl border border-black/5 bg-white p-8 sm:p-10">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: PALETTE.navy }} />
                  <div className="text-sm font-bold" style={{ color: PALETTE.navy }}>
                    Loading your cart...
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="rounded-3xl border border-black/5 bg-white p-4 animate-pulse"
                    >
                      <div className="flex gap-3">
                        <div className="h-20 w-20 rounded-2xl bg-black/5" />
                        <div className="flex-1">
                          <div className="h-3 w-20 rounded bg-black/5" />
                          <div className="mt-3 h-4 w-3/4 rounded bg-black/5" />
                          <div className="mt-3 h-4 w-28 rounded bg-black/5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !bootChecked ? null : items.length ? (
              <div className="grid gap-3">
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
              <div className="rounded-3xl border border-black/5 bg-white p-8 sm:p-10 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-black/5 ring-1 ring-black/10">
                  <ShoppingCart className="h-6 w-6" style={{ color: PALETTE.navy }} />
                </div>

                <div className="mt-3 text-lg font-black" style={{ color: PALETTE.navy }}>
                  {error === "Please sign in to view your cart."
                    ? "Please sign in first"
                    : "Your cart is empty"}
                </div>

                <div className="mt-1 text-sm font-semibold text-slate-600">
                  {error === "Please sign in to view your cart."
                    ? "Your cart is linked to your account."
                    : "Browse products and add your favorites."}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {error === "Please sign in to view your cart." ? (
                    <button
                      type="button"
                      onClick={goLogin}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-white shadow-md active:scale-[0.99]"
                      style={{ backgroundColor: PALETTE.navy }}
                    >
                      Sign In <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goShop}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-white shadow-md active:scale-[0.99]"
                      style={{ backgroundColor: PALETTE.navy }}
                    >
                      Shop Now <ArrowRight className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={fetchCart}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black ring-1 ring-black/10 hover:bg-slate-50"
                    style={{ color: PALETTE.navy }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </section>

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
                  <div className="font-semibold text-slate-600">Estimated Shipping</div>
                  <div className="font-black" style={{ color: PALETTE.navy }}>
                    {formatBDT(shipping)}
                  </div>
                </div>

                <div className="border-t border-black/10 pt-3 flex items-center justify-between">
                  <div className="text-sm font-extrabold" style={{ color: PALETTE.navy }}>
                    Estimated Total
                  </div>
                  <div className="text-lg font-black" style={{ color: PALETTE.cta }}>
                    {formatBDT(total)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!items.length || loading}
                onClick={goCheckout}
                className={cx(
                  "mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-md active:scale-[0.99]",
                  !items.length || loading
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                )}
                style={{ backgroundColor: PALETTE.cta }}
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-3 text-xs font-semibold text-slate-500">
                Cash on Delivery available • Final delivery charge calculated at checkout
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}