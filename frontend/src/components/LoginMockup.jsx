import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import AttendanceRing from "@/components/AttendanceRing";
import StatusBadge from "@/components/StatusBadge";
import SubjectIcon from "@/components/SubjectIcon";
import { cn } from "@/lib/utils";

/**
 * A still product shot for the login brand panel: a cropped miniature of the
 * real "Mark attendance" screen. Real content is the focal point; every row
 * shares one grid so avatars, names and statuses line up, with an even inset
 * around the whole card.
 */
const rollCall = [
  { name: "Arjun Sharma", roll: "B01", status: "present", tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  { name: "Priya Patel", roll: "B02", status: "present", tone: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  { name: "Rahul Verma", roll: "B03", status: "late", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
];

export default function LoginMockup({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-elevated",
        className
      )}
    >
      {/* Quiet browser chrome: centered URL pill, no invented toolbar. */}
      <div className="flex h-9 items-center justify-center border-b border-border/60 bg-muted/25">
        <span className="tnum rounded-full bg-muted/70 px-3 py-0.5 text-[10px] text-muted-foreground">
          markit.app/attendance
        </span>
      </div>

      {/* One even inset for all content; dividers share the same lane. */}
      <div className="p-5">
        {/* Class context — the words that make it recognizably MarkIt. */}
        <div className="flex items-center gap-3">
          <SubjectIcon
            subject="Mathematics"
            name="Mathematics 101"
            className="size-10 rounded-xl"
            iconClassName="size-5"
            strokeWidth={1.8}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] leading-tight font-semibold text-foreground">
              Mathematics 101
            </p>
            <p className="mt-1 truncate text-[11px] leading-tight text-muted-foreground">
              Batch A · 25 students
            </p>
          </div>
        </div>

        <div className="my-4 border-t border-border/60" />

        {/* Payoff: one big number, the count beneath it, a quiet progress line. */}
        <div className="flex items-center gap-5">
          <AttendanceRing value={92} size={82} stroke={8} label="Today" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
              Today&apos;s attendance
            </p>
            <p className="mt-1.5 text-[16px] leading-tight font-semibold tracking-[-0.02em] text-foreground">
              23 of 25 present
            </p>
            <Progress value={92} className="mt-3" />
          </div>
        </div>

        <div className="my-4 border-t border-border/60" />

        {/* Roll call: one grid template for every row so the columns align. */}
        <div>
          <p className="mb-2 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
            Roll call
          </p>
          <div className="space-y-0.5">
            {rollCall.map(({ name, roll, status, tone }) => (
              <div key={roll} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-1.5">
                <Avatar size="sm">
                  <AvatarFallback className={cn("text-[10px] font-medium", tone)}>
                    {name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-[12px] leading-tight font-medium text-foreground">
                    {name}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                    Roll {roll}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
