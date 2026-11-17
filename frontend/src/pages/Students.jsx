import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import SubjectIcon from "@/components/SubjectIcon";
import { TableSkeleton } from "@/components/Skeletons";
import { useConfirm } from "@/components/ConfirmDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { getErrorMessage, initials, plural } from "@/lib/format";

const emptyForm = {
  name: "",
  email: "",
  rollNumber: "",
  batch: "",
  className: "",
  guardianPhone: "",
  password: "",
};

export default function Students() {
  const confirm = useConfirm();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [enrollTarget, setEnrollTarget] = useState(null);
  const [enrollClassId, setEnrollClassId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [studentResponse, classResponse] = await Promise.all([
        api.get("/students"),
        api.get("/classes"),
      ]);
      setStudents(studentResponse.data);
      setClasses(classResponse.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load students."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const batches = useMemo(
    () => [...new Set(students.map((student) => student.batch).filter(Boolean))].sort(),
    [students]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter((student) => {
      if (batchFilter !== "all" && student.batch !== batchFilter) return false;
      if (!needle) return true;
      return [student.name, student.email, student.rollNumber, student.batch, student.class?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [students, query, batchFilter]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (student) => {
    setEditId(student.id);
    setForm({
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      batch: student.batch,
      className: student.class?.id || student.classId || "",
      guardianPhone: student.guardianPhone || "",
      password: "",
    });
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/students/${editId}`, form);
        toast.success("Student updated");
      } else {
        await api.post("/students", form);
        toast.success("Student enrolled");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save student."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (student) => {
    const ok = await confirm({
      title: `Delete ${student.name}?`,
      description:
        "This permanently removes the student and their login account. Attendance records will remain but be unlinked.",
      confirmLabel: "Delete student",
    });
    if (!ok) return;
    try {
      await api.delete(`/students/${student.id}`);
      toast.success("Student deleted");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete student."));
    }
  };

  const openEnroll = (student) => {
    setEnrollTarget(student);
    setEnrollClassId(student.class?.id || student.classId || "");
  };

  const enroll = async () => {
    if (!enrollTarget || !enrollClassId) return;
    setEnrolling(true);
    try {
      await api.post(`/classes/${enrollClassId}/enroll`, {
        studentIds: [enrollTarget.id],
      });
      toast.success(`${enrollTarget.name} enrolled in the class`);
      setEnrollTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Enrollment failed."));
    } finally {
      setEnrolling(false);
    }
  };

  const currentEnrollId = enrollTarget?.class?.id || enrollTarget?.classId || "";
  const alreadyEnrolled = Boolean(currentEnrollId && currentEnrollId === enrollClassId);

  const header = (
    <PageHeader
      title="Students"
      description={
        loading || error
          ? "Everyone enrolled across your batches."
          : `${plural(students.length, "student")} across ${plural(batches.length, "batch", "batches")}.`
      }
      actions={
        <Button onClick={openAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Add student
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or roll…"
            className="pl-8"
            aria-label="Search students"
          />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="sm:w-44" aria-label="Filter by batch">
            <SelectValue placeholder="All batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All batches</SelectItem>
            {batches.map((batch) => (
              <SelectItem key={batch} value={batch}>
                {batch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[12px] text-muted-foreground sm:ml-auto" aria-live="polite">
          {loading ? "Loading…" : `Showing ${filtered.length} of ${students.length}`}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={7} cols={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={query || batchFilter !== "all" ? Search : Users}
              title={students.length === 0 ? "No students yet" : "No students match"}
              description={
                students.length === 0
                  ? "Add your first student to start enrolling them in classes and taking attendance."
                  : "Try a different search term or clear the batch filter."
              }
              action={
                students.length === 0 ? (
                  <Button size="sm" onClick={openAdd}>
                    <Plus className="size-3.5" aria-hidden="true" />
                    Add student
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setQuery("");
                      setBatchFilter("all");
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
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Roll</TableHead>
                  <TableHead className="hidden sm:table-cell">Batch</TableHead>
                  <TableHead className="hidden md:table-cell">Class</TableHead>
                  <TableHead className="hidden md:table-cell">Guardian</TableHead>
                  <TableHead className="w-10 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-primary/[0.08] text-[10px] font-semibold text-primary">
                            {initials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {student.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="tnum hidden text-muted-foreground sm:table-cell">
                      {student.rollNumber || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {student.batch ? (
                        <Badge variant="secondary">{student.batch}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {student.class?.name ? (
                        <span className="text-[13px]">{student.className.name}</span>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">Not enrolled</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {student.guardianPhone || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon-sm"
                            className="text-muted-foreground"
                            aria-label={`Actions for ${student.name}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-44">
                          <DropdownMenuItem onSelect={() => openEdit(student)}>
                            <Pencil className="size-4" aria-hidden="true" />
                            Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEnroll(student)}>
                            <BookOpen className="size-4" aria-hidden="true" />
                            Enroll in class
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => remove(student)}>
                            <Trash2 className="size-4" aria-hidden="true" />
                            Delete student
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit student" : "Add student"}</DialogTitle>
            <DialogDescription>
              {editId
                ? "Update this student's profile details."
                : "Create a student profile and a matching login account."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="student-name">Full name</Label>
                <Input
                  id="student-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Priya Sharma"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-email">Email</Label>
                <Input
                  id="student-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="priya@school.com"
                  required
                  disabled={Boolean(editId)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-roll">Roll number</Label>
                <Input
                  id="student-roll"
                  value={form.rollNumber}
                  onChange={(event) => setForm({ ...form, rollNumber: event.target.value })}
                  placeholder="S-1024"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-batch">Batch</Label>
                <Input
                  id="student-batch"
                  value={form.batch}
                  onChange={(event) => setForm({ ...form, batch: event.target.value })}
                  placeholder="Batch A"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select
                  value={form.className}
                  onValueChange={(value) => setForm({ ...form, className: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <div className="px-2 py-3 text-center text-[13px] text-muted-foreground">
                        No classes yet
                      </div>
                    ) : (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          <SubjectIcon subject={cls.subject} name={cls.name} plain />
                          {cls.name} ({cls.batch})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-guardian">Guardian phone</Label>
                <Input
                  id="student-guardian"
                  value={form.guardianPhone}
                  onChange={(event) => setForm({ ...form, guardianPhone: event.target.value })}
                  placeholder="+91 98xxx xxxxx"
                />
              </div>
              {!editId && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="student-password">Default password</Label>
                  <Input
                    id="student-password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="password123"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave blank to use the default password.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="mt-5">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                {editId ? "Save changes" : "Add student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(enrollTarget)} onOpenChange={(value) => !value && setEnrollTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll in a class</DialogTitle>
            <DialogDescription>
              Add {enrollTarget?.name} to a class so they show up when taking attendance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={enrollClassId} onValueChange={setEnrollClassId}>
              <SelectTrigger className="w-full">
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
            {alreadyEnrolled && (
              <p className="pt-1 text-[11px] text-muted-foreground">
                Already enrolled in this class.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEnrollTarget(null)}>
              Cancel
            </Button>
            <Button onClick={enroll} disabled={!enrollClassId || enrolling || alreadyEnrolled}>
              {enrolling && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              Enroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
