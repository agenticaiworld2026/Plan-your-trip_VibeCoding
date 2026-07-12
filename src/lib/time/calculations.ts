import { PACE_BUDGETS, type Pace, type Stop, type TripDay } from "@/types/trip";

export function getCategoryColor(category: string): string {
  const key = category.toLowerCase();
  const colors: Record<string, string> = {
    food: "#C17F3A",
    restaurant: "#C17F3A",
    cafe: "#C17F3A",
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
  };
  return colors[key] ?? "#2D6A5E";
}

export function calculateDayTotals(stops: Stop[]) {
  const totalActiveMinutes = stops.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalTravelMinutes = stops.reduce(
    (sum, s) => sum + s.travelFromPreviousMinutes,
    0
  );
  return { totalActiveMinutes, totalTravelMinutes };
}

export function isDayOverpacked(
  totalActiveMinutes: number,
  totalTravelMinutes: number,
  pace: Pace
): boolean {
  const budget = PACE_BUDGETS[pace];
  return totalActiveMinutes + totalTravelMinutes > budget;
}

export function recalculateDay(
  day: TripDay,
  pace: Pace
): TripDay {
  const { totalActiveMinutes, totalTravelMinutes } = calculateDayTotals(day.stops);
  return {
    ...day,
    totalActiveMinutes,
    totalTravelMinutes,
    isOverpacked: isDayOverpacked(totalActiveMinutes, totalTravelMinutes, pace),
  };
}

export function recalculateTravelOnReorder(stops: Stop[]): Stop[] {
  if (stops.length === 0) return stops;

  return stops.map((stop, index) => {
    if (index === 0) {
      return { ...stop, travelFromPreviousMinutes: 0 };
    }
    const prev = stops[index - 1];
    const base = stop.travelFromPreviousMinutes || 15;
    const sameCategory = prev.category.toLowerCase() === stop.category.toLowerCase();
    const adjusted = sameCategory
      ? Math.max(5, Math.round(base * 0.8))
      : Math.min(90, Math.round(base * 1.1));
    return { ...stop, travelFromPreviousMinutes: adjusted };
  });
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
