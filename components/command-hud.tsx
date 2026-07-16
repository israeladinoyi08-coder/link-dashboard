import { cn } from "@/lib/utils"

type CommandHudProps = {
  command: string
  searchQuery: string
  connected: boolean
  lastSync: number
}

export function CommandHud({ command, searchQuery, connected, lastSync }: CommandHudProps) {
  const stamp = lastSync ? new Date(lastSync).toLocaleTimeString() : "—"
  const cmd = command || "IDLE"
  const playing = cmd === "PLAY_MUSIC"
  const idle = cmd === "IDLE"

  return (
    <div className="space-y-3 font-mono text-xs">
      <Row label="LINK">
        <span className={cn("flex items-center gap-1.5", connected ? "text-primary" : "text-muted-foreground")}>
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              connected ? "animate-pulse bg-primary shadow-[0_0_8px_var(--primary)]" : "bg-muted-foreground",
            )}
          />
          {connected ? "POLLING /api/command" : "AWAITING SIGNAL"}
        </span>
      </Row>
      <Row label="CMD">
        <span
          className={cn(
            "font-sans font-semibold tracking-widest",
            playing ? "text-primary" : idle ? "text-nominal" : "text-foreground",
          )}
        >
          {cmd}
        </span>
      </Row>
      <Row label="QUERY">
        <span className="truncate text-muted-foreground">{searchQuery || "null"}</span>
      </Row>
      <Row label="STATUS">
        {playing ? (
          <span className="truncate font-sans font-semibold text-primary">
            Playing: {searchQuery || "unknown track"}
          </span>
        ) : idle ? (
          <span className="font-sans font-semibold text-nominal">Nominal · standing by</span>
        ) : (
          <span className="font-sans font-semibold text-foreground">Executing directive</span>
        )}
      </Row>
      <Row label="SYNC">
        <span className="text-muted-foreground">{stamp}</span>
      </Row>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  )
}
