"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";

/**
 * Privacy Policy Page (Next.js App Router)
 * - TailwindCSS required
 * - Put in: app/privacy-policy/page.jsx
 */

const SECTIONS = [
  { id: "overview", title: "Overview" },
  { id: "info-we-collect", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Information" },
  { id: "sharing", title: "Sharing & Disclosure" },
  { id: "cookies", title: "Cookies & Tracking" },
  { id: "security", title: "Security" },
  { id: "your-rights", title: "Your Rights & Choices" },
  { id: "data-retention", title: "Data Retention" },
  { id: "children", title: "Children’s Privacy" },
  { id: "international", title: "International Transfers" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Us" },
];

function cx(...c) {
  return c.filter(Boolean).join(" ");
}

function SectionTitle({ children }) {
  return (
    <h2 className="scroll-mt-28 text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
      {children}
    </h2>
  );
}

function Card({ children, className }) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        "p-4 sm:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

function Accordion({ items }) {
  const [openId, setOpenId] = useState(items?.[0]?.id || null);

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const open = openId === it.id;
        return (
          <div key={it.id} className="rounded-2xl border border-slate-200 bg-white">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() => setOpenId(open ? null : it.id)}
              aria-expanded={open}
            >
              <div className="font-semibold text-slate-900">{it.q}</div>
              <div className="shrink-0 text-slate-500">{open ? "—" : "+"}</div>
            </button>
            {open ? (
              <div className="px-4 pb-4 text-sm leading-6 text-slate-700">{it.a}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function useActiveToc(sectionIds) {
  const [active, setActive] = useState(sectionIds?.[0] || "overview");

  useEffect(() => {
    const els = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // choose the closest to the top that is intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top || 0) - (b.boundingClientRect.top || 0));

        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      {
        root: null,
        rootMargin: "-25% 0px -65% 0px",
        threshold: [0.01, 0.1, 0.2],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sectionIds]);

  return active;
}

export default function PrivacyPolicyPage() {
  const sectionIds = useMemo(() => SECTIONS.map((s) => s.id), []);
  const activeId = useActiveToc(sectionIds);

  const lastUpdated = "February 28, 2026"; // change anytime

  const faq = [
    {
      id: "faq-1",
      q: "Do you sell my personal data?",
      a: "No. We do not sell personal information. We may share limited data with service providers to operate our store (e.g., payments, shipping), as described below.",
    },
    {
      id: "faq-2",
      q: "How can I delete my account?",
      a: "You can request account deletion by contacting support with your account email. We may retain certain data where legally required (e.g., invoices).",
    },
    {
      id: "faq-3",
      q: "How do cookies affect my experience?",
      a: "Cookies help with login sessions, cart persistence, preferences, and analytics. You can manage cookies via browser settings and our cookie banner (if enabled).",
    },
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <main className="bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge>Legal</Badge>
              <Badge>Privacy</Badge>
              <Badge>Transparent</Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              Privacy Policy
            </h1>

            <p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
              This page explains how we collect, use, share, and protect your information when you
              use our website, apps, and services. It’s written to be clear and easy to scan.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Last updated: <span className="font-semibold text-slate-800">{lastUpdated}</span>
              </span>
              <span className="text-slate-300">•</span>
              <Link href="/" className="font-semibold text-slate-800 hover:underline">
                Back to Home
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/contact" className="font-semibold text-slate-800 hover:underline">
                Contact Support
              </Link>
            </div>

            {/* Summary cards */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card>
                <div className="text-xs font-semibold text-slate-500">In short</div>
                <div className="mt-1 font-semibold text-slate-900">We collect what we need</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Account, order, device, and usage data—only to run and improve the store.
                </p>
              </Card>
              <Card>
                <div className="text-xs font-semibold text-slate-500">We don’t sell</div>
                <div className="mt-1 font-semibold text-slate-900">Your personal information</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  We share data only with trusted providers (payments, shipping, analytics).
                </p>
              </Card>
              <Card>
                <div className="text-xs font-semibold text-slate-500">You control</div>
                <div className="mt-1 font-semibold text-slate-900">Access & deletion</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Request a copy, correction, or deletion where applicable.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* TOC (sticky on desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Card className="p-4">
                <div className="text-xs font-semibold text-slate-500">On this page</div>
                <nav className="mt-3 space-y-1">
                  {SECTIONS.map((s) => {
                    const active = s.id === activeId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => scrollTo(s.id)}
                        className={cx(
                          "w-full text-left rounded-xl px-3 py-2 text-sm transition",
                          active
                            ? "bg-slate-900 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        {s.title}
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="text-xs font-semibold text-slate-500">Need help?</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    For privacy requests, contact us and include your account email.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
                  >
                    Contact support
                  </Link>
                </div>
              </Card>
            </div>
          </aside>

          {/* Main policy */}
          <section className="min-w-0">
            {/* Mobile TOC */}
            <div className="lg:hidden mb-6">
              <Card className="p-4">
                <div className="text-xs font-semibold text-slate-500">Jump to</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollTo(s.id)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-10">
              <Card>
                <div id="overview" />
                <SectionTitle>Overview</SectionTitle>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  This Privacy Policy describes how <span className="font-semibold">Aura &amp; OHM</span>{" "}
                  (“we”, “us”, “our”) collects, uses, and shares information when you visit or make a
                  purchase from our website or use our services.
                </p>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  If you have questions, see <a className="font-semibold underline" href="#contact">Contact Us</a>.
                </p>
              </Card>

              <Card>
                <div id="info-we-collect" />
                <SectionTitle>Information We Collect</SectionTitle>

                <div className="mt-4 space-y-4 text-sm sm:text-base leading-7 text-slate-700">
                  <div>
                    <div className="font-semibold text-slate-900">Information you provide</div>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>Account details (name, email, phone, password)</li>
                      <li>Order info (shipping address, billing address, items purchased)</li>
                      <li>Support messages (when you contact us)</li>
                    </ul>
                  </div>

                  <div>
                    <div className="font-semibold text-slate-900">Information collected automatically</div>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>Device and browser info (IP address, device identifiers)</li>
                      <li>Usage data (pages viewed, clicks, referral pages)</li>
                      <li>Approximate location (derived from IP, not precise GPS unless you allow it)</li>
                    </ul>
                  </div>

                  <div>
                    <div className="font-semibold text-slate-900">Information from partners</div>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>Payment confirmations from payment processors</li>
                      <li>Delivery updates from shipping carriers</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card>
                <div id="how-we-use" />
                <SectionTitle>How We Use Information</SectionTitle>
                <ul className="mt-4 list-disc pl-5 space-y-2 text-sm sm:text-base leading-7 text-slate-700">
                  <li>To create and manage accounts and authenticate users</li>
                  <li>To process orders, payments, shipping, returns, and customer support</li>
                  <li>To personalize your experience (e.g., saved cart, preferences)</li>
                  <li>To improve our products, services, and site performance</li>
                  <li>To prevent fraud, abuse, and security incidents</li>
                  <li>To comply with legal requirements</li>
                </ul>
              </Card>

              <Card>
                <div id="sharing" />
                <SectionTitle>Sharing &amp; Disclosure</SectionTitle>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  We may share information with:
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="font-semibold text-slate-900">Service providers</div>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      Payment processors, hosting, analytics, customer support tools, shipping carriers.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="font-semibold text-slate-900">Legal &amp; safety</div>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      If required by law, or to protect rights, safety, and security.
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm sm:text-base leading-7 text-slate-700">
                  We do not sell personal information.
                </p>
              </Card>

              <Card>
                <div id="cookies" />
                <SectionTitle>Cookies &amp; Tracking</SectionTitle>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  We use cookies and similar technologies to:
                </p>
                <ul className="mt-3 list-disc pl-5 space-y-2 text-sm sm:text-base leading-7 text-slate-700">
                  <li>Remember your session and cart</li>
                  <li>Store preferences</li>
                  <li>Measure performance and improve the site</li>
                </ul>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  You can manage cookies in your browser settings. Disabling some cookies may impact functionality.
                </p>
              </Card>

              <Card>
                <div id="security" />
                <SectionTitle>Security</SectionTitle>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  We use reasonable administrative, technical, and physical safeguards designed to protect information.
                  No method of transmission or storage is 100% secure, but we work to maintain strong security controls.
                </p>
              </Card>

              <Card>
                <div id="your-rights" />
                <SectionTitle>Your Rights &amp; Choices</SectionTitle>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  Depending on your location, you may have rights to access, correct, delete, or object to processing
                  of your personal information.
                </p>
                <ul className="mt-3 list-disc pl-5 space-y-2 text-sm sm:text-base leading-7 text-slate-700">
                  <li>Access: request a copy of your data</li>
                  <li>Correction: update inaccurate details</li>
                  <li>Deletion: request deletion (with legal retention limits)</li>
                  <li>Marketing: opt out of promotional emails anytime</li>
                </ul>
              </Card>

              <Card>
                <div id="data-retention" />
                <SectionTitle>Data Retention</SectionTitle>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  We keep personal information as long as necessary for the purposes described in this policy,
                  including to comply with legal obligations, resolve disputes, and enforce agreements.
                </p>
              </Card>

              <Card>
                <div id="children" />
                <SectionTitle>Children’s Privacy</SectionTitle>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  Our services are not directed to children, and we do not knowingly collect personal information from
                  children without appropriate consent where required.
                </p>
              </Card>

              <Card>
                <div id="international" />
                <SectionTitle>International Transfers</SectionTitle>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  If you access our services from outside the country where our servers are located, your information
                  may be transferred and processed across borders. We take steps to protect information consistent with
                  applicable law.
                </p>
              </Card>

              <Card>
                <div id="changes" />
                <SectionTitle>Changes to This Policy</SectionTitle>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  We may update this policy from time to time. If we make material changes, we’ll post the updated
                  policy and revise the “Last updated” date.
                </p>
              </Card>

              <Card>
                <div id="contact" />
                <SectionTitle>Contact Us</SectionTitle>
                <p className="mt-3 text-sm sm:text-base leading-7 text-slate-700">
                  For privacy-related requests, contact us at:
                </p>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">Aura &amp; OHM Support</div>
                  <div className="mt-1 text-sm text-slate-700">
                    Email: <span className="font-semibold">support@yourdomain.com</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    Address: <span className="font-semibold">Dhaka, Bangladesh</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                  >
                    Contact support
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                  >
                    Back to Home
                  </Link>
                </div>
              </Card>

              {/* Optional FAQ */}
              <div className="pt-2">
                <div className="mb-3 text-sm font-semibold text-slate-500">FAQ</div>
                <Accordion items={faq} />
              </div>

              <p className="text-xs text-slate-500 leading-5">
                This template is for design/UI purposes and may need legal review to match your jurisdiction and
                business practices.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}