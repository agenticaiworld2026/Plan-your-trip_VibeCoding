"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Clock, MapPin } from "lucide-react";
import { getCategoryColor } from "@/lib/time/calculations";
import { formatMinutes } from "@/lib/utils";
import type { Stop } from "@/types/trip";

interface StopDetailSheetProps {
  stop: Stop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StopDetailSheet({ stop, open, onOpenChange }: StopDetailSheetProps) {
  if (!stop) return null;

  const accentColor = getCategoryColor(stop.category);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:bg-black/20" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-bg-surface p-6 shadow-lg focus:outline-none md:bottom-auto md:left-auto md:right-6 md:top-24 md:w-[380px] md:rounded-2xl">
          <Dialog.Close className="absolute right-4 top-4 rounded-lg p-1 text-text-secondary hover:text-text-primary">
            <X className="h-5 w-5" />
          </Dialog.Close>

          <div
            className="mb-4 h-1 w-12 rounded-full md:hidden"
            style={{ backgroundColor: accentColor }}
          />

          <Dialog.Title className="pr-8 text-xl font-semibold tracking-tight text-text-primary">
            {stop.name}
          </Dialog.Title>

          <span
            className="mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {stop.category}
          </span>

          <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">{stop.description}</p>

          <div className="mt-6 space-y-3 rounded-xl bg-bg-base p-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock className="h-4 w-4" />
              <span className="tabular-nums">
                {stop.suggestedStartTime} – {stop.suggestedEndTime} ({formatMinutes(stop.durationMinutes)})
              </span>
            </div>
            {stop.travelFromPreviousMinutes > 0 && (
              <p className="text-sm text-text-secondary">
                {formatMinutes(stop.travelFromPreviousMinutes)} travel from previous stop
              </p>
            )}
            {stop.openingHours && (
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{stop.openingHours}</span>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
