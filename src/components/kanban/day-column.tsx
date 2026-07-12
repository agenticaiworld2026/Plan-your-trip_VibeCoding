"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { format, parseISO } from "date-fns";
import { DaySummaryBar } from "@/components/kanban/day-summary-bar";
import { StopCard } from "@/components/kanban/stop-card";
import type { TripDay, Pace } from "@/types/trip";
import { cn } from "@/lib/utils";

interface DayColumnProps {
  day: TripDay;
  pace: Pace;
  isOver?: boolean;
  onStopClick?: (stopId: string) => void;
}

export function DayColumn({ day, pace, isOver, onStopClick }: DayColumnProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({ id: day.id });

  const dateLabel = (() => {
    try {
      return format(parseISO(day.date), "EEE, MMM d");
    } catch {
      return day.date;
    }
  })();

  return (
    <div
      className={cn(
        "flex w-[320px] shrink-0 flex-col rounded-2xl border border-border bg-bg-surface/80 p-3 transition-colors duration-200",
        (isOver || isDroppableOver) && "border-accent/40 bg-accent-muted/50"
      )}
    >
      <div
        className={cn(
          "mb-3 rounded-xl px-3 py-3 transition-colors",
          day.isOverpacked && "bg-warn/[0.08]"
        )}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          Day {day.dayIndex + 1}
        </p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight text-text-primary">{day.label}</p>
        <p className="text-sm text-text-secondary">{dateLabel}</p>
        <div className="mt-3">
          <DaySummaryBar
            activeMinutes={day.totalActiveMinutes}
            travelMinutes={day.totalTravelMinutes}
            isOverpacked={day.isOverpacked}
            pace={pace}
          />
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2 rounded-xl p-1 transition-all",
          isDroppableOver && "border-2 border-dashed border-accent/30"
        )}
      >
        <SortableContext items={day.stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {day.stops.map((stop) => (
            <StopCard key={stop.id} stop={stop} onClick={() => onStopClick?.(stop.id)} />
          ))}
        </SortableContext>
        {day.stops.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border py-12 text-sm text-text-secondary">
            Drop stops here
          </div>
        )}
      </div>
    </div>
  );
}
