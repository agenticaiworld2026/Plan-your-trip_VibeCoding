"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TripCard, EmptyTrips } from "@/components/trips/trip-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Trip } from "@/types/trip";

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
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

      const tripsRes = await fetch("/api/trips");
      if (tripsRes.ok) {
        const data = await tripsRes.json();
        setTrips(data.trips);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleSignOut = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  };

  return (
    <>
      <Header user={user} onSignOut={handleSignOut} />
      <main className="mx-auto max-w-6xl flex-1 px-6 py-10 md:px-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
              My Trips
            </h1>
            <p className="mt-1 text-text-secondary">Pick up where you left off</p>
          </div>
          <Link href="/trips/new">
            <Button>Plan a trip</Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl skeleton-shimmer" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyTrips />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
