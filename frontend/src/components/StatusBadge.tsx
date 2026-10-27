import React from "react";
import { CheckCircle2, Sparkles, Clock } from "lucide-react";

interface StatusBadgeProps {
  isProvisional?: boolean;
  evaluationMethod?: string;
  isMock?: boolean;
  size?: "sm" | "md";
}

export function StatusBadge({
  isProvisional = true,
  evaluationMethod = "automated_provisional",
  isMock = false,
  size = "md",
}: StatusBadgeProps) {
  const isHuman = evaluationMethod === "human_validated" || !isProvisional;
  const paddingClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  if (isMock) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 ${paddingClass}`}
      >
        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
        Illustrative Demo Fixture
      </span>
    );
  }

  if (isHuman) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${paddingClass}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        Human Verified
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 ${paddingClass}`}
    >
      <Clock className="h-3.5 w-3.5 text-amber-500" />
      Provisional Automated
    </span>
  );
}
