"use client";

import React from "react";
import {
  ShieldCheck,
  BadgeCheck,
  PackageCheck,
  CalendarDays,
  Wrench,
  Ban,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Clock3,
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

export default function WarrantyPolicyPage() {
  const sections = [
    { id: "coverage", label: "Warranty Coverage" },
    { id: "eligibility", label: "Eligibility" },
    { id: "claim-process", label: "Claim Process" },
    { id: "repair-replace", label: "Repair or Replacement" },
    { id: "exclusions", label: "Exclusions" },
    { id: "customer-responsibility", label: "Customer Responsibility" },
    { id: "processing-time", label: "Processing Time" },
    { id: "contact", label: "Contact & Support" },
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
              <div className="p-6 sm:p-8 lg:col-span-8 lg:p-10">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{
                    color: PALETTE.navy,
                    background:
                      "linear-gradient(135deg, rgba(255,107,107,0.10), rgba(255,126,105,0.10), rgba(234,179,8,0.10))",
                    border: `1px solid ${PALETTE.border}`,
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Product Warranty
                </div>

                <h1
                  className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl"
                  style={{ color: PALETTE.navy }}
                >
                  Warranty <GradientWord>Policy</GradientWord>
                </h1>

                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  We stand behind the quality of our products. This Warranty
                  Policy explains what is covered, how to request support, and
                  the conditions under which repair, replacement, or service may
                  be provided.
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
                    <CalendarDays className="h-4 w-4" />
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
                    <BadgeCheck className="h-4 w-4" />
                    Applies to eligible products only
                  </div>
                </div>
              </div>

              <div
                className="relative p-6 sm:p-8 lg:col-span-4"
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
                        Coverage
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">
                        Manufacturing defects and eligible faults
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
                        Requirement
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">
                        Valid proof of purchase may be required
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
                        Resolution
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">
                        Inspection, repair, replacement, or support
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                    Review full warranty details
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat
              title="Policy Type"
              value="Warranty & Service Support"
              icon={ShieldCheck}
            />
            <MiniStat
              title="Applies To"
              value="Eligible Store Products"
              icon={ShoppingBag}
            />
            <MiniStat
              title="Claim Basis"
              value="Defect Verification"
              icon={PackageCheck}
            />
            <MiniStat
              title="Support Window"
              value="As per product coverage"
              icon={Clock3}
            />
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <SectionCard
              id="coverage"
              icon={ShieldCheck}
              title="Warranty Coverage"
            >
              <PolicyPoint>
                This warranty generally covers manufacturing defects,
                workmanship issues, and product faults that occur under normal
                intended use during the applicable warranty period.
              </PolicyPoint>
              <PolicyPoint>
                Coverage may vary by product category, brand, or supplier, and
                some products may include a specific limited warranty period
                stated on the product page, packaging, or invoice.
              </PolicyPoint>
              <PolicyPoint>
                Warranty service may include inspection, repair, replacement, or
                another appropriate resolution depending on the nature of the
                issue and product availability.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="eligibility"
              icon={FileText}
              title="Eligibility Requirements"
            >
              <PolicyPoint>
                To qualify for warranty support, customers may need to provide a
                valid order number, invoice, or proof of purchase from our
                store.
              </PolicyPoint>
              <PolicyPoint>
                The product should be used in accordance with normal intended
                usage and maintained reasonably according to any care or usage
                instructions provided.
              </PolicyPoint>
              <PolicyPoint>
                Warranty eligibility may also depend on inspection results and
                whether the reported issue falls within covered conditions.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="claim-process"
              icon={RefreshCw}
              title="How to Submit a Warranty Claim"
            >
              <PolicyPoint>
                Contact our support team with your order details, product
                information, and a clear description of the issue.
              </PolicyPoint>
              <PolicyPoint>
                You may be asked to provide photos, videos, packaging details,
                serial information, or other evidence to help verify the
                problem.
              </PolicyPoint>
              <PolicyPoint>
                Once received, the claim will be reviewed and the customer will
                be informed of the next steps, which may include troubleshooting,
                return instructions, or product inspection.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="repair-replace"
              icon={Wrench}
              title="Repair, Replacement, or Resolution"
            >
              <PolicyPoint>
                If the issue is confirmed as covered under warranty, we may
                arrange a repair, replacement, store-supported service, or
                another suitable remedy.
              </PolicyPoint>
              <PolicyPoint>
                If an identical replacement item is unavailable, an equivalent
                product, alternate resolution, or store-approved option may be
                offered.
              </PolicyPoint>
              <PolicyPoint>
                Final resolution depends on product condition, inspection
                outcome, brand policy, parts availability, and service
                feasibility.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="exclusions"
              icon={Ban}
              title="What Is Not Covered"
            >
              <PolicyPoint>
                Warranty coverage typically does not apply to accidental damage,
                misuse, negligence, improper installation, liquid exposure,
                unauthorized modifications, or external physical damage.
              </PolicyPoint>
              <PolicyPoint>
                Consumable parts, normal wear and tear, cosmetic marks, and
                damage caused by improper storage or handling are usually
                excluded unless specifically stated otherwise.
              </PolicyPoint>
              <PolicyPoint>
                Products serviced or altered by unauthorized persons may no
                longer be eligible for warranty support.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="customer-responsibility"
              icon={AlertTriangle}
              title="Customer Responsibilities"
            >
              <PolicyPoint>
                Customers are responsible for providing accurate claim details
                and cooperating with troubleshooting, return, or inspection
                procedures where necessary.
              </PolicyPoint>
              <PolicyPoint>
                Products returned for inspection should be packaged safely to
                avoid transit-related damage during return handling.
              </PolicyPoint>
              <PolicyPoint>
                Any personal data stored on electronic products should be backed
                up before submission where applicable, as service processes may
                require reset, replacement, or testing.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="processing-time"
              icon={Clock3}
              title="Inspection & Processing Time"
            >
              <PolicyPoint>
                Warranty review and service timelines may vary depending on the
                product type, issue severity, service center workflow, and parts
                or replacement availability.
              </PolicyPoint>
              <PolicyPoint>
                Some claims may be resolved quickly through verification, while
                others may require inspection, technical review, or coordination
                with suppliers or brand partners.
              </PolicyPoint>
              <PolicyPoint>
                We aim to keep customers informed throughout the process and
                share updates once the claim status changes.
              </PolicyPoint>
            </SectionCard>

            <SectionCard
              id="contact"
              icon={Phone}
              title="Contact & Warranty Support"
            >
              <PolicyPoint>
                For warranty assistance, please contact our support team with
                your order number and issue details so we can guide you through
                the correct process.
              </PolicyPoint>
              <PolicyPoint>
                Support may be available by email, phone, or customer service
                channels listed on the website.
              </PolicyPoint>
              <PolicyPoint>
                Additional product-specific terms may apply for certain items,
                brands, or supplier-backed warranty programs.
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
                  Warranty Support
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
                        warranty@yourstore.com
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
                Warranty decisions may depend on inspection results, product
                condition, and applicable brand or supplier terms.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}