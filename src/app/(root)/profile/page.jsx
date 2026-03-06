"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Camera,
  Pencil,
  Check,
  X,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Package,
  Heart,
  CreditCard,
  Bell,
  CheckCircle2,
  BadgeCheck,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Home,
  Lock,
} from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#f7f8fb",
  card: "#ffffff",
  danger: "#ef4444",
  dangerBg: "rgba(239, 68, 68, 0.10)",
  border: "rgba(15, 23, 42, 0.08)",
  muted: "rgba(0,31,63,0.64)",
};

const cx = (...c) => c.filter(Boolean).join(" ");

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const clearToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("auth_user");
  sessionStorage.removeItem("auth_user");
};

async function authFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, { ...options, headers, cache: "no-store" });
  const data = await res.json().catch(() => null);

  return { res, data };
}

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

function getOrderTone(status) {
  const s = String(status || "").toLowerCase();
  if (["delivered"].includes(s)) return "good";
  if (["processing", "confirmed", "shipped"].includes(s)) return "warn";
  if (["cancelled", "returned"].includes(s)) return "bad";
  return "neutral";
}

function getOrderLabel(status) {
  if (!status) return "Pending";
  return String(status).charAt(0).toUpperCase() + String(status).slice(1);
}

/* -------------------- SMALL UI -------------------- */

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div
          className="text-xl font-black sm:text-2xl"
          style={{ color: PALETTE.navy }}
        >
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 text-sm font-semibold text-slate-500">
            {subtitle}
          </div>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

