import { cn } from "@/lib/utils";

/**
 * MarkIt mark — a layered bookmark.
 * Inherits currentColor so it works on light, dark and tinted surfaces.
 */
export function Logo({ className, strokeWidth = 2, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0 text-primary", className)}
      {...props}
    >
      <path
        fill="currentColor"
        opacity="0.28"
        d="M11.8 1c-1.67 0-2.75 0-3.65.29-1.83.6-3.26 2.03-3.86 3.86C4 6.05 4 7.13 4 8.8V22c0 .39.23.75.58.91.36.16.77.1 1.07-.15l1.79-1.54c.94-.8 1.6-1.36 2.15-1.77.55-.4.93-.6 1.29-.7.73-.22 1.51-.22 2.24 0 .36.1.74.3 1.29.7.55.41 1.21.97 2.15 1.77l1.79 1.54c.3.25.71.31 1.07.15.35-.16.58-.52.58-.91V8.8c0-1.67 0-2.75-.29-3.65-.6-1.83-2.03-3.26-3.86-3.86C14.95 1 13.87 1 12.2 1z"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        d="m19 22-1.79-1.53c-1.85-1.59-2.78-2.38-3.81-2.68-.91-.27-1.89-.27-2.8 0-1.03.3-1.96 1.09-3.81 2.68L5 22"
      />
    </svg>
  );
}

export function Brand({ collapsed = false, className, markClassName, subtitle = "Attendance" }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-primary/[0.08] ring-1 ring-primary/15",
          markClassName
        )}
      >
        <Logo className="size-[22px]" />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block text-[15px] leading-tight font-semibold tracking-[-0.015em]">
            MarkIt
          </span>
          {subtitle && (
            <span className="block text-[11px] leading-tight text-muted-foreground">{subtitle}</span>
          )}
        </span>
      )}
    </div>
  );
}
