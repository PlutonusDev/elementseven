import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { appUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "Element Seven Australia",
    template: "%s - Element Seven Australia",
  },
  description:
    "Australian-owned online vape store. Disposable vapes, pod systems, mods and e-liquids with fast shipping Australia-wide. Ditch the messy refills and burnt coils. Adults 18+ only.",
  keywords: [
    "vape store Australia",
    "buy vapes online Australia",
    "disposable vapes Australia",
    "pod systems Australia",
    "e-liquids Australia",
    "bulk vapes Australia",
  ],
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Element Seven",
    title: "Element Seven | Online Vape Store Australia",
    description:
      "Disposable vapes, pod systems, mods and e-liquids. Australian-owned, fast shipping Australia-wide. Adults 18+ only.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Element Seven | Online Vape Store Australia",
    description:
      "Disposable vapes, pod systems, mods and e-liquids. Fast shipping Australia-wide. 18+.",
  },
  other: { "geo.region": "AU", "geo.placename": "Australia" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${inter.variable} ${space.variable}`}>
      <body className="bg-paper font-body text-ink antialiased">{children}</body>
    </html>
  );
}
