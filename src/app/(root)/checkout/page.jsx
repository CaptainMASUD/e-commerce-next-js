"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  User,
  Truck,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ShoppingCart,
  Package,
  Mail,
  Loader2,
  Home,
  MapPinned,
  FileText,
  RefreshCw,
} from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
  card: "#ffffff",
  danger: "#ef4444",
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
    id: String(productId),
    productId: String(productId),
    variantBarcode: String(it?.variantBarcode || ""),
    title: it?.title || productObj?.title || "Untitled item",
    image,
    priceBDT: price,
    qty: Math.max(1, Number(it?.qty || 1)),
    category: productObj?.category || "Product",
    raw: it,
  };
}

function Field({ label, icon: Icon, required, error, children }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-extrabold text-slate-600">
          {label} {required ? <span className="text-rose-500">*</span> : null}
        </label>
        {error ? <div className="text-[11px] font-bold text-rose-500">{error}</div> : null}
      </div>
      <div
        className={cx(
          "flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1",
          error ? "ring-rose-200" : "ring-black/10"
        )}
      >
        {Icon ? <Icon className="h-4 w-4 text-black/45 shrink-0" /> : null}
        {children}
      </div>
    </div>
  );
}

function RadioCard({ checked, title, desc, icon: Icon, onPick }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cx(
        "cursor-pointer w-full rounded-3xl border p-4 text-left transition",
        checked ? "border-black/10 bg-white shadow-sm" : "border-black/5 bg-white/70 hover:bg-white"
      )}
      style={{ boxShadow: checked ? "0 12px 28px rgba(0,31,63,.08)" : "none" }}
    >
      <div className="flex items-start gap-3">
        <span
          className={cx(
            "inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 shrink-0",
            checked ? "bg-black/5 ring-black/10" : "bg-black/4 ring-black/5"
          )}
        >
          <Icon className="h-5 w-5" style={{ color: checked ? PALETTE.cta : PALETTE.navy }} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
              {title}
            </div>
            <span
              className={cx(
                "inline-flex h-5 w-5 items-center justify-center rounded-full ring-2",
                checked ? "ring-[rgba(255,107,107,.35)]" : "ring-black/15"
              )}
            >
              <span
                className={cx("h-2.5 w-2.5 rounded-full", checked ? "" : "opacity-0")}
                style={{ background: PALETTE.cta }}
              />
            </span>
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-600">{desc}</div>
        </div>
      </div>
    </button>
  );
}

