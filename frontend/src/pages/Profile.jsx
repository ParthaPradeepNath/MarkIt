import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Monitor,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { getErrorMessage, initials } from "@/lib/format";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function Profile() {
  const { user, setProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.student?.guardianPhone || "");
  const [saving, setSaving] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isStudent = user?.role === "student";
  const profileInitials = useMemo(() => initials(user?.name), [user?.name]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dirty = name.trim() !== (user?.name || "") || (isStudent && phone !== (user?.student?.guardianPhone || ""));

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { name: name.trim() };
      if (isStudent) payload.guardianPhone = phone;
      const { data } = await api.put("/auth/profile", payload);
      setProfile(data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  };

  const openPassword = () => {
    setPw({ currentPassword: "", newPassword: "", confirm: "" });
    setShowPw(false);
    setPwOpen(true);
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (pw.newPassword.length < 6) {
      toast.error("Choose a longer password", {
        description: "Your new password needs at least 6 characters.",
      });
      return;
    }
    if (pw.newPassword !== pw.confirm) {
      toast.error("Passwords don't match", {
        description: "Re-enter your new password in both fields.",
      });
      return;
    }
    setPwSaving(true);
    try {
      await api.put("/auth/password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast.success("Password changed");
      setPwOpen(false);
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error("Couldn't change your password", {
        description: getErrorMessage(err, "Please try again in a moment."),
      });
    } finally {
      setPwSaving(false);
    }
  };

  const meta = isStudent
    ? [
        { label: "Roll number", value: user?.student?.rollNumber || "—" },
        { label: "Batch", value: user?.student?.batch || "—" },
        {
          label: "Class",
          value: user?.student?.class?.name || "Not enrolled",
        },
      ]
    : [
        { label: "Role", value: "Teacher" },
        { label: "Workspace", value: "MarkIt attendance" },
      ];

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your account, security and appearance." />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="size-16">
                <AvatarFallback className="bg-primary/[0.08] text-[20px] font-semibold text-primary">
                  {profileInitials}
                </AvatarFallback>
              </Avatar>
              <p className="mt-3 text-[16px] leading-tight font-semibold tracking-[-0.01em]">
                {user?.name}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Mail className="size-3.5" aria-hidden="true" />
                {user?.email}
              </p>
              <Badge
                variant="secondary"
                className="mt-3 gap-1 capitalize"
              >
                <BadgeCheck className="size-3" aria-hidden="true" />
                {user?.role}
              </Badge>

              <dl className="mt-5 w-full divide-y divide-border/60 rounded-xl border border-border/70 bg-muted/25 text-left">
                {meta.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <dt className="text-[12px] text-muted-foreground">{item.label}</dt>
                    <dd className="truncate text-[12px] font-medium text-foreground">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="size-4 text-muted-foreground" aria-hidden="true" />
                Appearance
              </CardTitle>
              <CardDescription>Choose how MarkIt looks on this device.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="grid grid-cols-3 gap-2"
                role="group"
                aria-label="Theme"
              >
                {THEMES.map(({ value, label, icon: Icon }) => {
                  const active = mounted && theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      aria-pressed={active}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[12px] font-medium outline-none transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:ring-3 focus-visible:ring-ring/30",
                        active
                          ? "border-primary/40 bg-primary/[0.06] text-foreground ring-1 ring-primary/20"
                          : "border-border/70 bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
                Account details
              </CardTitle>
              <CardDescription>Update the name and contact details on your profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-name">Full name</Label>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input id="profile-email" value={user?.email || ""} disabled />
                    <p className="text-[11px] text-muted-foreground">
                      Email is used to sign in and can&apos;t be changed here.
                    </p>
                  </div>
                  {isStudent && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="profile-phone">Guardian phone</Label>
                      <Input
                        id="profile-phone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+91 98xxx xxxxx"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-border/60 pt-4">
                  <Button type="submit" disabled={saving || !dirty}>
                    {saving ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="size-3.5" aria-hidden="true" />
                    )}
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                  {dirty && !saving && (
                    <span className="text-[12px] text-muted-foreground">Unsaved changes</span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
                Security
              </CardTitle>
              <CardDescription>
                Use a strong, unique password to keep your account safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[13px] font-medium">Password</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Last changed details aren&apos;t tracked — change it any time.
                </p>
              </div>
              <Button variant="secondary" onClick={openPassword}>
                <KeyRound className="size-3.5" aria-hidden="true" />
                Change password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter your current password, then choose a new one of at least 6 characters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={changePassword}>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type={showPw ? "text" : "password"}
                  value={pw.currentPassword}
                  onChange={(event) => setPw({ ...pw, currentPassword: event.target.value })}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPw ? "text" : "password"}
                    value={pw.newPassword}
                    onChange={(event) => setPw({ ...pw, newPassword: event.target.value })}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="pr-9"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPw((value) => !value)}
                    aria-label={showPw ? "Hide passwords" : "Show passwords"}
                  >
                    {showPw ? (
                      <EyeOff className="size-3.5" aria-hidden="true" />
                    ) : (
                      <Eye className="size-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type={showPw ? "text" : "password"}
                  value={pw.confirm}
                  onChange={(event) => setPw({ ...pw, confirm: event.target.value })}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-5">
              <Button type="button" variant="secondary" onClick={() => setPwOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pwSaving}>
                {pwSaving && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                {pwSaving ? "Changing…" : "Change password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
