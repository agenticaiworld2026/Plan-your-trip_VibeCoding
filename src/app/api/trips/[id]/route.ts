import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTripById, updateTrip } from "@/lib/db/store";

export async function GET(
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

  return NextResponse.json({ trip });
}

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

  const body = await request.json();
  const updated = await updateTrip({ ...trip, ...body, id });
  return NextResponse.json({ trip: updated });
}
