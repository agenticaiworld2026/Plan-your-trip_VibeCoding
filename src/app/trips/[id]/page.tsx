"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TripBoard } from "@/components/trips/trip-board";
import type { Trip } from "@/types/trip";

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const authRes = await fetch("/api/auth");
      const authData = await authRes.json();
      if (!authData.user) {
        router.push("/trips/new");
        return;
      }
      setUser(authData.user);

      const res = await fetch(`/api/trips/${params.id}`);
      if (!res.ok) {
        router.push("/trips");
        return;
      }
      const data = await res.json();
      setTrip(data.trip);
      setLoading(false);
    }
    load();
  }, [params.id, router]);

  const handleSignOut = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  };

  if (loading || !trip) {
    return (
      <>
        <Header user={user} onSignOut={handleSignOut} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} onSignOut={handleSignOut} />
      <TripBoard initialTrip={trip} />
    </>
  );
}
