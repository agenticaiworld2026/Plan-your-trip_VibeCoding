"use client";

import { isMapsConfigured } from "@/lib/maps/places";
import type { Stop } from "@/types/trip";

interface MapPanelProps {
  stops: Stop[];
  selectedStopId?: string | null;
  className?: string;
}

export function MapPanel({ stops, selectedStopId, className }: MapPanelProps) {
  const withCoords = stops.filter((s) => s.lat != null && s.lng != null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!isMapsConfigured() || withCoords.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-border bg-bg-surface p-8 text-center ${className}`}
      >
        <div className="mb-4 h-32 w-full max-w-sm rounded-xl bg-accent-muted/50" />
        <p className="text-sm font-medium text-text-primary">Map view</p>
        <p className="mt-1 max-w-xs text-xs text-text-secondary">
          {apiKey
            ? "Stops will appear on the map once coordinates are available"
            : "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable live maps"}
        </p>
      </div>
    );
  }

  const center = withCoords[0];
  const markers = withCoords
    .map(
      (s) =>
        `markers=color:0x2D6A5E%7C${s.lat},${s.lng}`
    )
    .join("&");

  const path = withCoords.map((s) => `${s.lat},${s.lng}`).join("|");
  const selected = withCoords.find((s) => s.id === selectedStopId);

  const mapUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${selected?.lat ?? center.lat},${selected?.lng ?? center.lng}&zoom=14`;

  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-bg-surface ${className}`}>
      <iframe
        title="Trip map"
        width="100%"
        height="100%"
        className="min-h-[300px] border-0"
        loading="lazy"
        src={mapUrl}
      />
      {withCoords.length > 1 && (
        <div className="border-t border-border px-4 py-2 text-xs text-text-secondary">
          {withCoords.length} stops mapped
          {path && " · route preview available with full API"}
        </div>
      )}
    </div>
  );
}
