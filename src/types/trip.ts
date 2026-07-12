export type Pace = "relaxed" | "moderate" | "packed";
export type Budget = "budget" | "mid" | "premium";
export type TravelStyle = "solo" | "couple" | "family" | "friends" | "business";
export type TripStatus = "draft" | "generating" | "ready" | "archived";

export const INTERESTS = [
  "Food",
  "Museums",
  "Nature",
  "Nightlife",
  "Shopping",
  "History",
  "Architecture",
  "Local experiences",
  "Family",
  "Wellness",
  "Photography",
  "Hidden gems",
] as const;

export type Interest = (typeof INTERESTS)[number];

export interface TripPreferences {
  interests: Interest[];
  pace: Pace;
  budget: Budget;
  travelStyle: TravelStyle;
  partySize: number;
  optionalNotes: string;
}

export interface Stop {
  id: string;
  tripDayId: string;
  sortOrder: number;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  travelFromPreviousMinutes: number;
  suggestedStartTime: string;
  suggestedEndTime: string;
  lat?: number | null;
  lng?: number | null;
  placeId?: string | null;
  openingHours?: string | null;
  aiMetadata?: Record<string, unknown> | null;
}

export interface TripDay {
  id: string;
  tripId: string;
  dayIndex: number;
  date: string;
  label: string;
  totalActiveMinutes: number;
  totalTravelMinutes: number;
  isOverpacked: boolean;
  stops: Stop[];
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  destinationCountry: string;
  startDate: string;
  dayCount: number;
  status: TripStatus;
  generationMeta?: Record<string, unknown> | null;
  shareToken?: string | null;
  preferences: TripPreferences;
  days: TripDay[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  destination: string;
  destinationCountry?: string;
  startDate: string;
  dayCount: number;
  preferences: TripPreferences;
}

export interface WizardFormData {
  destination: string;
  destinationCountry: string;
  startDate: string;
  dayCount: number;
  interests: Interest[];
  pace: Pace;
  budget: Budget;
  travelStyle: TravelStyle;
  partySize: number;
  optionalNotes: string;
}

export const PACE_BUDGETS: Record<Pace, number> = {
  relaxed: 300,
  moderate: 390,
  packed: 480,
};

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#C17F3A",
  restaurant: "#C17F3A",
  museum: "#5C6B73",
  culture: "#5C6B73",
  nature: "#2D6A5E",
  park: "#2D6A5E",
  nightlife: "#6B4C7A",
  shopping: "#8B6F5C",
  history: "#7A6B5C",
  architecture: "#4A5568",
  viewpoint: "#3D7A8C",
  wellness: "#6B8F71",
  default: "#2D6A5E",
};
