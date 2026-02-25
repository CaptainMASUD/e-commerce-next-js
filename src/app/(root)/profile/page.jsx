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
} from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
  card: "#ffffff",
  danger: "#ef4444",
  dangerBg: "rgba(239, 68, 68, 0.10)",
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
};

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { res, data };
}

const seedOrders = [
  { id: "RJ-10821", date: "Feb 10, 2026", items: 3, total: 34500, status: "Delivered" },
  { id: "RJ-10712", date: "Jan 28, 2026", items: 1, total: 289990, status: "Processing" },
  { id: "RJ-10640", date: "Jan 02, 2026", items: 2, total: 55980, status: "Cancelled" },
];

const formatBDT = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );

/* -------------------- SMALL UI PIECES -------------------- */
function CurvedUnderline({ color = PALETTE.coral, center = false }) {
  return (
    <div className={cx("mt-2", center ? "flex justify-center" : "")}>
      <svg width="210" height="18" viewBox="0 0 210 18" fill="none" aria-hidden="true">
        <path d="M8 12 C58 2, 152 2, 202 12" stroke="rgba(0,31,63,0.10)" strokeWidth="6" strokeLinecap="round" />
        <path d="M10 12 C60 3, 150 3, 200 12" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <path
          d="M40 12 C75 6, 110 6, 145 12"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function SectionHeader({ title, accent = "coral", center = false, subtitle }) {
  const accentColor = accent === "gold" ? PALETTE.gold : PALETTE.coral;

  return (
    <div className={cx("flex flex-col gap-2", center ? "items-center text-center" : "")}>
      <div>
        <div
          className={cx("text-2xl font-black tracking-tight sm:text-[30px]", center ? "text-center" : "")}
          style={{ color: PALETTE.navy }}
        >
          {title}
        </div>
        <CurvedUnderline color={accentColor} center={center} />
      </div>
      {subtitle ? <div className="text-sm font-semibold text-slate-600">{subtitle}</div> : null}
    </div>
  );
}

function Pill({ icon: Icon, text, tone = "neutral" }) {
  const styles =
    tone === "good"
      ? { bg: "rgba(34,197,94,0.10)", ring: "rgba(34,197,94,0.25)", color: "#16a34a" }
      : tone === "warn"
      ? { bg: "rgba(234,179,8,0.12)", ring: "rgba(234,179,8,0.30)", color: PALETTE.gold }
      : { bg: "rgba(0,0,0,0.04)", ring: "rgba(0,0,0,0.08)", color: PALETTE.navy };

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

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4" style={{ boxShadow: "0 12px 30px rgba(0,31,63,.06)" }}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5 ring-1 ring-black/10">
          <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-extrabold text-slate-600">{label}</div>
          <div className="mt-0.5 text-lg font-black" style={{ color: PALETTE.navy }}>
            {value}
          </div>
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
        className={cx("flex items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1", error ? "ring-rose-200" : "ring-black/10")}
      >
        {Icon ? <Icon className="h-4 w-4 text-black/45 shrink-0" /> : null}
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
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1 transition active:scale-[0.99]",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        isGhost ? "bg-white hover:bg-slate-50 ring-black/10" : "",
        !isGhost && !isDanger ? "text-white" : "",
        isDanger ? "text-xs" : ""
      )}
      style={
        isDanger
          ? { background: PALETTE.dangerBg, color: PALETTE.danger, borderColor: "rgba(239, 68, 68, 0.25)" }
          : isGhost
          ? { color: PALETTE.navy }
          : { background: PALETTE.cta, borderColor: "rgba(0,0,0,0.06)" }
      }
      onMouseEnter={(e) => {
        if (isDanger && !disabled) e.currentTarget.style.background = "rgba(239, 68, 68, 0.16)";
      }}
      onMouseLeave={(e) => {
        if (isDanger) e.currentTarget.style.background = PALETTE.dangerBg;
      }}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

/* -------------------- MAIN COMPONENT -------------------- */
export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef(null);

  // Profile fields supported by API: name, email, role, status
  const [apiUser, setApiUser] = useState(null);

  // UI-only extras (until you add them to schema)
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
  const [tab, setTab] = useState("account"); // account | orders | security | prefs
  const [loadingMe, setLoadingMe] = useState(true);

  const [prefs, setPrefs] = useState({ sms: true, email: true, promos: false });

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace("/login");
      return;
    }

    (async () => {
      setLoadingMe(true);
      const { res, data } = await authFetch("/api/auth/me", { method: "GET" });

      if (!res.ok) {
        clearToken();
        router.replace("/login");
        return;
      }

      const u = data?.user;
      setApiUser(u);

      // Map API user -> UI profile
      setProfile((p) => ({
        ...p,
        fullName: u?.name || "",
        email: u?.email || "",
        role: u?.role || "customer",
        status: u?.status || "active",
      }));

      setDraft((p) => ({
        ...p,
        fullName: u?.name || "",
        email: u?.email || "",
        role: u?.role || "customer",
        status: u?.status || "active",
      }));

      setLoadingMe(false);
    })();
  }, [router]);

  const initials = useMemo(() => {
    const parts = (profile.fullName || "User").trim().split(/\s+/);
    return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
  }, [profile.fullName]);

  const errors = useMemo(() => {
    const e = {};
    if (!draft.fullName.trim()) e.fullName = "Required";
    if (!draft.email.trim()) e.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) e.email = "Invalid";
    // Phone/address are UI-only; keep optional for now
    return e;
  }, [draft]);

  const canSave = Object.keys(errors).length === 0;

  const statusTone = (s) => {
    const v = String(s || "").toLowerCase();
    if (v.includes("deliver")) return "good";
    if (v.includes("process")) return "warn";
    if (v.includes("cancel")) return "neutral";
    return "neutral";
  };

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

      // API supports: name + password only
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

      // Update UI profile
      setProfile((p) => ({
        ...p,
        fullName: updatedUser?.name || draft.fullName,
        email: updatedUser?.email || p.email,
      }));

      setDraft((p) => ({
        ...p,
        fullName: updatedUser?.name || p.fullName,
        email: updatedUser?.email || p.email,
      }));

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
    // UI-only for now
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
      <div className="min-h-screen grid place-items-center" style={{ background: PALETTE.bg }}>
        <div className="rounded-3xl bg-white px-6 py-4 ring-1 ring-black/10 text-sm font-black" style={{ color: PALETTE.navy }}>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Soft top glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.10), rgba(255,126,105,.08), rgba(234,179,8,.05), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-black/10">
              <User className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </span>

            <div>
              <div className="text-2xl sm:text-[30px] font-black tracking-tight" style={{ color: PALETTE.navy }}>
                Profile
              </div>
              <div className="text-sm font-semibold text-slate-600">Manage your account, orders & preferences</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
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
              onClick={() => router.push("/")}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-white shadow active:scale-[0.99]"
              style={{ background: PALETTE.cta }}
            >
              Home <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hero card */}
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <div className="rounded-3xl border border-black/5 bg-white p-5 sm:p-6" style={{ boxShadow: "0 12px 30px rgba(0,31,63,.07)" }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className="h-[76px] w-[76px] overflow-hidden rounded-[1.75rem] ring-1 ring-black/10"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.18), rgba(0,31,63,0.06) 60%), #fff",
                        boxShadow: "0 12px 28px rgba(0,31,63,.08)",
                      }}
                    >
                      {((editMode ? draft.avatarUrl : profile.avatarUrl) || "").trim() ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editMode ? draft.avatarUrl : profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
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
                      className="absolute -bottom-2 -right-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-black/10 shadow-sm hover:bg-slate-50 active:scale-[0.99]"
                      aria-label="Change avatar (UI only)"
                      title="Avatar is UI-only unless you add it to your DB schema"
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
                      <div className="text-lg sm:text-xl font-black" style={{ color: PALETTE.navy }}>
                        {profile.fullName || "User"}
                      </div>
                      <Pill icon={BadgeCheck} text={profile.role === "admin" ? "Admin" : "Customer"} tone="good" />
                      <Pill icon={ShieldCheck} text={profile.status === "active" ? "Active" : "Inactive"} tone="neutral" />
                    </div>

                    <div className="mt-1 flex flex-col gap-1 text-sm font-semibold text-slate-600">
                      <div className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4 text-black/45" />
                        <span className="truncate">{profile.email}</span>
                      </div>

                      {/* UI-only phone */}
                      <div className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4 text-black/45" />
                        <span className="truncate">{profile.phone || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2 sm:justify-end">
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

              {/* Tabs */}
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { key: "account", label: "Account", icon: User },
                  { key: "orders", label: "Orders", icon: Package },
                  { key: "security", label: "Security", icon: ShieldCheck },
                  { key: "prefs", label: "Preferences", icon: Bell },
                ].map(({ key, label, icon: Icon }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1 transition active:scale-[0.99]",
                        active ? "bg-white" : "bg-white/70 hover:bg-white"
                      )}
                      style={{
                        color: active ? PALETTE.cta : PALETTE.navy,
                        borderColor: active ? "rgba(255,107,107,.25)" : "rgba(0,0,0,0.08)",
                        boxShadow: active ? "0 12px 28px rgba(0,31,63,.07)" : "none",
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="mt-6">
                {tab === "account" ? (
                  <div className="grid gap-6">
                    <SectionHeader title="Account Details" subtitle="Update your name (and password if needed)" accent="coral" />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Full Name" icon={User} required error={touched ? errors.fullName : ""}>
                        <input
                          value={editMode ? draft.fullName : profile.fullName}
                          disabled={!editMode}
                          onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                          onBlur={() => setTouched(true)}
                          className={cx(
                            "w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none",
                            !editMode && "opacity-80 cursor-not-allowed"
                          )}
                          style={{ color: PALETTE.navy }}
                          placeholder="Your name"
                        />
                      </Field>

                      <Field label="Email (read-only)" icon={Mail} required error={touched ? errors.email : ""}>
                        <input
                          value={profile.email}
                          disabled
                          className="w-full bg-transparent text-sm font-semibold opacity-80 cursor-not-allowed focus:outline-none"
                          style={{ color: PALETTE.navy }}
                        />
                      </Field>

                      <div className="sm:col-span-2">
                        <Field label="New Password (optional)" icon={ShieldCheck}>
                          <input
                            value={editMode ? newPassword : ""}
                            disabled={!editMode}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={cx(
                              "w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none",
                              !editMode && "opacity-80 cursor-not-allowed"
                            )}
                            style={{ color: PALETTE.navy }}
                            placeholder="Min 8 characters"
                            type="password"
                          />
                        </Field>
                        {editMode && newPassword && newPassword.length < 8 ? (
                          <div className="mt-1 text-[11px] font-bold text-rose-500">Password must be at least 8 characters.</div>
                        ) : null}
                      </div>

                      {/* UI-only extras */}
                      <Field label="Phone (UI only)" icon={Phone}>
                        <input
                          value={editMode ? draft.phone : profile.phone}
                          disabled={!editMode}
                          onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
                          className={cx(
                            "w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none",
                            !editMode && "opacity-80 cursor-not-allowed"
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
                            editMode ? "cursor-pointer" : "opacity-80 cursor-not-allowed"
                          )}
                          style={{ color: PALETTE.navy }}
                        >
                          <option value="Dhaka">Dhaka</option>
                          <option value="Outside Dhaka">Outside Dhaka</option>
                        </select>
                      </Field>

                      <div className="sm:col-span-2">
                        <Field label="Full Address (UI only)" icon={MapPin}>
                          <input
                            value={editMode ? draft.address : profile.address}
                            disabled={!editMode}
                            onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))}
                            className={cx(
                              "w-full bg-transparent text-sm font-semibold placeholder:text-black/35 focus:outline-none",
                              !editMode && "opacity-80 cursor-not-allowed"
                            )}
                            style={{ color: PALETTE.navy }}
                            placeholder="House, Road, Area"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ) : null}

                {tab === "orders" ? (
                  <div className="grid gap-6">
                    <SectionHeader title="Recent Orders" subtitle="Demo data here (connect orders API later)" accent="gold" />

                    <div className="grid gap-3">
                      {seedOrders.map((o) => (
                        <div
                          key={o.id}
                          className="rounded-3xl border border-black/5 bg-white p-4 sm:p-5"
                          style={{ boxShadow: "0 12px 28px rgba(0,31,63,.06)" }}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                                  {o.id}
                                </div>
                                <Pill icon={o.status === "Delivered" ? CheckCircle2 : Package} text={o.status} tone={statusTone(o.status)} />
                              </div>
                              <div className="mt-1 text-xs font-semibold text-slate-600">
                                {o.date} • {o.items} item(s)
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                              <div className="text-xs font-semibold text-slate-500">Total</div>
                              <div className="text-sm font-black" style={{ color: PALETTE.cta }}>
                                {formatBDT(o.total)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <ActionBtn icon={ArrowRight} variant="ghost" onClick={() => router.push(`/orders/${encodeURIComponent(o.id)}`)}>
                              View details
                            </ActionBtn>
                            <ActionBtn icon={Package} variant="ghost" onClick={() => router.push("/product")}>
                              Reorder
                            </ActionBtn>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {tab === "security" ? (
                  <div className="grid gap-6">
                    <SectionHeader title="Security" subtitle="Change your password from Account tab" accent="coral" />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl border border-black/5 bg-white p-5" style={{ boxShadow: "0 12px 28px rgba(0,31,63,.06)" }}>
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5 ring-1 ring-black/10">
                            <ShieldCheck className="h-5 w-5" style={{ color: PALETTE.navy }} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                              Password
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-600">
                              Use “Edit Profile” → set a new password → Save.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setTab("account");
                            openEdit();
                          }}
                          className="mt-4 w-full rounded-2xl bg-white px-4 py-2 text-sm font-black ring-1 ring-black/10 hover:bg-slate-50"
                          style={{ color: PALETTE.navy }}
                        >
                          Go to Account
                        </button>
                      </div>

                      <div className="rounded-3xl border border-black/5 bg-white p-5" style={{ boxShadow: "0 12px 28px rgba(0,31,63,.06)" }}>
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5 ring-1 ring-black/10">
                            <CreditCard className="h-5 w-5" style={{ color: PALETTE.navy }} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                              Payment
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-600">
                              Cash on Delivery is enabled. Online payment can be added later.
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Pill icon={TruckIcon} text="Cash on Delivery" tone="neutral" />
                          <Pill icon={ShieldCheck} text="Secure checkout" tone="good" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {tab === "prefs" ? (
                  <div className="grid gap-6">
                    <SectionHeader title="Preferences" subtitle="UI only (save later in DB)" accent="gold" />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <PrefCard icon={Bell} title="Order Updates" desc="Get SMS updates about delivery progress" checked={prefs.sms} onToggle={() => setPrefs((p) => ({ ...p, sms: !p.sms }))} />
                      <PrefCard icon={Mail} title="Email Receipts" desc="Receive invoice and order summary via email" checked={prefs.email} onToggle={() => setPrefs((p) => ({ ...p, email: !p.email }))} />
                      <PrefCard icon={Heart} title="Promotions" desc="Be the first to know about offers and deals" checked={prefs.promos} onToggle={() => setPrefs((p) => ({ ...p, promos: !p.promos }))} />
                      <div className="rounded-3xl border border-black/5 bg-white p-5" style={{ boxShadow: "0 12px 28px rgba(0,31,63,.06)" }}>
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5 ring-1 ring-black/10">
                            <CheckCircle2 className="h-5 w-5" style={{ color: PALETTE.cta }} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                              Preferences are UI-only right now
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-600">
                              Add fields in User schema + update API to persist these.
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

          {/* Right column */}
          <aside className="lg:col-span-4">
            <div className="grid gap-3 lg:sticky lg:top-24">
              <StatCard icon={Package} label="Total orders" value="12" />
              <StatCard icon={Heart} label="Wishlist items" value="7" />
              <StatCard icon={ShieldCheck} label="Account status" value={profile.status === "active" ? "Active" : "Inactive"} />

              <div className="rounded-3xl border border-black/5 bg-white p-5" style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5 ring-1 ring-black/10">
                    <MapPin className="h-5 w-5" style={{ color: PALETTE.navy }} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-black" style={{ color: PALETTE.navy }}>
                      Default Delivery (UI only)
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-600">
                      {profile.address ? `${profile.address}, ${profile.area}` : "—"}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTab("account");
                        openEdit();
                      }}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black ring-1 ring-black/10 hover:bg-slate-50"
                      style={{ color: PALETTE.navy }}
                    >
                      <Pencil className="h-4 w-4" />
                      Update Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Toast */}
        {toast ? (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black text-white shadow-lg" style={{ background: PALETTE.navy }}>
              <CheckCircle2 className="h-4 w-4" />
              {toast}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

/* -------------------- EXTRA COMPONENTS -------------------- */
function PrefCard({ icon: Icon, title, desc, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        "cursor-pointer w-full rounded-3xl border p-5 text-left transition",
        checked ? "border-black/10 bg-white shadow-sm" : "border-black/5 bg-white/70 hover:bg-white"
      )}
      style={{ boxShadow: checked ? "0 12px 28px rgba(0,31,63,.08)" : "none" }}
    >
      <div className="flex items-start gap-3">
        <span className={cx("inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 shrink-0", checked ? "bg-black/5 ring-black/10" : "bg-black/4 ring-black/5")}>
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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props} className={cx("h-4 w-4", props.className)}>
      <path d="M3 7h11v9H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 10h4l3 3v3h-7v-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM18 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        fill="currentColor"
      />
    </svg>
  );
}
