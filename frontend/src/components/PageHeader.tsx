import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="text-muted-foreground text-[11px] font-medium tracking-[0.08em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-foreground text-[22px] leading-[1.15] font-semibold tracking-[-0.025em] sm:text-[26px]">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground max-w-2xl text-[13px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
