import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarRange,
  Check,
  Download,
  Loader2,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/PageHeader";
import AttendanceRing from "@/components/AttendanceRing";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import StatusFilter from "@/components/StatusFilter";
import { TableSkeleton } from "@/components/Skeletons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate, getErrorMessage, initials, plural } from "@/lib/format";

const STATUSES = [
  { value: "present", label: "Present", dot: "bg-emerald-500" },
  { value: "absent", label: "Absent", dot: "bg-rose-500" },
  { value: "late", label: "Late", dot: "bg-amber-500" },
  { value: "leave", label: "Leave", dot: "bg-sky-500" },
];

export default function AttendanceHistory() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const ownStudentId = user?.student?.id || user?.studentId;

  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [correction, setCorrection] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isTeacher) {
      api
        .get("/students")
        .then(({ data }) => {
          setStudents(data);
          setStudentId((current) => current || data[0]?.id || "");
        })
        .catch((err) => setError(getErrorMessage(err, "Failed to load students.")));
    } else if (ownStudentId) {
      setStudentId(ownStudentId);
    }
  }, [isTeacher, ownStudentId]);

  const loadRecords = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/attendance/student/${studentId}`);
      setRecords(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load attendance history."));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const selectedStudent = students.find((student) => student.id === studentId);
  const studentName = selectedStudent?.name || user?.name || "Student";

  const counts = useMemo(() => {
    const next = { all: records.length, present: 0, absent: 0, late: 0, leave: 0 };
    records.forEach((record) => {
      if (next[record.status] !== undefined) next[record.status] += 1;
    });
    return next;
  }, [records]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      if (!needle) return true;
      return [record.class?.name, record.class?.batch, record.remark, formatDate(record.date)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [records, statusFilter, query]);

  const present = counts.present + counts.late;
  const percentage = counts.all ? Math.round((present / counts.all) * 100) : null;

  const saveCorrection = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put(`/attendance/${correction.id}`, {
        status: correction.status,
        remark: correction.remark,
      });
      toast.success("Record corrected");
      setCorrection(null);
      loadRecords();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to correct record."));
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const header = "Date,Class,Batch,Status,Remark,Marked by\n";
    const rows = records
      .map((record) =>
        [
          format(new Date(record.date), "yyyy-MM-dd"),
          record.class?.name || "",
          record.class?.batch || "",
          record.status,
          (record.remark || "").replace(/[",\n]/g, " "),
          record.markedBy?.name || "",
        ]
          .map((value) => `"${value}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `attendance-${studentName.replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const header = (
    <PageHeader
      title={isTeacher ? "Attendance history" : "My attendance"}
      description={
        isTeacher
          ? "Review a student's full timeline and correct anything that looks off."
          : "Every session your teachers have recorded for you."
      }
      actions={
        <Button variant="secondary" onClick={exportCsv} disabled={records.length === 0}>
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </Button>
      }
    />
  );

  if (isTeacher && students.length === 0 && !loading && !error) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <EmptyState
            icon={CalendarRange}
            title="No students yet"
            description="Add students first, then their attendance history will appear here."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {isTeacher && (
        <Card>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full space-y-1.5 sm:max-w-sm">
              <Label className="text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
                Student
              </Label>
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
            </div>
            {selectedStudent && (
              <div className="flex items-center gap-2.5">
                <Avatar>
                  <AvatarFallback className="bg-primary/[0.08] text-[11px] font-semibold text-primary">
                    {initials(selectedStudent.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{selectedStudent.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Roll {selectedStudent.rollNumber} · {selectedStudent.batch || "No batch"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error ? (
        <ErrorState error={error} onRetry={loadRecords} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Card>
              <CardContent className="flex items-center gap-5">
                <AttendanceRing value={percentage} size={96} stroke={9} label="Overall" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                    Attendance
                  </p>
                  <p className="mt-1 text-[15px] leading-tight font-semibold tracking-[-0.01em]">
                    {percentage === null
                      ? "No records yet"
                      : percentage >= 75
                        ? "On track"
                        : "Below target"}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {percentage === null
                      ? "Sessions will appear once marked."
                      : `${present} of ${counts.all} sessions attended.`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
              <StatCard
                className="col-span-2 sm:col-span-1"
                title="Sessions"
                value={counts.all}
                sub="total recorded"
                icon={CalendarRange}
                tone="neutral"
              />
              <StatCard
                title="Present"
                value={counts.present}
                sub={`${counts.late} late`}
                icon={Check}
                tone="success"
              />
              <StatCard
                title="Absent"
                value={counts.absent}
                sub={`${counts.leave} on leave`}
                icon={X}
                tone="danger"
              />
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3 border-b border-border/60 sm:flex-row sm:items-center">
              <StatusFilter value={statusFilter} onChange={setStatusFilter} counts={counts} />

              <div className="relative sm:ml-auto sm:w-56">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search class or remark…"
                  className="pl-8"
                  aria-label="Search history"
                />
              </div>
            </CardContent>

            <CardContent className="p-0">
              {loading ? (
                <TableSkeleton rows={8} cols={4} />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={CalendarRange}
                  title={records.length === 0 ? "No history yet" : "Nothing matches these filters"}
                  description={
                    records.length === 0
                      ? "Once attendance is marked for this student, every session will show up here."
                      : "Try a different status filter or search term."
                  }
                  action={
                    records.length > 0 ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setStatusFilter("all");
                          setQuery("");
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Remark</TableHead>
                      <TableHead className="hidden lg:table-cell">Marked by</TableHead>
                      {isTeacher && (
                        <TableHead className="w-10 text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="tnum text-[12px] text-muted-foreground">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <p className="text-[13px] font-medium">{record.class?.name || "—"}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {record.class?.batch || "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={record.status} />
                        </TableCell>
                        <TableCell className="hidden max-w-[220px] truncate text-[12px] text-muted-foreground md:table-cell">
                          {record.remark || "—"}
                        </TableCell>
                        <TableCell className="hidden text-[12px] text-muted-foreground lg:table-cell">
                          {record.markedBy?.name || "—"}
                        </TableCell>
                        {isTeacher && (
                          <TableCell className="text-right">
                            <Button
                              variant="secondary"
                              size="icon-sm"
                              className="text-muted-foreground"
                              onClick={() => setCorrection({ ...record })}
                              aria-label={`Correct record from ${formatDate(record.date)}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {!loading && filtered.length > 0 && (
            <p className="text-center text-[11px] text-muted-foreground">
              Showing {plural(filtered.length, "record")} · {plural(counts.all, "total record")}
            </p>
          )}
        </>
      )}

      <Dialog open={Boolean(correction)} onOpenChange={(value) => !value && setCorrection(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Correct record</DialogTitle>
            <DialogDescription>
              {studentName} · {correction?.class?.name || "Class"} ·{" "}
              {correction ? formatDate(correction.date) : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveCorrection}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((status) => {
                    const active = correction?.status === status.value;
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() =>
                          setCorrection((previous) => ({ ...previous, status: status.value }))
                        }
                        aria-pressed={active}
                        className={cn(
                          "flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[13px] font-medium outline-none transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:ring-3 focus-visible:ring-ring/30",
                          active
                            ? "border-primary/40 bg-primary/[0.06] text-foreground ring-1 ring-primary/20"
                            : "border-border/70 bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden="true" />
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="history-remark">Remark</Label>
                <Input
                  id="history-remark"
                  value={correction?.remark || ""}
                  onChange={(event) =>
                    setCorrection((previous) => ({ ...previous, remark: event.target.value }))
                  }
                  placeholder="Reason for correction"
                />
              </div>
            </div>
            <DialogFooter className="mt-5">
              <Button type="button" variant="secondary" onClick={() => setCorrection(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                Save correction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
