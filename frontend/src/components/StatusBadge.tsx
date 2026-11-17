import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/types";

const config = {
  present: {
    label: "Present",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  },
  absent: {
    label: "Absent",
    className: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400",
  },
  late: {
    label: "Late",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400",
  },
  leave: {
    label: "Leave",
    className: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400",
  },
};

type StatusBadgeProps = {
  status: AttendanceStatus;
  label?: string;
  className?: string;
};

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const c = config[status] || config.present;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium ring-1 ring-inset",
        c.className,
        className
      )}
    >
      {label ?? c.label}
    </span>
  );
}

export { config as statusConfig };
