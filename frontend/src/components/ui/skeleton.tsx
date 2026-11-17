import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("shimmer bg-muted/70 rounded-lg", className)}
      {...props}
    />
  );
}

export { Skeleton };
