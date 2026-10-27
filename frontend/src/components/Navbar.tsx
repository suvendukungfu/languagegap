"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, Menu, X, ArrowUpRight } from "lucide-react";
import { getHealth } from "@/lib/api";

export function Navbar() {
  const pathname = usePathname();
  const [providerStatus, setProviderStatus] = useState<string>("connecting");
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-3 pointer-events-none">
      <div className="mx-auto max-w-6xl">
        <div className="pointer-events-auto flex items-center justify-between rounded-full bg-[#131313]/80 backdrop-blur-xl border border-white/10 px-4 py-2 sm:px-5 sm:py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {/* Left: Original LanguageGap Brand Mark and Wordmark */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-[#2C241D] to-[#7A5832] border border-[#F0A24C]/40 text-[#F0A24C] shadow-[0_0_15px_rgba(240,162,76,0.25)] transition-transform duration-300 group-hover:scale-105">
              <span className="font-mono text-xs font-bold tracking-tighter text-white">LG</span>
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#F0A24C] ring-2 ring-[#0D0D0D]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-normal tracking-tight text-white group-hover:text-white transition-colors">
                LanguageGap
              </span>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] tracking-widest uppercase font-mono text-[#F0A24C] bg-[#2C241D]/60 border border-[#F0A24C]/30">
                Research
              </span>
            </div>
          </Link>

          {/* Middle: Overview, Benchmark, Methodology, Research */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-normal">
            <Link
              href={isHome ? "#overview" : "/#overview"}
              className="px-3 py-1.5 rounded-full text-[#ADADAD] hover:text-white hover:bg-white/5 transition-colors relative"
            >
              Overview
            </Link>
            <Link
              href={isHome ? "#benchmark" : "/#benchmark"}
              className="px-3 py-1.5 rounded-full text-[#ADADAD] hover:text-white hover:bg-white/5 transition-colors"
            >
              Benchmark
            </Link>
            <Link
              href={isHome ? "#methodology" : "/#methodology"}
              className="px-3 py-1.5 rounded-full text-[#ADADAD] hover:text-white hover:bg-white/5 transition-colors"
            >
              Methodology
            </Link>
            <Link
              href={isHome ? "#research" : "/#research"}
              className="px-3 py-1.5 rounded-full text-[#ADADAD] hover:text-white hover:bg-white/5 transition-colors"
            >
              Research
            </Link>
          </nav>

          {/* Right: Explore benchmark & Run evaluation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={isHome ? "#benchmark" : "/#benchmark"}
              className="hidden sm:inline-flex text-xs text-[#ADADAD] hover:text-white px-3 py-1.5 transition-colors"
            >
              Explore benchmark
            </Link>

            <Link
              href="/evaluate"
              aria-label="Start New Evaluation"
              className="btn-amber-glass inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal tracking-wide"
            >
              <span>Run evaluation</span>
              <ArrowUpRight className="h-3 w-3 text-[#F0A24C]" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#ADADAD] hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="pointer-events-auto mt-2 rounded-2xl bg-[#131313]/95 backdrop-blur-2xl border border-white/10 p-4 shadow-2xl md:hidden animate-fade-in">
            <nav className="flex flex-col gap-2 text-sm">
              <Link
                href={isHome ? "#overview" : "/#overview"}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[#ADADAD] hover:text-white hover:bg-white/5"
              >
                Overview
              </Link>
              <Link
                href={isHome ? "#benchmark" : "/#benchmark"}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[#ADADAD] hover:text-white hover:bg-white/5"
              >
                Benchmark
              </Link>
              <Link
                href={isHome ? "#methodology" : "/#methodology"}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[#ADADAD] hover:text-white hover:bg-white/5"
              >
                Methodology
              </Link>
              <Link
                href={isHome ? "#research" : "/#research"}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[#ADADAD] hover:text-white hover:bg-white/5"
              >
                Research
              </Link>
              <div className="h-px bg-white/10 my-1" />
              <Link
                href="/evaluate"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-amber-glass text-center py-2.5 rounded-lg text-sm text-white"
              >
                Run an evaluation
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
