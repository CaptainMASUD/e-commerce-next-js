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
  FileText,
  RefreshCw,
  MapPinned,
  ChevronDown,
} from "lucide-react";

const PALETTE = {
  navy: "#0f172a",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#f8fafc",
  card: "#ffffff",
  danger: "#ef4444",
  text: "#334155",
  muted: "#64748b",
};

const cx = (...c) => c.filter(Boolean).join(" ");

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const BANGLADESH_CITIES = [
  "Dhaka",
  "Chattogram",
  "Khulna",
  "Rajshahi",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Comilla",
  "Narayanganj",
  "Gazipur",
  "Narsingdi",
  "Tangail",
  "Jashore",
  "Bogura",
  "Dinajpur",
  "Pabna",
  "Kushtia",
  "Noakhali",
  "Feni",
  "Cox's Bazar",
  "Brahmanbaria",
  "Faridpur",
  "Jamalpur",
  "Kishoreganj",
  "Madaripur",
  "Gopalganj",
  "Munshiganj",
  "Shariatpur",
  "Rajbari",
  "Manikganj",
  "Sunamganj",
  "Moulvibazar",
  "Habiganj",
  "Lakshmipur",
  "Chandpur",
  "Bhola",
  "Patuakhali",
  "Barguna",
  "Jhalokathi",
  "Pirojpur",
  "Satkhira",
  "Bagerhat",
  "Narail",
  "Magura",
  "Jhenaidah",
  "Chuadanga",
  "Meherpur",
  "Sirajganj",
  "Naogaon",
  "Natore",
  "Chapainawabganj",
  "Joypurhat",
  "Gaibandha",
  "Kurigram",
  "Lalmonirhat",
  "Nilphamari",
  "Panchagarh",
  "Thakurgaon",
  "Sherpur",
  "Netrokona",
  "Khagrachari",
  "Rangamati",
  "Bandarban",
];

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

  const cleanId = productObj?._id || it?.product || it?._id || `row-${idx}`;

  const price = Number.isFinite(Number(it?.unitPrice))
    ? Number(it.unitPrice)
    : Number.isFinite(Number(productObj?.price))
    ? Number(productObj.price)
    : 0;

  const image = it?.image || productObj?.image || "/placeholder.png";

  return {
    key: `${String(cleanId)}__${String(it?.variantBarcode || "")}`,
    id: String(cleanId),
    productId: String(cleanId),
    variantBarcode: String(it?.variantBarcode || ""),
    title:
      it?.title ||
      productObj?.title ||
      it?.name ||
      productObj?.name ||
      "Untitled item",
    image,
    priceBDT: price,
    qty: Math.max(1, Number(it?.qty || 1)),
    category: productObj?.category || "Product",
    raw: it,
  };
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200 sm:h-11 sm:w-11">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: PALETTE.navy }} />
      </span>

      <div className="min-w-0">
        <h2
          className="text-base font-semibold leading-tight sm:text-lg lg:text-[1.15rem]"
          style={{ color: PALETTE.navy }}
        >
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, required, error, children }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <label
          className="text-xs font-medium sm:text-sm"
          style={{ color: PALETTE.text }}
        >
          {label} {required ? <span className="text-rose-500">*</span> : null}
        </label>
        {error ? <div className="text-[11px] text-rose-500 sm:text-xs">{error}</div> : null}
      </div>

      <div
        className={cx(
          "flex min-h-[46px] items-center gap-3 rounded-2xl bg-white px-3.5 ring-1 transition sm:min-h-[50px] sm:px-4",
          error ? "ring-rose-200" : "ring-slate-200"
        )}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-slate-400" /> : null}
        {children}
      </div>
    </div>
  );
}

