import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const whiteButton =
  "border border-[#e5e5e5] bg-white text-[#171717] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_2px_6px_rgba(0,0,0,0.04)] transition-[color,box-shadow,background-color,border-color,transform] duration-200 ease-out enabled:hover:-translate-y-px enabled:hover:border-[#d4d4d4] enabled:hover:bg-[#fafafa] enabled:hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.06)] enabled:active:translate-y-0 dark:border-white/10 dark:bg-white/[0.06] dark:text-foreground dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] dark:enabled:hover:border-white/15 dark:enabled:hover:bg-white/[0.09]"

const buttonVariants = cva(
  "group/button relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center bg-clip-padding font-medium whitespace-nowrap outline-none select-none transition-[color,box-shadow] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:border before:border-transparent before:transition-[scale,background-color,border-color,box-shadow] before:duration-150 before:ease-[var(--ease-out)] focus-visible:ring-3 focus-visible:ring-ring/40 motion-reduce:before:transition-none active:not-aria-[haspopup]:not-data-[variant=push]:before:scale-[0.99] data-pressed:not-data-[variant=push]:before:scale-[0.99] motion-reduce:active:before:scale-100 motion-reduce:data-pressed:before:scale-100 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-[#3b82f6] bg-[#2563eb] bg-[linear-gradient(to_bottom,#3b82f6,#2563eb)] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_2px_6px_rgba(37,99,235,0.35)] transition-[color,box-shadow,background-color,border-color,transform] duration-200 ease-out enabled:hover:-translate-y-px enabled:hover:bg-[#1d4ed8] enabled:hover:bg-[linear-gradient(to_bottom,#2563eb,#1d4ed8)] enabled:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_12px_rgba(37,99,235,0.5)] enabled:active:translate-y-0",
        outline: whiteButton,
        secondary: whiteButton,
        ghost:
          "text-foreground before:bg-transparent hover:before:bg-muted dark:hover:before:bg-muted/60",
        destructive:
          "text-destructive before:bg-destructive/10 hover:before:bg-destructive/15 focus-visible:ring-destructive/25 dark:before:bg-destructive/20 dark:hover:before:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-0",
      },
      size: {
        default:
          "h-8 gap-1 rounded-lg px-3 text-[0.8rem] has-data-[icon=inline-end]:pe-2.5 has-data-[icon=inline-start]:ps-2.5",
        xs: "h-6 gap-1 rounded-md px-2 text-[0.7rem] has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-xs has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 rounded-[10px] px-3.5 text-sm has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3",
        icon: "size-8",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-9 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

