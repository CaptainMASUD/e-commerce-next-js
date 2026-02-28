import { DM_Sans } from "next/font/google";
import "./globals.css";
import TopRouteLoaderClient from "@/Components/Utils/TopRouteLoaderClient";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Aura & OHM",
  description: "Aura & OHM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${dmSans.variable} antialiased`}>
        <TopRouteLoaderClient />
        {children}
      </body>
    </html>
  );
}