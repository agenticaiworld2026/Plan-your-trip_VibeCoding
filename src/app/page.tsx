import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-32">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-accent">
              AI-powered travel planning
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-text-primary md:text-5xl md:leading-[1.1]">
              Your trip, planned day by day
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary md:text-xl">
              Answer a few guided questions. Get a full itinerary on a beautiful kanban board.
              Drag stops between days, see travel times, and never overpack a day again.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/trips/new"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-accent px-7 text-base font-medium text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Plan a trip
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/trips"
                className="inline-flex h-13 items-center justify-center rounded-xl border border-border bg-bg-surface px-7 text-base font-medium text-text-primary transition-all hover:bg-accent-muted active:scale-[0.98]"
              >
                My trips
              </Link>
            </div>
          </div>

          <div className="mt-20 grid gap-4 md:grid-cols-3">
            {[
              { title: "Guided setup", desc: "Chips, sliders, and toggles — no blank page anxiety" },
              { title: "Kanban board", desc: "Drag stops between days with satisfying micro-interactions" },
              { title: "Time-aware", desc: "See active and travel time — overpacked days stand out" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-bg-surface p-6 shadow-sm"
              >
                <h3 className="font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 overflow-hidden rounded-2xl border border-border bg-bg-surface p-4 shadow-md">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3].map((day) => (
                <div key={day} className="w-[280px] shrink-0 rounded-xl bg-bg-base p-4">
                  <div className="mb-3 h-3 w-20 rounded bg-accent-muted" />
                  <div className="mb-2 h-4 w-32 rounded bg-accent/20" />
                  {[1, 2, 3].map((card) => (
                    <div
                      key={card}
                      className="mb-2 rounded-lg border border-border bg-bg-surface p-3 shadow-sm"
                    >
                      <div className="h-3 w-3/4 rounded bg-text-primary/10" />
                      <div className="mt-2 h-2 w-1/2 rounded bg-text-secondary/10" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
