import { useEffect, useId, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { format } from "date-fns";
import {
  CalendarPlus,
  ChartColumn,
  ChevronRight,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  UserRound,
  Users,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import SidebarContent from "@/components/layout/SidebarContent";
import { Logo } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NavGroup } from "@/types";

const teacherGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      { to: "/classes", label: "Classes", icon: School },
      { to: "/students", label: "Students", icon: Users },
    ],
  },
  {
    label: "Attendance",
    items: [
      { to: "/mark-attendance", label: "Mark attendance", icon: CalendarPlus },
      { to: "/attendance", label: "Records", icon: ClipboardList },
      { to: "/history", label: "History", icon: History },
      { to: "/reports", label: "Reports", icon: ChartColumn },
    ],
  },
  {
    label: "Account",
    items: [{ to: "/profile", label: "Profile", icon: UserRound }],
  },
];

const studentGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      { to: "/history", label: "My attendance", icon: History },
      { to: "/reports", label: "My report", icon: ChartColumn },
    ],
  },
  {
    label: "Account",
    items: [{ to: "/profile", label: "Profile", icon: UserRound }],
  },
];

const MOBILE_NAV_ID = "mobile-nav";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const layoutId = useId();
  const mobileLayoutId = useId();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("markit:sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups = user?.role === "teacher" ? teacherGroups : studentGroups;
  const flatNav = groups.flatMap((group) => group.items);
  const currentLabel =
    flatNav.find((item) =>
      item.end
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to)
    )?.label || "MarkIt";

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem("markit:sidebar-collapsed", next ? "1" : "0");
      } catch {
        /* ignore storage failures */
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const userInitials = initials(user?.name);

  const accountMenu = (align: "start" | "end" = "end") => (
    <DropdownMenuContent align={align} sideOffset={6} className="min-w-52">
      <DropdownMenuLabel className="px-2 py-1.5">
        <p className="text-foreground truncate text-[13px] font-medium">
          {user?.name}
        </p>
        <p className="text-muted-foreground truncate text-[11px] font-normal">
          {user?.email}
        </p>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          navigate("/profile");
          setMobileOpen(false);
        }}
      >
        <UserRound className="size-4" aria-hidden="true" />
        Profile
        <ChevronRight className="text-muted-foreground ml-auto size-3.5" />
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <div className="theme-fade bg-background min-h-dvh">
      <div className="flex min-h-dvh">
        <aside
          className={cn(
            "border-sidebar-border sticky top-0 hidden h-dvh shrink-0 overflow-hidden border-r transition-[width,background-color,border-color,color] duration-300 ease-[var(--ease-out)] md:block",
            collapsed ? "w-[72px]" : "w-[256px]"
          )}
        >
          <SidebarContent
            groups={groups}
            user={user}
            collapsed={collapsed}
            onNavigate={() => {}}
            onLogout={handleLogout}
            layoutId={layoutId}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="theme-fade border-border/60 bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1.5 border-b px-3 backdrop-blur-xl backdrop-saturate-150 md:px-5">
            <Button
              variant="secondary"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-[18px]" strokeWidth={1.8} />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="text-muted-foreground hover:text-foreground hidden md:inline-flex"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-[18px]" strokeWidth={1.8} />
              ) : (
                <PanelLeftClose className="size-[18px]" strokeWidth={1.8} />
              )}
            </Button>

            <div className="flex min-w-0 items-center gap-1.5 pl-0.5">
              <Logo className="size-5 md:hidden" />
              <span className="text-muted-foreground hidden text-[12px] sm:inline">
                MarkIt
              </span>
              <ChevronRight
                className="text-muted-foreground/50 hidden size-3.5 sm:inline"
                aria-hidden="true"
              />
              <span
                className="text-foreground truncate text-[13px] font-medium"
                aria-current="page"
              >
                {currentLabel}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <span className="text-muted-foreground mr-1.5 hidden text-[12px] lg:inline">
                {format(new Date(), "EEEE, MMMM d")}
              </span>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full md:hidden"
                    aria-label="Account menu"
                  >
                    <Avatar size="sm">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                {accountMenu("end")}
              </DropdownMenu>
            </div>
          </header>

          <main className="theme-fade bg-muted/30 dark:bg-muted/10 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1140px]">
              <div key={location.pathname} className="page-enter">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/30 duration-200 supports-backdrop-filter:backdrop-blur-[2px] motion-reduce:data-closed:animate-none motion-reduce:data-open:animate-none" />
          <DialogPrimitive.Content
            id={MOBILE_NAV_ID}
            className="border-sidebar-border bg-sidebar shadow-float data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left fixed inset-y-0 left-0 z-50 flex w-[286px] max-w-[85vw] flex-col border-r duration-300 ease-[var(--ease-drawer)] outline-none motion-reduce:data-closed:animate-none motion-reduce:data-open:animate-none"
          >
            <DialogPrimitive.Title className="sr-only">
              Navigation
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Move between the pages of MarkIt.
            </DialogPrimitive.Description>
            <SidebarContent
              groups={groups}
              user={user}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
              layoutId={mobileLayoutId}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
