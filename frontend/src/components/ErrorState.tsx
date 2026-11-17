import type { ReactNode } from "react";

import { RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: ReactNode;
  error?: ReactNode;
  onRetry?: () => void;
  className?: string;
};

export default function ErrorState({
  title = "Couldn't load this page",
  description,
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "border-destructive/20 bg-destructive/[0.025] flex flex-col items-center justify-center rounded-xl border px-6 py-12 text-center",
        className
      )}
    >
      <div className="bg-destructive/10 text-destructive ring-destructive/15 mb-3 flex size-11 items-center justify-center rounded-2xl ring-1 ring-inset">
        <TriangleAlert
          className="size-5"
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </div>
      <p className="text-foreground text-[14px] font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-sm text-[13px] leading-relaxed">
        {description || error || "Check your connection and try again."}
      </p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={onRetry}
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
