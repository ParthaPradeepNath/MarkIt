import { RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ErrorState({
  title = "Couldn't load this page",
  description,
  error,
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/[0.025] px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/15 ring-inset">
        <TriangleAlert className="size-5" strokeWidth={1.7} aria-hidden="true" />
      </div>
      <p className="text-[14px] font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        {description || error || "Check your connection and try again."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
