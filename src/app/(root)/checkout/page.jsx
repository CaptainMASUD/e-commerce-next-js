"use client";

import React, { useMemo, useState } from "react";
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

/** Demo cart (replace with your cart/store data) */
const seedCart = [
  {
    id: "p2",
    title: "iPhone 17 Pro Max (Cosmic Orange)",
    image:
      "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2FiPhone-17-Pro-Max-cosmic-orange-8534.jpg&w=3840&q=100",
    priceBDT: 289990,
    qty: 1,
    category: "Phones",
  },
  {
    id: "p12",
    title: "AirPods Pro",
    image: "https://img.drz.lazcdn.com/static/bd/p/e5b23c70b92d51ac06d54b59f4ebddf5.jpg_720x720q80.jpg",
    priceBDT: 27990,
    qty: 2,
    category: "Audio",
  },
];

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
              <span className={cx("h-2.5 w-2.5 rounded-full", checked ? "" : "opacity-0")} style={{ background: PALETTE.cta }} />
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
      <div className={cx("text-sm", bold ? "font-extrabold" : "font-semibold", "text-slate-600")}>{label}</div>
      <div className={cx("text-sm", bold ? "font-black" : "font-extrabold")} style={{ color: accent ? PALETTE.cta : PALETTE.navy }}>
        {value}
      </div>
    </div>
  );
}

function MiniItem({ item }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-black/5 p-2 ring-1 ring-black/5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
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

  const [cart] = useState(seedCart);

  // form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("Dhaka");
  const [note, setNote] = useState("");

  // payment: ONLY COD
  const [payment, setPayment] = useState("cod");

  const [touched, setTouched] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const subtotal = useMemo(
    () => cart.reduce((sum, it) => sum + Number(it.priceBDT || 0) * Math.max(1, Number(it.qty || 1)), 0),
    [cart]
  );

  const shipping = useMemo(() => {
    if (!cart.length) return 0;
    return area === "Dhaka" ? 120 : 180;
  }, [cart.length, area]);

  const total = Math.max(0, subtotal + shipping);

  const errors = useMemo(() => {
    const e = {};
    if (!fullName.trim()) e.fullName = "Required";
    if (!phone.trim()) e.phone = "Required";
    else if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone.trim().replace(/\s+/g, ""))) e.phone = "Invalid";
    if (!address.trim()) e.address = "Required";
    return e;
  }, [fullName, phone, address]);

  const canPlace = Object.keys(errors).length === 0 && cart.length > 0;

  const onPlaceOrder = async () => {
    setTouched(true);
    if (!canPlace) return;

    setPlacing(true);
    await new Promise((r) => setTimeout(r, 700));
    setPlacing(false);
    setPlaced(true);

    // router.push("/order-success");
  };

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.10), rgba(255,126,105,.07), rgba(234,179,8,.05), transparent)",
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
              <div className="text-2xl sm:text-[30px] font-black tracking-tight" style={{ color: PALETTE.navy }}>
                Checkout
              </div>
              <div className="text-sm font-semibold text-slate-600">
                {cart.length ? "Confirm your details and place order" : "Your cart is empty"}
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

        {/* Layout */}
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Left: forms */}
          <section className="lg:col-span-7">
            {/* Delivery info */}
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
                  <div className="text-xs font-semibold text-slate-600">Use your real name & phone number</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label="Full Name" icon={User} required error={touched ? errors.fullName : ""}>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="Your name"
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

                <div className="sm:col-span-2">
                  <Field label="Full Address" icon={MapPin} required error={touched ? errors.address : ""}>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                      style={{ color: PALETTE.navy }}
                      placeholder="House, Road, Area"
                    />
                  </Field>
                </div>

                <Field label="Area" icon={Truck}>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
                    style={{ color: PALETTE.navy }}
                  >
                    <option value="Dhaka">Dhaka (৳120)</option>
                    <option value="Outside Dhaka">Outside Dhaka (৳180)</option>
                  </select>
                </Field>

                <Field label="Order Note (optional)" icon={ShieldCheck}>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none"
                    style={{ color: PALETTE.navy }}
                    placeholder="e.g. Call before delivery"
                  />
                </Field>
              </div>
            </div>

            {/* Payment */}
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
                  <div className="text-xs font-semibold text-slate-600">Only Cash on Delivery is available</div>
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

            {/* Mobile place button */}
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
                {placing ? "Placing Order..." : "Place Order"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-2 text-center text-xs font-semibold text-slate-500">Cash on Delivery • No online payment</div>
            </div>
          </section>

          {/* Right: summary */}
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
                  <div className="text-xs font-semibold text-slate-600">{cart.length} item(s)</div>
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

              <div className="mt-4 grid gap-2">{cart.map((it) => <MiniItem key={it.id} item={it} />)}</div>

              <div className="mt-5 rounded-3xl bg-black/5 p-4 ring-1 ring-black/5">
                <div className="grid gap-2">
                  <SummaryRow label="Subtotal" value={formatBDT(subtotal)} />
                  <SummaryRow label="Shipping" value={formatBDT(shipping)} />
                  <div className="border-t border-black/10 pt-3">
                    <SummaryRow label="Total" value={formatBDT(total)} bold accent />
                  </div>
                </div>
              </div>

              {/* Desktop place button */}
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
                  {placing ? "Placing Order..." : "Place Order"}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="mt-2 text-center text-xs font-semibold text-slate-500">Cash on Delivery • No online payment</div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-black/5 bg-white p-3">
                <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: PALETTE.gold }} />
                <div className="text-xs font-semibold text-slate-600">
                  By placing the order, you confirm your details are correct. Delivery charge depends on your area.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
