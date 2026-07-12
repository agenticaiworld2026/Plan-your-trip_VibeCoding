"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Clock, GripVertical } from "lucide-react";
import { getCategoryColor } from "@/lib/time/calculations";
import { formatMinutes } from "@/lib/utils";
import type { Stop } from "@/types/trip";
import { cn } from "@/lib/utils";

interface StopCardProps {
  stop: Stop;
  isDragging?: boolean;
  onClick?: () => void;
}

export function StopCard({ stop, isDragging, onClick }: StopCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;
  const accentColor = getCategoryColor(stop.category);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      layoutId={stop.id}
      className={cn(
        "group relative cursor-grab rounded-xl border border-border bg-bg-surface p-4 transition-shadow duration-200",
        dragging
          ? "z-50 scale-[1.02] rotate-[0.5deg] shadow-lg opacity-90"
          : "shadow-sm hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-start gap-2 pl-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary/40 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium leading-snug text-text-primary">{stop.name}</p>
          <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{stop.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs tabular-nums text-text-secondary">
            <span className="rounded-md bg-bg-base px-2 py-0.5 capitalize">{stop.category}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatMinutes(stop.durationMinutes)}
            </span>
            {stop.suggestedStartTime && (
              <span>
                {stop.suggestedStartTime}–{stop.suggestedEndTime}
              </span>
            )}
            {stop.travelFromPreviousMinutes > 0 && (
              <span className="text-text-secondary/70">
                +{formatMinutes(stop.travelFromPreviousMinutes)} travel
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function StopCardOverlay({ stop }: { stop: Stop }) {
  const accentColor = getCategoryColor(stop.category);
  return (
    <div className="scale-[1.02] rotate-[0.5deg] rounded-xl border border-accent/30 bg-bg-surface p-4 shadow-lg">
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: accentColor }}
      />
      <p className="pl-2 text-[15px] font-medium text-text-primary">{stop.name}</p>
    </div>
  );
}
