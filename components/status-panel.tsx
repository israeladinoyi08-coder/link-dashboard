import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type StatusPanelProps = {
  title: string
  children: ReactNode
  className?: string
}

/** Bordered HUD card with corner ticks and a glowing header, used across the grid. */
export function StatusPanel({ title, children, className }: StatusPanelProps) {
  return (
    <section
      className={cn(
        "relative rounded-md border border-primary/25 bg-card/60 p-4 backdrop-blur-sm",
        "shadow-[inset_0_0_30px_rgba(80,240,255,0.04)]",
        className,
      )}
    >
      {/* corner ticks */}
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-primary/70" />
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-primary/70" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-primary/70" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-primary/70" />
      <header className="mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">{title}</h2>
      </header>
      {children}
    </section>
  )
}
