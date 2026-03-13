"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  PhoneCall,
  Mail,
  MapPin,
  Facebook,
  ArrowRight,
} from "lucide-react";

const COLORS = {
  cta: "#ff6b6b",
  accent2: "#ff7e69",
  navy: "#001f3f",

  headerBg: "#071a2d",
  headerBg2: "#061325",
  headerBorder: "rgba(255,255,255,0.12)",
  headerText: "rgba(255,255,255,0.92)",
  headerMuted: "rgba(255,255,255,0.72)",
  inputBg: "rgba(255,255,255,0.08)",
  inputBorder: "rgba(255,255,255,0.14)",
  gold: "#eab308",
};

const cx = (...c) => c.filter(Boolean).join(" ");

function FooterLink({ href, children }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cx(
        "w-fit rounded-xl px-2.5 py-1.5 text-sm font-semibold transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        "hover:bg-white/10",
        isActive ? "bg-white/10" : ""
      )}
      style={{ color: isActive ? COLORS.headerText : COLORS.headerMuted }}
    >
      {children}
    </Link>
  );
}

function InfoPill({ icon: Icon, title, desc }) {
  return (
    <div
      className={cx(
        "flex h-full items-start gap-3 rounded-2xl p-4",
        "backdrop-blur"
      )}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${COLORS.headerBorder}`,
        boxShadow: "0 14px 34px rgba(0,0,0,.20)",
      }}
    >
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl shrink-0"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <Icon className="h-5 w-5" style={{ color: COLORS.gold }} />
      </span>

      <div className="min-w-0">
        <div
          className="text-sm font-semibold"
          style={{ color: COLORS.headerText }}
        >
          {title}
        </div>
        <div
          className="mt-1 text-xs leading-relaxed"
          style={{ color: COLORS.headerMuted }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

function ContactCard({ icon: Icon, title, sub, href }) {
  const content = (
    <div
      className={cx(
        "flex items-start gap-3 rounded-2xl p-4",
        "backdrop-blur transition"
      )}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${COLORS.headerBorder}`,
        boxShadow: "0 14px 34px rgba(0,0,0,.18)",
      }}
    >
      <Icon
        className="h-5 w-5 mt-0.5 shrink-0"
        style={{ color: COLORS.accent2 }}
      />

      <div className="min-w-0">
        <div
          className="text-sm font-semibold truncate"
          style={{ color: COLORS.headerText }}
        >
          {title}
        </div>
        <div
          className="mt-1 text-xs leading-relaxed whitespace-pre-line"
          style={{ color: COLORS.headerMuted }}
        >
          {sub}
        </div>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      {content}
    </a>
  );
}

