"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TripWizard } from "@/components/wizard/trip-wizard";
import { AuthModal } from "@/components/auth/auth-modal";
import { GenerationOverlay } from "@/components/kanban/generation-overlay";
import type { WizardFormData } from "@/types/trip";

export default function NewTripPage() {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pendingForm, setPendingForm] = useState<WizardFormData | null>(null);
  const [destination, setDestination] = useState("");

  const createAndGenerate = async (form: WizardFormData) => {
    setGenerating(true);
    setDestination(form.destination);

    try {
      const createRes = await fetch("/api/trips", {
        method: "POST",
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

      if (!createRes.ok) throw new Error("Failed to create trip");
      const { trip } = await createRes.json();

      const genRes = await fetch(`/api/trips/${trip.id}/generate`, { method: "POST" });
      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error ?? "Generation failed");
      }

      router.push(`/trips/${trip.id}`);
    } catch (error) {
      setGenerating(false);
      alert(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleComplete = async (form: WizardFormData) => {
    const authRes = await fetch("/api/auth");
    const authData = await authRes.json();

    if (!authData.user) {
      setPendingForm(form);
      setAuthOpen(true);
      return;
    }

    await createAndGenerate(form);
  };

  const handleAuthSuccess = async () => {
    if (pendingForm) {
      await createAndGenerate(pendingForm);
      setPendingForm(null);
    }
  };

  return (
    <>
      <Header />
      {generating && <GenerationOverlay destination={destination} />}
      <main className="mx-auto max-w-3xl flex-1 px-6 py-10 md:px-10 md:py-16">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
            Plan your trip
          </h1>
          <p className="mt-2 text-text-secondary">
            A few quick choices — we&apos;ll handle the rest
          </p>
        </div>
        <TripWizard onComplete={handleComplete} />
      </main>

      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
