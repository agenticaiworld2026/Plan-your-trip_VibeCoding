"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { DayColumn } from "@/components/kanban/day-column";
import { StopCardOverlay } from "@/components/kanban/stop-card";
import { recalculateTravelOnReorder, recalculateDay } from "@/lib/time/calculations";
import type { Trip, Stop } from "@/types/trip";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  trip: Trip;
  onTripUpdate: (trip: Trip) => void;
  onStopClick?: (stopId: string) => void;
  mobileDayIndex?: number;
  className?: string;
}

export function KanbanBoard({
  trip,
  onTripUpdate,
  onStopClick,
  mobileDayIndex = 0,
  className,
}: KanbanBoardProps) {
  const [days, setDays] = useState(trip.days);
  const [activeStop, setActiveStop] = useState<Stop | null>(null);
  const [overDayId, setOverDayId] = useState<string | null>(null);
  const resuggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const affectedDays = useRef<Set<string>>(new Set());

  useEffect(() => {
    setDays(trip.days);
  }, [trip.days]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findStop = useCallback(
    (stopId: string) => {
      for (const day of days) {
        const stop = day.stops.find((s) => s.id === stopId);
        if (stop) return { stop, day };
      }
      return null;
    },
    [days]
  );

  const persistTrip = useCallback(
    async (updatedDays: typeof days, movedStop?: { stopId: string; tripDayId: string; sortOrder: number }) => {
      let resultTrip = { ...trip, days: updatedDays };

      if (movedStop) {
        try {
          const res = await fetch(`/api/trips/${trip.id}/stops`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(movedStop),
          });
          if (res.ok) {
            const data = await res.json();
            resultTrip = data.trip;
          }
        } catch {
          // keep optimistic state
        }
      }

      onTripUpdate(resultTrip);
      return resultTrip;
    },
    [trip, onTripUpdate]
  );

  const scheduleResuggest = useCallback(
    (dayIds: string[]) => {
      dayIds.forEach((id) => affectedDays.current.add(id));
      if (resuggestTimer.current) clearTimeout(resuggestTimer.current);
      resuggestTimer.current = setTimeout(async () => {
        const ids = Array.from(affectedDays.current);
        affectedDays.current.clear();
        if (ids.length === 0) return;
        try {
          const res = await fetch(`/api/trips/${trip.id}/resuggest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ affectedDayIds: ids }),
          });
          if (res.ok) {
            const data = await res.json();
            onTripUpdate(data.trip);
          }
        } catch {
          // silent fail
        }
      }, 800);
    },
    [trip.id, onTripUpdate]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const found = findStop(event.active.id as string);
    if (found) setActiveStop(found.stop);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverDayId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeFound = findStop(activeId);
    if (!activeFound) return;

    const overDay = days.find((d) => d.id === overId);
    const overStop = findStop(overId);
    const targetDayId = overDay?.id ?? overStop?.day.id;

    if (!targetDayId || targetDayId === activeFound.day.id) {
      setOverDayId(targetDayId ?? null);
      return;
    }

    setOverDayId(targetDayId);

    setDays((prev) => {
      const activeDayIdx = prev.findIndex((d) => d.id === activeFound.day.id);
      const overDayIdx = prev.findIndex((d) => d.id === targetDayId);
      if (activeDayIdx === -1 || overDayIdx === -1) return prev;

      const newDays = [...prev];
      const sourceStops = [...newDays[activeDayIdx].stops];
      const activeIndex = sourceStops.findIndex((s) => s.id === activeId);
      const [moved] = sourceStops.splice(activeIndex, 1);

      const destStops = [...newDays[overDayIdx].stops];
      let insertIndex = destStops.length;
      if (overStop) {
        insertIndex = destStops.findIndex((s) => s.id === overId);
      }

      moved.tripDayId = targetDayId;
      destStops.splice(insertIndex, 0, moved);

      newDays[activeDayIdx] = recalculateDay(
        { ...newDays[activeDayIdx], stops: sourceStops.map((s, i) => ({ ...s, sortOrder: i })) },
        trip.preferences.pace
      );
      newDays[overDayIdx] = recalculateDay(
        {
          ...newDays[overDayIdx],
          stops: recalculateTravelOnReorder(destStops.map((s, i) => ({ ...s, sortOrder: i }))),
        },
        trip.preferences.pace
      );

      return newDays;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveStop(null);
    setOverDayId(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeFound = findStop(activeId);
    if (!activeFound) return;

    let newDays = [...days];
    const activeDayIdx = newDays.findIndex((d) => d.stops.some((s) => s.id === activeId));
    const activeDay = newDays[activeDayIdx];

    const overInSameDay = activeDay.stops.some((s) => s.id === overId);
    const overDay = newDays.find((d) => d.id === overId);

    if (overInSameDay) {
      const oldIndex = activeDay.stops.findIndex((s) => s.id === activeId);
      const newIndex = activeDay.stops.findIndex((s) => s.id === overId);
      if (oldIndex !== newIndex) {
        const reordered = recalculateTravelOnReorder(
          arrayMove(activeDay.stops, oldIndex, newIndex).map((s, i) => ({ ...s, sortOrder: i }))
        );
        newDays[activeDayIdx] = recalculateDay({ ...activeDay, stops: reordered }, trip.preferences.pace);
      }
    } else if (overDay) {
      // already handled in dragOver
    }

    setDays(newDays);

    const finalDay = newDays.find((d) => d.stops.some((s) => s.id === activeId));
    const sortOrder = finalDay?.stops.findIndex((s) => s.id === activeId) ?? 0;

    const changedDayIds = new Set<string>();
    changedDayIds.add(activeFound.day.id);
    if (finalDay) changedDayIds.add(finalDay.id);

    await persistTrip(newDays, {
      stopId: activeId,
      tripDayId: finalDay?.id ?? activeFound.day.id,
      sortOrder,
    });

    scheduleResuggest(Array.from(changedDayIds));
  };

  const isMobile = useIsMobile();
  const visibleDays = isMobile ? days.filter((_, i) => i === mobileDayIndex) : days;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "flex gap-4 overflow-x-auto pb-4",
          "snap-x snap-mandatory md:snap-none",
          className
        )}
        role="region"
        aria-label="Itinerary kanban board"
      >
        {visibleDays.map((day) => (
          <motion.div
            key={day.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: day.dayIndex * 0.08 }}
            className="snap-center"
          >
            <DayColumn
              day={day}
              pace={trip.preferences.pace}
              isOver={overDayId === day.id}
              onStopClick={onStopClick}
            />
          </motion.div>
        ))}
      </div>

      <DragOverlay>
        {activeStop ? <StopCardOverlay stop={activeStop} /> : null}
      </DragOverlay>

      <div className="sr-only" aria-live="polite" aria-atomic="true" id="board-announcer" />
    </DndContext>
  );
}
