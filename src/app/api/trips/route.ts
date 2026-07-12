import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createTrip, getTripsByUser } from "@/lib/db/store";
import type { CreateTripInput } from "@/types/trip";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const trips = await getTripsByUser(session.userId);
  return NextResponse.json({ trips });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateTripInput;
  const trip = await createTrip(session.userId, body);
  return NextResponse.json({ trip });
}
