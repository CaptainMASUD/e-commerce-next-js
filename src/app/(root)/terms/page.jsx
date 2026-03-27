"use client";

import React from "react";
import {
  FileCheck,
  ScrollText,
  Shield,
  ShoppingCart,
  CreditCard,
  Truck,
  Undo2,
  Ban,
  Scale,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
  gold: "#eab308",
  bg: "#fafafa",
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

function SectionCard({ id, icon: Icon, title, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-3xl border border-black/5 bg-white p-5 sm:p-6"
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
          <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 sm:text-[15px]">
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

function MiniStat({ title, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div
        className="mt-2 text-sm font-bold"
        style={{ color: PALETTE.navy }}
      >
        {value}
      </div>
    </div>
  );
}

export default function TermsAndConditionsPage() {
  const sections = [
    { id: "acceptance", label: "Acceptance of Terms" },
    { id: "orders", label: "Orders & Availability" },
    { id: "payments", label: "Payments & Pricing" },
    { id: "shipping", label: "Shipping & Delivery" },
    { id: "returns", label: "Returns & Refunds" },
    { id: "conduct", label: "User Responsibilities" },
    { id: "liability", label: "Limitations of Liability" },
    { id: "law", label: "Governing Law" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: PALETTE.bg,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-96"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,31,63,.12), rgba(255,126,105,.10), rgba(234,179,8,.08), transparent)",
        }}
      />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
        <section className="mx-auto max-w-5xl">
          <div
            className="overflow-hidden rounded-[32px] border border-black/5 bg-white"
            style={{ boxShadow: "0 18px 40px rgba(0,31,63,.10)" }}
          >
            <div className="grid gap-0 lg:grid-cols-12">
              <div className="lg:col-span-8 p-6 sm:p-8 lg:p-10">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{
                    color: PALETTE.navy,
                    background:
                      "linear-gradient(135deg, rgba(255,107,107,0.10), rgba(255,126,105,0.10), rgba(234,179,8,0.10))",
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <FileCheck className="h-4 w-4" />
                  Legal Information
                </div>

                <h1
                  className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl"
                  style={{ color: PALETTE.navy }}
                >
                  Terms & <GradientWord>Conditions</GradientWord>
                </h1>

                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  Please read these Terms & Conditions carefully before using
                  our ecommerce website. These terms govern your access to our
                  services, product purchases, payments, shipping, returns, and
                  overall use of the platform.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                    style={{
                      background: "rgba(0,31,63,0.06)",
                      color: PALETTE.navy,
                      border: `1px solid ${PALETTE.border}`,
                    }}
                  >
                    <ScrollText className="h-4 w-4" />
                    Effective Date: March 27, 2026
                  </div>

                  <div
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                    style={{
                      background: "rgba(255,107,107,0.10)",
                      color: PALETTE.navy,
                      border: "1px solid rgba(255,107,107,0.18)",
                    }}
                  >
                    <Shield className="h-4 w-4" />
                    Applies to all website users and customers
                  </div>
                </div>
              </div>

              <div
                className="relative lg:col-span-4 p-6 sm:p-8"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,31,63,0.98), rgba(0,31,63,0.90))",
                }}
              >
                <div className="absolute inset-0 opacity-20">
                  <div
                    className="h-full w-full"
                    style={{
                      background:
                        "radial-gradient(circle at top right, rgba(255,107,107,0.45), transparent 35%), radial-gradient(circle at bottom left, rgba(234,179,8,0.35), transparent 30%)",
                    }}
                  />
                </div>

                <div className="relative">
                  <div className="text-sm font-semibold text-white/70">
                    Quick Highlights
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
                        Orders
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">
                        Subject to availability and confirmation
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
                        Payments
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">
                        Prices and payment approval required
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
                        Returns
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">
                        Eligible items may be returned per policy
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                    Read policy details below
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat
              title="Policy Type"
              value="Terms of Use & Purchase"
              icon={FileCheck}
            />
            <MiniStat
              title="Coverage"
              value="Website, Orders & Support"
              icon={Shield}
            />
            <MiniStat
              title="Region"
              value="Ecommerce Operations"
              icon={MapPin}
            />
            <MiniStat
              title="Customer Scope"
              value="All Visitors & Buyers"
              icon={ShoppingCart}
            />
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <SectionCard
              id="acceptance"
              icon={ScrollText}
              title="Acceptance of Terms"
            >
              <PolicyPoint>
                By accessing or using this website, you agree to be bound by
                these Terms & Conditions and all related policies referenced on
                this platform.
              </PolicyPoint>
              <PolicyPoint>
                If you do not agree with any part of these terms, you should not
                use the website or place any orders through it.
              </PolicyPoint>
              <PolicyPoint>
                We may update these terms from time to time, and continued use
                of the website after changes means you accept the revised terms.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="orders"
              icon={ShoppingCart}
              title="Orders & Product Availability"
            >
              <PolicyPoint>
                All orders placed through the website are subject to product
                availability, verification, and acceptance by our store.
              </PolicyPoint>
              <PolicyPoint>
                We reserve the right to refuse or cancel orders for reasons
                including stock issues, pricing errors, suspicious activity, or
                incomplete customer information.
              </PolicyPoint>
              <PolicyPoint>
                Product images, descriptions, and availability are presented as
                accurately as possible, but slight variations may occur.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="payments"
              icon={CreditCard}
              title="Payments, Pricing & Billing"
            >
              <PolicyPoint>
                All listed prices are subject to change without prior notice.
                Promotional pricing, coupons, and limited offers may have
                separate terms.
              </PolicyPoint>
              <PolicyPoint>
                Customers must provide valid and complete payment information at
                checkout. Orders may be delayed or cancelled if payment is not
                approved.
              </PolicyPoint>
              <PolicyPoint>
                In the event of a pricing or billing error, we reserve the right
                to cancel the order and issue an appropriate correction or
                refund where necessary.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="shipping"
              icon={Truck}
              title="Shipping, Delivery & Fulfillment"
            >
              <PolicyPoint>
                Delivery timelines are estimates and may vary depending on
                location, courier performance, holidays, weather, or operational
                disruptions.
              </PolicyPoint>
              <PolicyPoint>
                Customers are responsible for providing accurate delivery
                details. We are not responsible for delays or failed deliveries
                caused by incorrect address or contact information.
              </PolicyPoint>
              <PolicyPoint>
                Once an order is handed over to the delivery partner, tracking
                updates may depend on courier system availability and scanning
                events.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="returns"
              icon={Undo2}
              title="Returns, Refunds & Exchanges"
            >
              <PolicyPoint>
                Eligible items may be returned, exchanged, or refunded according
                to our return policy and within the stated return window.
              </PolicyPoint>
              <PolicyPoint>
                Returned products must typically be unused, in original
                condition, and include all packaging, accessories, and proof of
                purchase unless otherwise stated.
              </PolicyPoint>
              <PolicyPoint>
                Refund approval, timing, and method may vary depending on the
                payment method used and the outcome of the inspection process.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="conduct"
              icon={Ban}
              title="User Responsibilities & Prohibited Use"
            >
              <PolicyPoint>
                You agree not to misuse the website, interfere with its
                operation, attempt unauthorized access, or use the platform for
                fraudulent, unlawful, or abusive activity.
              </PolicyPoint>
              <PolicyPoint>
                Any false information, misuse of promotions, chargeback abuse,
                or harmful activity may result in account restrictions, order
                cancellation, or legal action where applicable.
              </PolicyPoint>
              <PolicyPoint>
                You are responsible for maintaining the confidentiality of your
                account details and for activities conducted using your account.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="liability"
              icon={AlertTriangle}
              title="Limitations of Liability"
            >
              <PolicyPoint>
                To the maximum extent permitted by law, we are not liable for
                indirect, incidental, special, or consequential damages arising
                from use of the website, products, or services.
              </PolicyPoint>
              <PolicyPoint>
                We do not guarantee uninterrupted access to the website and may
                suspend, modify, or discontinue features at any time without
                notice.
              </PolicyPoint>
              <PolicyPoint>
                Our total liability related to any claim shall generally not
                exceed the amount paid for the relevant order, except where the
                law requires otherwise.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="law"
              icon={Scale}
              title="Governing Law & Dispute Resolution"
            >
              <PolicyPoint>
                These Terms & Conditions are governed by the applicable laws of
                the jurisdiction in which the ecommerce business operates.
              </PolicyPoint>
              <PolicyPoint>
                Any disputes arising from website use, purchases, payments, or
                services should first be addressed through customer support for
                amicable resolution.
              </PolicyPoint>
              <PolicyPoint>
                If a dispute cannot be resolved informally, it may be handled in
                the appropriate courts or legal forums under applicable law.
              </PolicyPoint>
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
                On This Page
              </h3>

              <div className="mt-4 space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition hover:translate-x-0.5"
                    style={{
                      background: "rgba(0,31,63,0.04)",
                      color: PALETTE.navy,
                      border: `1px solid ${PALETTE.border}`,
                    }}
                  >
                    <span>{section.label}</span>
                    <ArrowRight className="h-4 w-4 opacity-70" />
                  </a>
                ))}
              </div>

              <div className="mt-6">
                <h4
                  className="text-lg font-bold"
                  style={{ color: PALETTE.navy }}
                >
                  Need Help?
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
                        legal@yourstore.com
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
                By continuing to use this website, you acknowledge that you
                have read, understood, and agreed to these Terms &
                Conditions.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}