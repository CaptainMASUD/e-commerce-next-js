"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MailCheck,
  CircleCheckBig,
  TriangleAlert,
  LoaderCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  card: "#ffffff",
  muted: "rgba(0,31,63,0.62)",
  border: "rgba(2, 10, 25, 0.10)",
  bg: "linear-gradient(180deg, #f8fbff 0%, #eef5fb 100%)",
};

const cx = (...c) => c.filter(Boolean).join(" ");

function ActionButton({
  as = "button",
  href,
  children,
  variant = "primary",
  disabled,
  ...props
}) {
  const className = cx(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition",
    disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-95"
  );

  const style =
    variant === "primary"
      ? {
          background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
          color: "#fff",
          boxShadow: "0 18px 40px rgba(0,31,63,.18)",
        }
      : {
          background: "#fff",
          color: PALETTE.navy,
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "0 10px 25px rgba(0,31,63,.06)",
        };

  if (as === "link") {
    return (
      <Link href={href} className={className} style={style} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={className} style={style} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export default function VerifyEmailClient({ token }) {
  const router = useRouter();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    try {
      const savedEmail =
        sessionStorage.getItem("pending_verification_email") ||
        localStorage.getItem("pending_verification_email") ||
        "";
      if (savedEmail) setEmail(savedEmail);
    } catch {}
  }, []);

  useEffect(() => {
    let ignore = false;

    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        setStatus("loading");
        setMessage("Verifying your email...");

        const res = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
          { method: "GET", cache: "no-store" }
        );

        const data = await res.json().catch(() => null);

        if (ignore) return;

        if (!res.ok) {
          setStatus("error");
          setMessage(
            data?.error || data?.message || "Invalid or expired verification link."
          );
          return;
        }

        setStatus("success");
        setMessage(data?.message || "Email verified successfully.");

        try {
          sessionStorage.removeItem("pending_verification_email");
          localStorage.removeItem("pending_verification_email");
        } catch {}
      } catch {
        if (ignore) return;
        setStatus("error");
        setMessage("Something went wrong while verifying your email.");
      }
    }

    verifyEmail();
    return () => {
      ignore = true;
    };
  }, [token]);

  const statusMeta = useMemo(() => {
    if (status === "success") {
      return {
        icon: CircleCheckBig,
        title: "Email verified",
        bg: "rgba(34,197,94,0.10)",
        border: "1px solid rgba(34,197,94,0.20)",
        iconBg: "rgba(34,197,94,0.14)",
      };
    }

    if (status === "error") {
      return {
        icon: TriangleAlert,
        title: "Verification failed",
        bg: "rgba(255,107,107,0.10)",
        border: "1px solid rgba(255,107,107,0.22)",
        iconBg: "rgba(255,107,107,0.14)",
      };
    }

    return {
      icon: LoaderCircle,
      title: "Verifying email",
      bg: "rgba(59,130,246,0.08)",
      border: "1px solid rgba(59,130,246,0.16)",
      iconBg: "rgba(59,130,246,0.12)",
    };
  }, [status]);

  const Icon = statusMeta.icon;

  async function handleResend() {
    if (!email) {
      setResendError("No email found for resend. Please go back and register again.");
      setResendMessage("");
      return;
    }

    try {
      setResendLoading(true);
      setResendError("");
      setResendMessage("");

      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setResendError(
          data?.error || data?.message || "Failed to resend verification email."
        );
        return;
      }

      setResendMessage(
        data?.message || "Verification email sent again. Please check your inbox."
      );
    } catch {
      setResendError("Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6" style={{ background: PALETTE.bg }}>
      <div className="mx-auto flex min-h-[85vh] max-w-6xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          className="grid w-full max-w-5xl overflow-hidden rounded-[36px] border md:grid-cols-2"
          style={{
            background: "rgba(255,255,255,0.97)",
            borderColor: PALETTE.border,
            boxShadow: "0 28px 80px rgba(0,31,63,.12)",
          }}
        >
          <section className="hidden md:block">{/* left side unchanged */}</section>

          <section className="flex items-center">
            <div className="w-full px-5 py-7 sm:px-8 sm:py-10">
              <div className="mx-auto w-full max-w-md">
                <div
                  className="rounded-[30px] border p-6 sm:p-7"
                  style={{
                    background: "#fff",
                    borderColor: PALETTE.border,
                    boxShadow: "0 20px 55px rgba(0,31,63,.08)",
                  }}
                >
                  <div
                    className="mx-auto grid h-16 w-16 place-items-center rounded-full"
                    style={{ background: statusMeta.iconBg, color: PALETTE.navy }}
                  >
                    <Icon
                      className={cx("h-8 w-8", status === "loading" && "animate-spin")}
                    />
                  </div>

                  <h2
                    className="mt-5 text-center text-3xl font-black tracking-tight"
                    style={{ color: PALETTE.navy }}
                  >
                    {statusMeta.title}
                  </h2>

                  <div
                    className="mt-6 rounded-3xl p-4"
                    style={{ background: statusMeta.bg, border: statusMeta.border }}
                  >
                    <div className="text-sm font-bold leading-6" style={{ color: PALETTE.navy }}>
                      {message}
                    </div>
                  </div>

                  {status === "error" && (
                    <div className="mt-5 grid gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none"
                        style={{ borderColor: PALETTE.border, color: PALETTE.navy }}
                      />

                      {resendError && <div>{resendError}</div>}
                      {resendMessage && <div>{resendMessage}</div>}

                      <ActionButton
                        onClick={handleResend}
                        disabled={resendLoading}
                        variant="secondary"
                      >
                        <RefreshCw className={cx("h-4 w-4", resendLoading && "animate-spin")} />
                        {resendLoading ? "Sending verification..." : "Resend verification email"}
                      </ActionButton>
                    </div>
                  )}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {status === "success" ? (
                      <>
                        <ActionButton as="link" href="/login">
                          Go to login
                          <ArrowRight className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton as="link" href="/" variant="secondary">
                          Back to home
                        </ActionButton>
                      </>
                    ) : (
                      <>
                        <ActionButton
                          variant="primary"
                          onClick={() => window.location.reload()}
                          disabled={status === "loading"}
                        >
                          Try again
                        </ActionButton>
                        <ActionButton as="link" href="/" variant="secondary">
                          Back to home
                        </ActionButton>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}