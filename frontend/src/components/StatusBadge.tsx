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
  const paddingClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  if (isMock) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-mono text-[#ADADAD] bg-[#1D1D1D] border border-white/10 ${paddingClass}`}
      >
        <Sparkles className="h-3 w-3 text-[#F0A24C]" />
        Illustrative Demo Fixture
      </span>
    );
  }

  if (isHuman) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-mono text-[#F0A24C] bg-[#2C241D]/70 border border-[#F0A24C]/40 ${paddingClass}`}
      >
        <CheckCircle2 className="h-3 w-3 text-[#F0A24C]" />
        Human Verified
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono text-[#ADADAD] bg-[#131313] border border-white/10 ${paddingClass}`}
    >
      <Clock className="h-3 w-3 text-[#7D7D7D]" />
      Provisional Automated
    </span>
  );
}
