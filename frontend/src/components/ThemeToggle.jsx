import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }) {
  const { resolvedTheme, setTheme } = useTheme();
  const reduce = useReducedMotion();
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={reduce ? false : { opacity: 0, scale: 0.85, rotate: -25 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85, rotate: 25 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="size-4" strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <Sun className="size-4" strokeWidth={1.8} aria-hidden="true" />
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
