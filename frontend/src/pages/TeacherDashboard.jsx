import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarPlus,
  ChevronRight,
  ClipboardList,
  School,
  TriangleAlert,
  Users,
} from "lucide-react";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import AttendanceRing from "@/components/AttendanceRing";
import SubjectIcon from "@/components/SubjectIcon";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { DashboardSkeleton } from "@/components/Skeletons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { firstName, getErrorMessage, greeting, initials, plural } from "@/lib/format";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [lowAttendance, setLowAttendance] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [classResponse, studentResponse, lowResponse] = await Promise.all([
        api.get("/classes"),
        api.get("/students"),
        api.get("/reports/low-attendance"),
      ]);
      setClasses(classResponse.data);
      setStudents(studentResponse.data);
      setLowAttendance(lowResponse.data);

      const today = format(new Date(), "yyyy-MM-dd");
      const days = await Promise.all(
        classResponse.data.map((cls) =>
          api
            .get(`/attendance/class/${cls.id}?date=${today}`)
            .catch(() => ({ data: [] }))
        )
      );
      setTodayRecords(days.flatMap((day) => day.data));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load your dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const todaySummary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, leave: 0 };
    todayRecords.forEach((record) => {
      if (counts[record.status] !== undefined) counts[record.status] += 1;
    });
    const total = todayRecords.length;
    const present = counts.present + counts.late;
    return {
      counts,
      total,
      present,
      percentage: total ? Math.round((present / total) * 100) : null,
    };
  }, [todayRecords]);

  const enrolledCount = classes.reduce(
    (total, cls) => total + (cls.students?.length || 0),
    0
  );

  const header = (
    <PageHeader
      eyebrow={format(new Date(), "EEEE, MMMM d")}
      title={`${greeting()}, ${firstName(user?.name)}`}
      description="Here's how your classes and students are doing today."
      actions={
        <>
          <Button asChild variant="secondary">
            <Link to="/classes">
              <School className="size-4" aria-hidden="true" />
              New class
            </Link>
          </Button>
          <Button asChild>
            <Link to="/mark-attendance">
              <CalendarPlus className="size-4" aria-hidden="true" />
              Mark attendance
            </Link>
          </Button>
        </>
      }
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState error={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-2">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primary/[0.06] blur-2xl"
          />
          <CardContent className="flex flex-1 flex-col justify-center gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <AttendanceRing
                value={todaySummary.percentage}
                size={116}
                stroke={10}
                label="Today"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                  Today&apos;s attendance
                </p>
                <p className="mt-1.5 text-[17px] leading-tight font-semibold tracking-[-0.02em]">
                  {todaySummary.total
                    ? `${todaySummary.present} of ${todaySummary.total} present`
                    : "Nothing marked yet"}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {todaySummary.total
                    ? `Across ${plural(classes.length, "class", "classes")}.`
                    : "Start with your first class of the day."}
                </p>
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <Button asChild size="sm">
                    <Link to="/mark-attendance">
                      <CalendarPlus className="size-3.5" aria-hidden="true" />
                      Mark attendance
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/attendance">
                      View records
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[188px] sm:gap-x-6 sm:gap-y-4">
              <Breakdown status="present" value={todaySummary.counts.present} />
              <Breakdown status="absent" value={todaySummary.counts.absent} />
              <Breakdown status="late" value={todaySummary.counts.late} />
              <Breakdown status="leave" value={todaySummary.counts.leave} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <StatCard
            title="Classes"
            value={classes.length}
            sub={`${enrolledCount} enrollments`}
            icon={School}
            tone="primary"
          />
          <StatCard
            title="Students"
            value={students.length}
            sub="across all batches"
            icon={Users}
            tone="info"
          />
        </div>
      </div>

      {lowAttendance.length > 0 && (
        <Card className="border-warning/25 bg-warning/[0.045] shadow-none">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-warning/15 text-warning ring-1 ring-warning/20 ring-inset">
              <TriangleAlert className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-foreground">
                {plural(lowAttendance.length, "student")} below the 75% threshold
              </p>
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                {lowAttendance
                  .slice(0, 3)
                  .map((item) => `${item.student.name} (${item.summary.percentage}%)`)
                  .join(" · ")}
                {lowAttendance.length > 3 ? ` · +${lowAttendance.length - 3} more` : ""}
              </p>
            </div>
            <Button asChild variant="secondary" size="sm" className="self-start sm:self-auto">
              <Link to="/reports">Review reports</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Your classes</CardTitle>
            <Button asChild variant="secondary" size="sm">
              <Link to="/classes">
                View all
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <EmptyState
                compact
                icon={School}
                title="No classes yet"
                description="Create your first class to start enrolling students and taking attendance."
                action={
                  <Button asChild size="sm">
                    <Link to="/classes">
                      <CalendarPlus className="size-3.5" aria-hidden="true" />
                      Create class
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-0.5">
                {classes.slice(0, 5).map((cls) => (
                  <Link
                    key={cls.id}
                    to="/classes"
                    className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-150 hover:bg-muted/60"
                  >
                    <SubjectIcon
                      subject={cls.subject}
                      name={cls.name}
                      className="size-9 rounded-[10px]"
                      iconClassName="size-[17px]"
                      strokeWidth={1.8}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{cls.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {cls.subject} · {cls.batch}
                        {cls.schedule ? ` · ${cls.schedule}` : ""}
                      </span>
                    </span>
                    <Badge variant="secondary" className="tnum gap-1 text-muted-foreground">
                      <Users className="size-3" aria-hidden="true" />
                      {cls.students?.length || 0}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Needs attention</CardTitle>
            <Button asChild variant="secondary" size="sm">
              <Link to="/reports">
                Reports
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowAttendance.length === 0 ? (
              <EmptyState
                compact
                icon={BadgeCheck}
                title="Everyone's on track"
                description="No student is below the 75% attendance threshold."
              />
            ) : (
              <div className="space-y-4">
                {lowAttendance.slice(0, 5).map(({ student, summary }) => (
                  <div key={student.id} className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-muted text-[10px] font-medium">
                        {initials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-medium">{student.name}</p>
                        <span
                          className={
                            summary.percentage < 50
                              ? "tnum text-[12px] font-medium text-destructive"
                              : "tnum text-[12px] font-medium text-muted-foreground"
                          }
                        >
                          {summary.percentage}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Roll {student.rollNumber}
                      </p>
                      <Progress
                        value={summary.percentage}
                        className={
                          summary.percentage < 50
                            ? "mt-1.5 [&>div]:bg-destructive"
                            : "mt-1.5 [&>div]:bg-warning"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Today&apos;s records</CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {todaySummary.total
                ? `${plural(todaySummary.total, "record")} marked today`
                : "Attendance marked today will appear here."}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/attendance">
              View all
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {todayRecords.length === 0 ? (
            <EmptyState
              compact
              icon={ClipboardList}
              title="No attendance marked yet"
              description="Take attendance for a class and it will show up here instantly."
              action={
                <Button asChild size="sm" variant="secondary">
                  <Link to="/mark-attendance">Mark attendance</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Class</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayRecords.slice(0, 8).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-muted text-[10px] font-medium">
                            {initials(record.student?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{record.student?.name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {record.class?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Breakdown({ status, value }) {
  return (
    <div>
      <p className="tnum text-[18px] leading-none font-semibold tracking-[-0.02em]">{value}</p>
      <StatusBadge status={status} className="mt-1.5" />
    </div>
  );
}
