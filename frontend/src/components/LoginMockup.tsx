import AttendanceRing from "@/components/AttendanceRing";
import { Badge, type BadgeProps } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AttendanceRow = {
  name: string;
  roll: string;
  status: string;
  badge: NonNullable<BadgeProps["variant"]>;
  time: string;
};

/**
 * A still product shot for the login brand panel: the reui c-table-9 pattern,
 * populated with real MarkIt attendance data.
 */
const activity: AttendanceRow[] = [
  {
    name: "Arjun Sharma",
    roll: "B01",
    status: "Present",
    badge: "success",
    time: "9:02 AM",
  },
  {
    name: "Priya Patel",
    roll: "B02",
    status: "Present",
    badge: "success",
    time: "9:03 AM",
  },
  {
    name: "Rahul Verma",
    roll: "B03",
    status: "Late",
    badge: "warning-outline",
    time: "9:11 AM",
  },
  {
    name: "Sneha Iyer",
    roll: "B04",
    status: "Absent",
    badge: "destructive-light",
    time: "9:15 AM",
  },
  {
    name: "Kabir Singh",
    roll: "B05",
    status: "Present",
    badge: "success",
    time: "9:16 AM",
  },
];

export default function LoginMockup({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("w-full max-w-[540px]", className)}>
      <Frame spacing="sm" className="shadow-elevated">
        <FrameHeader className="flex-row items-center justify-between gap-4">
          <div className="min-w-0">
            <FrameTitle>Today&apos;s attendance</FrameTitle>
            <FrameDescription>Mathematics 101 · Batch A</FrameDescription>
          </div>
          <AttendanceRing value={92} size={56} stroke={6} />
        </FrameHeader>

        <FramePanel className="p-0!">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.map(({ name, roll, status, badge, time }) => (
                <TableRow key={roll}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-muted text-[10px] font-medium">
                          {name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] font-medium">{name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={badge} size="sm">
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="tnum text-muted-foreground text-[12px]">
                    {roll}
                  </TableCell>
                  <TableCell className="text-muted-foreground tnum text-right text-[12px]">
                    {time}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </FramePanel>
      </Frame>
    </div>
  );
}
