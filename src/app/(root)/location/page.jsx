"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiPhone, FiMail, FiFacebook, FiMapPin } from "react-icons/fi";
import { MapPin, Building2, ExternalLink, Copy, CheckCircle2 } from "lucide-react";

const PALETTE = {
  navy: "#001f3f",
  coral: "#ff7e69",
  gold: "#eab308",
};

const PHONE_DISPLAY = "01410-060804";
const PHONE_TEL = "tel:+8801410060804";

const EMAIL_DISPLAY = "auranohm@gmail.com";
const EMAIL_MAILTO = "mailto:auranohm@gmail.com";

const FACEBOOK_URL = "https://www.facebook.com/auraandohm";

const ADDRESS_TITLE = "Afroza Villa";
const ADDRESS_SUB = "30/1, Free School Street,\nKathal Bagan, Dhaka-1205.";

const MAP_QUERY = `${ADDRESS_TITLE}, ${ADDRESS_SUB.replace(/\n/g, ", ")}`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  MAP_QUERY
)}`;

const cn = (...classes) => classes.filter(Boolean).join(" ");

function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = React.useState(null);

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      // ignore
    }
  };

  return { copiedKey, copy };
}

function SectionHeader({ title = "Store Location", subtitle = "Address, map, and quick contacts." }) {
  const parts = String(title).split(/\bLocation\b/);

  return (
    <div className="flex flex-col gap-2 text-center items-center">
      <div className="text-2xl font-semibold tracking-tight sm:text-[30px]" style={{ color: PALETTE.navy }}>
        {parts.length > 1 ? (
          <>
            {parts[0]}
            <span
              className="inline-flex items-center rounded-xl px-2.5 py-1 text-white"
              style={{
                backgroundImage: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.gold})`,
                boxShadow: "0 10px 24px rgba(0,31,63,.08)",
              }}
            >
              Location
            </span>
            {parts.slice(1).join("Location")}
          </>
        ) : (
          title
        )}
      </div>

      {subtitle ? (
        <div className="text-[13px] sm:text-sm" style={{ color: "rgba(0,31,63,0.62)" }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function InfoRow({ icon, label, value, href, onCopy, copied }) {
  const isLink = Boolean(href);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={cn(
        "relative overflow-hidden rounded-3xl bg-white ring-1 ring-black/5",
        "px-4 py-4 shadow-sm"
      )}
      style={{ boxShadow: "0 14px 34px rgba(0,31,63,.06)" }}
    >
      <div className="flex items-center gap-3">
        {/* icon badge: white background, colored icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5 bg-white"
          style={{ boxShadow: "0 10px 22px rgba(0,31,63,.06)" }}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "rgba(0,31,63,0.58)" }}>
            {label}
          </div>

          {isLink ? (
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              className="mt-0.5 inline-flex items-center gap-2 text-[15px] font-medium"
              style={{ color: PALETTE.navy }}
            >
              <span className="truncate">{value}</span>
              {href.startsWith("http") ? (
                <ExternalLink className="h-4 w-4" style={{ color: "rgba(0,31,63,0.45)" }} />
              ) : null}
            </a>
          ) : (
            <div className="mt-0.5 truncate text-[15px] font-medium" style={{ color: PALETTE.navy }}>
              {value}
            </div>
          )}

          <div className="mt-2 h-1.5 w-16 overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full w-2/3 rounded-full"
              style={{
                backgroundImage: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.gold})`,
              }}
            />
          </div>
        </div>

        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[12px] font-medium",
              "ring-1 ring-black/10 bg-white",
              "transition hover:shadow-md active:scale-[0.99]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            )}
            style={{ color: PALETTE.navy, outlineColor: PALETTE.coral, boxShadow: "0 10px 25px rgba(0,31,63,.08)" }}
            aria-label={`Copy ${label}`}
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

export default function StoreLocationSmooth() {
  const { copiedKey, copy } = useCopyToClipboard();
  const addressOneLine = `${ADDRESS_TITLE}, ${ADDRESS_SUB.replace(/\n/g, ", ")}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Smooth warm background (very subtle, no pink blocks) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 18% 14%, rgba(234,179,8,0.12), transparent 42%), radial-gradient(circle at 82% 88%, rgba(255,126,105,0.10), transparent 45%), linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,248,235,0.55) 55%, rgba(255,255,255,1) 100%)",
          }}
        />
      </div>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* header only (no "Visit" pill) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <SectionHeader title="Store Location" subtitle="Address, map, and quick contacts." />
        </motion.div>

        <div className="mt-7 grid gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Left: Address + Map */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.06 }}
            className={cn(
              "relative overflow-hidden rounded-[28px] bg-white ring-1 ring-black/5",
              "p-5 sm:p-6 shadow-sm"
            )}
            style={{ boxShadow: "0 16px 40px rgba(0,31,63,.06)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-black/5 bg-white"
                style={{ boxShadow: "0 10px 22px rgba(0,31,63,.06)" }}
              >
                <Building2 className="h-6 w-6" style={{ color: PALETTE.navy }} />
              </div>

              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "rgba(0,31,63,0.58)" }}>
                  Address
                </div>
                <div className="mt-0.5 text-lg font-semibold" style={{ color: PALETTE.navy }}>
                  {ADDRESS_TITLE}
                </div>
                <div className="mt-1 whitespace-pre-line text-[14px] leading-relaxed" style={{ color: "rgba(0,31,63,0.68)" }}>
                  {ADDRESS_SUB}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={MAP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-medium",
                      "transition active:scale-[0.99]"
                    )}
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.gold})`,
                      color: "white",
                      boxShadow: "0 14px 30px rgba(0,31,63,.10)",
                    }}
                  >
                    <FiMapPin className="h-5 w-5" />
                    Get Directions
                    <ExternalLink className="h-4 w-4 opacity-90" />
                  </a>

                  <button
                    type="button"
                    onClick={() => copy("address", addressOneLine)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-medium",
                      "ring-1 ring-black/10 bg-white",
                      "transition hover:shadow-md active:scale-[0.99]",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    )}
                    style={{
                      color: PALETTE.navy,
                      outlineColor: PALETTE.coral,
                      boxShadow: "0 10px 25px rgba(0,31,63,.08)",
                    }}
                  >
                    {copiedKey === "address" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Address copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy address
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="mt-5 overflow-hidden rounded-3xl ring-1 ring-black/5 bg-white">
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{
                  background: "linear-gradient(90deg, rgba(255,126,105,0.08), rgba(234,179,8,0.10))",
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: PALETTE.navy }}>
                  <MapPin className="h-4 w-4" style={{ color: "rgba(0,31,63,0.75)" }} />
                  Map
                </div>
                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-medium"
                  style={{ color: "rgba(0,31,63,0.72)" }}
                >
                  Open in Google Maps
                </a>
              </div>

              <div className="relative h-60 w-full">
                <iframe
                  title="Store location map"
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`}
                />
              </div>
            </div>
          </motion.section>

          {/* Right: Contact */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.12 }}
            className="space-y-4"
          >
            <InfoRow
              icon={<FiPhone className="h-5 w-5" style={{ color: PALETTE.coral }} />}
              label="Phone"
              value={PHONE_DISPLAY}
              href={PHONE_TEL}
              onCopy={() => copy("phone", PHONE_DISPLAY)}
              copied={copiedKey === "phone"}
            />
            <InfoRow
              icon={<FiMail className="h-5 w-5" style={{ color: PALETTE.gold }} />}
              label="Email"
              value={EMAIL_DISPLAY}
              href={EMAIL_MAILTO}
              onCopy={() => copy("email", EMAIL_DISPLAY)}
              copied={copiedKey === "email"}
            />
            <InfoRow
              icon={<FiFacebook className="h-5 w-5" style={{ color: PALETTE.coral }} />}
              label="Facebook"
              value="facebook.com/auraandohm"
              href={FACEBOOK_URL}
              onCopy={() => copy("facebook", FACEBOOK_URL)}
              copied={copiedKey === "facebook"}
            />
          </motion.section>
        </div>
      </main>
    </div>
  );
}