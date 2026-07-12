import { promises as fs } from "fs";
import path from "path";
import type { CreateTripInput, Trip, TripDay, Stop } from "@/types/trip";
import { generateId } from "@/lib/utils";
import { addDaysToDate, recalculateDay } from "@/lib/time/calculations";

const DATA_DIR = path.join(process.cwd(), "data");
const TRIPS_FILE = path.join(DATA_DIR, "trips.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface DbData {
  users: StoredUser[];
  trips: Trip[];
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readDb(): Promise<DbData> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(TRIPS_FILE, "utf-8");
    return JSON.parse(raw) as DbData;
  } catch {
    return { users: [], trips: [] };
  }
}

async function writeDb(data: DbData) {
  await ensureDataDir();
  await fs.writeFile(TRIPS_FILE, JSON.stringify(data, null, 2));
}

export async function getOrCreateDevUser(email: string): Promise<StoredUser> {
  const db = await readDb();
  let user = db.users.find((u) => u.email === email);
  if (!user) {
    user = {
      id: generateId(),
      email,
      displayName: email.split("@")[0],
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    await writeDb(db);
  }
  return user;
}

export async function getTripsByUser(userId: string): Promise<Trip[]> {
  const db = await readDb();
  return db.trips
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getTripById(id: string): Promise<Trip | null> {
  const db = await readDb();
  return db.trips.find((t) => t.id === id) ?? null;
}

export async function getTripByShareToken(token: string): Promise<Trip | null> {
  const db = await readDb();
  return db.trips.find((t) => t.shareToken === token) ?? null;
}

export async function createTrip(userId: string, input: CreateTripInput): Promise<Trip> {
  const db = await readDb();
  const now = new Date().toISOString();
  const tripId = generateId();

  const days: TripDay[] = Array.from({ length: input.dayCount }, (_, i) => ({
    id: generateId(),
    tripId,
    dayIndex: i,
    date: addDaysToDate(input.startDate, i),
    label: `Day ${i + 1}`,
    totalActiveMinutes: 0,
    totalTravelMinutes: 0,
    isOverpacked: false,
    stops: [],
  }));

  const trip: Trip = {
    id: tripId,
    userId,
    title: `${input.dayCount} Days in ${input.destination}`,
    destination: input.destination,
    destinationCountry: input.destinationCountry ?? "",
    startDate: input.startDate,
    dayCount: input.dayCount,
    status: "draft",
    preferences: input.preferences,
    days,
    createdAt: now,
    updatedAt: now,
  };

  db.trips.push(trip);
  await writeDb(db);
  return trip;
}

export async function updateTrip(trip: Trip): Promise<Trip> {
  const db = await readDb();
  const index = db.trips.findIndex((t) => t.id === trip.id);
  if (index === -1) throw new Error("Trip not found");
  trip.updatedAt = new Date().toISOString();
  db.trips[index] = trip;
  await writeDb(db);
  return trip;
}

export async function applyGeneratedItinerary(
  tripId: string,
  data: {
    tripTitle: string;
    days: Array<{
      dayIndex: number;
      label: string;
      stops: Array<{
        name: string;
        category: string;
        description: string;
        durationMinutes: number;
        travelFromPreviousMinutes: number;
        suggestedStartTime: string;
        suggestedEndTime: string;
        lat?: number;
        lng?: number;
        placeId?: string;
        openingHours?: string;
      }>;
    }>;
  },
  generationMeta?: Record<string, unknown>
): Promise<Trip> {
  const trip = await getTripById(tripId);
  if (!trip) throw new Error("Trip not found");

  trip.title = data.tripTitle;
  trip.status = "ready";
  trip.generationMeta = generationMeta ?? null;

  for (const dayData of data.days) {
    const day = trip.days.find((d) => d.dayIndex === dayData.dayIndex);
    if (!day) continue;

    day.label = dayData.label;
    day.stops = dayData.stops.map((s, i) => ({
      id: generateId(),
      tripDayId: day.id,
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
      aiMetadata: null,
    }));

    const recalculated = recalculateDay(day, trip.preferences.pace);
    Object.assign(day, recalculated);
  }

  return updateTrip(trip);
}

export async function moveStop(
  tripId: string,
  stopId: string,
  targetDayId: string,
  sortOrder: number
): Promise<Trip> {
  const trip = await getTripById(tripId);
  if (!trip) throw new Error("Trip not found");

  let movedStop: Stop | null = null;
  for (const day of trip.days) {
    const idx = day.stops.findIndex((s) => s.id === stopId);
    if (idx !== -1) {
      [movedStop] = day.stops.splice(idx, 1);
      break;
    }
  }
  if (!movedStop) throw new Error("Stop not found");

  movedStop.tripDayId = targetDayId;
  const targetDay = trip.days.find((d) => d.id === targetDayId);
  if (!targetDay) throw new Error("Target day not found");

  targetDay.stops.splice(sortOrder, 0, movedStop);
  targetDay.stops.forEach((s, i) => {
    s.sortOrder = i;
  });

  for (const day of trip.days) {
    const recalculated = recalculateDay(day, trip.preferences.pace);
    Object.assign(day, recalculated);
  }

  return updateTrip(trip);
}

export async function updateStops(tripId: string, days: TripDay[]): Promise<Trip> {
  const trip = await getTripById(tripId);
  if (!trip) throw new Error("Trip not found");

  for (const updatedDay of days) {
    const day = trip.days.find((d) => d.id === updatedDay.id);
    if (day) {
      day.stops = updatedDay.stops;
      const recalculated = recalculateDay(day, trip.preferences.pace);
      Object.assign(day, recalculated);
    }
  }

  return updateTrip(trip);
}

export async function enableShare(tripId: string): Promise<string> {
  const trip = await getTripById(tripId);
  if (!trip) throw new Error("Trip not found");
  if (!trip.shareToken) {
    trip.shareToken = generateId().replace(/-/g, "").slice(0, 12);
    await updateTrip(trip);
  }
  return trip.shareToken;
}
