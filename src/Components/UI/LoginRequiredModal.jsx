"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const cx = (...c) => c.filter(Boolean).join(" ");

const PALETTE = {
  navy: "#001f3f",
  navy2: "#061a2f",
  coral: "#ff7e69",
  gold: "#eab308",
  card: "#ffffff",
  muted: "rgba(0,31,63,0.62)",
  border: "rgba(0,31,63,0.10)",
  blueOverlay: "rgba(10, 37, 64, 0.28)",
};

const PrimaryButton = React.memo(function PrimaryButton({
  children,
  disabled,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cx(
        "group relative w-full overflow-hidden rounded-2xl px-4 py-3 text-sm font-bold text-white transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:-translate-y-[1px]"
      )}
      style={{
        background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
        boxShadow: "0 18px 40px rgba(0,31,63,.20)",
      }}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.navy}, ${PALETTE.gold})`,
            opacity: 0.18,
          }}
        />
      </span>

      <span className="relative inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
});

function InfoItem({ children, dotColor }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: dotColor }}
      />
      <p className="text-sm leading-6" style={{ color: PALETTE.muted }}>
        {children}
      </p>
    </div>
  );
}

export default function LoginRequiredModal({ open, onClose, onLogin }) {
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

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[9999] isolate">
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
              aria-labelledby="login-required-title"
              className="relative w-full overflow-hidden"
              style={{
                width: "min(100%, 440px)",
                maxHeight: "min(88vh, 720px)",
                borderRadius: 28,
                background: PALETTE.card,
                border: `1px solid ${PALETTE.border}`,
                boxShadow: "0 24px 60px rgba(0,31,63,0.16)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative overflow-y-auto"
                style={{
                  maxHeight: "min(88vh, 720px)",
                }}
              >
                <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-7 md:py-8">
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="grid h-12 w-12 place-items-center rounded-2xl sm:h-14 sm:w-14"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(0,31,63,0.04), rgba(0,31,63,0.08))",
                        border: `1px solid ${PALETTE.border}`,
                        boxShadow: "0 12px 24px rgba(0,31,63,.08)",
                      }}
                    >
                      <Lock
                        className="h-5 w-5 sm:h-6 sm:w-6"
                        style={{ color: PALETTE.navy }}
                      />
                    </div>

                    <h2
                      id="login-required-title"
                      className="mt-4 text-[22px] leading-tight font-extrabold tracking-tight sm:mt-5 sm:text-[28px] md:text-[30px]"
                      style={{ color: PALETTE.navy }}
                    >
                      Login to continue
                    </h2>

                    <p
                      className="mt-2 text-sm leading-6 sm:mt-3"
                      style={{ color: PALETTE.muted }}
                    >
                      Please login to use your account features.
                    </p>
                  </div>

                  <div
                    className="mt-5 rounded-2xl p-4 sm:mt-6"
                    style={{
                      background: "#ffffff",
                      border: `1px solid ${PALETTE.border}`,
                      boxShadow: "0 10px 24px rgba(0,31,63,.05)",
                    }}
                  >
                    <div className="grid gap-3">
                      <InfoItem dotColor={PALETTE.gold}>
                        Login to add items to your cart.
                      </InfoItem>

                      <InfoItem dotColor={PALETTE.coral}>
                        Track and manage your orders after logging in.
                      </InfoItem>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer sm:order-1"
                      style={{
                        background: "#ffffff",
                        border: `1px solid ${PALETTE.border}`,
                        color: PALETTE.navy,
                        boxShadow: "0 10px 24px rgba(0,31,63,.05)",
                      }}
                    >
                      Cancel
                    </button>

                    <div className="w-full sm:order-2">
                      <PrimaryButton type="button" onClick={onLogin}>
                        Go to Login
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </PrimaryButton>
                    </div>
                  </div>
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