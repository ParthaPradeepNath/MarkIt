import {
  Atom,
  Beaker,
  Binary,
  BookOpen,
  Calculator,
  Coins,
  Dna,
  Globe,
  Landmark,
  Languages,
  Music,
  Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Keyword → icon + tint. Order matters: first match wins, so broader
// families (e.g. chemistry before biology for "biochemistry") come first.
type SubjectMeta = { icon: LucideIcon; text: string; tile: string };

const SUBJECTS: Array<SubjectMeta & { match: string[] }> = [
  {
    match: ["math", "algebra", "geometry", "calculus", "trig", "statistic", "arithmetic"],
    icon: Calculator,
    text: "text-blue-600 dark:text-blue-400",
    tile: "bg-blue-500/10 ring-blue-500/15",
  },
  {
    match: ["chem"],
    icon: Beaker,
    text: "text-emerald-600 dark:text-emerald-400",
    tile: "bg-emerald-500/10 ring-emerald-500/15",
  },
  {
    match: ["phys", "mechanic", "quantum", "thermodynamic"],
    icon: Atom,
    text: "text-violet-600 dark:text-violet-400",
    tile: "bg-violet-500/10 ring-violet-500/15",
  },
  {
    match: ["bio", "botany", "zoology"],
    icon: Dna,
    text: "text-rose-600 dark:text-rose-400",
    tile: "bg-rose-500/10 ring-rose-500/15",
  },
  {
    match: [
      "computer",
      "computing",
      "programming",
      "coding",
      "informatics",
      "software",
      "database",
      "data science",
      "artificial",
      "machine learning",
    ],
    icon: Binary,
    text: "text-sky-600 dark:text-sky-400",
    tile: "bg-sky-500/10 ring-sky-500/15",
  },
  {
    match: ["english", "literature", "language", "grammar", "writing"],
    icon: Languages,
    text: "text-amber-600 dark:text-amber-400",
    tile: "bg-amber-500/10 ring-amber-500/15",
  },
  {
    match: ["geograph", "earth", "environment"],
    icon: Globe,
    text: "text-teal-600 dark:text-teal-400",
    tile: "bg-teal-500/10 ring-teal-500/15",
  },
  {
    match: ["history", "historic", "civics"],
    icon: Landmark,
    text: "text-orange-600 dark:text-orange-400",
    tile: "bg-orange-500/10 ring-orange-500/15",
  },
  {
    match: ["econom", "commerce", "account", "business", "finance"],
    icon: Coins,
    text: "text-lime-600 dark:text-lime-400",
    tile: "bg-lime-500/10 ring-lime-500/15",
  },
  {
    match: ["art", "design", "drawing", "painting"],
    icon: Palette,
    text: "text-pink-600 dark:text-pink-400",
    tile: "bg-pink-500/10 ring-pink-500/15",
  },
  {
    match: ["music", "instrument"],
    icon: Music,
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    tile: "bg-fuchsia-500/10 ring-fuchsia-500/15",
  },
];

const FALLBACK: SubjectMeta = {
  icon: BookOpen,
  text: "text-primary",
  tile: "bg-primary/[0.08] ring-primary/10",
};

function getSubjectMeta(subject?: string | null, name?: string | null): SubjectMeta {
  const values = [subject, name].filter(Boolean).map((value) => String(value).toLowerCase());

  for (const value of values) {
    const entry = SUBJECTS.find((item) => item.match.some((keyword) => value.includes(keyword)));
    if (entry) return entry;
  }

  return FALLBACK;
}

/**
 * Icon for a class, picked from its subject (falling back to the class name,
 * then a generic book). Renders a tinted tile by default; `plain` renders just
 * the glyph for tight spots like select options. Purely decorative — the class
 * name is always rendered as text too.
 */
type SubjectIconProps = {
  subject?: string | null;
  name?: string | null;
  className?: string;
  iconClassName?: string;
  strokeWidth?: number;
  plain?: boolean;
};

export default function SubjectIcon({
  subject,
  name,
  className,
  iconClassName,
  strokeWidth = 1.75,
  plain = false,
}: SubjectIconProps) {
  const { icon: Icon, text, tile } = getSubjectMeta(subject, name);

  if (plain) {
    return (
      <Icon
        className={cn("size-4 shrink-0", text, className, iconClassName)}
        strokeWidth={strokeWidth}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
        tile,
        text,
        className
      )}
    >
      <Icon
        className={cn("size-[19px]", iconClassName)}
        strokeWidth={strokeWidth}
        aria-hidden="true"
      />
    </span>
  );
}
