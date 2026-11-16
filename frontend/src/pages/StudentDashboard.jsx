import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowUpRight,
  CalendarCheck2,
  ChartColumn,
  ClipboardList,
  History,
  TriangleAlert,
  BookOpen,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EvilAreaChart } from "@/components/evilcharts/charts/recharts-area-chart";
import { firstName, formatDate, formatMonth, getErrorMessage, greeting } from "@/lib/format";

const TREND_CONFIG = {
  percentage: {
    label: "Attendance",
    colors: {
      light: ["var(--chart-1)"],
      dark: ["var(--chart-1)"],
    },
  },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const studentId = user?.studentId?._id || user?.studentId;

  const load = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [reportResponse, recordsResponse] = await Promise.all([
        api.get("/reports/attendance", { params: { type: "student", studentId } }),
        api.get(`/attendance/student/${studentId}`),
      ]);
      setReport(reportResponse.data);
      setRecent(recordsResponse.data.slice(0, 6));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load your attendance."));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = report?.summary || {};
  const trend = report?.trend || [];
  const byClass = report?.byClass || [];
  const hasRecords = (summary.total || 0) > 0;
  const risk = Boolean(summary.risk);

  const header = (
    <PageHeader
      eyebrow={format(new Date(), "EEEE, MMMM d")}
      title={`${greeting()}, ${firstName(user?.name)}`}
      description="Here's your attendance at a glance."
      actions={
        <Button asChild variant="outline">
          <Link to="/history">
            <History className="size-4" aria-hidden="true" />
            Full history
          </Link>
        </Button>
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
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <AttendanceRing
                value={hasRecords ? summary.percentage : null}
                size={124}
                stroke={10}
                label="Overall"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                  Your attendance
                </p>
                <p className="mt-1.5 text-[17px] leading-tight font-semibold tracking-[-0.02em]">
                  {hasRecords
                    ? risk
                      ? "A little below target"
                      : "You're on track"
                    : "No sessions yet"}
                </p>
                <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
                  {hasRecords
                    ? risk
                      ? "Aim for 75% or higher. Talk to your teacher about missed sessions."
                      : `${summary.present ?? 0} attended out of ${summary.total ?? 0} sessions.`
                    : "Your attendance will appear here once your teacher starts marking."}
                </p>
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/reports">
                      Detailed report
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:min-w-[150px] sm:grid-cols-1 sm:gap-3">
              <MiniStat label="Present" value={summary.present ?? 0} dot="bg-emerald-500" />
              <MiniStat label="Absent" value={summary.absent ?? 0} dot="bg-rose-500" />
              <MiniStat
                label="Late / Leave"
                value={(summary.late ?? 0) + (summary.leave ?? 0)}
                dot="bg-amber-500"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <StatCard
            title="Sessions"
            value={summary.total ?? 0}
            sub="recorded so far"
            icon={CalendarCheck2}
            tone="info"
          />
          <StatCard
            title="Classes"
            value={byClass.length}
            sub="with attendance"
            icon={BookOpen}
            tone="neutral"
          />
        </div>
      </div>

      {risk && (
        <Card className="border-warning/25 bg-warning/[0.045] shadow-none">
          <CardContent className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-warning/15 text-warning ring-1 ring-warning/20 ring-inset">
              <TriangleAlert className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13px] font-medium">Your attendance is below 75%</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                Please contact your teacher to get back on track.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly trend</CardTitle>
            <CardDescription>Your attendance percentage over time.</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <EmptyState
                compact
                icon={ChartColumn}
                title="No trend data yet"
                description="Once you have a few sessions, your monthly trend will appear here."
              />
            ) : (
              <EvilAreaChart
                data={trend}
                config={TREND_CONFIG}
                className="h-[248px] w-full"
                xDataKey="month"
                curveType="monotone"
                chartProps={{ margin: { top: 6, right: 8, left: 0, bottom: 0 } }}
              >
                <EvilAreaChart.Grid />
                <EvilAreaChart.XAxis dataKey="month" tickFormatter={formatMonth} />
                <EvilAreaChart.YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  width={38}
                  tickFormatter={(value) => `${value}%`}
                />
                <EvilAreaChart.Tooltip />
                <EvilAreaChart.Area dataKey="percentage" strokeWidth={2.5} />
              </EvilAreaChart>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>By class</CardTitle>
            <CardDescription>Where your attendance stands.</CardDescription>
          </CardHeader>
          <CardContent>
            {byClass.length === 0 ? (
              <EmptyState
                compact
                icon={BookOpen}
                title="No classes yet"
                description="Class-level attendance will appear once records exist."
              />
            ) : (
              <div className="space-y-4">
                {byClass.map((cls) => (
                  <div key={cls.className}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <SubjectIcon
                          subject={cls.subject}
                          name={cls.className}
                          className="size-7 rounded-lg"
                          iconClassName="size-4"
                        />
                        <p className="truncate text-[13px] font-medium">
                          {cls.className}{" "}
                          <span className="font-normal text-muted-foreground">({cls.batch})</span>
                        </p>
                      </div>
                      <span className="tnum text-[12px] font-medium">{cls.summary.percentage}%</span>
                    </div>
                    <Progress
                      value={cls.summary.percentage}
                      className={
                        cls.summary.risk ? "mt-1.5 [&>div]:bg-warning" : "mt-1.5"
                      }
                    />
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
            <CardTitle>Recent records</CardTitle>
            <p className="mt-1 text-[12px] text-muted-foreground">Your latest attendance entries.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/history">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <EmptyState
              compact
              icon={ClipboardList}
              title="No records yet"
              description="Your attendance history will appear here after your first marked session."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Remark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(record.date, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="hidden font-medium sm:table-cell">{record.classId?.name || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-muted-foreground md:table-cell">
                      {record.remark || "—"}
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

function MiniStat({ label, value, dot }) {
  return (
    <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1">
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />
      <span className="order-3 text-[11px] text-muted-foreground sm:order-2 sm:mt-0.5">{label}</span>
      <span className="tnum ml-auto text-[17px] leading-none font-semibold tracking-[-0.02em] sm:order-1 sm:ml-0">
        {value}
      </span>
    </div>
  );
}
