import { DM_Sans } from "next/font/google";
import "./globals.css";
import TopRouteLoader from "@/Components/Utils/TopRouteLoader";

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
        <TopRouteLoader />
        {children}
      </body>
    </html>
  );
}