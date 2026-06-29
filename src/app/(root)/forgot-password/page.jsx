"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  bg: "#ffffff",
  muted: "rgba(0,31,63,0.62)",
  border: "rgba(2, 10, 25, 0.10)",
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Something went wrong. Please try again.");
        return;
      }

      setMessage(
        data?.message ||
          "If this email exists, password reset instructions have been created."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen w-full px-5 py-10"
      style={{
        background: PALETTE.bg,
        color: PALETTE.navy,
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center justify-center">
        <div
          className="w-full rounded-[34px] p-6 sm:p-8"
          style={{
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 24px 70px rgba(0,31,63,0.12)",
            background: "rgba(255,255,255,0.96)",
          }}
        >
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold"
            style={{ color: PALETTE.muted }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <h1 className="text-3xl font-black tracking-tight">
            Forgot password?
          </h1>

          <p
            className="mt-2 text-sm leading-6"
            style={{ color: PALETTE.muted }}
          >
            Enter your email address and we will create a password reset request
            for your account.
          </p>

          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span
                className="text-xs font-semibold"
                style={{ color: PALETTE.muted }}
              >
                Email
              </span>

              <div
                className="flex h-12 items-center gap-2 rounded-2xl px-3"
                style={{
                  border: `1px solid ${PALETTE.border}`,
                  background: "#fff",
                }}
              >
                <Mail
                  className="h-4 w-4 shrink-0"
                  style={{ color: PALETTE.muted }}
                />

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 w-full bg-transparent text-sm outline-none"
                  style={{ color: PALETTE.navy }}
                />
              </div>
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

            {message ? (
              <div
                className="rounded-2xl px-4 py-3 text-xs font-semibold"
                style={{
                  background: "rgba(34,197,94,0.10)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  color: PALETTE.navy,
                }}
              >
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
                boxShadow: "0 18px 40px rgba(0,31,63,.24)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset request"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}