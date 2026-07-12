"use client";

import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function Chip({ label, selected, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
        "border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        selected
          ? "scale-100 border-accent bg-accent-muted text-accent"
          : "bg-bg-surface text-text-secondary hover:border-accent/30 hover:text-text-primary active:scale-[0.97]",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );
}
