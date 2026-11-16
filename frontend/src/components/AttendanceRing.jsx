import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Signature attendance ring. Animates its stroke once on mount,
 * then transitions smoothly whenever the value changes.
 */
export default function AttendanceRing({
  value = 0,
  size = 120,
  stroke = 10,
  label,
  className,
  tone = "auto",
}) {
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(reduce ? Number(value) || 0 : 0);
  const hasValue = value !== null && value !== undefined && Number.isFinite(Number(value));
  const safeValue = hasValue ? Math.min(Math.max(Number(value), 0), 100) : 0;

  useEffect(() => {
    if (reduce) {
      setProgress(safeValue);
      return;
    }
    const frame = requestAnimationFrame(() => setProgress(safeValue));
    return () => cancelAnimationFrame(frame);
  }, [safeValue, reduce]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isRisk = tone === "danger" || (tone === "auto" && hasValue && safeValue < 75);
  const strokeColor = isRisk ? "var(--destructive)" : "var(--primary)";

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={hasValue ? `${Math.round(safeValue)} percent attendance` : "No attendance data"}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: reduce ? "none" : "stroke-dashoffset 900ms var(--ease-out)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-[24px] leading-none font-semibold tracking-[-0.03em] text-foreground">
          {hasValue ? Math.round(safeValue) : "—"}
          {hasValue && <span className="ml-0.5 text-[13px] font-medium text-muted-foreground">%</span>}
        </span>
        {label && (
          <span className="mt-1 text-[10px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
