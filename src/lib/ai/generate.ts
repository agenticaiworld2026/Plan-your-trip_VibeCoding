import { z } from "zod";
import type { CreateTripInput, TripPreferences } from "@/types/trip";

export const aiItinerarySchema = z.object({
  tripTitle: z.string(),
  days: z.array(
    z.object({
      dayIndex: z.number(),
      label: z.string(),
      stops: z.array(
        z.object({
          name: z.string(),
          category: z.string(),
          description: z.string(),
          durationMinutes: z.number(),
          travelFromPreviousMinutes: z.number(),
          suggestedStartTime: z.string(),
          suggestedEndTime: z.string(),
          lat: z.number().optional(),
          lng: z.number().optional(),
          placeId: z.string().optional(),
          openingHours: z.string().optional(),
        })
      ),
    })
  ),
});

export type AIItinerary = z.infer<typeof aiItinerarySchema>;

export const resuggestSchema = z.object({
  days: z.array(
    z.object({
      dayIndex: z.number(),
      stops: z.array(
        z.object({
          name: z.string(),
          category: z.string(),
          travelFromPreviousMinutes: z.number(),
          suggestedStartTime: z.string(),
          suggestedEndTime: z.string(),
        })
      ),
    })
  ),
});

export type ResuggestResult = z.infer<typeof resuggestSchema>;

function buildPrompt(input: CreateTripInput): string {
  const p = input.preferences;
  return `Create a detailed ${input.dayCount}-day travel itinerary for ${input.destination}${input.destinationCountry ? `, ${input.destinationCountry}` : ""}.

Trip starts: ${input.startDate}
Party size: ${p.partySize}
Travel style: ${p.travelStyle}
Pace: ${p.pace} (relaxed=4-5h active/day, moderate=6-6.5h, packed=7-8h)
Budget: ${p.budget}
Interests: ${p.interests.join(", ")}
${p.optionalNotes ? `Special notes: ${p.optionalNotes}` : ""}

Return JSON with realistic stops, estimated durations, travel times between stops, and suggested time windows (HH:mm format).
Include 3-5 stops per day. First stop of each day should have travelFromPreviousMinutes: 0.
Use real or realistic place names. Categories: food, museum, nature, nightlife, shopping, history, architecture, viewpoint, wellness, culture.`;
}

export async function generateItinerary(
  input: CreateTripInput
): Promise<AIItinerary> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return getMockItinerary(input);
  }

  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert travel planner. Return only valid JSON matching the requested schema. No markdown.",
      },
      {
        role: "user",
        content: buildPrompt(input),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "itinerary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            tripTitle: { type: "string" },
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dayIndex: { type: "number" },
                  label: { type: "string" },
                  stops: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        category: { type: "string" },
                        description: { type: "string" },
                        durationMinutes: { type: "number" },
                        travelFromPreviousMinutes: { type: "number" },
                        suggestedStartTime: { type: "string" },
                        suggestedEndTime: { type: "string" },
                      },
                      required: [
                        "name",
                        "category",
                        "description",
                        "durationMinutes",
                        "travelFromPreviousMinutes",
                        "suggestedStartTime",
                        "suggestedEndTime",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["dayIndex", "label", "stops"],
                additionalProperties: false,
              },
            },
          },
          required: ["tripTitle", "days"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  const parsed = JSON.parse(content);
  return aiItinerarySchema.parse(parsed);
}

