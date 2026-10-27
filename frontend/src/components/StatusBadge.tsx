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
  const paddingClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  if (isMock) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium specimen-tag bg-[#E8ECF2] text-[#2D4059] border border-[#CBD5E1] dark:bg-[#1E293B] dark:text-[#94A3B8] dark:border-[#334155] ${paddingClass}`}
      >
        <Sparkles className="h-3 w-3 text-[#2D4059] dark:text-[#94A3B8]" />
        Illustrative Demo Fixture
      </span>
    );
  }

  if (isHuman) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium specimen-tag bg-[#EDF0EA] text-[#4E5642] border border-[#BAC3AE] dark:bg-[#20271C] dark:text-[#A3B192] dark:border-[#38432E] ${paddingClass}`}
      >
        <CheckCircle2 className="h-3 w-3 text-[#5A634D] dark:text-[#A3B192]" />
        Human Verified
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium specimen-tag bg-[#FBF5E8] text-[#8C6D2D] border border-[#E5D7B7] dark:bg-[#2D2415] dark:text-[#DFC285] dark:border-[#4D3F25] ${paddingClass}`}
    >
      <Clock className="h-3 w-3 text-[#A88234] dark:text-[#DFC285]" />
      Provisional Automated
    </span>
  );
}
