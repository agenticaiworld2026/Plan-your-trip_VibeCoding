"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  Settings,
  Share2,
  Download,
  Sparkles,
} from "lucide-react";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { GenerationOverlay } from "@/components/kanban/generation-overlay";
import { StopDetailSheet } from "@/components/kanban/stop-detail-sheet";
import { MapPanel } from "@/components/map/map-panel";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { Trip } from "@/types/trip";
import { cn } from "@/lib/utils";

interface TripBoardProps {
  initialTrip: Trip;
}

export function TripBoard({ initialTrip }: TripBoardProps) {
  const [trip, setTrip] = useState(initialTrip);
  const [generating, setGenerating] = useState(trip.status === "generating");
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const isMobile = useIsMobile();

  const selectedStop =
    trip.days.flatMap((d) => d.stops).find((s) => s.id === selectedStopId) ?? null;

  const allStops = trip.days.flatMap((d) => d.stops);

  const handleOptimizeDay = async () => {
    const day = trip.days[mobileDayIndex] ?? trip.days[0];
    if (!day) return;
    setOptimizing(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId: day.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrip(data.trip);
      }
    } finally {
      setOptimizing(false);
    }
  };

  const handleShare = async () => {
    const res = await fetch(`/api/trips/${trip.id}/share`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setShareUrl(data.shareUrl);
      await navigator.clipboard.writeText(data.shareUrl);
    }
  };

  const handleExport = () => {
    window.print();
  };

  const dateRange = (() => {
    try {
      const start = format(parseISO(trip.startDate), "MMM d");
      const endDate = new Date(parseISO(trip.startDate));
      endDate.setDate(endDate.getDate() + trip.dayCount - 1);
      return `${start} – ${format(endDate, "MMM d, yyyy")}`;
    } catch {
      return trip.startDate;
    }
  })();

  return (
    <>
      {generating && <GenerationOverlay destination={trip.destination} />}

      <div className="mx-auto max-w-[1600px] px-6 py-6 md:px-10">
        <div className="no-print mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
              {trip.title}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {trip.destination} · {dateRange}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowMap(!showMap)}>
              <Sparkles className="h-4 w-4" />
              {showMap ? "Hide map" : "Map"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOptimizeDay}
              disabled={optimizing}
            >
              <Settings className="h-4 w-4" />
              {optimizing ? "Optimizing…" : "Optimize day"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              {shareUrl ? "Copied!" : "Share"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Link href={`/trips/${trip.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
                Edit setup
              </Button>
            </Link>
          </div>
        </div>

        {isMobile && (
          <div className="no-print mb-4 flex gap-2 overflow-x-auto pb-2">
            {trip.days.map((day, i) => (
              <button
                key={day.id}
                onClick={() => setMobileDayIndex(i)}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  mobileDayIndex === i
                    ? "bg-accent text-white"
                    : "bg-bg-surface text-text-secondary border border-border"
                )}
              >
                Day {i + 1}
                {day.isOverpacked && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warn" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className={cn("grid gap-6", showMap && !isMobile && "lg:grid-cols-[1fr_380px]")}>
          <KanbanBoard
            trip={trip}
            onTripUpdate={setTrip}
            onStopClick={setSelectedStopId}
            mobileDayIndex={mobileDayIndex}
          />
          {showMap && (
            <MapPanel
              stops={allStops}
              selectedStopId={selectedStopId}
              className="no-print min-h-[400px] lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]"
            />
          )}
        </div>

        <div className="print-only hidden">
          <h1>{trip.title}</h1>
          {trip.days.map((day) => (
            <div key={day.id} className="mb-8">
              <h2>Day {day.dayIndex + 1}: {day.label}</h2>
              <ol>
                {day.stops.map((stop) => (
                  <li key={stop.id}>
                    {stop.suggestedStartTime} – {stop.name} ({stop.durationMinutes}min)
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      <StopDetailSheet
        stop={selectedStop}
        open={!!selectedStopId}
        onOpenChange={(open) => !open && setSelectedStopId(null)}
      />
    </>
  );
}
