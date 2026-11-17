import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowUpRight,
  BookOpen,
  ChartColumn,
  Check,
  GraduationCap,
  Layers,
  RefreshCw,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";

import api from "@/api/axios";
import AttendanceRing from "@/components/AttendanceRing";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { EvilAreaChart } from "@/components/evilcharts/charts/recharts-area-chart";
import { EvilBarChart } from "@/components/evilcharts/charts/recharts-bar-chart";
import PageHeader from "@/components/PageHeader";
import { TableSkeleton } from "@/components/Skeletons";
import StatCard from "@/components/StatCard";
import SubjectIcon from "@/components/SubjectIcon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { formatMonth, getErrorMessage, initials, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  ClassInfo,
  ClassSummary,
  ReportData,
  ReportTrendPoint,
  Student,
  StudentSummary,
} from "@/types";

type ReportTab = "class" | "batch" | "student";

const TREND_CONFIG = {
  percentage: {
    label: "Attendance",
    colors: {
      light: ["var(--chart-1)"],
      dark: ["var(--chart-1)"],
    },
  },
};

const STUDENT_CONFIG = {
  percentage: {
    label: "Attendance",
    colors: {
      light: ["var(--chart-1)"],
      dark: ["var(--chart-1)"],
    },
  },
};

export default function Reports() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const ownStudentId = user?.student?.id || user?.studentId;

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [tab, setTab] = useState<ReportTab>("class");
  const [classId, setClassId] = useState("");
  const [batch, setBatch] = useState("");
  const [studentId, setStudentId] = useState("");

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSourcesLoading(true);
      try {
        const [classResponse, studentResponse] = await Promise.all([
          api.get<ClassInfo[]>("/classes"),
          api.get<Student[]>("/students"),
        ]);
        if (cancelled) return;
        setClasses(classResponse.data);
        setStudents(studentResponse.data);
        const nextBatches = [
          ...new Set(studentResponse.data.map((s) => s.batch).filter(Boolean)),
        ].sort();
        setBatches(nextBatches);
        if (isTeacher)
          setClassId((current) => current || classResponse.data[0]?.id || "");
        if (!isTeacher) setBatch((current) => current || nextBatches[0] || "");
      } catch (err) {
        if (!cancelled)
          setError(getErrorMessage(err, "Failed to load report data."));
      } finally {
        if (!cancelled) setSourcesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isTeacher]);

  const request = useMemo(() => {
    if (!isTeacher) {
      return ownStudentId ? { type: "student", studentId: ownStudentId } : null;
    }
    if (tab === "class" && classId) return { type: "class", classId };
    if (tab === "batch" && batch) return { type: "batch", batch };
    if (tab === "student" && studentId) return { type: "student", studentId };
    return null;
  }, [isTeacher, ownStudentId, tab, classId, batch, studentId]);

  const load = useCallback(async () => {
    if (!request) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data: response } = await api.get<ReportData>(
        "/reports/attendance",
        { params: request }
      );
      setData(response);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load this report."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTabChange = (next: string) => {
    setTab(next as ReportTab);
    setStudentId("");
    setData(null);
    setError("");
    if (next === "batch" && !batch) setBatch(batches[0] || "");
    if (next === "student" && !studentId) setStudentId(students[0]?.id || "");
  };

  const viewStudent = (id: string) => {
    setTab("student");
    setStudentId(id);
  };

  const summary = data?.summary;
  const studentSummaries = data?.students ?? [];
  const selectedStudent = students.find((student) => student.id === studentId);
  const isStudentReport = Boolean(data?.summary && !data?.students);
  const atRisk = studentSummaries.filter((entry) => entry.summary.risk);

  const scopeLabel = isStudentReport
    ? selectedStudent?.name || (isTeacher ? "Student" : "Your report")
    : tab === "class"
      ? classes.find((cls) => cls.id === classId)?.name || "Class report"
      : tab === "batch"
        ? batch || "Batch report"
        : "Student report";

  const header = (
    <PageHeader
      title="Reports"
      description={
        isTeacher
          ? "Attendance analytics by class, batch or individual student."
          : "Your attendance trends and class-by-class breakdown."
      }
      actions={
        <Button
          variant="secondary"
          size="icon-sm"
          onClick={load}
          aria-label="Refresh report"
          title="Refresh report"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
        </Button>
      }
    />
  );

  const filterBar = isTeacher ? (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="class" className="gap-1.5">
            <BookOpen className="size-3.5" aria-hidden="true" />
            By class
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-1.5">
            <Layers className="size-3.5" aria-hidden="true" />
            By batch
          </TabsTrigger>
          <TabsTrigger value="student" className="gap-1.5">
            <GraduationCap className="size-3.5" aria-hidden="true" />
            By student
          </TabsTrigger>
        </TabsList>

        <div className="sm:w-64">
          {tab === "class" && (
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-full" aria-label="Select class">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <SubjectIcon subject={cls.subject} name={cls.name} plain />
                    {cls.name} ({cls.batch})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {tab === "batch" && (
            <Select value={batch} onValueChange={setBatch}>
              <SelectTrigger className="w-full" aria-label="Select batch">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {tab === "student" && (
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-full" aria-label="Select student">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} ({student.rollNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </Tabs>
  ) : null;

  // The TabsList above is the control; report content is rendered below it.
  return (
    <div className="space-y-6">
      {header}
      {filterBar}

      {error && !loading ? (
        <ErrorState error={error} onRetry={load} />
      ) : sourcesLoading || loading ? (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <Skeleton className="h-[120px] rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[280px] rounded-xl" />
            <Skeleton className="h-[280px] rounded-xl" />
          </div>
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : !request ? (
        <Card>
          <EmptyState
            icon={ChartColumn}
            title={
              tab === "student" ? "Choose a student" : "Nothing to report yet"
            }
            description={
              isTeacher
                ? "Pick a class, batch or student above to see attendance analytics."
                : "Reports will appear once attendance has been recorded."
            }
            action={
              isTeacher && classes.length === 0 ? (
                <Button asChild size="sm" variant="secondary">
                  <Link to="/classes">Create a class</Link>
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : !data ? (
        <Card>
          <EmptyState
            icon={ChartColumn}
            title="No report data"
            description="There are no attendance records for this selection yet."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Card>
              <CardContent className="flex items-center gap-5">
                <AttendanceRing
                  value={summary?.percentage}
                  size={100}
                  stroke={9}
                  label="Attendance"
                />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-[11px] font-medium tracking-[0.06em] uppercase">
                    {scopeLabel}
                  </p>
                  <p className="mt-1 text-[15px] leading-tight font-semibold tracking-[-0.01em]">
                    {summary?.risk
                      ? "Below the 75% target"
                      : "Healthy attendance"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-[12px] leading-relaxed">
                    {summary?.present ?? 0} present of{" "}
                    {(summary?.present ?? 0) +
                      (summary?.absent ?? 0) +
                      (summary?.late ?? 0) +
                      (summary?.leave ?? 0)}{" "}
                    sessions
                    {data.totalStudents
                      ? ` · ${plural(data.totalStudents, "student")}`
                      : ""}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <StatCard
                title="Present"
                value={summary?.present ?? 0}
                sub={summary?.late ? `${summary.late} late` : "on time"}
                icon={Check}
                tone="success"
              />
              <StatCard
                title="Absent"
                value={summary?.absent ?? 0}
                sub={summary?.leave ? `${summary.leave} on leave` : "no leave"}
                icon={X}
                tone="danger"
              />
              <StatCard
                className="col-span-2 sm:col-span-1"
                title={isStudentReport ? "Classes" : "Students"}
                value={
                  isStudentReport
                    ? (data.byClass?.length ?? 0)
                    : (data.students?.length ?? 0)
                }
                sub={isStudentReport ? "with records" : "in this scope"}
                icon={isStudentReport ? BookOpen : Users}
                tone="info"
              />
            </div>
          </div>

          {atRisk.length > 0 && (
            <Card className="border-warning/25 bg-warning/[0.045] shadow-none">
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="bg-warning/15 text-warning ring-warning/20 flex size-9 shrink-0 items-center justify-center rounded-[10px] ring-1 ring-inset">
                  <TriangleAlert
                    className="size-[18px]"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">
                    {plural(atRisk.length, "student")} below the 75% threshold
                  </p>
                  <p className="text-muted-foreground mt-0.5 truncate text-[12px]">
                    {atRisk.map((entry) => entry.student.name).join(" · ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly trend</CardTitle>
                <p className="text-muted-foreground text-[12px]">
                  Attendance percentage over time.
                </p>
              </CardHeader>
              <CardContent>
                <TrendChart trend={data.trend} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {isStudentReport ? "By class" : "Per-student attendance"}
                </CardTitle>
                <p className="text-muted-foreground text-[12px]">
                  {isStudentReport
                    ? "Where this attendance stands."
                    : "Compare students at a glance."}
                </p>
              </CardHeader>
              <CardContent>
                {isStudentReport ? (
                  <ClassBreakdown byClass={data.byClass} />
                ) : (
                  <StudentBars students={data.students} />
                )}
              </CardContent>
            </Card>
          </div>

          {!isStudentReport && studentSummaries.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Student breakdown</CardTitle>
                  <p className="text-muted-foreground mt-0.5 text-[12px]">
                    {plural(studentSummaries.length, "student")} in{" "}
                    {scopeLabel.toLowerCase()}
                  </p>
                </div>
                <Badge variant="secondary" className="tnum">
                  {plural(atRisk.length, "at-risk", "at-risk")}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Status
                      </TableHead>
                      <TableHead className="w-10 text-right">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentSummaries.map(
                      ({ student, summary: studentSummary }) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar size="sm">
                                <AvatarFallback className="bg-muted text-[10px] font-medium">
                                  {initials(student.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium">
                                  {student.name}
                                </p>
                                <p className="tnum text-muted-foreground truncate text-[11px]">
                                  Roll {student.rollNumber}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={studentSummary.percentage}
                                className={cn(
                                  "w-20",
                                  studentSummary.risk && "[&>div]:bg-warning"
                                )}
                              />
                              <span className="tnum text-[12px] font-medium">
                                {studentSummary.percentage}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {studentSummary.risk ? (
                              <Badge variant="destructive" className="gap-1">
                                <TriangleAlert
                                  className="size-3"
                                  aria-hidden="true"
                                />
                                At risk
                              </Badge>
                            ) : (
                              <Badge variant="secondary">On track</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="secondary"
                              size="icon-sm"
                              className="text-muted-foreground"
                              onClick={() => viewStudent(student.id)}
                              aria-label={`Open report for ${student.name}`}
                            >
                              <ArrowUpRight className="size-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function TrendChart({ trend }: { trend: ReportTrendPoint[] }) {
  if (!trend || trend.length === 0) {
    return (
      <EmptyState
        compact
        icon={ChartColumn}
        title="No trend yet"
        description="Monthly percentages appear after a few sessions."
      />
    );
  }

  return (
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
  );
}

function StudentBars({ students }: { students?: StudentSummary[] }) {
  if (!students || students.length === 0) {
    return (
      <EmptyState
        compact
        icon={Users}
        title="No students in this scope"
        description="Enroll students and mark attendance to compare them here."
      />
    );
  }

  const data = students.map(({ student, summary }) => ({
    name: student.name,
    short:
      student.name.length > 14 ? `${student.name.slice(0, 13)}…` : student.name,
    percentage: summary.percentage,
  }));

  const height = Math.max(220, data.length * 34);

  return (
    <div className="w-full" style={{ height }}>
      <EvilBarChart
        data={data}
        config={STUDENT_CONFIG}
        className="h-full w-full"
        layout="horizontal"
        barRadius={5}
        chartProps={{ margin: { top: 4, right: 24, left: 0, bottom: 4 } }}
      >
        <EvilBarChart.Grid horizontal={false} />
        <EvilBarChart.XAxis type="number" domain={[0, 100]} hide />
        <EvilBarChart.YAxis
          type="category"
          dataKey="short"
          width={102}
          tick={{ fontSize: 11 }}
        />
        <EvilBarChart.Tooltip />
        <EvilBarChart.Bar dataKey="percentage" variant="gradient" />
      </EvilBarChart>
    </div>
  );
}

function ClassBreakdown({ byClass }: { byClass?: ClassSummary[] }) {
  if (!byClass || byClass.length === 0) {
    return (
      <EmptyState
        compact
        icon={BookOpen}
        title="No class data"
        description="Class-level attendance appears once records exist."
      />
    );
  }

  return (
    <div className="space-y-4">
      {byClass.map((cls) => (
        <div key={`${cls.className}-${cls.batch}`}>
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
                <span className="text-muted-foreground font-normal">
                  ({cls.batch})
                </span>
              </p>
            </div>
            <span className="tnum text-[12px] font-medium">
              {cls.summary.percentage}%
            </span>
          </div>
          <Progress
            value={cls.summary.percentage}
            className={cn("mt-1.5", cls.summary.risk && "[&>div]:bg-warning")}
          />
        </div>
      ))}
    </div>
  );
}