function SummaryRow({ label, value, bold = false, accent = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className={cx("text-sm", bold ? "font-extrabold" : "font-semibold", "text-slate-600")}>
        {label}
      </div>
      <div
        className={cx("text-sm", bold ? "font-black" : "font-extrabold")}
        style={{ color: accent ? PALETTE.cta : PALETTE.navy }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniItem({ item }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-black/5 p-2 ring-1 ring-black/5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
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
        <div className="text-[11px] font-extrabold" style={{ color: PALETTE.coral }}>
          {item.category}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[12px] font-semibold" style={{ color: PALETTE.navy }}>
          {item.title}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="text-xs font-black" style={{ color: PALETTE.cta }}>
            {formatBDT(item.priceBDT)}
          </div>
          <div className="text-[11px] font-extrabold text-slate-600">x{item.qty}</div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartError, setCartError] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("BD");
  const [city, setCity] = useState("Dhaka");
  const [area, setArea] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [noteFromCustomer, setNoteFromCustomer] = useState("");

  const [payment, setPayment] = useState("cod");

  const [touched, setTouched] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const { user } = getStoredAuth();
    if (user?.name) setFullName(user.name);
    if (user?.email) setEmail(user.email);
  }, []);

  const fetchCart = useCallback(async () => {
    const { token } = getStoredAuth();

    if (!token) {
      setCart([]);
      setLoadingCart(false);
      setCartError("Please sign in first.");
      return;
    }

    try {
      setLoadingCart(true);
      setCartError("");

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
        setCart([]);
        setCartError(parseApiError(data, "Failed to load cart."));
        return;
      }

      const apiItems = Array.isArray(data?.cart?.items) ? data.cart.items : [];
      setCart(apiItems.map((it, idx) => normalizeCartItem(it, idx)));
    } catch {
      setCart([]);
      setCartError("Failed to load cart.");
    } finally {
      setLoadingCart(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, it) => sum + Number(it.priceBDT || 0) * Math.max(1, Number(it.qty || 1)),
        0
      ),
    [cart]
  );

  const shipping = useMemo(() => {
    if (!cart.length) return 0;
    const cityNormalized = city.trim().toLowerCase();
    return cityNormalized === "dhaka" ? 120 : 180;
  }, [cart.length, city]);

  const total = Math.max(0, subtotal + shipping);

  const errors = useMemo(() => {
    const e = {};

    if (!fullName.trim()) e.fullName = "Required";

    if (!phone.trim()) e.phone = "Required";
    else if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone.trim().replace(/\s+/g, ""))) {
      e.phone = "Invalid";
    }

    if (!email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Invalid";

    if (!country.trim()) e.country = "Required";
    if (!city.trim()) e.city = "Required";
    if (!area.trim()) e.area = "Required";
    if (!addressLine1.trim()) e.addressLine1 = "Required";
    if (!addressLine2.trim()) e.addressLine2 = "Required";
    if (!postalCode.trim()) e.postalCode = "Required";
    if (!notes.trim()) e.notes = "Required";

    return e;
  }, [fullName, phone, email, country, city, area, addressLine1, addressLine2, postalCode, notes]);

  const canPlace = Object.keys(errors).length === 0 && cart.length > 0 && !loadingCart;

  const onPlaceOrder = async () => {
    setTouched(true);
    setSubmitError("");

    if (!canPlace) return;

    const { token } = getStoredAuth();
    if (!token) {
      setSubmitError("Please sign in first.");
      router.push("/login");
      return;
    }

    try {
      setPlacing(true);

      const payload = {
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          country: country.trim(),
          city: city.trim(),
          area: area.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          postalCode: postalCode.trim(),
          notes: notes.trim(),
        },
        shippingFee: shipping,
        discount: 0,
        noteFromCustomer: noteFromCustomer.trim(),
      };

      const res = await fetch("/api/customer/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setSubmitError(parseApiError(data, "Failed to place order."));
        return;
      }

      setPlaced(true);
      setPlacedOrder(data?.order || null);
      setCart([]);
    } catch {
      setSubmitError("Failed to place order.");
    } finally {
      setPlacing(false);
    }
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
            "linear-gradient(to bottom, rgba(0,31,63,.10), rgba(255,126,105,.07), rgba(234,179,8,.05), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-black/10">
              <ShoppingCart className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </span>
            <div>
              <div className="text-2xl sm:text-[30px] font-black tracking-tight" style={{ color: PALETTE.navy }}>
                Checkout
              </div>
              <div className="text-sm font-semibold text-slate-600">
                {loadingCart
                  ? "Loading your cart..."
                  : cart.length
                  ? "Confirm your details and place order"
                  : "Your cart is empty"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black ring-1 ring-black/10 hover:bg-slate-50"
              style={{ color: PALETTE.navy }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-white shadow active:scale-[0.99]"
              style={{ background: PALETTE.cta }}
            >
              View Cart <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {cartError ? (
          <div
            className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{
              background: "rgba(255,107,107,0.10)",
              border: "1px solid rgba(255,107,107,0.25)",
              color: PALETTE.navy,
            }}
          >
            {cartError}
          </div>
        ) : null}

        {submitError ? (
          <div
            className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{
              background: "rgba(255,107,107,0.10)",
              border: "1px solid rgba(255,107,107,0.25)",
              color: PALETTE.navy,
            }}
          >
            {submitError}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div
              className="rounded-3xl border border-black/5 bg-white p-5 sm:p-6"
              style={{ boxShadow: "0 12px 30px rgba(0,31,63,.07)" }}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 ring-1 ring-black/10">
                  <Package className="h-5 w-5" style={{ color: PALETTE.navy }} />
                </span>
                <div>
                  <div className="text-lg font-black" style={{ color: PALETTE.navy }}>
                    Delivery Information
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    Fill all required shipping fields
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label="Full Name" icon={User} required error={touched ? errors.fullName : ""}>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Phone" icon={Phone} required error={touched ? errors.phone : ""}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                  />
                </Field>

                <Field label="Email" icon={Mail} required error={touched ? errors.email : ""}>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="you@example.com"
                    type="email"
                  />
                </Field>

                <Field label="Country" icon={MapPinned} required error={touched ? errors.country : ""}>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="BD"
                  />
                </Field>

                <Field label="City" icon={Truck} required error={touched ? errors.city : ""}>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="Dhaka"
                  />
                </Field>

                <Field label="Area" icon={MapPin} required error={touched ? errors.area : ""}>
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="Mirpur / Dhanmondi / Chattogram..."
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field
                    label="Address Line 1"
                    icon={Home}
                    required
                    error={touched ? errors.addressLine1 : ""}
                  >
                    <input
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                      style={{ color: PALETTE.navy }}
                      placeholder="House, Road, Building"
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field
                    label="Address Line 2"
                    icon={Home}
                    required
                    error={touched ? errors.addressLine2 : ""}
                  >
                    <input
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                      style={{ color: PALETTE.navy }}
                      placeholder="Flat, Floor, Landmark"
                    />
                  </Field>
                </div>

                <Field
                  label="Postal Code"
                  icon={MapPinned}
                  required
                  error={touched ? errors.postalCode : ""}
                >
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="1216"
                  />
                </Field>

                <Field label="Notes" icon={FileText} required error={touched ? errors.notes : ""}>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="Call before delivery"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Order Note (optional)" icon={ShieldCheck}>
                    <input
                      value={noteFromCustomer}
                      onChange={(e) => setNoteFromCustomer(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                      style={{ color: PALETTE.navy }}
                      placeholder="Any extra instruction for the order"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div
              className="mt-6 rounded-3xl border border-black/5 bg-white p-5 sm:p-6"
              style={{ boxShadow: "0 12px 30px rgba(0,31,63,.07)" }}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 ring-1 ring-black/10">
                  <CreditCard className="h-5 w-5" style={{ color: PALETTE.navy }} />
                </span>
                <div>
                  <div className="text-lg font-black" style={{ color: PALETTE.navy }}>
                    Payment Method
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    Only Cash on Delivery is available
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <RadioCard
                  checked={payment === "cod"}
                  title="Cash on Delivery"
                  desc="Pay in cash when you receive your order"
                  icon={Truck}
                  onPick={() => setPayment("cod")}
                />
              </div>
            </div>

            <div className="mt-6 lg:hidden">
              <button
                type="button"
                onClick={onPlaceOrder}
                disabled={!canPlace || placing}
                className={cx(
                  "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-white shadow-md active:scale-[0.99]",
                  (!canPlace || placing) && "opacity-70 cursor-not-allowed"
                )}
                style={{ background: PALETTE.cta }}
              >
                {placing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-2 text-center text-xs font-semibold text-slate-500">
                Cash on Delivery • No online payment
              </div>
            </div>
          </section>

          <aside className="lg:col-span-5">
            <div
              className="rounded-3xl border border-black/5 bg-white p-5 sm:p-6 lg:sticky lg:top-24"
              style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-black" style={{ color: PALETTE.navy }}>
                    Order Summary
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    {loadingCart ? "Loading..." : `${cart.length} item(s)`}
                  </div>
                </div>

                {placed ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black text-white"
                    style={{ background: PALETTE.navy }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Order placed
                  </span>
                ) : null}
              </div>

              {placedOrder?.orderNo ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  Order created successfully. Order No: <span className="font-black">{placedOrder.orderNo}</span>
                </div>
              ) : null}

              {loadingCart ? (
                <div className="mt-4 rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                  <div className="flex items-center gap-2 text-sm font-bold" style={{ color: PALETTE.navy }}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading cart items...
                  </div>
                </div>
              ) : cart.length ? (
                <div className="mt-4 grid gap-2">
                  {cart.map((it) => (
                    <MiniItem key={it.key} item={it} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-black/5 bg-black/5 p-4 text-center">
                  <div className="text-sm font-bold" style={{ color: PALETTE.navy }}>
                    Your cart is empty
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {cartError === "Please sign in first." ? (
                      <button
                        type="button"
                        onClick={goLogin}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-white"
                        style={{ backgroundColor: PALETTE.navy }}
                      >
                        Sign In
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={fetchCart}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black ring-1 ring-black/10"
                      style={{ color: PALETTE.navy }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-3xl bg-black/5 p-4 ring-1 ring-black/5">
                <div className="grid gap-2">
                  <SummaryRow label="Subtotal" value={formatBDT(subtotal)} />
                  <SummaryRow label="Shipping" value={formatBDT(shipping)} />
                  <div className="border-t border-black/10 pt-3">
                    <SummaryRow label="Total" value={formatBDT(total)} bold accent />
                  </div>
                </div>
              </div>

              <div className="mt-5 hidden lg:block">
                <button
                  type="button"
                  onClick={onPlaceOrder}
                  disabled={!canPlace || placing}
                  className={cx(
                    "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-white shadow-md active:scale-[0.99]",
                    (!canPlace || placing) && "opacity-70 cursor-not-allowed"
                  )}
                  style={{ background: PALETTE.cta }}
                >
                  {placing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="mt-2 text-center text-xs font-semibold text-slate-500">
                  Cash on Delivery • No online payment
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-black/5 bg-white p-3">
                <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: PALETTE.gold }} />
                <div className="text-xs font-semibold text-slate-600">
                  By placing the order, you confirm your details are correct. Delivery charge depends on your city.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}