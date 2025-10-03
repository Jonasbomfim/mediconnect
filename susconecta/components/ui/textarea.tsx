import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "border-2 border-gray-300 dark:border-gray-600",
        "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2",
        "hover:border-gray-400 dark:hover:border-gray-500",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aria-invalid:border-2",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
