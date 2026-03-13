"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BiSupport } from "react-icons/bi";

const supportProfiles = [
  "/assets/support/woman.png",
  "/assets/support/man.png",
  "/assets/support/man2.png",
];

const tooltipMessages = [
  "Need assistance? Our support team is here to help.",
  "Have a question? We're available to assist you anytime.",
];

const WHATSAPP_NUMBER = "8801410060804";
const WHATSAPP_MESSAGE = "Hello, I need support.";

export default function HelpWidget() {
  const [activeProfile, setActiveProfile] = useState(0);
  const [activeMessage, setActiveMessage] = useState(0);

  useEffect(() => {
    const profileInterval = setInterval(() => {
      setActiveProfile((prev) => (prev + 1) % supportProfiles.length);
    }, 2200);

    const messageInterval = setInterval(() => {
      setActiveMessage((prev) => (prev + 1) % tooltipMessages.length);
    }, 6600);

    return () => {
      clearInterval(profileInterval);
      clearInterval(messageInterval);
    };
  }, []);

  const supportUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`;

  return (
    <div className="fixed bottom-20 right-4 z-[9999] flex items-center gap-2 sm:bottom-5 sm:right-5 sm:gap-3">
      {/* Tooltip */}
      <div className="hidden sm:flex items-center">
        <div className="relative min-w-[230px] max-w-[270px] rounded-2xl bg-white px-3 py-2.5 shadow-[0_8px_25px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
          <div className="relative h-[40px] overflow-hidden">
            {tooltipMessages.map((message, index) => (
              <p
                key={index}
                className={`absolute inset-0 text-sm font-medium leading-relaxed text-gray-700 transition-all duration-700 ${
                  activeMessage === index
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
              >
                {message}
              </p>
            ))}
          </div>

          <span className="absolute right-[-5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 bg-white" />
        </div>
      </div>

      {/* Support button */}
      <a
        href={supportUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Support Chat"
        className="group relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-[0_8px_20px_rgba(34,197,94,0.22)] transition-transform duration-300 hover:scale-105 sm:h-[66px] sm:w-[66px] sm:shadow-[0_12px_30px_rgba(34,197,94,0.28)]"
      >
        {/* Avatar */}
        <div className="relative z-10 h-[46px] w-[46px] overflow-hidden rounded-full bg-white shadow-md sm:h-[56px] sm:w-[56px]">
          {supportProfiles.map((src, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ${
                activeProfile === index
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-0"
              }`}
            >
              <Image
                src={src}
                alt={`Support representative ${index + 1}`}
                fill
                sizes="(max-width: 640px) 46px, 56px"
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* Support icon badge */}
        <div className="absolute -bottom-1 -right-1 z-20 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-white shadow-lg sm:h-8 sm:w-8">
          <BiSupport className="text-[13px] text-green-600 sm:text-[18px]" />
        </div>
      </a>
    </div>
  );
}