export async function resuggestDays(
  preferences: TripPreferences,
  destination: string,
  affectedDays: Array<{ dayIndex: number; label: string; stops: Array<{ name: string; category: string; durationMinutes: number }> }>
): Promise<ResuggestResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return getMockResuggest(affectedDays);
  }

  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Adjust time windows and travel estimates for reordered stops. Return only valid JSON.",
      },
      {
        role: "user",
        content: `Destination: ${destination}. Pace: ${preferences.pace}. Adjust these days:\n${JSON.stringify(affectedDays)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");
  return resuggestSchema.parse(JSON.parse(content));
}

function getMockItinerary(input: CreateTripInput): AIItinerary {
  const dest = input.destination;
  const dayCount = Math.min(input.dayCount, 5);

  const templates = [
    {
      dayIndex: 0,
      label: `Arrival & First Impressions`,
      stops: [
        { name: `${dest} Old Town Walk`, category: "history", description: "Stroll through historic streets and main square", durationMinutes: 90, travelFromPreviousMinutes: 0, suggestedStartTime: "14:00", suggestedEndTime: "15:30" },
        { name: `Local Market`, category: "food", description: "Sample regional specialties and street food", durationMinutes: 60, travelFromPreviousMinutes: 15, suggestedStartTime: "15:45", suggestedEndTime: "16:45" },
        { name: `Sunset Viewpoint`, category: "viewpoint", description: "Panoramic views over the city", durationMinutes: 45, travelFromPreviousMinutes: 20, suggestedStartTime: "17:30", suggestedEndTime: "18:15" },
        { name: `Neighborhood Bistro`, category: "food", description: "Casual dinner with local cuisine", durationMinutes: 90, travelFromPreviousMinutes: 25, suggestedStartTime: "19:00", suggestedEndTime: "20:30" },
      ],
    },
    {
      dayIndex: 1,
      label: `Culture & Museums`,
      stops: [
        { name: `${dest} National Museum`, category: "museum", description: "Core collection and highlights tour", durationMinutes: 120, travelFromPreviousMinutes: 0, suggestedStartTime: "10:00", suggestedEndTime: "12:00" },
        { name: `Garden Café`, category: "food", description: "Light lunch in a scenic setting", durationMinutes: 60, travelFromPreviousMinutes: 10, suggestedStartTime: "12:15", suggestedEndTime: "13:15" },
        { name: `Architecture District`, category: "architecture", description: "Notable buildings and design landmarks", durationMinutes: 90, travelFromPreviousMinutes: 20, suggestedStartTime: "14:00", suggestedEndTime: "15:30" },
        { name: `Artisan Quarter`, category: "shopping", description: "Boutiques and local crafts", durationMinutes: 75, travelFromPreviousMinutes: 15, suggestedStartTime: "16:00", suggestedEndTime: "17:15" },
      ],
    },
    {
      dayIndex: 2,
      label: `Nature & Hidden Gems`,
      stops: [
        { name: `City Park`, category: "nature", description: "Morning walk through green spaces", durationMinutes: 75, travelFromPreviousMinutes: 0, suggestedStartTime: "09:00", suggestedEndTime: "10:15" },
        { name: `Hidden Courtyard`, category: "hidden gems", description: "Off-the-beaten-path local favorite", durationMinutes: 45, travelFromPreviousMinutes: 25, suggestedStartTime: "10:45", suggestedEndTime: "11:30" },
        { name: `Riverside Promenade`, category: "nature", description: "Scenic waterfront stroll", durationMinutes: 60, travelFromPreviousMinutes: 20, suggestedStartTime: "12:00", suggestedEndTime: "13:00" },
        { name: `Wellness Spa`, category: "wellness", description: "Afternoon relaxation", durationMinutes: 90, travelFromPreviousMinutes: 30, suggestedStartTime: "15:00", suggestedEndTime: "16:30" },
      ],
    },
  ];

  const days = Array.from({ length: dayCount }, (_, i) => {
    const template = templates[i % templates.length];
    return { ...template, dayIndex: i, label: i < templates.length ? template.label : `Day ${i + 1} Exploration` };
  });

  return {
    tripTitle: `${input.dayCount} Days in ${dest}`,
    days,
  };
}

function getMockResuggest(
  affectedDays: Array<{ dayIndex: number; stops: Array<{ name: string; category: string; durationMinutes: number }> }>
): ResuggestResult {
  const startHours = [9, 10, 11, 14];
  return {
    days: affectedDays.map((day, di) => {
      let hour = startHours[di % startHours.length];
      let minute = 0;
      return {
        dayIndex: day.dayIndex,
        stops: day.stops.map((stop, si) => {
          const travel = si === 0 ? 0 : 15 + (si * 5);
          const startH = hour;
          const startM = minute;
          const endTotal = startH * 60 + startM + stop.durationMinutes;
          const endH = Math.floor(endTotal / 60);
          const endM = endTotal % 60;
          const result = {
            name: stop.name,
            category: stop.category,
            travelFromPreviousMinutes: travel,
            suggestedStartTime: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
            suggestedEndTime: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
          };
          const nextStart = endTotal + travel;
          hour = Math.floor(nextStart / 60);
          minute = nextStart % 60;
          return result;
        }),
      };
    }),
  };
}