function SelectField({
  label,
  icon: Icon,
  required,
  error,
  value,
  onChange,
  options,
  placeholder = "Select one",
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <label
          className="text-xs font-medium sm:text-sm"
          style={{ color: PALETTE.text }}
        >
          {label} {required ? <span className="text-rose-500">*</span> : null}
        </label>
        {error ? <div className="text-[11px] text-rose-500 sm:text-xs">{error}</div> : null}
      </div>

      <div
        className={cx(
          "relative flex min-h-[46px] items-center rounded-2xl bg-white px-3.5 ring-1 transition sm:min-h-[50px] sm:px-4",
          error ? "ring-rose-200" : "ring-slate-200"
        )}
      >
        {Icon ? <Icon className="mr-3 h-4 w-4 shrink-0 text-slate-400" /> : null}

        <select
          value={value}
          onChange={onChange}
          className="w-full cursor-pointer appearance-none bg-transparent px-2 pr-10 text-center text-sm sm:text-[15px] focus:outline-none"
          style={{ color: PALETTE.navy, textAlignLast: "center" }}
        >
          <option value="" className="text-center">
            {placeholder}
          </option>
          {options.map((op) => (
            <option key={op} value={op} className="text-center">
              {op}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}

function RadioCard({ checked, title, desc, icon: Icon, onPick, badge }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cx(
        "w-full cursor-pointer rounded-3xl border p-4 text-left transition sm:p-5",
        checked
          ? "border-slate-300 bg-white shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
      style={{ boxShadow: checked ? "0 10px 24px rgba(15,23,42,.08)" : "none" }}
    >
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <span
          className={cx(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 sm:h-12 sm:w-12",
            checked ? "bg-rose-50 ring-rose-100" : "bg-slate-50 ring-slate-200"
          )}
        >
          <Icon
            className="h-4 w-4 sm:h-5 sm:w-5"
            style={{ color: checked ? PALETTE.cta : PALETTE.navy }}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-sm font-semibold sm:text-[15px]" style={{ color: PALETTE.navy }}>
              {title}
            </div>

            <div className="flex items-center gap-3 self-start">
              {badge ? (
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium sm:px-3 sm:text-xs"
                  style={{
                    background: "rgba(255,107,107,0.12)",
                    color: PALETTE.cta,
                  }}
                >
                  {badge}
                </span>
              ) : null}

              <span
                className={cx(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full ring-2",
                  checked ? "ring-rose-200" : "ring-slate-300"
                )}
              >
                <span
                  className={cx("h-2.5 w-2.5 rounded-full", checked ? "" : "opacity-0")}
                  style={{ background: PALETTE.cta }}
                />
              </span>
            </div>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{desc}</p>
        </div>
      </div>
    </button>
  );
}

function SummaryRow({ label, value, bold = false, accent = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div
        className={cx("text-sm", bold ? "font-medium" : "font-normal")}
        style={{ color: PALETTE.muted }}
      >
        {label}
      </div>
      <div
        className={cx("text-sm sm:text-[15px]", bold ? "font-semibold" : "font-medium")}
        style={{
          color: accent ? PALETTE.cta : PALETTE.navy,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniItem({ item }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 transition hover:bg-slate-100 sm:p-3.5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 sm:h-16 sm:w-16">
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
        <div className="text-[11px] font-semibold uppercase tracking-wide sm:text-xs" style={{ color: PALETTE.coral }}>
          {item.category}
        </div>

        <div
          className="mt-0.5 line-clamp-2 text-sm font-medium leading-5 sm:text-[15px]"
          style={{ color: PALETTE.navy }}
        >
          {item.title}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold sm:text-[15px]" style={{ color: PALETTE.cta }}>
            {formatBDT(item.priceBDT)}
          </div>
          <div className="text-xs text-slate-500 sm:text-sm">x{item.qty}</div>
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
  const [city, setCity] = useState("Dhaka");
  const [addressLine1, setAddressLine1] = useState("");
  const [deliveryZone, setDeliveryZone] = useState("inside_dhaka");
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

  useEffect(() => {
    if (!city) return;
    setDeliveryZone(city.trim().toLowerCase() === "dhaka" ? "inside_dhaka" : "outside_dhaka");
  }, [city]);

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
    return deliveryZone === "inside_dhaka" ? 70 : 130;
  }, [cart.length, deliveryZone]);

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

    if (!city.trim()) e.city = "Required";
    if (!addressLine1.trim()) e.addressLine1 = "Required";

    if (!["inside_dhaka", "outside_dhaka"].includes(deliveryZone)) {
      e.deliveryZone = "Required";
    }

    return e;
  }, [fullName, phone, email, city, addressLine1, deliveryZone]);

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
          city: city.trim(),
          addressLine1: addressLine1.trim(),
        },
        deliveryZone,
        discount: 0,
        noteFromCustomer: noteFromCustomer.trim(),
      };

      const res = await fetch("/api/customer/orders", {
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
    <div className="min-h-screen bg-slate-50">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 sm:h-72"
        style={{
          background:
            "linear-gradient(to bottom, rgba(15,23,42,.08), rgba(255,126,105,.05), rgba(234,179,8,.04), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 sm:h-11 sm:w-11">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: PALETTE.navy }} />
            </span>

            <div className="min-w-0">
              <h1
                className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[2rem]"
                style={{ color: PALETTE.navy }}
              >
                Checkout
              </h1>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {loadingCart
                  ? "Loading your cart..."
                  : cart.length
                  ? "Complete your delivery details and place the order"
                  : "Your cart is empty"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium ring-1 ring-slate-200 transition hover:bg-slate-50 sm:min-h-[46px]"
              style={{ color: PALETTE.navy }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow transition active:scale-[0.99] sm:min-h-[46px]"
              style={{ background: PALETTE.cta }}
            >
              View Cart <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {cartError ? (
          <div
            className="mt-5 rounded-2xl px-4 py-3 text-sm"
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
            className="mt-5 rounded-2xl px-4 py-3 text-sm"
            style={{
              background: "rgba(255,107,107,0.10)",
              border: "1px solid rgba(255,107,107,0.25)",
              color: PALETTE.navy,
            }}
          >
            {submitError}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div
              className="rounded-[24px] border border-slate-200 bg-white p-4 sm:rounded-[28px] sm:p-5 lg:p-6"
              style={{ boxShadow: "0 12px 30px rgba(15,23,42,.06)" }}
            >
              <SectionHeader
                icon={Package}
                title="Delivery Information"
                subtitle="Updated to match your latest order route fields"
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-4 lg:mt-6">
                <Field label="Full Name" icon={User} required error={touched ? errors.fullName : ""}>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-[15px] focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Phone" icon={Phone} required error={touched ? errors.phone : ""}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-[15px] focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                  />
                </Field>

                <Field label="Email" icon={Mail} required error={touched ? errors.email : ""}>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-[15px] focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="you@example.com"
                    type="email"
                  />
                </Field>

                <SelectField
                  label="City"
                  icon={MapPinned}
                  required
                  error={touched ? errors.city : ""}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  options={BANGLADESH_CITIES}
                  placeholder="Select city"
                />

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
                      className="w-full bg-transparent text-sm sm:text-[15px] focus:outline-none"
                      style={{ color: PALETTE.navy }}
                      placeholder="House, road, area, landmark"
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Order Note" icon={FileText}>
                    <input
                      value={noteFromCustomer}
                      onChange={(e) => setNoteFromCustomer(e.target.value)}
                      className="w-full bg-transparent text-sm sm:text-[15px] focus:outline-none"
                      style={{ color: PALETTE.navy }}
                      placeholder="Any extra delivery instruction"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div
              className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4 sm:rounded-[28px] sm:p-5 lg:p-6"
              style={{ boxShadow: "0 12px 30px rgba(15,23,42,.06)" }}
            >
              <SectionHeader
                icon={Truck}
                title="Delivery Zone"
                subtitle="Choose the correct shipping area"
              />

              <div className="mt-5 grid gap-3 lg:mt-6">
                <RadioCard
                  checked={deliveryZone === "inside_dhaka"}
                  title="Inside Dhaka"
                  desc="Choose this for delivery inside Dhaka city"
                  badge={formatBDT(70)}
                  icon={MapPin}
                  onPick={() => setDeliveryZone("inside_dhaka")}
                />

                <RadioCard
                  checked={deliveryZone === "outside_dhaka"}
                  title="Outside Dhaka"
                  desc="Choose this for delivery anywhere outside Dhaka"
                  badge={formatBDT(130)}
                  icon={Truck}
                  onPick={() => setDeliveryZone("outside_dhaka")}
                />
              </div>

              {touched && errors.deliveryZone ? (
                <div className="mt-3 text-sm text-rose-500">{errors.deliveryZone}</div>
              ) : null}
            </div>

            <div
              className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4 sm:rounded-[28px] sm:p-5 lg:p-6"
              style={{ boxShadow: "0 12px 30px rgba(15,23,42,.06)" }}
            >
              <SectionHeader
                icon={CreditCard}
                title="Payment Method"
                subtitle="Only cash on delivery is available right now"
              />

              <div className="mt-5 grid gap-3 lg:mt-6">
                <RadioCard
                  checked={payment === "cod"}
                  title="Cash on Delivery"
                  desc="Pay in cash when you receive your order"
                  icon={CreditCard}
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
                  "inline-flex min-h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold text-white shadow-md transition active:scale-[0.99] sm:min-h-[54px] sm:text-[15px]",
                  (!canPlace || placing) && "cursor-not-allowed opacity-70"
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

              <div className="mt-2 text-center text-xs text-slate-500 sm:text-sm">
                Cash on Delivery • No online payment
              </div>
            </div>
          </section>

          <aside className="lg:col-span-5">
            <div
              className="rounded-[24px] border border-slate-200 bg-white p-4 sm:rounded-[28px] sm:p-5 lg:sticky lg:top-24 lg:p-6"
              style={{ boxShadow: "0 12px 30px rgba(15,23,42,.07)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold sm:text-lg" style={{ color: PALETTE.navy }}>
                    Order Summary
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {loadingCart ? "Loading..." : `${cart.length} item(s)`}
                  </p>
                </div>

                {placed ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium text-white sm:text-xs"
                    style={{ background: PALETTE.navy }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Order placed
                  </span>
                ) : null}
              </div>

              {placedOrder?.orderNo ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Order created successfully. Order No:{" "}
                  <span className="font-semibold">{placedOrder.orderNo}</span>
                </div>
              ) : null}

              {loadingCart ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-center gap-2 text-sm" style={{ color: PALETTE.navy }}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading cart items...
                  </div>
                </div>
              ) : cart.length ? (
                <div className="mt-4 grid gap-3">
                  {cart.map((it) => (
                    <MiniItem key={it.key} item={it} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-sm font-medium sm:text-[15px]" style={{ color: PALETTE.navy }}>
                    Your cart is empty
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {cartError === "Please sign in first." ? (
                      <button
                        type="button"
                        onClick={goLogin}
                        className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white"
                        style={{ backgroundColor: PALETTE.navy }}
                      >
                        Sign In
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={fetchCart}
                      className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium ring-1 ring-slate-200"
                      style={{ color: PALETTE.navy }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-5">
                <div className="grid gap-2.5">
                  <SummaryRow label="City" value={city || "-"} />
                  <SummaryRow
                    label="Delivery Zone"
                    value={deliveryZone === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"}
                  />
                  <SummaryRow label="Subtotal" value={formatBDT(subtotal)} />
                  <SummaryRow label="Shipping" value={formatBDT(shipping)} />
                  <div className="border-t border-slate-200 pt-3">
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
                    "inline-flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold text-white shadow-md transition active:scale-[0.99] lg:text-[15px]",
                    (!canPlace || placing) && "cursor-not-allowed opacity-70"
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

                <div className="mt-2 text-center text-xs text-slate-500 sm:text-sm">
                  Cash on Delivery • No online payment
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: PALETTE.gold }} />
                <div className="text-sm leading-6 text-slate-500">
                  By placing the order, you confirm your delivery details are correct.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}