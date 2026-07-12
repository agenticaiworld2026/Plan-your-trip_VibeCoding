"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import * as Accordion from "@radix-ui/react-accordion";
import * as Slider from "@radix-ui/react-slider";
import { ChevronDown, Minus, Plus } from "lucide-react";
import {
  INTERESTS,
  type WizardFormData,
  type Interest,
  type Pace,
  type Budget,
  type TravelStyle,
} from "@/types/trip";
import { cn } from "@/lib/utils";

const POPULAR_DESTINATIONS = [
  "Lisbon, Portugal",
  "Tokyo, Japan",
  "Barcelona, Spain",
  "Paris, France",
  "New York, USA",
  "Bali, Indonesia",
];

const TRAVEL_STYLES: { value: TravelStyle; label: string }[] = [
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "friends", label: "Friends" },
  { value: "business", label: "Business" },
];

const BUDGETS: { value: Budget; label: string }[] = [
  { value: "budget", label: "Budget" },
  { value: "mid", label: "Mid-range" },
  { value: "premium", label: "Premium" },
];

const PACE_LABELS: Pace[] = ["relaxed", "moderate", "packed"];
const PACE_DISPLAY = ["Relaxed", "Moderate", "Packed"];

const defaultForm: WizardFormData = {
  destination: "",
  destinationCountry: "",
  startDate: new Date().toISOString().split("T")[0],
  dayCount: 3,
  interests: [],
  pace: "moderate",
  budget: "mid",
  travelStyle: "couple",
  partySize: 2,
  optionalNotes: "",
};

interface TripWizardProps {
  initialData?: Partial<WizardFormData>;
  onComplete: (data: WizardFormData) => void;
  onCancel?: () => void;
}

export function TripWizard({ initialData, onComplete, onCancel }: TripWizardProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardFormData>({ ...defaultForm, ...initialData });

  const update = <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (interest: Interest) => {
    setForm((prev) => {
      const has = prev.interests.includes(interest);
      if (has) return { ...prev, interests: prev.interests.filter((i) => i !== interest) };
      if (prev.interests.length >= 6) return prev;
      return { ...prev, interests: [...prev.interests, interest] };
    });
  };

  const canNext = () => {
    if (step === 0) return form.destination.trim().length > 0 && form.dayCount >= 1;
    if (step === 1) return form.interests.length >= 1;
    return true;
  };

  const handleDestinationSelect = (dest: string) => {
    const parts = dest.split(",").map((s) => s.trim());
    update("destination", parts[0]);
    update("destinationCountry", parts[1] ?? "");
  };

  const paceIndex = PACE_LABELS.indexOf(form.pace);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= step ? "bg-accent" : "bg-border"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        >
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Where are you going?</h2>
                <p className="mt-1 text-text-secondary">Choose a destination and trip length</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Destination</label>
                <Input
                  placeholder="City or region"
                  value={form.destination}
                  onChange={(e) => update("destination", e.target.value)}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {POPULAR_DESTINATIONS.map((d) => (
                    <Chip
                      key={d}
                      label={d}
                      selected={form.destination === d.split(",")[0]}
                      onClick={() => handleDestinationSelect(d)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Start date</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Number of days</label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => update("dayCount", Math.max(1, form.dayCount - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-2xl font-semibold tabular-nums">{form.dayCount}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => update("dayCount", Math.min(14, form.dayCount + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">What interests you?</h2>
                <p className="mt-1 text-text-secondary">Pick 1–6 categories</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <Chip
                    key={interest}
                    label={interest}
                    selected={form.interests.includes(interest)}
                    onClick={() => toggleInterest(interest)}
                    disabled={!form.interests.includes(interest) && form.interests.length >= 6}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Trip style</h2>
                <p className="mt-1 text-text-secondary">Pace, budget, and who&apos;s traveling</p>
              </div>

              <div>
                <label className="mb-4 block text-sm font-medium text-text-secondary">Pace</label>
                <Slider.Root
                  className="relative flex h-5 w-full touch-none items-center"
                  value={[paceIndex]}
                  onValueChange={([v]) => update("pace", PACE_LABELS[v])}
                  min={0}
                  max={2}
                  step={1}
                >
                  <Slider.Track className="relative h-1.5 grow rounded-full bg-border">
                    <Slider.Range className="absolute h-full rounded-full bg-accent" />
                  </Slider.Track>
                  <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-accent bg-bg-surface shadow-md focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </Slider.Root>
                <div className="mt-2 flex justify-between text-sm text-text-secondary">
                  {PACE_DISPLAY.map((l, i) => (
                    <span key={l} className={PACE_LABELS[i] === form.pace ? "font-medium text-accent" : ""}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-text-secondary">Budget</label>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <Chip
                      key={b.value}
                      label={b.label}
                      selected={form.budget === b.value}
                      onClick={() => update("budget", b.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-text-secondary">Travel style</label>
                <div className="flex flex-wrap gap-2">
                  {TRAVEL_STYLES.map((s) => (
                    <Chip
                      key={s.value}
                      label={s.label}
                      selected={form.travelStyle === s.value}
                      onClick={() => update("travelStyle", s.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Party size</label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => update("partySize", Math.max(1, form.partySize - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-2xl font-semibold tabular-nums">{form.partySize}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => update("partySize", Math.min(20, form.partySize + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Anything else?</h2>
                <p className="mt-1 text-text-secondary">Optional details to personalize your plan</p>
              </div>

              <Accordion.Root type="single" collapsible>
                <Accordion.Item value="notes" className="rounded-xl border border-border bg-bg-surface">
                  <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-4 text-left text-[15px] font-medium text-text-primary [&[data-state=open]>svg]:rotate-180">
                    Anything else we should know?
                    <ChevronDown className="h-4 w-4 text-text-secondary transition-transform duration-200" />
                  </Accordion.Trigger>
                  <Accordion.Content className="overflow-hidden px-4 pb-4 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <textarea
                      className="min-h-[120px] w-full resize-none rounded-xl border border-border bg-bg-base px-4 py-3 text-[15px] text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder='e.g. "vegetarian", "avoid crowds", "must see the Eiffel Tower"'
                      maxLength={500}
                      value={form.optionalNotes}
                      onChange={(e) => update("optionalNotes", e.target.value)}
                    />
                    <p className="mt-1 text-right text-xs text-text-secondary">{form.optionalNotes.length}/500</p>
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>

              <div className="rounded-xl bg-accent-muted p-4">
                <p className="text-sm font-medium text-accent">Trip summary</p>
                <p className="mt-1 text-[15px] text-text-primary">
                  {form.dayCount} days in {form.destination}
                  {form.destinationCountry && `, ${form.destinationCountry}`}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {form.interests.slice(0, 3).join(", ")}
                  {form.interests.length > 3 && ` +${form.interests.length - 3} more`}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
              Continue
            </Button>
          ) : (
            <Button onClick={() => onComplete(form)}>Generate itinerary</Button>
          )}
        </div>
      </div>
    </div>
  );
}
