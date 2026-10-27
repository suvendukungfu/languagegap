"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, Play, BookOpen } from "lucide-react";
import { getHealth } from "@/lib/api";

export function Navbar() {
  const pathname = usePathname();
  const [providerStatus, setProviderStatus] = useState<string>("connecting");
  const [isHealthy, setIsHealthy] = useState<boolean>(false);

  useEffect(() => {
    getHealth()
      .then((data) => {
        setProviderStatus(`${data.provider}`);
        setIsHealthy(data.status === "ok");
      })
      .catch(() => {
        setProviderStatus("offline");
        setIsHealthy(false);
      });
  }, []);

  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-[#DDD6C8] bg-[#F6F2E9]/95 backdrop-blur-md dark:border-[#36332C] dark:bg-[#171614]/95 transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Left: Exhibition Masthead Brand */}
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#DDD6C8] bg-[#FCFAF6] text-[#2D4059] shadow-xs transition-transform group-hover:scale-105 dark:border-[#36332C] dark:bg-[#1F1D19] dark:text-[#6F8CB0]">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial-serif text-lg font-bold tracking-tight text-[#1F1E1A] dark:text-[#EDE8DC]">
                  LanguageGap
                </span>
                <span className="archival-stamp rounded px-1.5 py-0.5 text-[9px] text-[#2D4059] border-[#2D4059]/40 bg-[#E8ECF2] dark:text-[#6F8CB0] dark:border-[#6F8CB0]/40 dark:bg-[#222D3D]">
                  OBSERVATORY
                </span>
              </div>
              <p className="text-[10px] tracking-wide text-[#7A7468] dark:text-[#8C8577] specimen-tag">
                AI Cross-Lingual Equity Benchmark
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Curated Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs">
          <Link
            href="/"
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              isHome
                ? "bg-[#FCFAF6] text-[#B35B43] border border-[#DDD6C8] shadow-2xs dark:bg-[#1F1D19] dark:border-[#36332C] dark:text-[#D9785F]"
                : "text-[#5E594F] hover:bg-[#EFE9DC]/60 hover:text-[#1F1E1A] dark:text-[#A69F91] dark:hover:bg-[#2A2822]"
            }`}
          >
            Exhibition Overview
          </Link>

          {isHome && (
            <>
              <a
                href="#divide"
                className="rounded-md px-2.5 py-1.5 text-[#5E594F] hover:bg-[#EFE9DC]/60 hover:text-[#1F1E1A] dark:text-[#A69F91] dark:hover:bg-[#2A2822] transition-colors"
              >
                The Divide
              </a>
              <a
                href="#experiment"
                className="rounded-md px-2.5 py-1.5 text-[#5E594F] hover:bg-[#EFE9DC]/60 hover:text-[#1F1E1A] dark:text-[#A69F91] dark:hover:bg-[#2A2822] transition-colors"
              >
                The Experiment
              </a>
              <a
                href="#specimen"
                className="rounded-md px-2.5 py-1.5 text-[#5E594F] hover:bg-[#EFE9DC]/60 hover:text-[#1F1E1A] dark:text-[#A69F91] dark:hover:bg-[#2A2822] transition-colors"
              >
                Specimen Matrix
              </a>
              <a
                href="#rubric"
                className="rounded-md px-2.5 py-1.5 text-[#5E594F] hover:bg-[#EFE9DC]/60 hover:text-[#1F1E1A] dark:text-[#A69F91] dark:hover:bg-[#2A2822] transition-colors"
              >
                14-Pt Rubric
              </a>
              <a
                href="#parity"
                className="rounded-md px-2.5 py-1.5 text-[#5E594F] hover:bg-[#EFE9DC]/60 hover:text-[#1F1E1A] dark:text-[#A69F91] dark:hover:bg-[#2A2822] transition-colors"
              >
                Parity Findings
              </a>
            </>
          )}

          <Link
            href="/evaluate"
            className={`rounded-md px-3 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${
              pathname === "/evaluate"
                ? "bg-[#FCFAF6] text-[#B35B43] border border-[#DDD6C8] shadow-2xs dark:bg-[#1F1D19] dark:border-[#36332C] dark:text-[#D9785F]"
                : "text-[#5E594F] hover:bg-[#EFE9DC]/60 hover:text-[#1F1E1A] dark:text-[#A69F91] dark:hover:bg-[#2A2822]"
            }`}
          >
            <Play className="h-3 w-3" /> Run Evaluation
          </Link>
        </nav>

        {/* Right: Telemetry & Actions */}
        <div className="flex items-center gap-3">
          {/* Provider Telemetry Status */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#DDD6C8] bg-[#FCFAF6] px-3 py-1 text-[11px] shadow-2xs dark:border-[#36332C] dark:bg-[#1F1D19]">
            <span
              className={`h-2 w-2 rounded-full ${
                isHealthy
                  ? providerStatus === "mock"
                    ? "bg-[#6E775F]"
                    : "bg-[#2D4059] animate-pulse"
                  : "bg-[#B35B43]"
              }`}
            />
            <span className="specimen-tag text-[#7A7468] dark:text-[#8C8577]">
              Engine: <strong className="text-[#1F1E1A] dark:text-[#EDE8DC] lowercase">{providerStatus}</strong>
            </span>
          </div>

          <Link
            href="/evaluate"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#B35B43] bg-[#B35B43] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#9E4A34] transition-all"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exhibition</span> Launcher
          </Link>
        </div>
      </div>
    </header>
  );
}
