"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import { getHealth } from "@/lib/api";

export function Navbar() {
  const pathname = usePathname();
  const [providerStatus, setProviderStatus] = useState<string>("connecting...");
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

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/evaluate", label: "Run Evaluation" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Globe2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  LanguageGap
                </span>
                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  Gemma 4
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cross-Lingual Quality & Parity Evaluator
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs dark:border-slate-800 dark:bg-slate-800/60">
            <span
              className={`h-2 w-2 rounded-full ${
                isHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="font-mono text-slate-600 dark:text-slate-300">
              Provider: {providerStatus}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
