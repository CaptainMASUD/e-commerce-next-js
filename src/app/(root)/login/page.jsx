"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Truck,
  BadgeCheck,
} from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");

const PALETTE = {
  navy: "#001f3f",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  bg: "#ffffff",
  card: "#ffffff",
  muted: "rgba(0,31,63,0.62)",
  border: "rgba(2, 10, 25, 0.10)",
};

function saveAuth({ token, user, remember }) {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("auth_user");

    const storage = remember ? localStorage : sessionStorage;
    if (token) storage.setItem("token", token);
    if (user) storage.setItem("auth_user", JSON.stringify(user));
  } catch {}
}

function parseApiError(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  return fallback;
}

const Badge = React.memo(function Badge({ icon: Icon, children }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.muted,
        boxShadow: "0 10px 25px rgba(0,31,63,.06)",
      }}
    >
      <Icon className="h-4 w-4" style={{ color: PALETTE.navy }} />
      {children}
    </div>
  );
});

const FeatureCard = React.memo(function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: "0 14px 34px rgba(0,31,63,.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-full overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.18), rgba(0,31,63,0.06) 60%), #fff",
            border: `1px solid ${PALETTE.border}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-extrabold" style={{ color: PALETTE.navy }}>
            {title}
          </div>
          <div className="mt-1 text-xs leading-relaxed" style={{ color: PALETTE.muted }}>
            {desc}
          </div>
        </div>
      </div>
    </div>
  );
});

const Field = React.memo(function Field({ label, icon: Icon, rightSlot, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold" style={{ color: PALETTE.muted }}>
        {label}
      </span>

      <div
        className={cx(
          "group flex h-12 items-center gap-2 overflow-hidden rounded-2xl px-3 transition",
          "focus-within:ring-2 focus-within:ring-offset-2"
        )}
        style={{
          background: PALETTE.card,
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <Icon className="h-4 w-4 shrink-0" style={{ color: PALETTE.muted }} />
        <div className="min-w-0 flex-1">{children}</div>

        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </label>
  );
});

/**
 * Button rules (as you requested):
 * - default background = current navy gradient
 * - ONLY on hover show the colorful gradient overlay
 * - no extra hover shadow effects
 * - cursor-pointer everywhere needed
 */
const PrimaryButton = React.memo(function PrimaryButton({ children, disabled, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cx(
        "group relative mt-2 w-full overflow-hidden rounded-2xl px-4 py-3 text-sm font-extrabold text-white",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
      style={{
        background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
        boxShadow: "0 18px 40px rgba(0,31,63,.24)",
      }}
    >
      {/* hover overlay only */}
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.navy}, ${PALETTE.gold})`,
            opacity: 0.42,
          }}
        />
      </span>

      <span className="relative inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
});

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.trim().length > 3 && password.trim().length >= 8 && !loading;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    if (!email.includes("@")) return setError("Please enter a valid email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(parseApiError(data, "Login failed. Please try again."));
        return;
      }

      if (!data?.token) {
        setError("Login succeeded but token is missing from response.");
        return;
      }

      saveAuth({ token: data.token, user: data.user || null, remember });
      router.push("/profile");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full" style={{ background: PALETTE.bg, color: PALETTE.navy }}>
      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -left-20 -top-20 h-[340px] w-[340px] rounded-full blur-3xl"
          style={{ background: "rgba(255,126,105,0.10)" }}
        />
        <div
          className="absolute right-[-140px] top-[120px] h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: "rgba(0,31,63,0.06)" }}
        />
      </div>

      <div className="mx-auto max-w-screen-xl px-5 pt-2 pb-6 md:px-10 md:pt-3 md:pb-10 lg:px-12 lg:pt-4">
        <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2 md:gap-10">
          {/* MOBILE HEADER */}
          <section className="md:hidden">
            <div className="mx-auto w-full max-w-md text-center">
              <div className="flex justify-center">
                <Badge icon={ShieldCheck}>Secure login • Official store</Badge>
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: PALETTE.navy }}>
                <span className="block">Welcome back to</span>
                <span
                  className="block"
                  style={{
                    background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.gold})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  AURA &amp; OHM
                </span>
              </h1>

              <p className="mt-1 text-sm font-semibold" style={{ color: PALETTE.muted }}>
                Login to track orders.
              </p>
            </div>
          </section>

          {/* LEFT CONTENT (desktop only) */}
          <section className="hidden md:block">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge icon={ShieldCheck}>Secure login • Official store</Badge>
              </div>

              <h1
                className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: PALETTE.navy }}
              >
                Welcome back to{" "}
                <span
                  style={{
                    background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.gold})`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  AURA &amp; OHM
                </span>
              </h1>

              <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: PALETTE.muted }}>
                Sign in to track orders, manage your wishlist, and get personalized recommendations — in a cleaner,
                faster experience.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <FeatureCard
                  icon={Truck}
                  title="Fast checkout"
                  desc="Save addresses & payment preferences for quicker buys."
                />
                <FeatureCard
                  icon={BadgeCheck}
                  title="Order tracking"
                  desc="Real-time updates from checkout to delivery."
                />
              </div>

              <div className="mt-6">
                <Link
                  href="/"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: PALETTE.card,
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.navy,
                    boxShadow: "0 12px 30px rgba(0,31,63,.06)",
                  }}
                >
                  Back to store <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* CARD */}
          <section>
            <div className="mx-auto w-full max-w-md">
              <div
                className="p-6 sm:p-7"
                style={{
                  borderRadius: 40,
                  background: "rgba(255,255,255,0.96)",
                  border: `1px solid ${PALETTE.border}`,
                  boxShadow: "0 24px 70px rgba(0,31,63,0.14)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[26px] font-black tracking-tight" style={{ color: PALETTE.navy }}>
                      Sign in
                    </div>
                    <div className="mt-1 text-xs font-semibold" style={{ color: PALETTE.muted }}>
                      Use your email and password.
                    </div>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold"
                    style={{
                      background: "rgba(0,31,63,0.04)",
                      border: `1px solid ${PALETTE.border}`,
                      color: PALETTE.muted,
                    }}
                  >
                    <Lock className="h-4 w-4" style={{ color: PALETTE.navy }} />
                    Encrypted
                  </div>
                </div>

                <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
                  <Field label="Email" icon={Mail}>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      className="w-full bg-transparent text-sm outline-none"
                      style={{ color: PALETTE.navy, height: 44 }}
                      placeholder="you@example.com"
                    />
                  </Field>

                  <Field
                    label="Password"
                    icon={Lock}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShow((v) => !v)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{ background: "transparent", border: "none" }}
                        aria-label={show ? "Hide password" : "Show password"}
                      >
                        {show ? (
                          <EyeOff className="h-4 w-4" style={{ color: PALETTE.muted }} />
                        ) : (
                          <Eye className="h-4 w-4" style={{ color: PALETTE.muted }} />
                        )}
                      </button>
                    }
                  >
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      type={show ? "text" : "password"}
                      className="w-full bg-transparent text-sm outline-none"
                      style={{ color: PALETTE.navy, height: 44 }}
                      placeholder="••••••••"
                    />
                  </Field>

                  <div className="flex items-center justify-between gap-3">
                    <label
                      className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold"
                      style={{ color: PALETTE.muted }}
                    >
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-black/20 bg-black/5"
                      />
                      Remember me
                    </label>

                    <Link
                      href="/forgot-password"
                      className="cursor-pointer text-xs font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded px-1"
                      style={{ color: PALETTE.muted }}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {error ? (
                    <div
                      className="rounded-2xl px-4 py-3 text-xs font-semibold"
                      style={{
                        background: "rgba(255,107,107,0.10)",
                        border: "1px solid rgba(255,107,107,0.25)",
                        color: PALETTE.navy,
                      }}
                    >
                      {error}
                    </div>
                  ) : null}

                  <PrimaryButton type="submit" disabled={!canSubmit}>
                    {loading ? "Signing in..." : "Sign in"}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </PrimaryButton>

                  <div className="hidden text-center text-xs md:block" style={{ color: PALETTE.muted }}>
                    Don’t have an account?{" "}
                    <Link
                      href="/register"
                      className="cursor-pointer font-extrabold transition hover:opacity-90"
                      style={{ color: PALETTE.navy, textDecoration: "none" }}
                    >
                      Create one
                    </Link>
                  </div>
                </form>
              </div>

              <div className="mx-auto mt-3 text-center text-[11px]" style={{ color: PALETTE.muted }}>
                By continuing, you agree to our{" "}
                <Link href="/terms" className="cursor-pointer underline underline-offset-4 hover:opacity-90">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="cursor-pointer underline underline-offset-4 hover:opacity-90">
                  Privacy Policy
                </Link>
                .
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
