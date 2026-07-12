# Waypoint — AI Itinerary Planner

A premium AI-powered trip planner with a guided setup wizard and day-by-day kanban board.

## Features

- **Guided trip wizard** — destination, dates, interests (chips), pace, budget, travel style, optional notes
- **AI itinerary generation** — structured day-by-day plans (OpenAI when configured, mock data otherwise)
- **Kanban board** — drag stops within/between days with smooth animations
- **Time intelligence** — active + travel time per day, overpacked warnings
- **Re-suggest on move** — debounced AI time adjustments after drag
- **Save & resume** — local JSON store with demo auth (Supabase-ready schema included)
- **Map panel** — Google Maps embed when API key is set
- **Route optimization** — nearest-neighbor ordering (enhanced with Google Routes API)
- **Share links** — read-only public itinerary view
- **Export** — print-friendly PDF via browser print
- **Dark mode** — toggle in header
- **PWA manifest** — installable web app metadata

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment (optional)

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Real AI generation (falls back to mock without it) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps embed + places enrichment |
| `NEXT_PUBLIC_APP_URL` | Base URL for share links |

### Demo auth

No password required — enter any email on the auth modal to sign in. Trips are stored in `data/trips.json`.

### Supabase (production)

Run `supabase/schema.sql` in your Supabase SQL editor for the production schema with RLS.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint

## Tech stack

Next.js 16 · React 19 · Tailwind CSS v4 · Framer Motion · @dnd-kit · Zod · OpenAI · Radix UI
