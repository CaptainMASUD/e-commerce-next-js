"use client";

import React from "react";
import {
  LifeBuoy,
  Search,
  ShoppingCart,
  Truck,
  RotateCcw,
  CreditCard,
  UserCircle2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  FileText,
  RefreshCw,
} from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
  border: "rgba(2, 10, 25, 0.08)",
};

function GradientWord({ children }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: `linear-gradient(135deg, ${PALETTE.cta}, ${PALETTE.coral}, ${PALETTE.gold})`,
      }}
    >
      {children}
    </span>
  );
}

function HelpCard({ icon: Icon, title, description, points }) {
  return (
    <div
      className="rounded-3xl border border-black/5 bg-white p-5 sm:p-6"
      style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,107,107,0.12), rgba(255,126,105,0.12), rgba(234,179,8,0.12))",
          border: `1px solid ${PALETTE.border}`,
        }}
      >
        <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
      </div>

      <h2
        className="mt-4 text-lg font-extrabold sm:text-xl"
        style={{ color: PALETTE.navy }}
      >
        {title}
      </h2>

      <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-[15px]">
        {description}
      </p>

      <div className="mt-4 space-y-2">
        {points.map((point, index) => (
          <div key={index} className="flex items-start gap-2">
            <CheckCircle2
              className="mt-1 h-4 w-4 shrink-0"
              style={{ color: PALETTE.cta }}
            />
            <p className="text-sm leading-7 text-slate-600 sm:text-[15px]">
              {point}
            </p>
          </div>
        ))}
      </div>

      <button
        className="mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition hover:translate-y-[-1px]"
        style={{
          background: PALETTE.navy,
          color: "#fff",
          boxShadow: "0 10px 24px rgba(0,31,63,.16)",
        }}
      >
        Explore Topic
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div
        className="mt-1 text-sm font-bold"
        style={{ color: PALETTE.navy }}
      >
        {value}
      </div>
    </div>
  );
}

export default function HelpCenterPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: PALETTE.bg,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.10), rgba(255,126,105,.10), rgba(234,179,8,.08), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
        <section className="mx-auto max-w-4xl text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
            style={{
              color: PALETTE.navy,
              background: "rgba(255,255,255,0.86)",
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 10px 24px rgba(0,31,63,.06)",
            }}
          >
            <LifeBuoy className="h-4 w-4" />
            Support Resources & Guidance
          </div>

          <h1
            className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl"
            style={{ color: PALETTE.navy }}
          >
            Help <GradientWord>Center</GradientWord>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
            Find the right support resources for shopping, payments, shipping,
            returns, account help, and customer care in one place.
          </p>

          <div
            className="mt-6 rounded-[28px] border border-black/5 bg-white p-4 sm:p-5"
            style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}
          >
            <div className="grid gap-3 text-left sm:grid-cols-3">
              <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <FileText className="h-4 w-4" />
                  Page Type
                </div>
                <div
                  className="mt-2 text-sm font-bold"
                  style={{ color: PALETTE.navy }}
                >
                  Help Center
                </div>
              </div>

              <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <RefreshCw className="h-4 w-4" />
                  Last Updated
                </div>
                <div
                  className="mt-2 text-sm font-bold"
                  style={{ color: PALETTE.navy }}
                >
                  March 27, 2026
                </div>
              </div>

              <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Search className="h-4 w-4" />
                  Purpose
                </div>
                <div
                  className="mt-2 text-sm font-bold"
                  style={{ color: PALETTE.navy }}
                >
                  Self-service customer support
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <HelpCard
                icon={ShoppingCart}
                title="Orders & Checkout"
                description="Everything related to placing orders, checkout steps, order confirmation, and purchase flow."
                points={[
                  "How to place an order",
                  "Applying promo codes",
                  "Order confirmation process",
                  "Guest checkout and account checkout",
                ]}
              />

              <HelpCard
                icon={CreditCard}
                title="Payments & Billing"
                description="Learn about payment methods, billing issues, transaction failures, and secure payment handling."
                points={[
                  "Supported payment methods",
                  "Payment verification",
                  "Billing issue support",
                  "Failed transaction guidance",
                ]}
              />

              <HelpCard
                icon={Truck}
                title="Shipping & Delivery"
                description="Get assistance with shipping timelines, courier tracking, delivery attempts, and service coverage."
                points={[
                  "Estimated delivery times",
                  "Tracking order shipments",
                  "Delivery area coverage",
                  "Missed or delayed deliveries",
                ]}
              />

              <HelpCard
                icon={RotateCcw}
                title="Returns & Refunds"
                description="Understand return eligibility, replacement options, refund process, and return request steps."
                points={[
                  "Return eligibility rules",
                  "How to request a return",
                  "Refund processing details",
                  "Exchange and replacement help",
                ]}
              />

              <HelpCard
                icon={UserCircle2}
                title="Account & Profile"
                description="Manage account settings, saved addresses, login details, passwords, and order history access."
                points={[
                  "Create or manage your account",
                  "Update address information",
                  "Reset password support",
                  "View previous orders",
                ]}
              />

              <HelpCard
                icon={ShieldCheck}
                title="Privacy & Security"
                description="Find support regarding account safety, payment protection, privacy rights, and customer data handling."
                points={[
                  "Account security practices",
                  "Payment protection support",
                  "Privacy-related information",
                  "Reporting suspicious activity",
                ]}
              />
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div
              className="rounded-3xl border border-black/5 bg-white p-5 lg:sticky lg:top-24"
              style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}
            >
              <h3
                className="text-lg font-bold"
                style={{ color: PALETTE.navy }}
              >
                Quick Support
              </h3>

              <div className="mt-4 space-y-3">
                <SummaryItem
                  label="Best for"
                  value="Finding the right support topic fast"
                />
                <SummaryItem
                  label="Support style"
                  value="Self-service plus direct contact options"
                />
                <SummaryItem
                  label="Available help"
                  value="Orders, payments, shipping, returns, account"
                />
              </div>

              <div className="mt-6">
                <h4
                  className="text-lg font-bold"
                  style={{ color: PALETTE.navy }}
                >
                  Contact Support
                </h4>

                <div
                  className="mt-3 rounded-2xl p-4 text-sm"
                  style={{
                    background: "#fff",
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Mail
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: PALETTE.navy }}
                      />
                      <div className="text-slate-600">help@yourstore.com</div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: PALETTE.navy }}
                      />
                      <div className="text-slate-600">+880 1XXX-XXXXXX</div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: PALETTE.navy }}
                      />
                      <div className="text-slate-600">Dhaka, Bangladesh</div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-4 rounded-2xl px-4 py-3 text-xs font-medium"
                style={{
                  background: "rgba(255,107,107,0.10)",
                  border: "1px solid rgba(255,107,107,0.20)",
                  color: PALETTE.navy,
                }}
              >
                Need personal assistance? Contact our support team for faster
                help with your issue.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}