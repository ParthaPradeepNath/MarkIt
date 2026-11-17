import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Small icon button. The sun/moon swap is an infrequent state change, so it
 * cross-fades with a short, zero-bounce spring; reduced motion keeps only the
 * opacity fade. The label carries the state — motion is never the only cue.
 */
export default function ThemeToggle({ className }) {
  const { resolvedTheme, setTheme } = useTheme();
  const reduce = useReducedMotion();
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";
  const Icon = isDark ? Moon : Sun;

  const enter = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.25, filter: "blur(4px)" };
  const shown = reduce ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" };
  const exit = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.25, filter: "blur(4px)" };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("rounded-full text-muted-foreground/70 hover:text-foreground", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={enter}
          animate={shown}
          exit={exit}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          className="flex items-center justify-center"
        >
          <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
