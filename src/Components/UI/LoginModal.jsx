"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  X,
  ShieldCheck,
  BadgeCheck,
  Truck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");

const PALETTE = {
  navy: "#001f3f",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  card: "#ffffff",
  muted: "rgba(0,31,63,0.62)",
  border: "rgba(2, 10, 25, 0.10)",
  blueOverlay: "rgba(10, 37, 64, 0.28)",
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

const SecondaryButton = React.memo(function SecondaryButton({
  children,
  disabled,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cx(
        "w-full rounded-2xl px-4 py-3 text-sm font-extrabold transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-90"
      )}
      style={{
        background: "#fff",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
        boxShadow: "0 10px 25px rgba(0,31,63,.06)",
      }}
    >
      <span className="inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
});

export default function LoginModal({
  open,
  onClose,
  onSuccess,
  defaultMode = "login",
}) {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState(defaultMode === "register" ? "register" : "login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showRegisterPass, setShowRegisterPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [agree, setAgree] = useState(true);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);

  const loginCanSubmit =
    loginEmail.trim().length > 3 &&
    loginPassword.trim().length >= 8 &&
    !loading;

  const registerCanSubmit = useMemo(() => {
    if (loading) return false;
    if (name.trim().length < 2) return false;
    if (!registerEmail.includes("@")) return false;
    if (registerPassword.length < 8) return false;
    if (registerPassword !== confirm) return false;
    if (!agree) return false;
    return true;
  }, [name, registerEmail, registerPassword, confirm, agree, loading]);

  const shouldShowResend =
    showVerificationNotice || /verify your email|verify email|not verified/i.test(error);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setMode(defaultMode === "register" ? "register" : "login");
      setError("");
      setInfoMessage("");
      setLoading(false);
      setResendLoading(false);
      setShowVerificationNotice(false);
    }
  }, [open, defaultMode]);

  const resetTransientState = () => {
    setError("");
    setInfoMessage("");
    setLoading(false);
    setResendLoading(false);
    setShowLoginPass(false);
    setShowRegisterPass(false);
    setShowConfirmPass(false);
    setShowVerificationNotice(false);
  };

  const switchToLogin = () => {
    resetTransientState();
    setMode("login");
  };

  const switchToRegister = () => {
    resetTransientState();
    setMode("register");
  };

  const handleResendVerification = async () => {
    const emailToUse = verificationEmail || registerEmail || loginEmail;

    if (!emailToUse || !emailToUse.includes("@")) {
      setError("No valid email found for resending verification.");
      return;
    }

    try {
      setResendLoading(true);
      setError("");
      setInfoMessage("");

      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(parseApiError(data, "Could not resend verification email."));
        return;
      }

      setInfoMessage("Verification email sent again. Please check your inbox.");
      setShowVerificationNotice(true);
    } catch {
      setError("Could not resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setInfoMessage("");
    setShowVerificationNotice(false);

    if (!loginEmail.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    if (loginPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = parseApiError(data, "Login failed. Please try again.");
        setError(message);

        if (/verify your email|verify email|not verified/i.test(message)) {
          setVerificationEmail(loginEmail.trim());
          setShowVerificationNotice(true);
        }

        return;
      }

      if (!data?.token) {
        setError("Login succeeded but token is missing from response.");
        return;
      }

      saveAuth({
        token: data.token,
        user: data.user || null,
        remember,
      });

      onSuccess?.(data, { mode: "login" });
      onClose?.();
      router.refresh?.();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setInfoMessage("");
    setShowVerificationNotice(false);

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!registerEmail.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    if (registerPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (registerPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!agree) {
      setError("You must agree to the Terms & Privacy Policy.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(parseApiError(data, "Registration failed. Please try again."));
        return;
      }

      setVerificationEmail(registerEmail.trim());
      setLoginEmail(registerEmail);
      setLoginPassword("");

      setShowVerificationNotice(true);
      setInfoMessage(
        data?.message ||
          "Account created successfully. Please check your email to verify your account."
      );

      onSuccess?.(data, { mode: "register" });

      setMode("login");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[9999] isolate"
          onClick={() => onClose?.()}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0"
            style={{
              background: PALETTE.blueOverlay,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.985 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 24,
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              className="relative w-full overflow-hidden"
              style={{
                width: "min(100%, 1040px)",
                maxHeight: "min(92vh, 900px)",
                borderRadius: 40,
                background: "rgba(255,255,255,0.98)",
                border: `1px solid ${PALETTE.border}`,
                boxShadow: "0 24px 70px rgba(0,31,63,0.14)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-[92vh] overflow-y-auto">
                <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
                  <section className="px-5 pt-5 md:hidden">
                    <div className="mx-auto w-full max-w-md text-center">
                      <h1
                        className="mt-3 text-3xl font-black tracking-tight"
                        style={{ color: PALETTE.navy }}
                      >
                        <span className="block">
                          {mode === "login" ? "Welcome back to" : "Join"}
                        </span>
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

                      <p
                        className="mt-1 text-sm font-semibold"
                        style={{ color: PALETTE.muted }}
                      >
                        {mode === "login"
                          ? "Login to continue shopping."
                          : "Create your account in under a minute."}
                      </p>
                    </div>
                  </section>

                  <section className="hidden md:block md:sticky md:top-0 md:self-start">
                    <div className="max-w-xl px-7 py-7">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge icon={ShieldCheck}>
                            {mode === "login"
                              ? "Secure login • Official store"
                              : "Create account • Official store"}
                          </Badge>
                        </div>

                        <button
                          type="button"
                          onClick={() => onClose?.()}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            background: "#ffffff",
                            border: `1px solid ${PALETTE.border}`,
                            color: PALETTE.navy,
                          }}
                          aria-label="Close modal"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <h1
                        className="mt-5 text-4xl font-black tracking-tight lg:text-6xl"
                        style={{ color: PALETTE.navy }}
                      >
                        {mode === "login" ? "Welcome back to " : "Join "}
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

                      <p
                        className="mt-3 text-sm leading-relaxed lg:text-base"
                        style={{ color: PALETTE.muted }}
                      >
                        {mode === "login"
                          ? "Sign in to track orders, manage your wishlist, and get a faster checkout experience."
                          : "Create an account to save your wishlist, track orders, and checkout faster."}
                      </p>

                      <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        <FeatureCard
                          icon={Truck}
                          title={mode === "login" ? "Fast checkout" : "Faster checkout"}
                          desc={
                            mode === "login"
                              ? "Save addresses & payment preferences for quicker buys."
                              : "Save addresses and preferences for quick buys."
                          }
                        />
                        <FeatureCard
                          icon={BadgeCheck}
                          title={mode === "login" ? "Order tracking" : "Order history"}
                          desc={
                            mode === "login"
                              ? "Real-time updates from checkout to delivery."
                              : "View past orders and manage returns easily."
                          }
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="mx-auto w-full max-w-md px-5 pb-5 md:px-0 md:pr-7 md:py-7">
                      <div
                        className="p-6 sm:p-7"
                        style={{
                          borderRadius: 40,
                          background: "rgba(255,255,255,0.96)",
                          border: `1px solid ${PALETTE.border}`,
                          boxShadow: "0 24px 70px rgba(0,31,63,0.14)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-4 md:hidden">
                          <div />
                          <button
                            type="button"
                            onClick={() => onClose?.()}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            style={{
                              background: "#ffffff",
                              border: `1px solid ${PALETTE.border}`,
                              color: PALETTE.navy,
                            }}
                            aria-label="Close modal"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div
                              id="auth-modal-title"
                              className="text-[26px] font-black tracking-tight"
                              style={{ color: PALETTE.navy }}
                            >
                              {mode === "login" ? "Sign in" : "Create account"}
                            </div>
                            <div
                              className="mt-1 text-xs font-semibold"
                              style={{ color: PALETTE.muted }}
                            >
                              {mode === "login"
                                ? "Use your email and password."
                                : "Use your details to sign up."}
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
                            {mode === "login" ? "Encrypted" : "Secure"}
                          </div>
                        </div>

                        <div
                          className="mt-5 grid grid-cols-2 rounded-2xl p-1"
                          style={{
                            background: "rgba(0,31,63,0.04)",
                            border: `1px solid ${PALETTE.border}`,
                          }}
                        >
                          <button
                            type="button"
                            onClick={switchToLogin}
                            className={cx(
                              "rounded-xl px-4 py-2.5 text-sm font-extrabold transition",
                              mode === "login" ? "cursor-default" : "cursor-pointer"
                            )}
                            style={{
                              background: mode === "login" ? "#fff" : "transparent",
                              color: PALETTE.navy,
                              boxShadow:
                                mode === "login"
                                  ? "0 10px 25px rgba(0,31,63,.06)"
                                  : "none",
                            }}
                          >
                            Sign in
                          </button>

                          <button
                            type="button"
                            onClick={switchToRegister}
                            className={cx(
                              "rounded-xl px-4 py-2.5 text-sm font-extrabold transition",
                              mode === "register" ? "cursor-default" : "cursor-pointer"
                            )}
                            style={{
                              background: mode === "register" ? "#fff" : "transparent",
                              color: PALETTE.navy,
                              boxShadow:
                                mode === "register"
                                  ? "0 10px 25px rgba(0,31,63,.06)"
                                  : "none",
                            }}
                          >
                            Register
                          </button>
                        </div>

                        {mode === "login" ? (
                          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
                            <Field label="Email" icon={Mail}>
                              <input
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
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
                                  onClick={() => setShowLoginPass((v) => !v)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                  style={{ background: "transparent", border: "none" }}
                                  aria-label={
                                    showLoginPass ? "Hide password" : "Show password"
                                  }
                                >
                                  {showLoginPass ? (
                                    <EyeOff
                                      className="h-4 w-4"
                                      style={{ color: PALETTE.muted }}
                                    />
                                  ) : (
                                    <Eye
                                      className="h-4 w-4"
                                      style={{ color: PALETTE.muted }}
                                    />
                                  )}
                                </button>
                              }
                            >
                              <input
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                autoComplete="current-password"
                                type={showLoginPass ? "text" : "password"}
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

                              <button
                                type="button"
                                onClick={() => router.push("/forgot-password")}
                                className="cursor-pointer text-xs font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded px-1"
                                style={{ color: PALETTE.muted }}
                              >
                                Forgot password?
                              </button>
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

                            {infoMessage ? (
                              <div
                                className="rounded-2xl px-4 py-3 text-xs font-semibold"
                                style={{
                                  background: "rgba(34,197,94,0.10)",
                                  border: "1px solid rgba(34,197,94,0.20)",
                                  color: PALETTE.navy,
                                }}
                              >
                                {infoMessage}
                              </div>
                            ) : null}

                            {showVerificationNotice ? (
                              <div
                                className="rounded-2xl p-4"
                                style={{
                                  background: "rgba(59,130,246,0.08)",
                                  border: "1px solid rgba(59,130,246,0.16)",
                                  color: PALETTE.navy,
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-sm font-extrabold">
                                      Check your email
                                    </div>
                                    <div
                                      className="mt-1 text-xs leading-relaxed"
                                      style={{ color: PALETTE.muted }}
                                    >
                                      We sent a verification link to{" "}
                                      <span className="font-bold" style={{ color: PALETTE.navy }}>
                                        {verificationEmail || loginEmail}
                                      </span>
                                      . Please open your inbox and verify your account before signing in.
                                    </div>

                                    <div className="mt-3">
                                      <SecondaryButton
                                        type="button"
                                        onClick={handleResendVerification}
                                        disabled={resendLoading}
                                      >
                                        <RefreshCw
                                          className={cx(
                                            "h-4 w-4",
                                            resendLoading && "animate-spin"
                                          )}
                                        />
                                        {resendLoading
                                          ? "Sending..."
                                          : "Resend verification email"}
                                      </SecondaryButton>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            <PrimaryButton type="submit" disabled={!loginCanSubmit}>
                              {loading ? "Signing in..." : "Sign in"}
                              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </PrimaryButton>

                            <div
                              className="text-center text-xs"
                              style={{ color: PALETTE.muted }}
                            >
                              Don’t have an account?{" "}
                              <button
                                type="button"
                                onClick={switchToRegister}
                                className="cursor-pointer font-extrabold transition hover:opacity-90"
                                style={{ color: PALETTE.navy }}
                              >
                                Create one
                              </button>
                            </div>
                          </form>
                        ) : (
                          <form className="mt-6 grid gap-4" onSubmit={handleRegister}>
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
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
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
                                  onClick={() => setShowRegisterPass((v) => !v)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                  style={{ background: "transparent", border: "none" }}
                                  aria-label={
                                    showRegisterPass ? "Hide password" : "Show password"
                                  }
                                >
                                  {showRegisterPass ? (
                                    <EyeOff
                                      className="h-4 w-4"
                                      style={{ color: PALETTE.muted }}
                                    />
                                  ) : (
                                    <Eye
                                      className="h-4 w-4"
                                      style={{ color: PALETTE.muted }}
                                    />
                                  )}
                                </button>
                              }
                            >
                              <input
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                                autoComplete="new-password"
                                type={showRegisterPass ? "text" : "password"}
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
                                  onClick={() => setShowConfirmPass((v) => !v)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                  style={{ background: "transparent", border: "none" }}
                                  aria-label={
                                    showConfirmPass ? "Hide password" : "Show password"
                                  }
                                >
                                  {showConfirmPass ? (
                                    <EyeOff
                                      className="h-4 w-4"
                                      style={{ color: PALETTE.muted }}
                                    />
                                  ) : (
                                    <Eye
                                      className="h-4 w-4"
                                      style={{ color: PALETTE.muted }}
                                    />
                                  )}
                                </button>
                              }
                            >
                              <input
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                autoComplete="new-password"
                                type={showConfirmPass ? "text" : "password"}
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
                                <button
                                  type="button"
                                  onClick={() => router.push("/terms")}
                                  className="cursor-pointer underline underline-offset-4 hover:opacity-90"
                                >
                                  Terms
                                </button>{" "}
                                and{" "}
                                <button
                                  type="button"
                                  onClick={() => router.push("/privacy")}
                                  className="cursor-pointer underline underline-offset-4 hover:opacity-90"
                                >
                                  Privacy Policy
                                </button>
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

                            {infoMessage ? (
                              <div
                                className="rounded-2xl px-4 py-3 text-xs font-semibold"
                                style={{
                                  background: "rgba(34,197,94,0.10)",
                                  border: "1px solid rgba(34,197,94,0.20)",
                                  color: PALETTE.navy,
                                }}
                              >
                                {infoMessage}
                              </div>
                            ) : null}

                            <PrimaryButton type="submit" disabled={!registerCanSubmit}>
                              {loading ? "Creating account..." : "Create account"}
                              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </PrimaryButton>

                            <div
                              className="text-center text-xs"
                              style={{ color: PALETTE.muted }}
                            >
                              Already have an account?{" "}
                              <button
                                type="button"
                                onClick={switchToLogin}
                                className="cursor-pointer font-extrabold transition hover:opacity-90"
                                style={{ color: PALETTE.navy }}
                              >
                                Sign in
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}