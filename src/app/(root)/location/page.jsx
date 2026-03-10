"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Clock3,
  ArrowUpRight,
} from "lucide-react";

const contactItems = [
  {
    icon: Phone,
    title: "Phone",
    value: "01410-060804",
    subtitle: "10am–10pm (Everyday)",
    href: "tel:01410060804",
  },
  {
    icon: Mail,
    title: "Email",
    value: "auranohm@gmail.com",
    subtitle: "We reply within 24 hours",
    href: "mailto:auranohm@gmail.com",
  },
  {
    icon: MapPin,
    title: "Store Location",
    value: "Afroza Villa",
    subtitle: "30/1, Free School Street, Kathal Bagan, Dhaka-1205.",
    href: "https://maps.google.com/?q=Afroza+Villa,+30/1+Free+School+Street,+Kathal+Bagan,+Dhaka+1205",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.12,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function StoreContactSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600">
            Visit us or get in touch
          </span>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Store Location & Contact Details
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Clean, minimal, and modern contact section with smooth motion and a
            strong content hierarchy.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {contactItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.a
                key={item.title}
                href={item.href}
                target={item.title === "Store Location" ? "_blank" : undefined}
                rel={item.title === "Store Location" ? "noreferrer" : undefined}
                custom={index}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                      <Icon size={24} />
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-300 group-hover:border-slate-900 group-hover:text-slate-900">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>

                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.title === "Phone" ? (
                      <Clock3 size={14} className="text-slate-400" />
                    ) : (
                      <span className="h-[14px] w-[14px] rounded-full bg-slate-200" />
                    )}
                    <span>{item.title}</span>
                  </div>

                  <h3 className="text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
                    {item.value}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                    {item.subtitle}
                  </p>
                </div>
              </motion.a>
            );
          })}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0.2}
          variants={fadeUp}
          className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6 sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Address Overview
              </p>

              <h3 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                Afroza Villa, Dhaka
              </h3>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                30/1, Free School Street, Kathal Bagan, Dhaka-1205. Reach out by
                phone, send an email, or open the map location instantly.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Opening Hours</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  10am – 10pm
                </p>
                <p className="text-sm text-slate-600">Open everyday</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Response Time</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  Within 24 hours
                </p>
                <p className="text-sm text-slate-600">For email inquiries</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}