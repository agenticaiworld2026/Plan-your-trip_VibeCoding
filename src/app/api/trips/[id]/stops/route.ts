import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTripById, moveStop } from "@/lib/db/store";

export async function PATCH(
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

  const { stopId, tripDayId, sortOrder } = await request.json();
  const updated = await moveStop(id, stopId, tripDayId, sortOrder);
  return NextResponse.json({ trip: updated });
}
