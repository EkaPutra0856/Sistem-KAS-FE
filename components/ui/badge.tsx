import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "inline-flex items-center rounded-full border border-transparent bg-primary/10 text-primary px-3 py-1 text-xs font-semibold",
  secondary: "inline-flex items-center rounded-full border border-border bg-secondary text-foreground px-3 py-1 text-xs font-semibold",
  outline: "inline-flex items-center rounded-full border border-border text-foreground px-3 py-1 text-xs font-semibold",
}

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof badgeVariants
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn(badgeVariants[variant], className)} {...props} />
}
