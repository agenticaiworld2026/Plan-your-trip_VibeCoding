import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTripById, applyGeneratedItinerary, updateTrip } from "@/lib/db/store";
import { generateItinerary } from "@/lib/ai/generate";
import { enrichStopsWithPlaces } from "@/lib/maps/places";

export async function POST(
  _request: Request,
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

  try {
    await updateTrip({ ...trip, status: "generating" });

    const itinerary = await generateItinerary({
      destination: trip.destination,
      destinationCountry: trip.destinationCountry,
      startDate: trip.startDate,
      dayCount: trip.dayCount,
      preferences: trip.preferences,
    });

    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      for (const day of itinerary.days) {
        day.stops = await enrichStopsWithPlaces(
          day.stops.map((s, i) => ({
            id: `temp-${i}`,
            tripDayId: "temp",
            sortOrder: i,
            name: s.name,
            category: s.category,
            description: s.description,
            durationMinutes: s.durationMinutes,
            travelFromPreviousMinutes: s.travelFromPreviousMinutes,
            suggestedStartTime: s.suggestedStartTime,
            suggestedEndTime: s.suggestedEndTime,
            lat: s.lat ?? null,
            lng: s.lng ?? null,
            placeId: s.placeId ?? null,
            openingHours: s.openingHours ?? null,
          })),
          trip.destination
        ).then((enriched) =>
          enriched.map((s) => ({
            name: s.name,
            category: s.category,
            description: s.description,
            durationMinutes: s.durationMinutes,
            travelFromPreviousMinutes: s.travelFromPreviousMinutes,
            suggestedStartTime: s.suggestedStartTime,
            suggestedEndTime: s.suggestedEndTime,
            lat: s.lat ?? undefined,
            lng: s.lng ?? undefined,
            placeId: s.placeId ?? undefined,
            openingHours: s.openingHours ?? undefined,
          }))
        );
      }
    }

    const updated = await applyGeneratedItinerary(id, itinerary, {
      model: process.env.OPENAI_API_KEY ? "gpt-4o-mini" : "mock",
      generatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ trip: updated });
  } catch (error) {
    const failed = await getTripById(id);
    if (failed) await updateTrip({ ...failed, status: "draft" });
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
