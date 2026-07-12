import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTripById, updateStops } from "@/lib/db/store";
import { optimizeStopOrder, getTravelTimeMinutes } from "@/lib/maps/places";
import { recalculateDay } from "@/lib/time/calculations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  const trip = await getTripById(id);

  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!session || trip.userId !== session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dayId } = (await request.json()) as { dayId: string };
  const day = trip.days.find((d) => d.id === dayId);
  if (!day) {
    return NextResponse.json({ error: "Day not found" }, { status: 404 });
  }

  let optimized = optimizeStopOrder(day.stops);

  if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    for (let i = 1; i < optimized.length; i++) {
      const prev = optimized[i - 1];
      const curr = optimized[i];
      if (prev.lat != null && prev.lng != null && curr.lat != null && curr.lng != null) {
        const travel = await getTravelTimeMinutes(
          { lat: prev.lat, lng: prev.lng },
          { lat: curr.lat, lng: curr.lng }
        );
        if (travel != null) {
          optimized[i] = { ...curr, travelFromPreviousMinutes: travel };
        }
      }
    }
  }

  const updatedDay = recalculateDay(
    { ...day, stops: optimized },
    trip.preferences.pace
  );

  const updated = await updateStops(
    id,
    trip.days.map((d) => (d.id === dayId ? updatedDay : d))
  );

  return NextResponse.json({ trip: updated });
}
