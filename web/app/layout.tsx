import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"]
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["700"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fuelkenya.com"),
  title: {
    default: "FuelKenya — Live EPRA Fuel Prices in Kenya",
    template: "%s | FuelKenya"
  },
  description:
    "Track official EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene across every town in Kenya. Updated every pricing cycle on the 14th.",
  keywords: [
    "EPRA fuel prices Kenya",
    "petrol prices Kenya today",
    "diesel prices Kenya",
    "kerosene prices Kenya",
    "fuel prices Kenya 2026",
    "EPRA maximum pump prices",
    "Kenya fuel tracker",
    "super petrol price Kenya",
    "Kenya petrol price per litre",
    "EPRA price update",
    "Energy Petroleum Regulatory Authority Kenya",
    "Kenya pump prices",
    "fuel cost Kenya",
    "petrol price Nairobi",
    "diesel price Nairobi"
  ],
  authors: [{ name: "FuelKenya", url: "https://fuelkenya.com" }],
  creator: "FuelKenya",
  publisher: "FuelKenya",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://fuelkenya.com",
    siteName: "FuelKenya",
    title: "FuelKenya — Live EPRA Fuel Prices in Kenya",
    description:
      "Track official EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene across every town in Kenya.",
    images: [
      {
        url: "/petrol-station.png",
        width: 1200,
        height: 630,
        alt: "FuelKenya — EPRA Fuel Price Tracker Kenya"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FuelKenya — Live EPRA Fuel Prices in Kenya",
    description:
      "Track official EPRA maximum pump prices for Super Petrol, Diesel, and Kerosene across every town in Kenya.",
    images: ["/petrol-station.png"]
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set dark/light class before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('fk-theme');if(!t||t==='dark'){document.documentElement.classList.add('dark')}else if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.toggle('dark',window.matchMedia('(prefers-color-scheme:dark)').matches)}}catch(e){document.documentElement.classList.add('dark')}`
          }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
