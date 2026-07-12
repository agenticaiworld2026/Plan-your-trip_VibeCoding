"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TripWizard } from "@/components/wizard/trip-wizard";
import { GenerationOverlay } from "@/components/kanban/generation-overlay";
import type { Trip, WizardFormData } from "@/types/trip";

export default function EditTripPage() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/trips/${params.id}`)
      .then((r) => r.json())
      .then((d) => setTrip(d.trip))
      .catch(() => router.push("/trips"));
  }, [params.id, router]);

  const handleComplete = async (form: WizardFormData) => {
    if (!trip) return;
    const confirmed = window.confirm(
      "Regenerating will replace your current itinerary and manual edits. Continue?"
    );
    if (!confirmed) return;

    setGenerating(true);

    try {
      await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: form.destination,
          destinationCountry: form.destinationCountry,
          startDate: form.startDate,
          dayCount: form.dayCount,
          preferences: {
            interests: form.interests,
            pace: form.pace,
            budget: form.budget,
            travelStyle: form.travelStyle,
            partySize: form.partySize,
            optionalNotes: form.optionalNotes,
          },
        }),
      });

      const genRes = await fetch(`/api/trips/${trip.id}/generate`, { method: "POST" });
      if (!genRes.ok) throw new Error("Generation failed");
      router.push(`/trips/${trip.id}`);
    } catch {
      setGenerating(false);
      alert("Failed to regenerate. Try simplifying your interests.");
    }
  };

  if (!trip) return null;

  const initialData: Partial<WizardFormData> = {
    destination: trip.destination,
    destinationCountry: trip.destinationCountry,
    startDate: trip.startDate,
    dayCount: trip.dayCount,
    interests: trip.preferences.interests,
    pace: trip.preferences.pace,
    budget: trip.preferences.budget,
    travelStyle: trip.preferences.travelStyle,
    partySize: trip.preferences.partySize,
    optionalNotes: trip.preferences.optionalNotes,
  };

  return (
    <>
      <Header />
      {generating && <GenerationOverlay destination={trip.destination} />}
      <main className="mx-auto max-w-3xl flex-1 px-6 py-10 md:px-10">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Edit trip setup</h1>
        <TripWizard
          initialData={initialData}
          onComplete={handleComplete}
          onCancel={() => router.push(`/trips/${trip.id}`)}
        />
      </main>
    </>
  );
}
