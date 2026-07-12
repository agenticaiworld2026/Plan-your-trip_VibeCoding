"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Header } from "@/components/layout/header";
import { formatMinutes } from "@/lib/utils";
import type { Trip } from "@/types/trip";

export default function SharePage() {
  const params = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setTrip(d.trip);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </>
    );
  }

  if (!trip) {
    return (
      <>
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-semibold">Trip not found</h1>
          <p className="mt-2 text-text-secondary">This share link may have expired.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl flex-1 px-6 py-10 md:px-10">
        <p className="text-sm text-text-secondary">Shared itinerary</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{trip.title}</h1>
        <p className="mt-2 text-text-secondary">{trip.destination}</p>

        <div className="mt-10 space-y-8">
          {trip.days.map((day) => (
            <section key={day.id}>
              <h2 className="text-lg font-semibold">
                Day {day.dayIndex + 1}: {day.label}
              </h2>
              <p className="text-sm text-text-secondary">
                {(() => {
                  try {
                    return format(parseISO(day.date), "EEEE, MMM d");
                  } catch {
                    return day.date;
                  }
                })()}
              </p>
              <ol className="mt-4 space-y-4">
                {day.stops.map((stop, i) => (
                  <li
                    key={stop.id}
                    className="rounded-xl border border-border bg-bg-surface p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-medium text-accent">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-text-primary">{stop.name}</p>
                        <p className="mt-1 text-sm text-text-secondary">{stop.description}</p>
                        <p className="mt-2 text-xs tabular-nums text-text-secondary">
                          {stop.suggestedStartTime} – {stop.suggestedEndTime} ·{" "}
                          {formatMinutes(stop.durationMinutes)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
