import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTripById, updateStops } from "@/lib/db/store";
import { resuggestDays } from "@/lib/ai/generate";

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

  const { affectedDayIds } = (await request.json()) as { affectedDayIds: string[] };

  const affectedDays = trip.days
    .filter((d) => affectedDayIds.includes(d.id))
    .map((d) => ({
      dayIndex: d.dayIndex,
      label: d.label,
      stops: d.stops.map((s) => ({
        name: s.name,
        category: s.category,
        durationMinutes: s.durationMinutes,
      })),
    }));

  if (affectedDays.length === 0) {
    return NextResponse.json({ trip });
  }

  try {
    const result = await resuggestDays(
      trip.preferences,
      trip.destination,
      affectedDays
    );

    const updatedDays = trip.days.map((day) => {
      const suggestion = result.days.find((d) => d.dayIndex === day.dayIndex);
      if (!suggestion) return day;

      const updatedStops = day.stops.map((stop) => {
        const s = suggestion.stops.find((x) => x.name === stop.name);
        if (!s) return stop;
        return {
          ...stop,
          travelFromPreviousMinutes: s.travelFromPreviousMinutes,
          suggestedStartTime: s.suggestedStartTime,
          suggestedEndTime: s.suggestedEndTime,
        };
      });

      return { ...day, stops: updatedStops };
    });

    const updated = await updateStops(id, updatedDays);
    return NextResponse.json({ trip: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resuggest failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
