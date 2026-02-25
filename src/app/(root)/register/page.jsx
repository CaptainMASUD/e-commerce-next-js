"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
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

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (name.trim().length < 2) return false;
    if (!email.includes("@")) return false;
    if (password.length < 8) return false;
    if (password !== confirm) return false;
    if (!agree) return false;
    return true;
  }, [name, email, password, confirm, agree, loading]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!email.includes("@")) return setError("Please enter a valid email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!agree) return setError("You must agree to the Terms & Privacy Policy.");

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(parseApiError(data, "Registration failed. Please try again."));
        return;
      }

      router.push("/login");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative w-full min-h-screen overflow-x-hidden"
      style={{ background: PALETTE.bg, color: PALETTE.navy }}
    >
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
        <div
          className="absolute left-[18%] bottom-[-220px] h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: "rgba(234,179,8,0.07)" }}
        />
      </div>

      {/* Top margin/padding for whole page */}
      <div className="mx-auto max-w-screen-xl px-5  pb-10 md:px-10 md:pt-10 lg:px-12">
        {/* Desktop:
            - Left section STICKS while right form scrolls
            - Mobile stays as-is (header shows, left section hidden) */}
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
          {/* MOBILE HEADER */}
          <section className="md:hidden">
            <div className="mx-auto w-full max-w-md text-center">
            

              <h1 className="mt-3 text-3xl font-black tracking-tight" style={{ color: PALETTE.navy }}>
                <span className="block">Join</span>
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
                Create your account in under a minute.
              </p>
            </div>
          </section>

          {/* LEFT CONTENT (desktop sticky) */}
          <section className="hidden md:block md:sticky md:top-24 md:self-start">
            {/* IMPORTANT:
               - sticky is applied to the section itself
               - ensure NO parent has overflow: hidden/auto/scroll for sticky to work */}
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge icon={ShieldCheck}>Create account • Official store</Badge>
              </div>

              <h1
                className="mt-5 text-4xl font-black tracking-tight lg:text-6xl"
                style={{ color: PALETTE.navy }}
              >
                Join{" "}
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

              <p className="mt-3 text-sm leading-relaxed lg:text-base" style={{ color: PALETTE.muted }}>
                Create an account to save your wishlist, track orders, and checkout faster.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <FeatureCard
                  icon={Truck}
                  title="Faster checkout"
                  desc="Save addresses and preferences for quick buys."
                />
                <FeatureCard
                  icon={BadgeCheck}
                  title="Order history"
                  desc="View past orders and manage returns easily."
                />
              </div>

              <div className="mt-7">
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

          {/* RIGHT CARD */}
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
                      Create account
                    </div>
                    <div className="mt-1 text-xs font-semibold" style={{ color: PALETTE.muted }}>
                      Use your details to sign up.
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
                    Secure
                  </div>
                </div>

                <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
                  <Field label="Full name" icon={User}>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="w-full bg-transparent text-sm outline-none"
                      style={{ color: PALETTE.navy, height: 44 }}
                      placeholder="Your name"
                    />
                  </Field>

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
                        onClick={() => setShowPass((v) => !v)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{ background: "transparent", border: "none" }}
                        aria-label={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? (
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
                      autoComplete="new-password"
                      type={showPass ? "text" : "password"}
                      className="w-full bg-transparent text-sm outline-none"
                      style={{ color: PALETTE.navy, height: 44 }}
                      placeholder="Create a password"
                    />
                  </Field>

                  <Field
                    label="Confirm password"
                    icon={Lock}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{ background: "transparent", border: "none" }}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4" style={{ color: PALETTE.muted }} />
                        ) : (
                          <Eye className="h-4 w-4" style={{ color: PALETTE.muted }} />
                        )}
                      </button>
                    }
                  >
                    <input
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      type={showConfirm ? "text" : "password"}
                      className="w-full bg-transparent text-sm outline-none"
                      style={{ color: PALETTE.navy, height: 44 }}
                      placeholder="Repeat password"
                    />
                  </Field>

                  <label
                    className="inline-flex cursor-pointer items-start gap-2 text-xs font-semibold"
                    style={{ color: PALETTE.muted }}
                  >
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-black/20 bg-black/5"
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" className="cursor-pointer underline underline-offset-4 hover:opacity-90">
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="cursor-pointer underline underline-offset-4 hover:opacity-90">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

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
                    {loading ? "Creating account..." : "Create account"}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </PrimaryButton>

                  <div className="text-center text-xs" style={{ color: PALETTE.muted }}>
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="cursor-pointer font-extrabold transition hover:opacity-90"
                      style={{ color: PALETTE.navy }}
                    >
                      Sign in
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
