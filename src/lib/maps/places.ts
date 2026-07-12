import type { Stop } from "@/types/trip";

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function isMapsConfigured(): boolean {
  return !!GOOGLE_KEY;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  openingHours?: string;
}

export async function geocodePlace(
  query: string,
  destination: string
): Promise<PlaceResult | null> {
  if (!GOOGLE_KEY) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", `${query} ${destination}`);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id,name,geometry,opening_hours");
  url.searchParams.set("key", GOOGLE_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();

  const candidate = data.candidates?.[0];
  if (!candidate) return null;

  return {
    placeId: candidate.place_id,
    name: candidate.name,
    lat: candidate.geometry.location.lat,
    lng: candidate.geometry.location.lng,
    openingHours: candidate.opening_hours?.weekday_text?.join("; "),
  };
}

export async function getTravelTimeMinutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<number | null> {
  if (!GOOGLE_KEY) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", `${origin.lat},${origin.lng}`);
  url.searchParams.set("destinations", `${destination.lat},${destination.lng}`);
  url.searchParams.set("mode", "walking");
  url.searchParams.set("key", GOOGLE_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  const seconds = data.rows?.[0]?.elements?.[0]?.duration?.value;
  if (!seconds) return null;
  return Math.ceil(seconds / 60);
}

export function optimizeStopOrder(stops: Stop[]): Stop[] {
  if (stops.length <= 2) return stops;

  const withCoords = stops.filter((s) => s.lat != null && s.lng != null);
  const withoutCoords = stops.filter((s) => s.lat == null || s.lng == null);

  if (withCoords.length < 2) return stops;

  const visited = new Set<string>();
  const ordered: Stop[] = [];
  let current = withCoords[0];
  visited.add(current.id);
  ordered.push(current);

  while (visited.size < withCoords.length) {
    let nearest: Stop | null = null;
    let minDist = Infinity;

    for (const stop of withCoords) {
      if (visited.has(stop.id)) continue;
      const dist = haversine(
        current.lat!,
        current.lng!,
        stop.lat!,
        stop.lng!
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = stop;
      }
    }

    if (!nearest) break;
    visited.add(nearest.id);
    ordered.push(nearest);
    current = nearest;
  }

  return [...ordered, ...withoutCoords].map((s, i) => ({
    ...s,
    sortOrder: i,
    travelFromPreviousMinutes: i === 0 ? 0 : s.travelFromPreviousMinutes,
  }));
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function enrichStopsWithPlaces(
  stops: Stop[],
  destination: string
): Promise<Stop[]> {
  if (!GOOGLE_KEY) return stops;

  const enriched: Stop[] = [];
  for (const stop of stops) {
    if (stop.placeId) {
      enriched.push(stop);
      continue;
    }
    const place = await geocodePlace(stop.name, destination);
    if (place) {
      enriched.push({
        ...stop,
        placeId: place.placeId,
        lat: place.lat,
        lng: place.lng,
        openingHours: place.openingHours ?? null,
      });
    } else {
      enriched.push(stop);
    }
  }
  return enriched;
}
