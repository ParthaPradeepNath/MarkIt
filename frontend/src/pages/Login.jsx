import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarPlus,
  ChartColumn,
  CircleAlert,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spotlight } from "@/components/ui/spotlight";
import { Brand, Logo } from "@/components/Logo";
import AttendanceRing from "@/components/AttendanceRing";
import { getErrorMessage } from "@/lib/format";

const features = [
  {
    icon: CalendarPlus,
    title: "Mark a whole class in seconds",
    description: "Bulk present/absent toggles with quick correction when plans change.",
  },
  {
    icon: ShieldCheck,
    title: "Built for teachers and students",
    description: "Role-based access keeps every dashboard focused on what matters.",
  },
  {
    icon: ChartColumn,
    title: "Catch at-risk students early",
    description: "Live percentages, trends and alerts before attendance becomes a problem.",
  },
];

const demos = [
  {
    role: "Teacher",
    email: "teacher@school.com",
    password: "password123",
    icon: GraduationCap,
  },
  {
    role: "Student",
    email: "arjun.sharma@student.school.com",
    password: "password123",
    icon: Users,
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const fill = (email, password) => {
    setError("");
    setForm({ email, password });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Spotlight
          className="-top-[22rem] -left-[18rem] hidden text-primary/70 lg:block"
          fill="currentColor"
        />
        <div className="absolute -top-44 -left-36 size-[560px] rounded-full bg-primary/[0.08] blur-3xl" />
        <div className="absolute top-1/4 -right-48 size-[520px] rounded-full bg-[oklch(0.72_0.11_195)]/[0.09] blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 size-[420px] rounded-full bg-[oklch(0.7_0.14_300)]/[0.05] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8">
        <section className="hidden lg:block">
          <Brand subtitle="Attendance management" />
          <h1 className="stagger-in mt-10 max-w-md text-[42px] leading-[1.06] font-semibold tracking-[-0.035em] text-foreground xl:text-[46px]">
            Attendance, without the busywork.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Take a full class in seconds, spot at-risk students early, and see the whole term at a
            glance.
          </p>

          <ul className="stagger-in mt-9 space-y-4">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-card text-primary shadow-card ring-1 ring-border/60 ring-inset">
                  <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[13px] font-medium text-foreground">{title}</span>
                  <span className="mt-0.5 block max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-10 max-w-md rounded-2xl border border-border/70 bg-card/70 p-4 shadow-card backdrop-blur-xl">
            <div className="flex items-center gap-5">
              <AttendanceRing value={92} size={92} stroke={9} label="Today" />
              <div className="min-w-0 flex-1 space-y-2.5">
                <div>
                  <p className="text-[13px] font-medium text-foreground">Mathematics 101</p>
                  <p className="text-[11px] text-muted-foreground">Batch A · Mon/Wed/Fri</p>
                </div>
                <div className="space-y-1.5">
                  <PreviewRow color="bg-emerald-500" label="Present" value="23" />
                  <PreviewRow color="bg-rose-500" label="Absent" value="1" />
                  <PreviewRow color="bg-amber-500" label="Late" value="1" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[420px] lg:justify-self-end">
          <div className="mb-7 flex flex-col items-center text-center lg:hidden">
            <Logo className="size-9" />
            <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.025em]">MarkIt</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Attendance management</p>
          </div>

          <Card className="shadow-elevated">
            <CardContent className="p-6 sm:p-7">
              <div className="mb-6">
                <h2 className="text-[22px] leading-tight font-semibold tracking-[-0.02em]">
                  Welcome back
                </h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Sign in to continue to your dashboard.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg bg-destructive/[0.07] px-3 py-2.5 text-[13px] leading-snug text-destructive ring-1 ring-destructive/15"
                  >
                    <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@school.com"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      className="h-10 pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      className="h-10 pr-10 pl-9"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-1 h-10 w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-medium tracking-[0.09em] text-muted-foreground uppercase">
                  Demo accounts
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-2">
                {demos.map(({ role, email, password, icon: Icon }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => fill(email, password)}
                    className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5 text-left outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary ring-1 ring-primary/10 ring-inset">
                      <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-tight font-medium">{role}</span>
                      <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted-foreground">
                        {email}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            MarkIt · Built for teachers and students
          </p>
        </section>
      </div>
    </div>
  );
}

function PreviewRow({ color, label, value }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={`size-1.5 rounded-full ${color}`} aria-hidden="true" />
      <span className="text-muted-foreground">{label}</span>
      <span className="tnum ml-auto font-medium text-foreground">{value}</span>
    </div>
  );
}
