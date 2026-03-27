"use client";

import React from "react";
import {
  RefreshCw,
  PackageCheck,
  RotateCcw,
  Wallet,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  FileText,
  Clock3,
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

export default function ReturnPolicyPage() {
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
            <RotateCcw className="h-4 w-4" />
            Returns, Refunds & Exchanges
          </div>

          <h1
            className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl"
            style={{ color: PALETTE.navy }}
          >
            Return <GradientWord>Policy</GradientWord>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
            We want you to shop with confidence. This Return Policy explains
            how returns, exchanges, replacements, and refunds are handled for
            purchases made through our ecommerce platform.
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
                  Returns, Exchanges & Refunds
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <SectionCard icon={Clock3} title="Return Eligibility Period">
              <div className="space-y-3">
                <PolicyPoint>
                  Customers may request a return or exchange within 7 days of
                  receiving the product, unless a different period is clearly
                  mentioned on the product page.
                </PolicyPoint>
                <PolicyPoint>
                  Items reported after the allowed return window may not be
                  eligible for refund, replacement, or exchange.
                </PolicyPoint>
                <PolicyPoint>
                  To speed up the process, customers should contact support as
                  soon as possible after discovering any issue with the order.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={PackageCheck} title="Items Eligible for Return">
              <div className="space-y-3">
                <PolicyPoint>
                  Products may be eligible for return if they arrive damaged,
                  defective, incorrect, incomplete, or significantly different
                  from the description shown on the website.
                </PolicyPoint>
                <PolicyPoint>
                  Returned items should be unused, in their original condition,
                  and include original packaging, tags, accessories, manuals,
                  and proof of purchase whenever applicable.
                </PolicyPoint>
                <PolicyPoint>
                  If the item has been opened or used beyond what is reasonably
                  necessary for inspection, return approval may be denied.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={AlertTriangle} title="Non-Returnable Items">
              <div className="space-y-3">
                <PolicyPoint>
                  Certain items may not be returned, including perishable
                  goods, personal care products, intimate items, gift cards,
                  downloadable products, and customized or made-to-order items.
                </PolicyPoint>
                <PolicyPoint>
                  Items damaged due to misuse, mishandling, unauthorized repair,
                  or failure to follow care instructions are generally not
                  eligible for return.
                </PolicyPoint>
                <PolicyPoint>
                  Clearance, final sale, or non-refundable promotional items may
                  also be excluded from returns unless they arrive damaged or
                  incorrect.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={ClipboardList} title="How to Request a Return">
              <div className="space-y-3">
                <PolicyPoint>
                  To request a return, exchange, or replacement, customers
                  should contact our support team with the order number, reason
                  for return, and clear photos or videos if the product is
                  damaged, defective, or incorrect.
                </PolicyPoint>
                <PolicyPoint>
                  Our team will review the request and provide instructions on
                  whether the item should be returned, picked up, exchanged, or
                  refunded directly.
                </PolicyPoint>
                <PolicyPoint>
                  Return requests may be rejected if insufficient information is
                  provided or if the request does not meet the policy criteria.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={Truck} title="Return Shipping & Collection">
              <div className="space-y-3">
                <PolicyPoint>
                  In approved cases, customers may be asked to return the item
                  through a courier partner or arrange collection based on
                  location and product type.
                </PolicyPoint>
                <PolicyPoint>
                  Return shipping charges may be covered by us when the item is
                  defective, damaged, or incorrectly delivered.
                </PolicyPoint>
                <PolicyPoint>
                  If the return is due to a change of mind or customer
                  preference, the customer may be responsible for return
                  shipping costs unless otherwise stated.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={Wallet} title="Refunds & Processing Time">
              <div className="space-y-3">
                <PolicyPoint>
                  Once the returned item is received and inspected, approved
                  refunds will be processed to the original payment method,
                  mobile financial service, bank account, or store credit,
                  depending on the payment type and refund policy.
                </PolicyPoint>
                <PolicyPoint>
                  Refund processing times may vary depending on banks, payment
                  gateways, and financial service providers.
                </PolicyPoint>
                <PolicyPoint>
                  Shipping fees, cash handling fees, or non-refundable charges
                  may be deducted where applicable unless the return is caused
                  by our error.
                </PolicyPoint>
              </div>
            </SectionCard>

            <SectionCard icon={RotateCcw} title="Exchanges & Replacements">
              <div className="space-y-3">
                <PolicyPoint>
                  Customers may request an exchange or replacement for eligible
                  products that are damaged, defective, wrong, or missing parts.
                </PolicyPoint>
                <PolicyPoint>
                  Exchanges are subject to stock availability. If a replacement
                  is unavailable, a refund or store credit may be offered
                  instead.
                </PolicyPoint>
                <PolicyPoint>
                  We reserve the right to offer repair, replacement, exchange,
                  or refund depending on the product condition and case review.
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
                    Return window
                  </div>
                  <div
                    className="mt-1 text-sm font-bold"
                    style={{ color: PALETTE.navy }}
                  >
                    Usually within 7 days of delivery
                  </div>
                </div>

                <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                  <div className="text-xs font-medium text-slate-500">
                    Eligible cases
                  </div>
                  <div
                    className="mt-1 text-sm font-bold"
                    style={{ color: PALETTE.navy }}
                  >
                    Damaged, defective, wrong, or incomplete items
                  </div>
                </div>

                <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
                  <div className="text-xs font-medium text-slate-500">
                    Refund method
                  </div>
                  <div
                    className="mt-1 text-sm font-bold"
                    style={{ color: PALETTE.navy }}
                  >
                    Original payment method, wallet, bank, or store credit
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
                        returns@yourstore.com
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
                By placing an order on this website, you agree to the terms
                described in this Return Policy.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}