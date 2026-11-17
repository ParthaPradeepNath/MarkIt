import type { ReactNode } from "react";

import { Inbox, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        compact ? "py-8" : "py-14",
        className
      )}
    >
      <div className="bg-muted text-muted-foreground ring-border/60 mb-3 flex size-11 items-center justify-center rounded-2xl ring-1 ring-inset">
        <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
      </div>
      <p className="text-foreground text-[14px] font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-[13px] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
