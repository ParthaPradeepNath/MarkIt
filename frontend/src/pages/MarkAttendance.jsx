import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  CalendarCheck2,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  Plane,
  RotateCcw,
  Save,
  School,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import PageHeader from "@/components/PageHeader";
import AttendanceRing from "@/components/AttendanceRing";
import DatePicker from "@/components/DatePicker";
import SubjectIcon from "@/components/SubjectIcon";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { TableSkeleton } from "@/components/Skeletons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getErrorMessage, initials, plural } from "@/lib/format";

const STATUSES = [
  {
    value: "present",
    label: "Present",
    icon: Check,
    active: "border-emerald-500/40 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    value: "absent",
    label: "Absent",
    icon: X,
    active: "border-rose-500/40 bg-rose-500/12 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  {
    value: "late",
    label: "Late",
    icon: Clock,
    active: "border-amber-500/40 bg-amber-500/12 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    value: "leave",
    label: "Leave",
    icon: Plane,
    active: "border-sky-500/40 bg-sky-500/12 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
];

const today = () => format(new Date(), "yyyy-MM-dd");

export default function MarkAttendance() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(today());
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [remarkMap, setRemarkMap] = useState({});
  const [existing, setExisting] = useState({});
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const activeClass = classes.find((cls) => cls._id === classId);

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    setError("");
    try {
      const { data } = await api.get("/classes");
      setClasses(data);
      setClassId((current) => current || data[0]?._id || "");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load your classes."));
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    setExisting({});
    setStatusMap({});
    setRemarkMap({});
    setDirty(false);
    api
      .get(`/classes/${classId}`)
      .then(({ data }) => setStudents(data.enrolledStudents || []))
      .catch((err) => toast.error(getErrorMessage(err, "Could not load class students.")))
      .finally(() => setLoadingStudents(false));
  }, [classId]);

  useEffect(() => {
    if (!classId || !date) return;
    setLoadingExisting(true);
    api
      .get(`/attendance/class/${classId}`, { params: { date } })
      .then(({ data }) => {
        const statuses = {};
        const remarks = {};
        data.forEach((record) => {
          const id = record.studentId?._id;
          if (!id) return;
          statuses[id] = record.status;
          remarks[id] = record.remark || "";
        });
        setExisting(statuses);
        setStatusMap(statuses);
        setRemarkMap(remarks);
        setDirty(false);
      })
      .catch(() => {
        setExisting({});
        setStatusMap({});
        setRemarkMap({});
        setDirty(false);
      })
      .finally(() => setLoadingExisting(false));
  }, [classId, date]);

  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, leave: 0 };
    Object.values(statusMap).forEach((status) => {
      if (counts[status] !== undefined) counts[status] += 1;
    });
    const marked = counts.present + counts.absent + counts.late + counts.leave;
    const present = counts.present + counts.late;
    return {
      counts,
      marked,
      percentage: marked ? Math.round((present / marked) * 100) : null,
      remaining: Math.max(students.length - marked, 0),
    };
  }, [statusMap, students.length]);

  const allSet = students.length > 0 && students.every((student) => statusMap[student._id]);

  const markAll = (status) => {
    setStatusMap((previous) => {
      const next = { ...previous };
      students.forEach((student) => {
        next[student._id] = status;
      });
      return next;
    });
    setDirty(true);
  };

  const reset = () => {
    setStatusMap(existing);
    setRemarkMap((previous) => {
      const next = {};
      students.forEach((student) => {
        next[student._id] = existing[student._id] ? previous[student._id] || "" : "";
      });
      return next;
    });
    setDirty(false);
  };

  const save = async () => {
    if (!allSet) {
      toast.warning("Set a status for every student before saving.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/attendance", {
        classId,
        date,
        records: students.map((student) => ({
          studentId: student._id,
          status: statusMap[student._id],
          remark: remarkMap[student._id] || "",
        })),
      });
      setExisting(statusMap);
      setDirty(false);
      toast.success(`Attendance saved for ${plural(students.length, "student")}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save attendance."));
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mark attendance"
          description="Take attendance for a class in a couple of taps."
        />
        <ErrorState error={error} onRetry={loadClasses} />
      </div>
    );
  }

  if (loadingClasses) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mark attendance"
          description="Take attendance for a class in a couple of taps."
        />
        <TableSkeleton rows={7} cols={4} />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mark attendance"
          description="Take attendance for a class in a couple of taps."
        />
        <Card>
          <EmptyState
            icon={School}
            title="No classes to mark"
            description="Create a class and enroll students first — then attendance takes seconds."
            action={
              <Button asChild size="sm">
                <Link to="/classes">Create a class</Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Mark attendance"
        description="Pick a class and date, then set everyone's status. Saved records load automatically."
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,180px)_auto] lg:items-end">
          <div className="space-y-1.5">
            <Label className="text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
              Class
            </Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-full" aria-label="Select class">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls._id} value={cls._id}>
                    <SubjectIcon subject={cls.subject} name={cls.name} plain />
                    {cls.name} ({cls.batch})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="mark-date"
              className="text-[11px] tracking-[0.06em] text-muted-foreground uppercase"
            >
              Date
            </Label>
            <div className="flex items-center gap-2">
              <DatePicker
                id="mark-date"
                value={date}
                onChange={setDate}
                max={new Date()}
                className="flex-1"
              />
              {date !== today() && (
                <Button variant="ghost" size="sm" onClick={() => setDate(today())}>
                  Today
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
              Quick actions
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => markAll("present")}>
                <CheckCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                All present
              </Button>
              <Button variant="outline" size="sm" onClick={() => markAll("absent")}>
                <X className="size-3.5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                All absent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary ring-1 ring-primary/10 ring-inset">
                <Users className="size-[19px]" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold tracking-[-0.01em]">
                  {activeClass?.name}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground">
                  <span>{format(new Date(`${date}T00:00:00`), "EEEE, MMM d")}</span>
                  <span aria-hidden="true">·</span>
                  <span>{plural(students.length, "student")}</span>
                  {activeClass?.schedule && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{activeClass.schedule}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {Object.values(existing).length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset dark:text-emerald-400">
                  <CalendarCheck2 className="size-3" aria-hidden="true" />
                  Already marked
                </span>
              )}
              <span className="tnum text-[12px] text-muted-foreground">
                {summary.marked}/{students.length} set
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <AttendanceRing value={summary.percentage} size={72} stroke={7} />
            <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5">
              {STATUSES.map((status) => (
                <div key={status.value} className="flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden="true" />
                  <span className="text-[11px] text-muted-foreground">{status.label}</span>
                  <span className="tnum ml-auto text-[12px] font-medium">
                    {summary.counts[status.value]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loadingStudents || loadingExisting ? (
            <TableSkeleton rows={Math.max(students.length || 5, 4)} cols={3} />
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students in this class"
              description="Enroll students into this class before taking attendance."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to="/classes">Manage classes</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {students.map((student) => {
                const status = statusMap[student._id];
                const saved = existing[student._id];
                return (
                  <li
                    key={student._id}
                    className="flex flex-col gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/25 lg:flex-row lg:items-center lg:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-muted text-[10px] font-medium">
                          {initials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-[13px] font-medium">
                          {student.name}
                          {saved === status && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                              <Check className="size-2.5" aria-hidden="true" />
                              saved
                            </span>
                          )}
                        </p>
                        <p className="tnum truncate text-[11px] text-muted-foreground">
                          Roll {student.rollNumber}
                          {student.batch ? ` · ${student.batch}` : ""}
                        </p>
                      </div>
                    </div>

                    <div
                      className="grid shrink-0 grid-cols-4 gap-1 rounded-lg bg-muted p-1"
                      role="group"
                      aria-label={`Attendance status for ${student.name}`}
                    >
                      {STATUSES.map(({ value, label, icon: Icon, active }) => {
                        const isActive = status === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setStatusMap((previous) => ({ ...previous, [student._id]: value }));
                              setDirty(true);
                            }}
                            aria-pressed={isActive}
                            title={label}
                            className={cn(
                              "inline-flex h-7 cursor-pointer items-center justify-center gap-1 rounded-md border border-transparent px-2 text-[11px] font-medium outline-none transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring/40",
                              isActive
                                ? cn("shadow-[0_1px_2px_oklch(0_0_0/0.08)]", active)
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Icon className="size-3" aria-hidden="true" />
                            <span className="hidden sm:inline">{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <Input
                      value={remarkMap[student._id] || ""}
                      onChange={(event) => {
                        setRemarkMap((previous) => ({
                          ...previous,
                          [student._id]: event.target.value,
                        }));
                        setDirty(true);
                      }}
                      placeholder="Add a remark"
                      aria-label={`Remark for ${student.name}`}
                      className="h-8 lg:w-44"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {students.length > 0 && (
        <div className="sticky bottom-3 z-20 sm:bottom-4">
          <div className="mx-auto flex max-w-[720px] items-center gap-2 rounded-2xl border border-border/70 bg-popover/95 p-2.5 shadow-float backdrop-blur-xl sm:gap-4 sm:p-3">
            <div className="hidden min-w-0 flex-1 sm:block">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium">
                  {summary.marked} of {students.length} marked
                </p>
                <span className="tnum text-[11px] text-muted-foreground">
                  {summary.percentage ?? 0}% present
                </span>
              </div>
              <Progress value={summary.marked ? (summary.marked / students.length) * 100 : 0} className="mt-1.5" />
            </div>
            <p className="tnum min-w-0 flex-1 truncate text-[12px] text-muted-foreground sm:hidden">
              {summary.marked}/{students.length} marked · {summary.percentage ?? 0}% present
            </p>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {dirty && (
                <Button variant="ghost" size="sm" onClick={reset} aria-label="Reset changes">
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              )}
              <Button onClick={save} disabled={saving || !dirty}>
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-3.5" aria-hidden="true" />
                )}
                <span className="sm:hidden">{saving ? "Saving…" : "Save"}</span>
                <span className="hidden sm:inline">{saving ? "Saving…" : "Save attendance"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {students.length > 0 && summary.remaining > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
          <TriangleAlert className="size-3.5" aria-hidden="true" />
          {plural(summary.remaining, "student")} still need a status.
        </p>
      )}
    </div>
  );
}
