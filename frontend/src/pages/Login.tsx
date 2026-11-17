import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import LoginMockup from "@/components/LoginMockup";
import { Brand, Logo } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/format";

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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error("Couldn't sign you in", {
        description: getErrorMessage(
          err,
          "Check your email and password, then try again."
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const fill = (email: string, password: string) =>
    setForm({ email, password });

  return (
    <div className="theme-fade bg-background relative min-h-dvh overflow-hidden dark:bg-[#121212]">
      <div className="absolute top-5 right-5 z-20 sm:top-7 sm:right-8">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-16 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-8">
        {/* Brand panel — one soft wash, one headline, one signature visual. */}
        <section className="relative hidden flex-col justify-center self-stretch lg:flex">
          <div
            aria-hidden="true"
            className="brand-wash pointer-events-none absolute inset-y-0 -right-16 -left-[50vw] opacity-[0.09]"
          />
          <div className="relative">
            <Brand subtitle="Attendance management" />

            <h1 className="page-enter text-foreground mt-14 max-w-[19ch] text-[44px] leading-[1.08] font-semibold tracking-[-0.04em] xl:text-[50px]">
              Attendance, without the busywork.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-[42ch] text-[15px] leading-relaxed">
              Take a full class in seconds, spot at-risk students early, and see
              the whole term at a glance.
            </p>

            <LoginMockup className="mt-12" />
          </div>
        </section>

        {/* Sign-in panel — the page itself is the surface, no floating card. */}
        <section className="page-enter mx-auto w-full max-w-[400px]">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Logo className="size-10" />
            <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.03em]">
              MarkIt
            </h1>
            <p className="text-muted-foreground mt-1 text-[13px]">
              Attendance management
            </p>
          </div>

          <header className="mb-8">
            <h2 className="text-foreground text-[26px] leading-tight font-semibold tracking-[-0.03em]">
              Welcome back
            </h2>
            <p className="text-muted-foreground mt-2 text-[14px]">
              Sign in to continue to your dashboard.
            </p>
          </header>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px]">
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@school.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className="h-11 pl-10 text-[14px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px]">
                Password
              </Label>
              <div className="relative">
                <LockKeyhole
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  className="h-11 pr-11 pl-10 text-[14px]"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2"
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
              className="mt-1 h-11 w-full text-[14px]"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-[12px]">
              or try a demo account
            </span>
            <span className="bg-border h-px flex-1" />
          </div>

          <div className="grid gap-2.5">
            {demos.map(({ role, email, password, icon: Icon }) => (
              <button
                key={role}
                type="button"
                onClick={() => fill(email, password)}
                className="border-border/70 bg-card/60 hover:bg-muted/60 focus-visible:ring-ring/40 flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors duration-150 outline-none focus-visible:ring-3"
              >
                <span className="bg-primary/[0.08] text-primary ring-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset">
                  <Icon
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block text-[13px] leading-tight font-medium">
                    {role}
                  </span>
                  <span className="text-muted-foreground mt-1 block truncate text-[12px] leading-tight">
                    {email}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
