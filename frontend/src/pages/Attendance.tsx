import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  Filter,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import StatusBadge from "@/components/StatusBadge";
import StatusFilter from "@/components/StatusFilter";
import DatePicker from "@/components/DatePicker";
import SubjectIcon from "@/components/SubjectIcon";
import { TableSkeleton } from "@/components/Skeletons";
import { useConfirm } from "@/components/ConfirmDialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type {
  AttendanceRecord,
  AttendanceStatus,
  ClassInfo,
  StatusCounts,
  StatusFilterValue,
} from "@/types";

const STATUSES: Array<{ value: AttendanceStatus; label: string; dot: string }> = [
  { value: "present", label: "Present", dot: "bg-emerald-500" },
  { value: "absent", label: "Absent", dot: "bg-rose-500" },
  { value: "late", label: "Late", dot: "bg-amber-500" },
  { value: "leave", label: "Leave", dot: "bg-sky-500" },
];

export default function Attendance() {
  const confirm = useConfirm();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classId, setClassId] = useState("all");
  const [date, setDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState<AttendanceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const loadRecords = useCallback(async () => {
    if (classId === "all" && classesLoading) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (date) params.date = date;

      if (classId !== "all") {
        const { data } = await api.get(`/attendance/class/${classId}`, { params });
        setRecords(data);
      } else {
        const responses = await Promise.all(
          classes.map((cls) =>
            api.get(`/attendance/class/${cls.id}`, { params }).catch(() => ({ data: [] }))
          )
        );
        setRecords(responses.flatMap((response) => response.data));
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load attendance records."));
    } finally {
      setLoading(false);
    }
  }, [classId, date, classes, classesLoading]);

  useEffect(() => {
    api
      .get("/classes")
      .then(({ data }) => setClasses(data))
      .catch((err) => setError(getErrorMessage(err, "Failed to load classes.")))
      .finally(() => setClassesLoading(false));
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const counts = useMemo<StatusCounts>(() => {
    const next: StatusCounts = { all: records.length, present: 0, absent: 0, late: 0, leave: 0 };
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
      return [record.student?.name, record.student?.rollNumber, record.class?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [records, statusFilter, query]);

  const presentCount = counts.present + counts.late;
  const percentage = counts.all ? Math.round((presentCount / counts.all) * 100) : null;

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!edit) return;
    setSaving(true);
    try {
      await api.put(`/attendance/${edit.id}`, {
        status: edit.status,
        remark: edit.remark,
      });
      toast.success("Record corrected");
      setEdit(null);
      loadRecords();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update record."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (record: AttendanceRecord) => {
    const ok = await confirm({
      title: "Delete this record?",
      description: `${record.student?.name || "This student"}'s attendance on ${formatDate(
        record.date
      )} will be permanently removed.`,
      confirmLabel: "Delete record",
    });
    if (!ok) return;
    try {
      await api.delete(`/attendance/${record.id}`);
      toast.success("Record deleted");
      loadRecords();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete record."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance records"
        description="Browse, filter and correct attendance across every class."
        actions={
          <Button asChild variant="secondary">
            <Link to="/mark-attendance">
              <CalendarDays className="size-4" aria-hidden="true" />
              Mark attendance
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,180px)_minmax(0,1fr)]">
            <div className="space-y-1.5">
              <Label className="text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
                Class
              </Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="w-full" aria-label="Filter by class">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      <SubjectIcon subject={cls.subject} name={cls.name} plain />
                      {cls.name} ({cls.batch})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="attendance-date"
                className="text-[11px] tracking-[0.06em] text-muted-foreground uppercase"
              >
                Date
              </Label>
              <div className="flex items-center gap-2">
                <DatePicker
                  id="attendance-date"
                  value={date}
                  onChange={setDate}
                  placeholder="All dates"
                  className="flex-1"
                />
                {date && (
                  <Button variant="secondary" size="sm" onClick={() => setDate("")}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
                Search
              </Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Student, roll or class…"
                  className="w-full pl-8"
                  aria-label="Search records"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border/60 pt-4">
            <StatusFilter value={statusFilter} onChange={setStatusFilter} counts={counts} />
            <p className="ml-auto flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Filter className="size-3.5" aria-hidden="true" />
              {loading
                ? "Loading…"
                : `${plural(filtered.length, "record")}${
                    percentage !== null ? ` · ${percentage}% present` : ""
                  }`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <ErrorState className="m-4" error={error} onRetry={loadRecords} />
          ) : loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={records.length === 0 ? "No records here" : "Nothing matches these filters"}
              description={
                records.length === 0
                  ? date
                    ? "No attendance was marked on this date. Try another day or class."
                    : "Take attendance for a class and the records will show up here."
                  : "Try clearing the status filter or search term."
              }
              action={
                records.length === 0 ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/mark-attendance">Mark attendance</Link>
                  </Button>
                ) : (
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
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Remark</TableHead>
                  <TableHead className="w-10 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="tnum hidden text-[12px] text-muted-foreground sm:table-cell">
                      {formatDate(record.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-muted text-[10px] font-medium">
                            {initials(record.student?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {record.student?.name || "—"}
                          </p>
                          <p className="tnum truncate text-[11px] text-muted-foreground">
                            <span className="sm:hidden">{formatDate(record.date)} · </span>
                            Roll {record.student?.rollNumber || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-[13px] text-muted-foreground sm:table-cell">
                      {record.class?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="hidden max-w-[240px] truncate text-[12px] text-muted-foreground md:table-cell">
                      {record.remark || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`Actions for ${record.student?.name || "record"}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-44">
                          <DropdownMenuItem onSelect={() => setEdit({ ...record })}>
                            <Pencil className="size-4" aria-hidden="true" />
                            Correct record
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => remove(record)}>
                            <Trash2 className="size-4" aria-hidden="true" />
                            Delete record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(edit)} onOpenChange={(value) => !value && setEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Correct record</DialogTitle>
            <DialogDescription>
              {edit?.student?.name || "Student"} · {edit?.class?.name || "Class"} ·{" "}
              {edit ? formatDate(edit.date) : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEdit}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((status) => {
                    const active = edit?.status === status.value;
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setEdit((previous) => ({ ...previous!, status: status.value }))}
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
                <Label htmlFor="correction-remark">Remark</Label>
                <Input
                  id="correction-remark"
                  value={edit?.remark || ""}
                  onChange={(event) =>
                    setEdit((previous) => ({ ...previous!, remark: event.target.value }))
                  }
                  placeholder="Reason for correction"
                />
              </div>
            </div>
            <DialogFooter className="mt-5">
              <Button type="button" variant="secondary" onClick={() => setEdit(null)}>
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
