"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { MapPin, Calendar } from "lucide-react";
import type { Trip } from "@/types/trip";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const dateLabel = (() => {
    try {
      const start = format(parseISO(trip.startDate), "MMM d");
      const end = format(
        parseISO(trip.startDate).getTime() + (trip.dayCount - 1) * 86400000,
        "MMM d, yyyy"
      );
      return `${start} – ${end}`;
    } catch {
      return trip.startDate;
    }
  })();

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group block rounded-2xl border border-border bg-bg-surface p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="mb-4 h-32 rounded-xl bg-gradient-to-br from-accent-muted to-accent/10 transition-transform group-hover:scale-[1.02]" />
      <h3 className="text-lg font-semibold tracking-tight text-text-primary group-hover:text-accent">
        {trip.title}
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {trip.destination}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {dateLabel}
        </span>
      </div>
      <p className="mt-3 text-xs text-text-secondary">
        {trip.dayCount} days · {trip.status}
      </p>
    </Link>
  );
}

export function EmptyTrips() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-surface/50 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted">
        <MapPin className="h-8 w-8 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary">No trips yet</h3>
      <p className="mt-1 max-w-sm text-sm text-text-secondary">
        Start planning your next adventure with a guided trip setup.
      </p>
      <Link
        href="/trips/new"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-[15px] font-medium text-white transition-all hover:brightness-110"
      >
        Plan a trip
      </Link>
    </div>
  );
}
