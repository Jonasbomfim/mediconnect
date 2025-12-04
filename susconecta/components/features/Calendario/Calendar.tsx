import React, { useState, useCallback, useMemo } from "react";
import { EventCard } from "./EventCard";
import { Card } from "@/components/ui/card";

// Types
import { Event } from "@/components/features/general/event-manager";

// Week View Component
export function WeekView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
  onDragStart: (event: Event) => void;
  onDragEnd: () => void;
  onDrop: (date: Date, hour: number) => void;
  getColorClasses: (color: string) => { bg: string; text: string };
}) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      const eventHour = eventDate.getHours();
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        eventHour === hour
      );
    });
  };

  // dias da semana em pt-BR (abreviações)
  const weekDayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <Card className="overflow-auto">
      <div className="grid grid-cols-8 border-b">
        <div className="border-r p-2 text-center text-xs font-medium sm:text-sm">
          Hora
        </div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm"
          >
            <div className="hidden sm:block">
              {day.toLocaleDateString("pt-BR", { weekday: "short" })}
            </div>
            <div className="sm:hidden">
              {day.toLocaleDateString("pt-BR", { weekday: "narrow" })}
            </div>
            <div className="text-[10px] text-muted-foreground sm:text-xs">
              {day.toLocaleDateString("pt-BR", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8">
        {hours.map((hour) => (
          <React.Fragment key={`hour-${hour}`}>
            <div
              key={`time-${hour}`}
              className="border-b border-r p-1 text-[10px] text-muted-foreground sm:p-2 sm:text-xs"
            >
              {hour.toString().padStart(2, "0")}:00
            </div>
            {weekDays.map((day) => {
              const dayEvents = getEventsForDayAndHour(day, hour);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-12 border-b border-r p-0.5 transition-colors hover:bg-accent/50 last:border-r-0 sm:min-h-16 sm:p-1"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(day, hour)}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEventClick={onEventClick}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        getColorClasses={getColorClasses}
                        variant="default"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}