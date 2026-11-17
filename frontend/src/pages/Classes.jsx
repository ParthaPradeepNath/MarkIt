import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  BookOpen,
  CalendarPlus,
  CalendarRange,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import SubjectIcon from "@/components/SubjectIcon";
import SchedulePicker from "@/components/SchedulePicker";
import { useConfirm } from "@/components/ConfirmDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getErrorMessage, initials, plural } from "@/lib/format";

const emptyForm = { name: "", subject: "", batch: "", scheduleDate: null, scheduleTime: "" };

export default function Classes() {
  const confirm = useConfirm();
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [enrollFor, setEnrollFor] = useState(null);
  const [selected, setSelected] = useState([]);
  const [enrollQuery, setEnrollQuery] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [classResponse, studentResponse] = await Promise.all([
        api.get("/classes"),
        api.get("/students"),
      ]);
      setClasses(classResponse.data);
      setAllStudents(studentResponse.data);
      setEnrollFor((current) =>
        current ? classResponse.data.find((cls) => cls.id === current.id) || null : null
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load classes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalEnrolled = classes.reduce(
    (sum, cls) => sum + (cls.students?.length || 0),
    0
  );

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const schedule = form.scheduleDate
      ? `${format(form.scheduleDate, "EEE, MMM d")}${form.scheduleTime ? ` · ${form.scheduleTime}` : ""}`
      : "";
    try {
      await api.post("/classes", {
        name: form.name,
        subject: form.subject,
        batch: form.batch,
        schedule,
      });
      toast.success("Class created");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create class."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (cls) => {
    const ok = await confirm({
      title: `Delete ${cls.name}?`,
      description:
        "The class and its attendance records will be removed. Students will stay enrolled in no class.",
      confirmLabel: "Delete class",
    });
    if (!ok) return;
    try {
      await api.delete(`/classes/${cls.id}`);
      toast.success("Class deleted");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete class."));
    }
  };

  const openEnroll = (cls) => {
    setEnrollFor(cls);
    setSelected([]);
    setEnrollQuery("");
  };

  const enrolledIds = useMemo(
    () => enrollFor?.students?.map((student) => student.id) || [],
    [enrollFor]
  );

  const available = useMemo(() => {
    const needle = enrollQuery.trim().toLowerCase();
    return allStudents
      .filter((student) => !enrolledIds.includes(student.id))
      .filter((student) =>
        !needle
          ? true
          : [student.name, student.rollNumber, student.batch, student.email]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(needle))
      );
  }, [allStudents, enrolledIds, enrollQuery]);

  const doEnroll = async () => {
    if (!enrollFor || selected.length === 0) return;
    setEnrolling(true);
    try {
      await api.post(`/classes/${enrollFor.id}/enroll`, { studentIds: selected });
      toast.success(`Enrolled ${plural(selected.length, "student")}`);
      setSelected([]);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Enrollment failed."));
    } finally {
      setEnrolling(false);
    }
  };

  const removeFromClass = async (cls, student) => {
    const ok = await confirm({
      title: `Remove ${student.name}?`,
      description: `They will be removed from ${cls.name}. Their attendance history is kept.`,
      confirmLabel: "Remove",
      tone: "default",
    });
    if (!ok) return;
    try {
      await api.delete(`/classes/${cls.id}/students/${student.id}`);
      toast.success("Student removed from class");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove student."));
    }
  };

  const header = (
    <PageHeader
      title="Classes"
      description={
        loading || error
          ? "Create classes, enroll students and take attendance."
          : `${plural(classes.length, "class", "classes")} · ${plural(totalEnrolled, "enrollment")}`
      }
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          New class
        </Button>
      }
    />
  );

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

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[186px] rounded-xl" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No classes yet"
            description="Create your first class to enroll students and start marking attendance."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-3.5" aria-hidden="true" />
                Create class
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => {
            const count = cls.students?.length || 0;
            return (
              <Card key={cls.id} className="group/card transition-shadow duration-200 hover:shadow-elevated">
                <CardContent className="flex h-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <SubjectIcon subject={cls.subject} name={cls.name} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[14px] leading-snug font-semibold tracking-[-0.01em]">
                        {cls.name}
                      </h3>
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                        {[cls.subject, cls.batch].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon-sm"
                          className="-mt-1 -mr-1 text-muted-foreground"
                          aria-label={`Actions for ${cls.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-44">
                        <DropdownMenuItem onSelect={() => openEnroll(cls)}>
                          <UserPlus className="size-4" aria-hidden="true" />
                          Manage students
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/mark-attendance">
                            <CalendarPlus className="size-4" aria-hidden="true" />
                            Mark attendance
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => remove(cls)}>
                          <Trash2 className="size-4" aria-hidden="true" />
                          Delete class
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {cls.schedule && (
                    <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <CalendarRange className="size-3.5 shrink-0" aria-hidden="true" />
                      {cls.schedule}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2">
                    {count > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {cls.students.slice(0, 4).map((student) => (
                            <Avatar key={student.id} size="sm">
                              <AvatarFallback className="bg-muted text-[9px] font-semibold ring-1 ring-border/60 ring-inset">
                                {initials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {count > 4 && (
                            <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-1 ring-border/60 ring-inset">
                              +{count - 4}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {plural(count, "student")}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        No students
                      </Badge>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-primary hover:text-primary"
                      onClick={() => openEnroll(cls)}
                    >
                      {count > 0 ? "Manage" : "Enroll"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create class</DialogTitle>
            <DialogDescription>Add a class, then enroll students into it.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="class-name">Class name</Label>
                <Input
                  id="class-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Mathematics 101"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="class-subject">Subject</Label>
                  <Input
                    id="class-subject"
                    value={form.subject}
                    onChange={(event) => setForm({ ...form, subject: event.target.value })}
                    placeholder="Mathematics"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="class-batch">Batch</Label>
                  <Input
                    id="class-batch"
                    value={form.batch}
                    onChange={(event) => setForm({ ...form, batch: event.target.value })}
                    placeholder="Batch A"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="class-schedule">Schedule</Label>
                <SchedulePicker
                  id="class-schedule"
                  date={form.scheduleDate}
                  time={form.scheduleTime}
                  onDateChange={(scheduleDate) => setForm((current) => ({ ...current, scheduleDate }))}
                  onTimeChange={(scheduleTime) => setForm((current) => ({ ...current, scheduleTime }))}
                  className="w-full"
                />
                <p className="text-[11px] text-muted-foreground">
                  Optional · shown on class cards and attendance.
                </p>
              </div>
            </div>
            <DialogFooter className="mt-5">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                Create class
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(enrollFor)}
        onOpenChange={(value) => {
          if (!value) {
            setEnrollFor(null);
            setSelected([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{enrollFor?.name}</DialogTitle>
            <DialogDescription>
              {plural(enrolledIds.length, "student")} enrolled · choose who to add or remove.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={enrollQuery}
                onChange={(event) => setEnrollQuery(event.target.value)}
                placeholder="Search students…"
                className="pl-8"
                aria-label="Search students to enroll"
              />
            </div>

            <div className="max-h-[260px] min-h-[120px] overflow-y-auto overscroll-contain rounded-lg border border-border/70">
              {available.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                  {allStudents.length === 0
                    ? "No students exist yet."
                    : "Every matching student is already enrolled."}
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {available.map((student) => {
                    const checked = selected.includes(student.id);
                    return (
                      <li key={student.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors duration-150 hover:bg-muted/60",
                            checked && "bg-primary/[0.04]"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              setSelected((previous) =>
                                checked
                                  ? previous.filter((id) => id !== student.id)
                                  : [...previous, student.id]
                              )
                            }
                          />
                          <Avatar size="sm">
                            <AvatarFallback className="bg-muted text-[10px] font-medium">
                              {initials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-foreground">
                              {student.name}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              Roll {student.rollNumber}
                              {student.batch ? ` · ${student.batch}` : ""}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {enrolledIds.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                  Enrolled
                </p>
                <ul className="max-h-[132px] divide-y divide-border/60 overflow-y-auto overscroll-contain rounded-lg border border-border/70">
                  {enrollFor.students.map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <Avatar size="sm">
                        <AvatarFallback className="bg-muted text-[10px] font-medium">
                          {initials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {student.name}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          Roll {student.rollNumber}
                        </span>
                      </span>
                      <Button
                        variant="secondary"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromClass(enrollFor, student)}
                        aria-label={`Remove ${student.name}`}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setEnrollFor(null)}>
              Done
            </Button>
            <Button onClick={doEnroll} disabled={selected.length === 0 || enrolling}>
              {enrolling ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus className="size-3.5" aria-hidden="true" />
              )}
              Enroll {selected.length > 0 ? selected.length : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
