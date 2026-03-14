import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        className={`${poppins.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}