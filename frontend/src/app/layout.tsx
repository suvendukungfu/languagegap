import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LanguageGap — Multilingual AI Language Equity Observatory & Evaluation Platform",
  description:
    "An editorial research observatory and evaluation platform investigating cross-lingual response quality, factual completeness, and equity parity across English, Hindi, Punjabi, and Odia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Gurmukhi:wght@400;600;700&family=Noto+Sans+Oriya:wght@400;600;700&display=swap"
        />
      </head>
      <body className="flex min-h-full flex-col bg-[#F6F2E9] text-[#1F1E1A] antialiased dark:bg-[#171614] dark:text-[#EDE8DC] font-editorial-sans selection:bg-[#B35B43]/20 selection:text-[#B35B43]">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#DDD6C8] bg-[#FCFAF6] py-10 dark:border-[#36332C] dark:bg-[#1F1D19]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4 pb-8 border-b border-[#E8E2D5] dark:border-[#2D2A24]">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-editorial-serif text-xl font-bold tracking-tight text-[#1F1E1A] dark:text-[#EDE8DC]">
                    LanguageGap
                  </span>
                  <span className="archival-stamp rounded px-1.5 py-0.5 text-[9px] text-[#2D4059] border-[#2D4059] dark:text-[#6F8CB0] dark:border-[#6F8CB0]">
                    OBSERVATORY
                  </span>
                </div>
                <p className="text-xs text-[#5E594F] dark:text-[#A69F91] leading-relaxed max-w-md font-editorial-serif italic">
                  &ldquo;Same question. Different languages. Equal opportunity to understand.&rdquo;
                </p>
                <p className="text-xs text-[#7A7468] dark:text-[#8C8577] leading-relaxed max-w-md">
                  An open-source digital exhibition and benchmark engine evaluating whether foundation models deliver equitable accuracy, factual completeness, and digital safety across diverse linguistic scripts.
                </p>
              </div>

              <div className="space-y-2">
                <span className="specimen-tag text-[10px] font-bold text-[#2D4059] dark:text-[#6F8CB0] block">
                  Catalog Languages
                </span>
                <ul className="text-xs space-y-1.5 text-[#5E594F] dark:text-[#A69F91]">
                  <li>English &bull; <span className="text-[#8C8577]">Latin Script</span></li>
                  <li>हिन्दी &bull; <span className="font-devanagari text-[#8C8577]">देवनागरी</span></li>
                  <li>ਪੰਜਾਬੀ &bull; <span className="font-gurmukhi text-[#8C8577]">ਗੁਰਮੁਖੀ</span></li>
                  <li>ଓଡ଼ିଆ &bull; <span className="font-odia text-[#8C8577]">ଉତ୍କଳ ଲିପି</span></li>
                </ul>
              </div>

              <div className="space-y-2">
                <span className="specimen-tag text-[10px] font-bold text-[#2D4059] dark:text-[#6F8CB0] block">
                  Methodology & Audit
                </span>
                <ul className="text-xs space-y-1.5 text-[#5E594F] dark:text-[#A69F91]">
                  <li>Digital Literacy v1.0.0</li>
                  <li>14-Point Multi-Dimension Rubric</li>
                  <li>Dual-Provenance Verification</li>
                  <li>Apache 2.0 Open Source</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#7A7468] dark:text-[#8C8577]">
              <p>
                &copy; 2026 LanguageGap Research Initiative &bull; Powered by Google Gemma 4
              </p>
              <div className="flex items-center gap-6">
                <span>Ref: ISO 639-1 / UNICODE 16.0</span>
                <span>Open-Source Evaluation Platform</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
