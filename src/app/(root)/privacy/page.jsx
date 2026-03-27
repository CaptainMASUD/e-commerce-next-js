"use client";

import React from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  CreditCard,
  Truck,
  Cookie,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  FileText,
  RefreshCw,
} from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
  danger: "#ef4444",
  border: "rgba(2, 10, 25, 0.08)",
  muted: "rgba(0,31,63,0.62)",
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

function SectionCard({ icon: Icon, title, children }) {
  return (
    <section
      className="rounded-3xl border border-black/5 bg-white p-5 sm:p-6"
      style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,107,107,0.12), rgba(255,126,105,0.12), rgba(234,179,8,0.12))",
            border: `1px solid ${PALETTE.border}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
        </div>

        <div className="min-w-0 flex-1">
          <h2
            className="text-lg font-extrabold sm:text-xl"
            style={{ color: PALETTE.navy }}
          >
            {title}
          </h2>
          <div className="mt-3 text-sm leading-7 text-slate-600 sm:text-[15px]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function PolicyPoint({ children }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2
        className="mt-1 h-4 w-4 shrink-0"
        style={{ color: PALETTE.cta }}
      />
      <p className="text-sm leading-7 text-slate-600 sm:text-[15px]">
        {children}
      </p>
    </div>
  );
}

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="h-4 w-4" />
            Privacy & Data Protection
          </div>

          <h1
            className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl"
            style={{ color: PALETTE.navy }}
          >
            Privacy <GradientWord>Policy</GradientWord>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
            Your privacy matters to us. This Privacy Policy explains how our
            ecommerce platform collects, uses, stores, and protects your
            personal information when you browse, shop, and interact with our
            website.
          </p>

          <div
            className="mt-6 rounded-[28px] border border-black/5 bg-white p-4 sm:p-5"
            style={{ boxShadow: "0 12px 30px rgba(0,31,63,.08)" }}
          >
            <div className="grid gap-3 text-left sm:grid-cols-3">
              <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <FileText className="h-4 w-4" />
                  Effective Date
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
                  <ShieldCheck className="h-4 w-4" />
                  Policy Scope
                </div>
                <div
                  className="mt-2 text-sm font-bold"
                  style={{ color: PALETTE.navy }}
                >
                  Website, Orders & Support
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <SectionCard icon={Database} title="Information We Collect">
              <div className="space-y-3">
                <PolicyPoint>
                  We may collect personal details such as your full name, phone
                  number, email address, shipping address, and billing address
                  when you place an order or create an account.
                </PolicyPoint>
                <PolicyPoint>
                  We collect transaction-related information including purchased
                  items, payment method, order history, refund requests, and
                  delivery details.
                </PolicyPoint>
                <PolicyPoint>
                  We may also collect device and usage information such as IP
                  address, browser type, pages visited, and interaction data to
                  improve website performance and security.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={Eye} title="How We Use Your Information">
              <div className="space-y-3">
                <PolicyPoint>
                  To process your orders, confirm purchases, arrange delivery,
                  and provide order tracking updates.
                </PolicyPoint>
                <PolicyPoint>
                  To communicate with you regarding your orders, returns,
                  customer support requests, promotions, and important service
                  announcements.
                </PolicyPoint>
                <PolicyPoint>
                  To personalize your shopping experience, improve our products
                  and services, and analyze website performance.
                </PolicyPoint>
                <PolicyPoint>
                  To detect fraud, prevent misuse, enforce policies, and comply
                  with legal obligations.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={CreditCard} title="Payments & Transaction Security">
              <div className="space-y-3">
                <PolicyPoint>
                  Payments are processed through secure payment gateways and
                  trusted financial partners.
                </PolicyPoint>
                <PolicyPoint>
                  We do not store your full card details on our servers unless
                  explicitly stated by the payment provider under compliant
                  security standards.
                </PolicyPoint>
                <PolicyPoint>
                  We apply appropriate safeguards to protect payment-related
                  data and help prevent unauthorized access or fraud.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={Truck} title="Shipping, Delivery & Order Fulfillment">
              <div className="space-y-3">
                <PolicyPoint>
                  We use your delivery information to process shipments,
                  coordinate courier services, and ensure successful order
                  fulfillment.
                </PolicyPoint>
                <PolicyPoint>
                  Shipping partners may receive limited necessary details such
                  as your name, contact number, and delivery address.
                </PolicyPoint>
                <PolicyPoint>
                  Delivery-related updates may be shared through SMS, phone
                  calls, email, or status notifications on the website.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={Cookie} title="Cookies & Tracking Technologies">
              <div className="space-y-3">
                <PolicyPoint>
                  We use cookies and similar technologies to remember your
                  preferences, keep items in your cart, improve site navigation,
                  and measure performance.
                </PolicyPoint>
                <PolicyPoint>
                  Some cookies help us understand customer behavior so we can
                  improve design, product discovery, and checkout experience.
                </PolicyPoint>
                <PolicyPoint>
                  You can manage or disable cookies through your browser
                  settings, though some features of the site may not function
                  properly afterward.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={Lock} title="Data Protection & Retention">
              <div className="space-y-3">
                <PolicyPoint>
                  We maintain reasonable technical, administrative, and physical
                  safeguards to protect your information against unauthorized
                  access, misuse, alteration, or disclosure.
                </PolicyPoint>
                <PolicyPoint>
                  Personal data is retained only as long as necessary for order
                  processing, customer support, legal compliance, dispute
                  resolution, and business operations.
                </PolicyPoint>
                <PolicyPoint>
                  While we work hard to protect your information, no online
                  system can guarantee absolute security.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={ShieldCheck} title="Your Rights & Choices">
              <div className="space-y-3">
                <PolicyPoint>
                  You may request access to your personal information and ask us
                  to correct inaccurate details where applicable.
                </PolicyPoint>
                <PolicyPoint>
                  You may opt out of promotional communications by using the
                  unsubscribe link or contacting our support team.
                </PolicyPoint>
                <PolicyPoint>
                  Subject to legal and operational requirements, you may request
                  deletion or restriction of certain personal information.
                </PolicyPoint>
              </div>
            </SectionCard>
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
                Quick Summary
              </h3>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                  <div className="text-xs font-medium text-slate-500">
                    What we collect
                  </div>
                  <div
                    className="mt-1 text-sm font-bold"
                    style={{ color: PALETTE.navy }}
                  >
                    Personal, order, payment, and usage data
                  </div>
                </div>

                <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                  <div className="text-xs font-medium text-slate-500">
                    Why we use it
                  </div>
                  <div
                    className="mt-1 text-sm font-bold"
                    style={{ color: PALETTE.navy }}
                  >
                    Orders, delivery, support, security, and improvements
                  </div>
                </div>

                <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                  <div className="text-xs font-medium text-slate-500">
                    Your control
                  </div>
                  <div
                    className="mt-1 text-sm font-bold"
                    style={{ color: PALETTE.navy }}
                  >
                    Access, update, unsubscribe, and request deletion
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4
                  className="text-lg font-bold"
                  style={{ color: PALETTE.navy }}
                >
                  Contact Us
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
                      <div className="text-slate-600">
                        privacy@yourstore.com
                      </div>
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
                      <div className="text-slate-600">
                        Dhaka, Bangladesh
                      </div>
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
                By using this website, you agree to the terms described in this
                Privacy Policy.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}