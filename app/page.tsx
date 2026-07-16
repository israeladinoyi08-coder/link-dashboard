"use client"

import { useEffect, useRef, useState } from "react"
import Vapi from "@vapi-ai/web"
import { Activity, Cpu, KeyRound, TerminalSquare, AudioLines, ShieldAlert, Mic, MicOff } from "lucide-react"
import { StatusPanel } from "@/components/status-panel"
import { ArcReactor } from "@/components/arc-reactor"
import { WaveGraph } from "@/components/wave-graph"
import { CommandHud } from "@/components/command-hud"
import { ScannerPanel } from "@/components/scanner-panel"
import { useMicAnalyser } from "@/hooks/use-mic-analyser"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CommandState = {
  command: string
  search_query: string
  timestamp: number
  receivedAt: string
}

export default function Page() {
  const [state, setState] = useState<CommandState>({
    command: "IDLE",
    search_query: "",
    timestamp: 0,
    receivedAt: "",
  })
  const [connected, setConnected] = useState(false)
  const lastTs = useRef(0)
  const [clock, setClock] = useState("")
  const mic = useMicAnalyser()
  const micLive = mic.status === "live"

  const [isCalling, setIsCalling] = useState(false)
  const [volume, setVolume] = useState(0)
  const vapiRef = useRef<any>(null)

  useEffect(() => {
    vapiRef.current = new Vapi("396df14f-8737-4d81-9f13-40ccc15af586")

    // Properly bind the UI state to when the voice connection actually opens
    vapiRef.current.on("call-start", () => {
      setIsCalling(true)
    })

    vapiRef.current.on("call-end", () => {
      setIsCalling(false)
      setVolume(0)
    })

    vapiRef.current.on("volume-level", (level: number) => {
      setVolume(level)
    })

    vapiRef.current.on("error", (err: any) => {
      console.error("Vapi error", err)
      setIsCalling(false)
    })

    return () => {
      vapiRef.current?.stop()
      vapiRef.current?.removeAllListeners()
    }
  }, [])
  const handleVapiToggle = async () => {
    if (isCalling) {
      vapiRef.current?.stop()
    } else {
      try {
        // Start call cleanly with the parameters Vapi SDK natively expects
        await vapiRef.current?.start("20ab2760-46dd-466c-ae59-6e8ce397c5ec")
      } catch (err) {
        console.error("Vapi start failed:", err)
      }
    }
  }

        // 2. Start the Vapi call
        await vapiRef.current?.start({
          assistantId: "20ab2760-46dd-466c-ae59-6e8ce397c5ec",
          publicKey: "396df14f-8737-4d81-9f13-40ccc15af586"
        });

        // 3. Explicitly unmute the incoming WebRTC stream
        vapiRef.current?.setMuted(false);
      } catch (err) {
        console.error("Vapi start failed:", err)
      }
    }
  }
  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch("/api/command", { cache: "no-store" })
        if (!res.ok) throw new Error("bad status")
        const data: CommandState = await res.json()
        if (cancelled) return
        setConnected(true)
        if (data.timestamp && data.timestamp !== lastTs.current) {
          lastTs.current = data.timestamp
          setState(data)
        }
      } catch {
        if (!cancelled) setConnected(false)
      }
    }

    poll()
    const id = setInterval(poll, 1500)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  // Local clock for the header.
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-US", { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const alert = state.command === "RED_ALERT"
  const playing = state.command === "PLAY_MUSIC"

  // Toggle the global crimson theme on the <html> element for ambient lighting.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("red-alert", alert)
    return () => root.classList.remove("red-alert")
  }, [alert])

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div
        className={cn("alert-flash pointer-events-none fixed inset-0 z-50 mix-blend-screen", alert ? "block" : "hidden")}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4 md:p-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/25 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-primary/50 bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-sans text-lg font-bold uppercase tracking-[0.35em] text-primary">L.I.N.K.</h1>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                lithium integrated neuron key
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
            <span
              className={cn(
                "flex items-center gap-1.5",
                alert ? "text-destructive" : playing ? "text-primary" : "text-nominal",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  alert
                    ? "animate-ping bg-destructive"
                    : playing
                      ? "animate-pulse bg-primary shadow-[0_0_8px_var(--primary)]"
                      : "animate-pulse bg-nominal shadow-[0_0_8px_var(--nominal)]",
                )}
              />
              {alert ? "RED_ALERT" : playing ? "PLAYBACK" : "NOMINAL"}
            </span>
            <span className="tabular-nums">{clock}</span>
          </div>
        </header>

        {/* Main grid */}
        <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_1.4fr_1fr]">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <StatusPanel title="System Core Status">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-sans text-4xl font-bold text-primary">98%</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    optimization
                  </p>
                </div>
                <Activity className="h-8 w-8 text-primary/60" />
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-[98%] rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
              </div>
            </StatusPanel>

            <StatusPanel title="Neuron Key Sync">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <span className="font-mono text-sm text-foreground">KEY_0xA7</span>
                </div>
                <span className="flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-widest text-primary">
                  <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
                  Active
                </span>
              </div>
            </StatusPanel>

            <StatusPanel title="Local Terminal Directory" className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <TerminalSquare className="h-5 w-5 text-primary" />
                <span className="font-sans text-[11px] font-semibold uppercase tracking-widest text-primary">
                  Connected
                </span>
              </div>
              <ul className="space-y-1.5 font-mono text-[11px] text-muted-foreground">
                <li>{"> /sys/core/reactor.io"}</li>
                <li>{"> /net/n8n/webhook"}</li>
                <li>{"> /audio/spectrum.dat"}</li>
                <li className="text-primary">{"> ready _"}</li>
              </ul>
            </StatusPanel>
          </div>

          {/* Center column: wave graph + arc reactor */}
          <div className="flex flex-col gap-4">
            <StatusPanel title="Frequency Wave Analysis" className="min-h-[220px] flex-1">
              <div className="h-[180px] w-full">
                <WaveGraph active={playing} alert={alert} />
              </div>
            </StatusPanel>

            <StatusPanel title="Arc Reactor // Audio Spectrum" className="flex-1">
              <ArcReactor active={playing} alert={alert} analyserRef={mic.analyserRef} micLive={isCalling} volume={volume} />

              <div className="mt-2 flex flex-col items-center gap-2">
              <Button
  type="button"
  variant={isCalling ? "default" : "outline"}
  size="sm"
  onClick={handleVapiToggle}
  className={cn(
    "w-full gap-1.5 font-mono text-xs uppercase tracking-wider",
    isCalling && "border-cyan-500/50 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/40"
  )}