function Pill({ icon: Icon, text, tone = "neutral" }) {
  const styles =
    tone === "good"
      ? {
          bg: "rgba(34,197,94,0.10)",
          ring: "rgba(34,197,94,0.24)",
          color: "#16a34a",
        }
      : tone === "warn"
      ? {
          bg: "rgba(234,179,8,0.14)",
          ring: "rgba(234,179,8,0.28)",
          color: "#b45309",
        }
      : tone === "bad"
      ? {
          bg: "rgba(239,68,68,0.10)",
          ring: "rgba(239,68,68,0.24)",
          color: "#dc2626",
        }
      : {
          bg: "rgba(0,0,0,0.04)",
          ring: "rgba(0,0,0,0.08)",
          color: PALETTE.navy,
        };

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1"
      style={{ background: styles.bg, borderColor: styles.ring, color: styles.color }}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {text}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div
      className="rounded-3xl border bg-white p-4"
      style={{
        borderColor: PALETTE.border,
        boxShadow: "0 14px 30px rgba(0,31,63,.06)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-black/5">
          <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            {label}
          </div>
          <div className="mt-0.5 text-lg font-black" style={{ color: PALETTE.navy }}>
            {value}
          </div>
          {hint ? (
            <div className="mt-0.5 text-xs font-semibold text-slate-500">
              {hint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
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
          "flex items-center gap-2 rounded-2xl bg-white px-3 py-3 ring-1 transition",
          error ? "ring-rose-200" : "ring-black/10"
        )}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-black/45" /> : null}
        {children}
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, children, onClick, variant = "primary", disabled }) {
  const isDanger = variant === "danger";
  const isGhost = variant === "ghost";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black ring-1 transition active:scale-[0.99]",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        isGhost ? "bg-white hover:bg-slate-50 ring-black/10" : "",
        !isGhost && !isDanger ? "text-white" : ""
      )}
      style={
        isDanger
          ? {
              background: PALETTE.dangerBg,
              color: PALETTE.danger,
              borderColor: "rgba(239, 68, 68, 0.25)",
            }
          : isGhost
          ? { color: PALETTE.navy }
          : {
              background: PALETTE.cta,
              borderColor: "rgba(0,0,0,0.06)",
            }
      }
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black ring-1 transition active:scale-[0.99]",
        active ? "bg-white" : "bg-white/80 hover:bg-white"
      )}
      style={{
        color: active ? PALETTE.cta : PALETTE.navy,
        borderColor: active ? "rgba(255,107,107,.24)" : "rgba(0,0,0,.08)",
        boxShadow: active ? "0 10px 24px rgba(0,31,63,.06)" : "none",
      }}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function OrderCard({ order, onView }) {
  const itemCount = Array.isArray(order?.items) ? order.items.length : 0;

  return (
    <div
      className="rounded-3xl border bg-white p-4 sm:p-5"
      style={{
        borderColor: PALETTE.border,
        boxShadow: "0 12px 28px rgba(0,31,63,.05)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
              {order?.orderNo || "Order"}
            </div>
            <Pill
              icon={order?.status === "delivered" ? CheckCircle2 : Package}
              text={getOrderLabel(order?.status)}
              tone={getOrderTone(order?.status)}
            />
            <Pill
              icon={CreditCard}
              text={order?.paymentMethod === "cod" ? "Cash on Delivery" : order?.paymentMethod || "Payment"}
              tone="neutral"
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
            <span>{formatDate(order?.createdAt)}</span>
            <span>{itemCount} item(s)</span>
            <span>{order?.paymentStatus || "unpaid"}</span>
          </div>

          {order?.shippingAddress?.fullName || order?.shippingAddress?.phone ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-black/5">
              {order?.shippingAddress?.fullName || "—"} • {order?.shippingAddress?.phone || "—"}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-[140px] flex-col items-start gap-3 sm:items-end">
          <div className="text-xs font-semibold text-slate-500">Total</div>
          <div className="text-lg font-black" style={{ color: PALETTE.cta }}>
            {formatBDT(order?.total)}
          </div>

          <ActionBtn icon={ArrowRight} variant="ghost" onClick={onView}>
            View details
          </ActionBtn>
        </div>
      </div>
    </div>
  );
}

function PrefCard({ icon: Icon, title, desc, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        "w-full cursor-pointer rounded-3xl border p-5 text-left transition",
        checked ? "border-black/10 bg-white shadow-sm" : "border-black/5 bg-white/80 hover:bg-white"
      )}
      style={{ boxShadow: checked ? "0 12px 28px rgba(0,31,63,.07)" : "none" }}
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
              className="inline-flex h-6 w-11 items-center rounded-full ring-1 transition"
              style={{
                background: checked ? "rgba(255,107,107,0.20)" : "rgba(0,0,0,0.06)",
                borderColor: checked ? "rgba(255,107,107,0.25)" : "rgba(0,0,0,0.10)",
              }}
              aria-hidden="true"
            >
              <span
                className="h-5 w-5 rounded-full transition"
                style={{
                  transform: checked ? "translateX(22px)" : "translateX(2px)",
                  background: checked ? PALETTE.cta : "rgba(0,0,0,0.20)",
                }}
              />
            </span>
          </div>

          <div className="mt-1 text-xs font-semibold text-slate-600">{desc}</div>
        </div>
      </div>
    </button>
  );
}

function TruckIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
      className={cx("h-4 w-4", props.className)}
    >
      <path d="M3 7h11v9H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v3h-7v-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM18 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* -------------------- MAIN -------------------- */

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [apiUser, setApiUser] = useState(null);

  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    area: "Dhaka",
    avatarUrl: "",
    role: "customer",
    status: "active",
  });

  const [draft, setDraft] = useState(profile);
  const [newPassword, setNewPassword] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState("account");

  const [loadingMe, setLoadingMe] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orders, setOrders] = useState([]);

  const [prefs, setPrefs] = useState({
    sms: true,
    email: true,
    promos: false,
  });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      setLoadingMe(true);

      const { res, data } = await authFetch("/api/auth/me", { method: "GET" });

      if (!res.ok) {
        clearToken();
        router.replace("/login");
        return;
      }

      const u = data?.user;
      setApiUser(u);

      const nextProfile = {
        fullName: u?.name || "",
        phone: "",
        email: u?.email || "",
        address: "",
        area: "Dhaka",
        avatarUrl: "",
        role: u?.role || "customer",
        status: u?.status || "active",
      };

      setProfile(nextProfile);
      setDraft(nextProfile);
      setLoadingMe(false);
    };

    loadProfile();
  }, [router]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      setOrdersError("");

      const { res, data } = await authFetch("/api/customer/order", {
        method: "GET",
      });

      if (!res.ok) {
        setOrders([]);
        setOrdersError(data?.error || data?.message || "Failed to load orders.");
        return;
      }

      const list = Array.isArray(data?.orders) ? data.orders : [];
      setOrders(list);
    } catch {
      setOrders([]);
      setOrdersError("Failed to load orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const initials = useMemo(() => {
    const parts = (profile.fullName || "User").trim().split(/\s+/);
    return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
  }, [profile.fullName]);

  const errors = useMemo(() => {
    const e = {};
    if (!draft.fullName.trim()) e.fullName = "Required";
    if (!draft.email.trim()) e.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) e.email = "Invalid";
    if (newPassword && newPassword.length < 8) e.password = "Min 8 chars";
    return e;
  }, [draft, newPassword]);

  const canSave = Object.keys(errors).length === 0;

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o?.status === "delivered").length;
  const pendingOrders = orders.filter((o) =>
    ["pending", "confirmed", "processing", "shipped"].includes(String(o?.status || "").toLowerCase())
  ).length;

  const openEdit = () => {
    setDraft(profile);
    setNewPassword("");
    setTouched(false);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setNewPassword("");
    setTouched(false);
    setEditMode(false);
  };

  const saveProfile = async () => {
    setTouched(true);
    if (!canSave) return;

    try {
      setSaving(true);

      const payload = {
        name: draft.fullName.trim(),
        ...(newPassword ? { password: newPassword } : {}),
      };

      const { res, data } = await authFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = data?.error || data?.message || "Update failed.";
        setToast(msg);
        setTimeout(() => setToast(""), 2200);
        return;
      }

      const updatedUser = data?.user;
      setApiUser(updatedUser);

      const nextProfile = {
        ...profile,
        fullName: updatedUser?.name || draft.fullName,
        email: updatedUser?.email || profile.email,
        phone: draft.phone,
        address: draft.address,
        area: draft.area,
        avatarUrl: draft.avatarUrl,
        role: updatedUser?.role || profile.role,
        status: updatedUser?.status || profile.status,
      };

      setProfile(nextProfile);
      setDraft(nextProfile);
      setEditMode(false);
      setNewPassword("");
      setToast("Profile updated successfully");
      setTimeout(() => setToast(""), 2200);
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);

    setDraft((p) => ({ ...p, avatarUrl: url }));

    if (!editMode) {
      setEditMode(true);
      setTouched(false);
    }
  };

  const logout = () => {
    clearToken();
    router.push("/login");
  };

  if (loadingMe) {
    return (
      <div className="grid min-h-screen place-items-center" style={{ background: PALETTE.bg }}>
        <div
          className="inline-flex items-center gap-3 rounded-3xl bg-white px-6 py-4 text-sm font-black ring-1 ring-black/10"
          style={{ color: PALETTE.navy }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.10), rgba(255,126,105,.06), rgba(234,179,8,.04), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-black/10">
              <User className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </span>

            <div>
              <div
                className="text-2xl font-black tracking-tight sm:text-[30px]"
                style={{ color: PALETTE.navy }}
              >
                My Account
              </div>
              <div className="text-sm font-semibold text-slate-600">
                Manage profile, orders, security and preferences
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black ring-1 ring-black/10 hover:bg-slate-50"
              style={{ color: PALETTE.navy }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black text-white shadow"
              style={{ background: PALETTE.cta }}
            >
              Home
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <div
              className="rounded-[28px] border bg-white p-5 sm:p-6"
              style={{
                borderColor: PALETTE.border,
                boxShadow: "0 16px 36px rgba(0,31,63,.08)",
              }}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className="h-[84px] w-[84px] overflow-hidden rounded-[28px] ring-1 ring-black/10"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.18), rgba(0,31,63,0.06) 60%), #fff",
                        boxShadow: "0 12px 28px rgba(0,31,63,.08)",
                      }}
                    >
                      {((editMode ? draft.avatarUrl : profile.avatarUrl) || "").trim() ? (
                        <img
                          src={editMode ? draft.avatarUrl : profile.avatarUrl}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="text-2xl font-black" style={{ color: PALETTE.navy }}>
                            {initials}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-2 -right-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-black/10 shadow-sm hover:bg-slate-50"
                      aria-label="Change avatar"
                      title="Avatar is UI-only unless you save it in your DB"
                    >
                      <Camera className="h-4 w-4" style={{ color: PALETTE.navy }} />
                    </button>

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickAvatar(e.target.files?.[0])}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xl font-black" style={{ color: PALETTE.navy }}>
                        {profile.fullName || "User"}
                      </div>
                      <Pill
                        icon={BadgeCheck}
                        text={profile.role === "admin" ? "Admin" : "Customer"}
                        tone="good"
                      />
                      <Pill
                        icon={ShieldCheck}
                        text={profile.status === "active" ? "Active" : "Inactive"}
                        tone="neutral"
                      />
                    </div>

                    <div className="mt-2 grid gap-1 text-sm font-semibold text-slate-600">
                      <div className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4 text-black/45" />
                        <span className="truncate">{profile.email || "—"}</span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4 text-black/45" />
                        <span className="truncate">{profile.phone || "No phone added"}</span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-black/45" />
                        <span className="truncate">
                          {profile.address ? `${profile.address}, ${profile.area}` : "No default address"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {editMode ? (
                    <>
                      <ActionBtn icon={Check} onClick={saveProfile} disabled={!canSave || saving}>
                        {saving ? "Saving..." : "Save"}
                      </ActionBtn>
                      <ActionBtn icon={X} variant="ghost" onClick={cancelEdit} disabled={saving}>
                        Cancel
                      </ActionBtn>
                    </>
                  ) : (
                    <>
                      <ActionBtn icon={Pencil} variant="ghost" onClick={openEdit}>
                        Edit Profile
                      </ActionBtn>
                      <ActionBtn icon={LogOut} variant="danger" onClick={logout}>
                        Logout
                      </ActionBtn>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <TabButton active={tab === "account"} icon={User} label="Account" onClick={() => setTab("account")} />
                <TabButton active={tab === "orders"} icon={Package} label="Orders" onClick={() => setTab("orders")} />
                <TabButton active={tab === "security"} icon={Lock} label="Security" onClick={() => setTab("security")} />
                <TabButton active={tab === "prefs"} icon={Bell} label="Preferences" onClick={() => setTab("prefs")} />
              </div>

              <div className="mt-6">
                {tab === "account" ? (
                  <div className="grid gap-6">
                    <SectionHeader
                      title="Account details"
                      subtitle="Keep your basic profile up to date."
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Full Name" icon={User} required error={touched ? errors.fullName : ""}>
                        <input
                          value={editMode ? draft.fullName : profile.fullName}
                          disabled={!editMode}
                          onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                          onBlur={() => setTouched(true)}
                          className={cx(
                            "w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none",
                            !editMode && "cursor-not-allowed opacity-80"
                          )}
                          style={{ color: PALETTE.navy }}
                          placeholder="Your name"
                        />
                      </Field>

                      <Field label="Email (read-only)" icon={Mail} required error={touched ? errors.email : ""}>
                        <input
                          value={profile.email}
                          disabled
                          className="w-full cursor-not-allowed bg-transparent text-sm font-semibold opacity-80 focus:outline-none"
                          style={{ color: PALETTE.navy }}
                        />
                      </Field>

                      <Field label="Phone (UI only)" icon={Phone}>
                        <input
                          value={editMode ? draft.phone : profile.phone}
                          disabled={!editMode}
                          onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
                          className={cx(
                            "w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none",
                            !editMode && "cursor-not-allowed opacity-80"
                          )}
                          style={{ color: PALETTE.navy }}
                          placeholder="01XXXXXXXXX"
                          inputMode="tel"
                        />
                      </Field>

                      <Field label="Area (UI only)" icon={MapPin}>
                        <select
                          value={editMode ? draft.area : profile.area}
                          disabled={!editMode}
                          onChange={(e) => setDraft((p) => ({ ...p, area: e.target.value }))}
                          className={cx(
                            "w-full bg-transparent text-sm font-semibold focus:outline-none",
                            editMode ? "cursor-pointer" : "cursor-not-allowed opacity-80"
                          )}
                          style={{ color: PALETTE.navy }}
                        >
                          <option value="Dhaka">Dhaka</option>
                          <option value="Outside Dhaka">Outside Dhaka</option>
                        </select>
                      </Field>

                      <div className="sm:col-span-2">
                        <Field label="Default Address (UI only)" icon={Home}>
                          <input
                            value={editMode ? draft.address : profile.address}
                            disabled={!editMode}
                            onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))}
                            className={cx(
                              "w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none",
                              !editMode && "cursor-not-allowed opacity-80"
                            )}
                            style={{ color: PALETTE.navy }}
                            placeholder="House, Road, Area"
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-dashed border-black/10 bg-slate-50 p-4">
                      <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                        Account note
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-600">
                        Phone, area, address and avatar are still UI-only unless you add them to your user schema and API.
                      </div>
                    </div>
                  </div>
                ) : null}

                {tab === "orders" ? (
                  <div className="grid gap-6">
                    <SectionHeader
                      title="My orders"
                      subtitle="Your recent orders from the live order API."
                      action={
                        <ActionBtn icon={RefreshCw} variant="ghost" onClick={fetchOrders}>
                          Refresh
                        </ActionBtn>
                      }
                    />

                    {loadingOrders ? (
                      <div className="rounded-3xl border border-black/5 bg-white p-8">
                        <div className="inline-flex items-center gap-2 text-sm font-black" style={{ color: PALETTE.navy }}>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading orders...
                        </div>
                      </div>
                    ) : ordersError ? (
                      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600">
                        {ordersError}
                      </div>
                    ) : orders.length ? (
                      <div className="grid gap-3">
                        {orders.map((order) => (
                          <OrderCard
                            key={order?._id || order?.orderNo}
                            order={order}
                            onView={() =>
                              router.push(`/orders/${encodeURIComponent(order?._id || "")}`)
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-black/5 bg-slate-50 p-8 text-center">
                        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-white ring-1 ring-black/10">
                          <ShoppingBag className="h-6 w-6" style={{ color: PALETTE.navy }} />
                        </div>
                        <div className="mt-3 text-lg font-black" style={{ color: PALETTE.navy }}>
                          No orders yet
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-500">
                          When you place an order, it will appear here.
                        </div>
                        <div className="mt-5">
                          <ActionBtn icon={ArrowRight} onClick={() => router.push("/product")}>
                            Start shopping
                          </ActionBtn>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {tab === "security" ? (
                  <div className="grid gap-6">
                    <SectionHeader
                      title="Security"
                      subtitle="Update password and keep your account protected."
                    />

                    <div className="grid gap-4">
                      <div
                        className="rounded-3xl border bg-white p-5"
                        style={{
                          borderColor: PALETTE.border,
                          boxShadow: "0 12px 28px rgba(0,31,63,.05)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-black/5">
                            <ShieldCheck className="h-5 w-5" style={{ color: PALETTE.navy }} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                              Change password
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-600">
                              Update your password from here. Name changes are also saved from the same form.
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <Field label="Full Name" icon={User} required error={touched ? errors.fullName : ""}>
                                <input
                                  value={editMode ? draft.fullName : profile.fullName}
                                  disabled={!editMode}
                                  onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                                  className={cx(
                                    "w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none",
                                    !editMode && "cursor-not-allowed opacity-80"
                                  )}
                                  style={{ color: PALETTE.navy }}
                                  placeholder="Your name"
                                />
                              </Field>

                              <Field label="New Password" icon={Lock} error={touched ? errors.password : ""}>
                                <input
                                  value={editMode ? newPassword : ""}
                                  disabled={!editMode}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  onBlur={() => setTouched(true)}
                                  className={cx(
                                    "w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none",
                                    !editMode && "cursor-not-allowed opacity-80"
                                  )}
                                  style={{ color: PALETTE.navy }}
                                  placeholder="Minimum 8 characters"
                                  type="password"
                                />
                              </Field>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {!editMode ? (
                                <ActionBtn
                                  icon={Pencil}
                                  variant="ghost"
                                  onClick={() => {
                                    setTab("security");
                                    openEdit();
                                  }}
                                >
                                  Edit security details
                                </ActionBtn>
                              ) : (
                                <>
                                  <ActionBtn icon={Check} onClick={saveProfile} disabled={!canSave || saving}>
                                    {saving ? "Saving..." : "Save changes"}
                                  </ActionBtn>
                                  <ActionBtn icon={X} variant="ghost" onClick={cancelEdit}>
                                    Cancel
                                  </ActionBtn>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className="rounded-3xl border bg-white p-5"
                        style={{
                          borderColor: PALETTE.border,
                          boxShadow: "0 12px 28px rgba(0,31,63,.05)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-black/5">
                            <CreditCard className="h-5 w-5" style={{ color: PALETTE.navy }} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                              Payment method
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-600">
                              Your checkout is currently set to Cash on Delivery only.
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <Pill icon={TruckIcon} text="Cash on Delivery" tone="neutral" />
                              <Pill icon={ShieldCheck} text="Secure checkout" tone="good" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {tab === "prefs" ? (
                  <div className="grid gap-6">
                    <SectionHeader
                      title="Preferences"
                      subtitle="These controls are UI-only until you save them in your backend."
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <PrefCard
                        icon={Bell}
                        title="Order Updates"
                        desc="Get SMS updates about delivery progress"
                        checked={prefs.sms}
                        onToggle={() => setPrefs((p) => ({ ...p, sms: !p.sms }))}
                      />
                      <PrefCard
                        icon={Mail}
                        title="Email Receipts"
                        desc="Receive invoice and order summary by email"
                        checked={prefs.email}
                        onToggle={() => setPrefs((p) => ({ ...p, email: !p.email }))}
                      />
                      <PrefCard
                        icon={Heart}
                        title="Promotions"
                        desc="Be the first to know about offers and deals"
                        checked={prefs.promos}
                        onToggle={() => setPrefs((p) => ({ ...p, promos: !p.promos }))}
                      />

                      <div
                        className="rounded-3xl border bg-white p-5"
                        style={{
                          borderColor: PALETTE.border,
                          boxShadow: "0 12px 28px rgba(0,31,63,.05)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-black/5">
                            <CheckCircle2 className="h-5 w-5" style={{ color: PALETTE.cta }} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                              Not saved to database yet
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-600">
                              Add fields in your user schema and update the profile API when you want these preferences to persist.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4">
            <div className="grid gap-3 lg:sticky lg:top-24">
              <StatCard
                icon={Package}
                label="Total orders"
                value={loadingOrders ? "..." : String(totalOrders)}
                hint="Live from your orders API"
              />
              <StatCard
                icon={CheckCircle2}
                label="Delivered"
                value={loadingOrders ? "..." : String(deliveredOrders)}
                hint="Completed orders"
              />
              <StatCard
                icon={ShieldCheck}
                label="Active orders"
                value={loadingOrders ? "..." : String(pendingOrders)}
                hint="Pending / processing / shipped"
              />

              <div
                className="rounded-3xl border bg-white p-5"
                style={{
                  borderColor: PALETTE.border,
                  boxShadow: "0 12px 30px rgba(0,31,63,.08)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-black/5">
                    <MapPin className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                      Default delivery
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-600">
                      {profile.address ? `${profile.address}, ${profile.area}` : "No address added yet"}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTab("account");
                        openEdit();
                      }}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black ring-1 ring-black/10 hover:bg-slate-50"
                      style={{ color: PALETTE.navy }}
                    >
                      <Pencil className="h-4 w-4" />
                      Update account
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="rounded-3xl border bg-white p-5"
                style={{
                  borderColor: PALETTE.border,
                  boxShadow: "0 12px 30px rgba(0,31,63,.08)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-black/5">
                    <ShoppingBag className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                      Quick shopping
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-600">
                      Browse products, add to cart, then checkout with COD.
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => router.push("/product")}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black text-white"
                        style={{ background: PALETTE.cta }}
                      >
                        Shop now
                      </button>

                      <button
                        type="button"
                        onClick={() => router.push("/cart")}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black ring-1 ring-black/10"
                        style={{ color: PALETTE.navy }}
                      >
                        Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {toast ? (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black text-white shadow-lg"
              style={{ background: PALETTE.navy }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {toast}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}