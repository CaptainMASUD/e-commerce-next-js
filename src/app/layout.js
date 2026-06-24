import { DM_Sans } from "next/font/google";
import "./globals.css";

// DM Sans is a variable font, so we don't need to list weights 400, 500, etc.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://aura-ohm-six.vercel.app"),
  title: {
    default: "Aura & OHM",
    template: "%s | Aura & OHM",
  },
  description:
    "Shop authentic products, top brands, and new arrivals at Aura & OHM.",
  applicationName: "Aura & OHM",
  keywords: [
    "Aura & OHM",
    "ecommerce",
    "online shop",
    "brands",
    "new arrivals",
    "products",
  ],
  authors: [{ name: "Aura & OHM" }],
  creator: "Aura & OHM",
  publisher: "Aura & OHM",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Aura & OHM",
    description:
      "Shop authentic products, top brands, and new arrivals at Aura & OHM.",
    url: "/",
    siteName: "Aura & OHM",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura & OHM",
    description:
      "Shop authentic products, top brands, and new arrivals at Aura & OHM.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        /* 1. dmSans.className: Sets DM Sans as the active font.
           2. dmSans.variable: Keeps the CSS variable --font-dm-sans available.
        */
        className={`${dmSans.className} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}