>
  {isCalling ? <Mic className="h-3.5 w-3.5 animate-pulse text-cyan-400" /> : <MicOff className="h-3.5 w-3.5" />}
  {isCalling ? "L.I.N.K. Active" : "Enable Mic"}
</Button>

                <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  {micLive ? (
                    <span className="flex items-center justify-center gap-1.5 text-primary">
                      <AudioLines className="h-3.5 w-3.5" /> listening to you
                    </span>
                  ) : playing ? (
                    <span className="flex items-center justify-center gap-1.5 text-primary">
                      <AudioLines className="h-3.5 w-3.5" /> spectrum live
                    </span>
                  ) : mic.error ? (
                    <span className="text-destructive">{mic.error}</span>
                  ) : (
                    "core idle · enable mic to react to your voice"
                  )}
                </p>
              </div>
            </StatusPanel>
          </div>

          {/* Right column: scanner + command feed */}
          <div className="flex flex-col gap-4">
            <StatusPanel title="Optical Scanner // Surroundings">
              <ScannerPanel alert={alert} />
            </StatusPanel>

            <StatusPanel title="Uplink // n8n Command" className="flex-1">
              <CommandHud
                command={state.command}
                searchQuery={state.search_query}
                connected={connected}
                lastSync={state.timestamp}
              />
            </StatusPanel>

            <StatusPanel title="Active Directive">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">now executing</p>
              <p
                className={cn(
                  "mt-1 font-sans text-2xl font-bold tracking-wider",
                  alert ? "text-destructive" : playing ? "text-primary" : "text-nominal",
                )}
              >
                {state.command || "IDLE"}
              </p>
              {state.search_query ? (
                <p className="mt-1 truncate font-mono text-sm text-foreground">&ldquo;{state.search_query}&rdquo;</p>
              ) : null}
            </StatusPanel>
          </div>
        </div>

        {/* Alert banner */}
        {alert ? (
          <div className="alert-flash flex items-center justify-center gap-3 rounded-md border-2 border-destructive bg-destructive/20 py-3">
            <ShieldAlert className="h-6 w-6 text-destructive-foreground" />
            <span className="font-sans text-lg font-bold uppercase tracking-[0.4em] text-destructive-foreground">
              Red Alert Engaged
            </span>
          </div>
        ) : (
          <footer className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            POST {"{ command, search_query }"} → /api/command · polling every 1.5s
          </footer>
        )}
      </div>
    </main>
  )
}
