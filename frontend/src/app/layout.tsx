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
  title: "LanguageGap — Multilingual AI Evaluation & Language Parity Platform",
  description:
    "Open-source response-quality and language-parity evaluation platform powered by Gemma 4 across English, Hindi, Punjabi, and Odia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 font-sans">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:px-6">
            <p>
              &copy; 2026 LanguageGap &bull; Apache 2.0 Open-Source License &bull; Powered by Google Gemma 4
            </p>
            <div className="flex items-center gap-4">
              <span>English &bull; हिन्दी &bull; ਪੰਜਾਬੀ &bull; ଓଡ଼ିଆ</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
