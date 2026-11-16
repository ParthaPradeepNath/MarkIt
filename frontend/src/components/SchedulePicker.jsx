import { useState } from "react";
import { format, isSameDay, startOfToday } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Half-hour slots from 07:00 to 21:30, shown as 12-hour labels.
const TIME_SLOTS = Array.from({ length: 30 }, (_, index) => {
  const minutes = 7 * 60 + index * 30;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return {
    hours,
    mins,
    label: format(new Date(2020, 0, 1, hours, mins), "h:mm a"),
  };
});

/**
 * Calendar + time-slot picker for scheduling something on a specific day.
 * Based on ReUI's "Picker Time Slots" example (c-calendar-27).
 *
 * `date` is a Date (or null) and `time` is the slot label (e.g. "10:30 AM").
 */
export default function SchedulePicker({
  id,
  date,
  time,
  onDateChange,
  onTimeChange,
  placeholder = "Pick a day & time",
  className,
}) {
  const [open, setOpen] = useState(false);
  const now = new Date();

  const isPastSlot = (slot) =>
    Boolean(date) &&
    isSameDay(date, now) &&
    (slot.hours < now.getHours() ||
      (slot.hours === now.getHours() && slot.mins <= now.getMinutes()));

  const clear = () => {
    onDateChange(null);
    onTimeChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn("min-w-0 justify-start gap-2 font-normal", className)}
        >
          <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className={cn("truncate", !date && "text-muted-foreground")}>
            {date
              ? `${format(date, "EEE, MMM d")}${time ? ` · ${time}` : ""}`
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex max-sm:flex-col">
          <Calendar
            mode="single"
            selected={date ?? undefined}
            defaultMonth={date ?? undefined}
            onSelect={(next) => {
              onDateChange(next ?? null);
              onTimeChange("");
            }}
            disabled={{ before: startOfToday() }}
            autoFocus
          />
          <div className="relative w-full max-sm:h-48 sm:w-44">
            <div className="absolute inset-0 flex flex-col max-sm:border-t sm:border-s">
              <div className="flex h-10 shrink-0 items-center px-4">
                <p className="truncate text-[13px] font-medium">
                  {date ? format(date, "EEEE, d") : "Pick a day"}
                </p>
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="grid gap-1.5 px-4 pb-3 max-sm:grid-cols-2">
                  {TIME_SLOTS.map((slot) => {
                    const active = time === slot.label;
                    return (
                      <Button
                        key={slot.label}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        disabled={!date || isPastSlot(slot)}
                        className="w-full"
                        onClick={() => onTimeChange(slot.label)}
                        aria-pressed={active}
                      >
                        {slot.label}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
          <Button type="button" size="sm" variant="ghost" onClick={clear} disabled={!date}>
            Clear
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)} disabled={!date}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
