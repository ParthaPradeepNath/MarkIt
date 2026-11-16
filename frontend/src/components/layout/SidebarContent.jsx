import { NavLink, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { LogOut, MoreHorizontal, ChevronRight, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/Logo";
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
import { initials } from "@/lib/format";

function NavItem({ item, collapsed, onNavigate, layoutId, reduce }) {
  const { to, label, icon: Icon, end } = item;

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-sidebar-ring/40",
          isActive
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/65 hover:text-sidebar-foreground",
          collapsed && "mx-auto w-10 justify-center px-0"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              aria-hidden="true"
              layoutId={`nav-active-${layoutId}`}
              className="absolute inset-0 rounded-[10px] bg-sidebar-primary/[0.09] ring-1 ring-sidebar-primary/10 ring-inset"
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 460, damping: 40, mass: 0.75 }
              }
            />
          )}
          <Icon
            className={cn(
              "relative z-10 size-[17px] shrink-0 transition-colors duration-150",
              isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
            )}
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <span
            className={cn(
              "relative z-10 min-w-0 truncate transition-opacity duration-150",
              collapsed && "pointer-events-none absolute opacity-0"
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function SidebarContent({
  groups,
  user,
  collapsed = false,
  onNavigate,
  onLogout,
  layoutId,
}) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const userInitials = initials(user?.name);

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <Brand collapsed={collapsed} subtitle={collapsed ? null : "Attendance"} />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-1 pb-4">
        {groups.map((group, index) => (
          <div key={group.label} className={cn(index > 0 && "mt-4")}>
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold tracking-[0.09em] text-muted-foreground/70 uppercase">
                {group.label}
              </p>
            )}
            {collapsed && index > 0 && <div className="mx-auto mb-3 h-px w-6 bg-sidebar-border" />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                  layoutId={layoutId}
                  reduce={reduce}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {collapsed ? (
              <Button
                variant="ghost"
                size="icon-lg"
                className="mx-auto flex rounded-full"
                aria-label="Account menu"
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            ) : (
              <button
                type="button"
                className="group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-150 hover:bg-sidebar-accent"
              >
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] leading-tight font-medium">
                    {user?.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] leading-tight text-muted-foreground capitalize">
                    {user?.role}
                  </span>
                </span>
                <MoreHorizontal className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={collapsed ? "start" : "end"}
            side={collapsed ? "right" : "top"}
            className="min-w-52"
          >
            <DropdownMenuLabel className="px-2 py-1.5">
              <p className="truncate text-[13px] font-medium text-foreground">{user?.name}</p>
              <p className="truncate text-[11px] font-normal text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                navigate("/profile");
                onNavigate?.();
              }}
            >
              <UserRound className="size-4" aria-hidden="true" />
              Profile
              <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
