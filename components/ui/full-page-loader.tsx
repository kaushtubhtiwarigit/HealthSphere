"use client"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type FullPageLoaderProps = {
  message?: string
  className?: string
}

export function FullPageLoader({ message = "Loading...", className }: FullPageLoaderProps) {
  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted", className)}>
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30">
          <Spinner className="size-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export default FullPageLoader
