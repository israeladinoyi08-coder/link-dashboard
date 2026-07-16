"use client"

import { Camera, CameraOff, ScanLine, Radar } from "lucide-react"
import { useCamera } from "@/hooks/use-camera"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Environmental scanner. Requests camera access (browser/system prompt) and
 * streams the feed into a <video> with a sci-fi scanline + reticle overlay so
 * L.I.N.K. can "scan the surroundings".
 */
export function ScannerPanel({ alert }: { alert: boolean }) {
  const cam = useCamera()
  const live = cam.status === "live"

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded border border-primary/30 bg-secondary/40",
          live && "scan-active",
        )}
      >
        {/* Camera feed */}
        <video
          ref={cam.videoRef}
          className={cn("h-full w-full object-cover transition-opacity", live ? "opacity-90" : "opacity-0")}
          muted
          playsInline
          aria-label="Environmental camera feed"
        />

        {/* Idle placeholder */}
        {!live ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Radar className={cn("h-10 w-10", cam.status === "requesting" && "animate-spin")} />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
              {cam.status === "requesting" ? "requesting access" : "sensor offline"}
            </span>
          </div>
        ) : null}

        {/* Scan overlay */}
        {live ? (
          <>
            <div className="scanline pointer-events-none absolute inset-x-0 top-0 h-1/3" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-3 rounded border border-primary/40" aria-hidden="true">
              <span className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-primary" />
              <span className="absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2 border-primary" />
              <span className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-primary" />
              <span className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-primary" />
            </div>
            <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-primary">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
              scanning
            </div>
          </>
        ) : null}
      </div>

      <Button
        type="button"
        variant={live ? "default" : "outline"}
        size="sm"
        onClick={() => (live ? cam.stop() : cam.start())}
        disabled={cam.status === "requesting"}
        className="font-mono text-[11px] uppercase tracking-widest"
        aria-pressed={live}
      >
        {live ? <Camera className="h-3.5 w-3.5" /> : <CameraOff className="h-3.5 w-3.5" />}
        {cam.status === "requesting" ? "Requesting..." : live ? "Stop Scan" : "Scan Surroundings"}
      </Button>

      <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {live ? (
          <span className="flex items-center justify-center gap-1.5 text-primary">
            <ScanLine className="h-3.5 w-3.5" /> environment mapped
          </span>
        ) : cam.error ? (
          <span className="text-destructive">{cam.error}</span>
        ) : (
          "optical sensor standby"
        )}
      </p>
    </div>
  )
}
