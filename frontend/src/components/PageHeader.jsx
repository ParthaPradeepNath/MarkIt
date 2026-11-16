import { cn } from "@/lib/utils";

export default function PageHeader({ title, description, actions, eyebrow, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] leading-[1.15] font-semibold tracking-[-0.025em] text-foreground sm:text-[26px]">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
