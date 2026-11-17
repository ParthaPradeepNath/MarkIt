import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

type TabsContextValue = {
  active: string | undefined;
  layoutId: string;
  variant: "default" | "line";
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function Tabs({
  className,
  orientation = "horizontal",
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [internal, setInternal] = React.useState<string | undefined>(
    defaultValue
  );
  const layoutId = React.useId();

  const active = value ?? internal;
  const handleValueChange = React.useCallback(
    (next: string) => {
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [onValueChange, value]
  );

  return (
    <TabsContext.Provider value={{ active, layoutId, variant: "default" }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        className={cn(
          "group/tabs flex gap-4 data-horizontal:flex-col",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsContext.Provider>
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "rounded-full bg-muted p-1",
        line: "gap-1 rounded-none border-b bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const ctx = React.useContext(TabsContext);
  const reduce = useReducedMotion();
  const isActive = ctx?.active === value;

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 data-active:text-foreground data-[variant=line]:after:bg-foreground relative inline-flex h-full flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-transparent px-3.5 py-1 text-[0.8rem] font-medium whitespace-nowrap transition-colors duration-150 outline-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 data-[variant=line]:rounded-none data-[variant=line]:bg-transparent data-[variant=line]:after:absolute data-[variant=line]:after:inset-x-0 data-[variant=line]:after:-bottom-px data-[variant=line]:after:h-0.5 data-[variant=line]:after:opacity-0 data-[variant=line]:data-active:after:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {isActive && ctx?.variant === "default" && (
        <motion.span
          aria-hidden="true"
          layoutId={`tab-thumb-${ctx.layoutId}`}
          className="bg-card dark:bg-accent absolute inset-0 rounded-full shadow-[0_1px_2px_oklch(0_0_0/0.08),0_0_0_1px_oklch(0_0_0/0.03)] dark:shadow-none"
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 520, damping: 42, mass: 0.7 }
          }
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 flex-1 text-sm outline-none data-[state=active]:duration-200 motion-reduce:data-[state=active]:animate-none",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
