import React, { useState } from "react";
import { Event } from "@/components/event-manager";
import { cn } from "@/lib/utils";

/*
  Componente leve para representar um evento no calendário.
  Compatível com o uso em Calendar.tsx (WeekView / DayView).
*/

export function EventCard({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  getColorClasses,
  variant = "default",
}: {
  event: Event;
  onEventClick: (e: Event) => void;
  onDragStart: (e: Event) => void;
  onDragEnd: () => void;
  getColorClasses: (color: string) => { bg: string; text: string };
  variant?: "default" | "compact" | "detailed";
}) {
  const [hover, setHover] = useState(false);
  const color = getColorClasses?.(event.color) ?? { bg: "bg-slate-400", text: "text-white" };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", event.id);
    onDragStart && onDragStart(event);
  };

  const handleClick = () => {
    onEventClick && onEventClick(event);
  };

  if (variant === "compact") {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={() => onDragEnd && onDragEnd()}
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(
          "rounded px-2 py-0.5 text-xs font-medium truncate",
          color.bg,
          color.text,
          "cursor-pointer transition-all",
          hover && "shadow-md scale-105"
        )}
      >
        {event.title}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={() => onDragEnd && onDragEnd()}
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(
          "rounded-lg p-2 text-sm cursor-pointer transition-all",
          color.bg,
          color.text,
          hover && "shadow-lg scale-[1.02]"
        )}
      >
        <div className="font-semibold">{event.title}</div>
        {event.description && <div className="text-xs opacity-90 mt-1 line-clamp-2">{event.description}</div>}
        <div className="mt-1 text-[11px] opacity-80">
          {event.startTime?.toLocaleTimeString?.("pt-BR", { hour: "2-digit", minute: "2-digit" }) ?? ""} - {event.endTime?.toLocaleTimeString?.("pt-BR", { hour: "2-digit", minute: "2-digit" }) ?? ""}
        </div>
      </div>
    );
  }

  // default
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => onDragEnd && onDragEnd()}
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "relative rounded px-2 py-1 text-xs font-medium cursor-pointer transition-all",
        color.bg,
        color.text,
        hover && "shadow-md scale-105"
      )}
    >
      <div className="truncate">{event.title}</div>
    </div>
  );
}
