import { NextResponse } from "next/server";
import { getTripByShareToken } from "@/lib/db/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const trip = await getTripByShareToken(token);

  if (!trip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ trip });
}
