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
  Instagram,
  Youtube,
  ArrowRight,
} from "lucide-react";

/**
 * ✅ Next.js (App Router) Footer
 * - Uses next/link + active state via usePathname()
 * - Uses next/image for the logo
 * - Dark navy bg, subtle glow, full width
 * - Bottom: Cash on Delivery only
 * ✅ Updated with your real contact details (phone, email, facebook, address)
 */

const COLORS = {
  navy: "#001f3f",
  coral: "#ff7e69",
  cta: "#ff6b6b",
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
        "w-fit rounded-lg px-2 py-1 text-sm font-semibold transition",
        "text-white/70 hover:text-white hover:bg-white/10",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
        isActive ? "text-white bg-white/10" : ""
      )}
    >
      {children}
    </Link>
  );
}

function InfoPill({ icon: Icon, title, desc }) {
  return (
    <div
      className={cx(
        "flex h-full items-start gap-3 rounded-2xl border border-white/10 p-4",
        "bg-white/5 backdrop-blur"
      )}
      style={{ boxShadow: "0 14px 34px rgba(0,0,0,.20)" }}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 shrink-0">
        <Icon className="h-5 w-5" style={{ color: COLORS.gold }} />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-black text-white">{title}</div>
        <div className="mt-0.5 text-xs font-medium text-white/70 leading-relaxed">
          {desc}
        </div>
      </div>
    </div>
  );
}

/* ✅ Contact text weights fixed (not too bold) */
function ContactCard({ icon: Icon, title, sub, href }) {
  const content = (
    <div
      className={cx(
        "flex items-start gap-3 rounded-2xl border border-white/10 p-4",
        "bg-white/5 backdrop-blur"
      )}
      style={{ boxShadow: "0 14px 34px rgba(0,0,0,.18)" }}
    >
      <Icon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: COLORS.coral }} />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white truncate">{title}</div>
        <div className="mt-0.5 text-xs font-medium text-white/60 leading-relaxed whitespace-pre-line">
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
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 rounded-2xl"
    >
      {content}
    </a>
  );
}

function Social({ href = "#", label, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className={cx(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
        "bg-white/10 hover:bg-white/15 ring-1 ring-white/10 transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
      )}
      style={{ color: "white" }}
    >
      {children}
    </a>
  );
}

export default function Footer() {
  const router = useRouter();

  // ✅ Your real details
  const PHONE_DISPLAY = "01410-060804";
  const PHONE_TEL = "tel:+8801410060804";

  const EMAIL_DISPLAY = "auranohm@gmail.com";
  const EMAIL_MAILTO = "mailto:auranohm@gmail.com";

  const FACEBOOK_URL = "https://www.facebook.com/auraandohm";

  const ADDRESS_TITLE = "Afroza Villa";
  const ADDRESS_SUB = "30/1, Free School Street,\nKathal Bagan, Dhaka-1205.";

  // Optional: open Google Maps search for your address
  const MAPS_URL =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Afroza Villa, 30/1, Free School Street, Kathal Bagan, Dhaka-1205");

  return (
    <footer className="">
      <div style={{ backgroundColor: COLORS.navy }}>
        <div
          style={{
            background:
              "radial-gradient(1100px 520px at 12% 0%, rgba(255,126,105,.10), transparent 60%)," +
              "radial-gradient(900px 520px at 88% 10%, rgba(234,179,8,.08), transparent 58%)," +
              "linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,0) 40%, rgba(0,0,0,.12))",
          }}
        >
          <div className="px-4 sm:px-8 lg:px-14 2xl:px-20 py-12">
            {/* top feature row */}
            <div className="grid gap-3 md:grid-cols-3">
              <InfoPill
                icon={ShieldCheck}
                title="Official Warranty"
                desc="Authentic products with verified warranty support."
              />
              <InfoPill
                icon={Truck}
                title="Fast Delivery"
                desc="Dhaka & nationwide delivery with tracking."
              />
              <InfoPill
                icon={RotateCcw}
                title="Easy Returns"
                desc="Hassle-free returns on eligible items."
              />
            </div>

            {/* main grid */}
            <div className="mt-10 grid gap-10 lg:grid-cols-12">
              {/* brand */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/assets/logo/logo1.png"
                    alt="AURA & OHM"
                    width={140}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                  />
                  <div className="leading-tight">
                    <div className="text-[16px] sm:text-[18px] font-black tracking-tight text-white">
                      AURA &amp; OHM
                    </div>
                    <div className="text-[11px] sm:text-[12px] font-semibold text-white/65 -mt-0.5">
                      E-commerce store
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-sm font-semibold text-white/70 leading-relaxed max-w-md">
                  Premium gadgets, accessories & lifestyle tech — curated for Bangladesh.
                </div>

                {/* quick mini links (optional but matches premium feel) */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/15 transition"
                  >
                    <Facebook className="h-4 w-4" />
                  Facebook :  Aura &amp; OHM 
                  </a>

                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/15 transition"
                  >
                    <MapPin className="h-4 w-4" />
                    View Location
                  </a>
                </div>
              </div>

              {/* links */}
              <div className="lg:col-span-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="text-xs font-extrabold tracking-wide uppercase text-white/75">
                    Shop
                  </div>
                  <div className="mt-3 grid gap-2">
                    <FooterLink href="/product">All Products</FooterLink>
                    <FooterLink href="/brands">Brands</FooterLink>
                    <FooterLink href="/product?category=Mobile%20Phones">
                      Mobile Phones
                    </FooterLink>
                    <FooterLink href="/product?category=Tablets%20%26%20iPads">
                      Tablets & iPads
                    </FooterLink>
                    <FooterLink href="/product?category=Smart%20Watches">
                      Smart Watches
                    </FooterLink>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-extrabold tracking-wide uppercase text-white/75">
                    Company
                  </div>
                  <div className="mt-3 grid gap-2">
                    <FooterLink href="/about">About</FooterLink>
                    <FooterLink href="/contact">Contact</FooterLink>
                    <FooterLink href="/privacy">Privacy Policy</FooterLink>
                    <FooterLink href="/terms">Terms & Conditions</FooterLink>
                    <FooterLink href="/faq">FAQ</FooterLink>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-extrabold tracking-wide uppercase text-white/75">
                    Support
                  </div>
                  <div className="mt-3 grid gap-2">
                    <FooterLink href="/track">Track Order</FooterLink>
                    <FooterLink href="/returns">Return Policy</FooterLink>
                    <FooterLink href="/warranty">Warranty</FooterLink>
                    <FooterLink href="/help">Help Center</FooterLink>
                  </div>

                  <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black text-white shadow-sm active:scale-[0.99]"
                    style={{ background: COLORS.cta }}
                    onClick={() => router.push("/product")}
                  >
                    Browse Products <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* contact */}
              <div className="lg:col-span-3">
                <div className="text-xs font-extrabold tracking-wide uppercase text-white/75">
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

                  <div className="flex items-center gap-2 pt-1">
                    <Social href={FACEBOOK_URL} label="Facebook">
                      <Facebook className="h-5 w-5" />
                    </Social>

                    {/* Keep placeholders if you don't have these yet */}
                    <Social href="#" label="Instagram">
                      <Instagram className="h-5 w-5" />
                    </Social>
                    <Social href="#" label="YouTube">
                      <Youtube className="h-5 w-5" />
                    </Social>
                  </div>
                </div>
              </div>
            </div>

            {/* bottom bar */}
            <div className="mt-10 border-t border-white/10 pt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-semibold text-white/60">
                © {new Date().getFullYear()} AURA &amp; OHM. All rights reserved.
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-white/60">
                <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">
                  Cash on Delivery
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
