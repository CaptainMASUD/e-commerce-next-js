"use client";

import React from "react";
import {
  HelpCircle,
  Search,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
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
          <div className="mt-4 space-y-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="rounded-2xl bg-black/5 p-4 ring-1 ring-black/5">
      <div
        className="text-sm font-extrabold sm:text-[15px]"
        style={{ color: PALETTE.navy }}
      >
        {question}
      </div>
      <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-[15px]">
        {answer}
      </p>
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

export default function FAQPage() {
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
            <HelpCircle className="h-4 w-4" />
            Customer Questions & Answers
          </div>

          <h1
            className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl"
            style={{ color: PALETTE.navy }}
          >
            Frequently Asked <GradientWord>Questions</GradientWord>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
            Find answers to the most common questions about orders, payments,
            shipping, returns, accounts, and customer support.
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
                  Support FAQ
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
                  Coverage
                </div>
                <div
                  className="mt-2 text-sm font-bold"
                  style={{ color: PALETTE.navy }}
                >
                  Orders, Shipping, Returns, Payments
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <SectionCard icon={ShoppingBag} title="Orders & Accounts">
              <FAQItem
                question="How do I place an order?"
                answer="Browse products, add your preferred items to the cart, proceed to checkout, fill in your shipping details, and complete payment using the available payment options."
              />
              <FAQItem
                question="Do I need an account to order?"
                answer="Not always. Some stores allow guest checkout, while others may require account creation for easier order tracking and faster future purchases."
              />
              <FAQItem
                question="Can I cancel my order after placing it?"
                answer="Orders may be canceled before they are packed or shipped. Once the order has entered processing or dispatch, cancellation may no longer be possible."
              />
            </SectionCard>

            <SectionCard icon={CreditCard} title="Payments & Billing">
              <FAQItem
                question="What payment methods do you accept?"
                answer="We may accept cash on delivery, debit cards, credit cards, mobile financial services, bank transfers, or other payment methods listed during checkout."
              />
              <FAQItem
                question="Is my payment information secure?"
                answer="Yes. Payments are processed through secure and trusted payment gateways, and reasonable safeguards are used to protect transaction information."
              />
              <FAQItem
                question="Why was my payment unsuccessful?"
                answer="Payment failures can happen due to incorrect card details, insufficient funds, bank restrictions, session timeouts, or temporary gateway issues."
              />
            </SectionCard>

            <SectionCard icon={Truck} title="Shipping & Delivery">
              <FAQItem
                question="How long does delivery take?"
                answer="Delivery times depend on your location, product availability, courier capacity, and order confirmation time. Estimated delivery dates are usually shown during checkout."
              />
              <FAQItem
                question="How can I track my order?"
                answer="Once your order is confirmed and shipped, tracking information may be shared through SMS, email, phone, or your account order history page."
              />
              <FAQItem
                question="Do you deliver outside major cities?"
                answer="Delivery coverage depends on courier availability and service areas. Some remote locations may require additional time or may not be serviceable."
              />
            </SectionCard>

            <SectionCard icon={RotateCcw} title="Returns & Refunds">
              <FAQItem
                question="Can I return a product?"
                answer="Yes, eligible products may be returned within the stated return period if they are damaged, defective, incorrect, incomplete, or otherwise approved under the return policy."
              />
              <FAQItem
                question="How do refunds work?"
                answer="After the returned item is received and inspected, approved refunds are processed according to the original payment method, store credit policy, or other supported refund channels."
              />
              <FAQItem
                question="Are all products returnable?"
                answer="No. Some items such as perishable goods, personal care items, digital goods, gift cards, intimate items, or customized products may not be eligible for return."
              />
            </SectionCard>

            <SectionCard icon={ShieldCheck} title="Support & Safety">
              <FAQItem
                question="How do I contact customer support?"
                answer="You can reach customer support using the email address, phone number, live chat, or contact form listed on the website."
              />
              <FAQItem
                question="What should I do if I receive a damaged item?"
                answer="Contact support as soon as possible with your order number and clear photos or videos of the issue so the team can review and assist you quickly."
              />
              <FAQItem
                question="How do you protect customer information?"
                answer="We use reasonable technical, administrative, and operational safeguards to help protect customer data and prevent misuse or unauthorized access."
              />
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
                <SummaryItem
                  label="Best for"
                  value="Common customer questions"
                />
                <SummaryItem
                  label="Topics covered"
                  value="Orders, delivery, returns, payments"
                />
                <SummaryItem
                  label="Need more help?"
                  value="Contact support directly"
                />
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
                      <div className="text-slate-600">support@yourstore.com</div>
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
                Still have questions? Our support team is here to help.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}