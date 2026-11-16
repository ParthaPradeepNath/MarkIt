import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const tones = {
  primary: "bg-primary/[0.08] text-primary ring-primary/15",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/[0.12] text-warning ring-warning/20",
  danger: "bg-destructive/10 text-destructive ring-destructive/15",
  info: "bg-info/10 text-info ring-info/20",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export default function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  tone = "primary",
  className,
  action,
}) {
  return (
    <Card className={cn("relative", className)}>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
            {title}
          </p>
          <p className="tnum text-[28px] leading-none font-semibold tracking-[-0.03em] text-foreground">
            {value}
          </p>
          {sub && <p className="text-xs leading-relaxed text-muted-foreground">{sub}</p>}
          {action}
        </div>
        {Icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[10px] ring-1 ring-inset",
              tones[tone] || tones.primary
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
          </span>
        )}
      </CardContent>
    </Card>
  );
}
