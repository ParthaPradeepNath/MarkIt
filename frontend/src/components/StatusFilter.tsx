import { cn } from "@/lib/utils";
import type { StatusFilterValue } from "@/types";

type StatusOption = { value: StatusFilterValue; label: string; dot?: string };

const STATUS_OPTIONS: StatusOption[] = [
  { value: "present", label: "Present", dot: "bg-emerald-500" },
  { value: "absent", label: "Absent", dot: "bg-rose-500" },
  { value: "late", label: "Late", dot: "bg-amber-500" },
  { value: "leave", label: "Leave", dot: "bg-sky-500" },
];

type StatusFilterProps = {
  value?: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
  counts?: Partial<Record<string, number>>;
  className?: string;
};

export default function StatusFilter({
  value = "all",
  onChange,
  counts,
  className,
}: StatusFilterProps) {
  const options: StatusOption[] = [
    { value: "all", label: "All" },
    ...STATUS_OPTIONS,
  ];

  return (
    <div
      className={cn(
        "bg-muted inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-full p-1",
        className
      )}
      role="group"
      aria-label="Filter by status"
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors duration-150",
              isActive
                ? "bg-card text-foreground dark:bg-accent shadow-[0_1px_2px_oklch(0_0_0/0.08),0_0_0_1px_oklch(0_0_0/0.03)] dark:shadow-none"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.dot && (
              <span
                className={cn("size-1.5 rounded-full", option.dot)}
                aria-hidden="true"
              />
            )}
            {option.label}
            {counts && counts[option.value] !== undefined && (
              <span
                className={cn(
                  "tnum rounded-full px-1 text-[10px] leading-4",
                  isActive
                    ? "bg-muted text-muted-foreground"
                    : "text-muted-foreground/70"
                )}
              >
                {counts[option.value]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
