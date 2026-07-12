"use client";

import { formatMinutes } from "@/lib/utils";
import { PACE_BUDGETS, type Pace } from "@/types/trip";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";

interface DaySummaryBarProps {
  activeMinutes: number;
  travelMinutes: number;
  isOverpacked: boolean;
  pace: Pace;
}

export function DaySummaryBar({
  activeMinutes,
  travelMinutes,
  isOverpacked,
  pace,
}: DaySummaryBarProps) {
  const total = activeMinutes + travelMinutes;
  const budget = PACE_BUDGETS[pace];

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-xs tabular-nums",
              isOverpacked ? "bg-warn/10 text-warn" : "bg-bg-base text-text-secondary"
            )}
          >
            <span>{formatMinutes(activeMinutes)} active</span>
            <span className="text-border">·</span>
            <span>{formatMinutes(travelMinutes)} travel</span>
            {isOverpacked && (
              <span className="ml-auto rounded-full bg-warn/20 px-2 py-0.5 text-[11px] font-medium pulse-once">
                Overpacked
              </span>
            )}
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="rounded-lg bg-text-primary px-3 py-2 text-xs text-bg-surface shadow-md"
            sideOffset={4}
          >
            {formatMinutes(total)} planned · pace budget ~{formatMinutes(budget)}
            <Tooltip.Arrow className="fill-text-primary" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