export default function Footer() {
  const router = useRouter();

  const PHONE_DISPLAY = "01410-060804";
  const PHONE_TEL = "tel:+8801410060804";

  const EMAIL_DISPLAY = "auranohm@gmail.com";
  const EMAIL_MAILTO = "mailto:auranohm@gmail.com";

  const FACEBOOK_URL = "https://www.facebook.com/auraandohm";

  const ADDRESS_TITLE = "Afroza Villa";
  const ADDRESS_SUB = "30/1, Free School Street,\nKathal Bagan, Dhaka-1205.";

  const MAPS_URL =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      "Afroza Villa, 30/1, Free School Street, Kathal Bagan, Dhaka-1205"
    );

  return (
    <footer>
      <div
        style={{
          background: `linear-gradient(180deg, ${COLORS.headerBg} 0%, ${COLORS.headerBg2} 100%)`,
          borderTop: `1px solid ${COLORS.headerBorder}`,
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(1100px 520px at 12% 0%, rgba(255,126,105,.10), transparent 60%)," +
              "radial-gradient(900px 520px at 88% 10%, rgba(234,179,8,.08), transparent 58%)," +
              "linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,0) 40%, rgba(0,0,0,.14))",
          }}
        >
          <div className="px-4 sm:px-8 lg:px-14 2xl:px-20 py-12">
            <div className="grid gap-3 md:grid-cols-3">
              <InfoPill
                icon={ShieldCheck}
                title="Official Warranty"
                desc="Authentic products with verified warranty support."
              />
              <InfoPill
                icon={Truck}
                title="Fast Delivery"
                desc="Dhaka and nationwide delivery with tracking."
              />
              <InfoPill
                icon={RotateCcw}
                title="Easy Returns"
                desc="Hassle-free returns on eligible items."
              />
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="group flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-xl"
                >
                  <Image
                    src="/assets/logo/logo1.png"
                    alt="AURA & OHM"
                    width={140}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                  />

                  <div className="leading-tight">
                    <div
                      className="text-[16px] sm:text-[18px] font-semibold tracking-tight"
                      style={{ color: COLORS.headerText }}
                    >
                      AURA &amp; OHM
                    </div>
                    <div
                      className="text-[11px] sm:text-[12px] font-medium mt-0.5"
                      style={{ color: COLORS.headerMuted }}
                    >
                      E-commerce store
                    </div>
                  </div>
                </button>

                <div
                  className="mt-4 text-sm leading-relaxed max-w-md"
                  style={{ color: COLORS.headerMuted }}
                >
                  Gadgets, accessories and lifestyle tech curated for customers
                  across Bangladesh.
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={cx(
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5",
                      "text-xs font-semibold text-white transition-all duration-300",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                      "hover:-translate-y-0.5"
                    )}
                    style={{
                      background:
                        "linear-gradient(135deg, #1877F2 0%, #145bd6 55%, #0f4ec9 100%)",
                      boxShadow:
                        "0 10px 24px rgba(24,119,242,.28), inset 0 1px 0 rgba(255,255,255,.18)",
                      border: "1px solid rgba(255,255,255,.14)",
                    }}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                      <Facebook className="h-4 w-4" />
                    </span>
                    Facebook: Aura &amp; OHM
                  </a>

                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={{
                      color: COLORS.headerText,
                      background: "rgba(255,255,255,0.08)",
                      border: `1px solid ${COLORS.inputBorder}`,
                    }}
                  >
                    <MapPin className="h-4 w-4" style={{ color: COLORS.accent2 }} />
                    View Location
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div
                    className="text-xs font-semibold tracking-[0.16em] uppercase"
                    style={{ color: COLORS.headerMuted }}
                  >
                    Shop
                  </div>
                  <div className="mt-3 grid gap-2">
                    <FooterLink href="/">All Products</FooterLink>
                    <FooterLink href="/brands">Brands</FooterLink>
                    <FooterLink href="/new-arrivals">New Arrival</FooterLink>
                  </div>
                </div>

                <div>
                  <div
                    className="text-xs font-semibold tracking-[0.16em] uppercase"
                    style={{ color: COLORS.headerMuted }}
                  >
                    Company
                  </div>
                  <div className="mt-3 grid gap-2">
                    <FooterLink href="/about">About</FooterLink>
                    <FooterLink href="/contact">Contact</FooterLink>
                    <FooterLink href="/privacy">Privacy Policy</FooterLink>
                    <FooterLink href="/terms">Terms &amp; Conditions</FooterLink>
                    <FooterLink href="/faq">FAQ</FooterLink>
                  </div>
                </div>

                <div>
                  <div
                    className="text-xs font-semibold tracking-[0.16em] uppercase"
                    style={{ color: COLORS.headerMuted }}
                  >
                    Support
                  </div>
                  <div className="mt-3 grid gap-2">
                    <FooterLink href="/order-tracking">Track Order</FooterLink>
                    <FooterLink href="/returns">Return Policy</FooterLink>
                    <FooterLink href="/warranty">Warranty</FooterLink>
                    <FooterLink href="/help">Help Center</FooterLink>
                  </div>

                  <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={{ background: COLORS.cta }}
                    onClick={() => router.push("/")}
                  >
                    Browse Products <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div
                  className="text-xs font-semibold tracking-[0.16em] uppercase"
                  style={{ color: COLORS.headerMuted }}
                >
                  Contact
                </div>

                <div className="mt-3 grid gap-3">
                  <ContactCard
                    icon={PhoneCall}
                    title={PHONE_DISPLAY}
                    sub="10am–10pm (Everyday)"
                    href={PHONE_TEL}
                  />
                  <ContactCard
                    icon={Mail}
                    title={EMAIL_DISPLAY}
                    sub="We reply within 24 hours"
                    href={EMAIL_MAILTO}
                  />
                  <ContactCard
                    icon={MapPin}
                    title={ADDRESS_TITLE}
                    sub={ADDRESS_SUB}
                    href={MAPS_URL}
                  />
                </div>
              </div>
            </div>

            <div
              className="mt-10 pt-5"
              style={{ borderTop: `1px solid ${COLORS.headerBorder}` }}
            >
              <div
                className="text-center text-xs font-medium"
                style={{ color: COLORS.headerMuted }}
              >
                © {new Date().getFullYear()} AURA &amp; OHM. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}