import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseValue(value) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toValue(date) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

/**
 * Single-day picker that keeps its value as a `yyyy-MM-dd` string, so it can
 * drop in wherever a native `<input type="date">` was used.
 */
export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  max,
  className,
}) {
  const [open, setOpen] = useState(false);
  const selected = parseValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn("min-w-0 justify-start gap-2 font-normal", className)}
        >
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? format(selected, "PPP") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(next) => {
            onChange(next ? toValue(next) : "");
            setOpen(false);
          }}
          disabled={max ? { after: max } : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
