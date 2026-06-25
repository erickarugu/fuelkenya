import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"]
});

export const metadata = {
  title: "FuelKenya — Live EPRA Fuel Prices",
  description:
    "Real-time EPRA pump prices for Super Petrol, Diesel, and Kerosene across every town in Kenya. Updated every pricing cycle."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
