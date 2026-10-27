import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LanguageGap — Multilingual AI Language Equity Observatory & Evaluation Platform",
  description:
    "An editorial research observatory and evaluation platform powered by Gemma 4, investigating cross-lingual response quality, factual completeness, and equity parity across English, Hindi, Punjabi, and Odia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#0D0D0D] text-[#ADADAD]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..72,100..1000&family=Noto+Sans+Devanagari:wght@300;400;500;600;700&family=Noto+Sans+Gurmukhi:wght@300;400;500;600;700&family=Noto+Sans+Oriya:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="flex min-h-full flex-col bg-[#0D0D0D] text-[#ADADAD] antialiased selection:bg-[#F0A24C]/25 selection:text-[#FFFFFF]">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
