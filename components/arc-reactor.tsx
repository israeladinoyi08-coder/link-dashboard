"use client"

import { useEffect, useRef } from "react"

type ArcReactorProps = {
  active: boolean
  alert: boolean
  analyserRef?: React.RefObject<AnalyserNode | null>
  micLive?: boolean
  volume?: number // Receive the real-time Vapi voice volume from parent page
}

export function ArcReactor({ active, alert, analyserRef, micLive = false, volume = 0 }: ArcReactorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  const alertRef = useRef(alert)
  const isCallingRef = useRef(micLive)
  const vapiVolumeRef = useRef(volume)

  activeRef.current = active
  alertRef.current = alert
  isCallingRef.current = micLive
  vapiVolumeRef.current = volume

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const BARS = 96
    const values = new Array(BARS).fill(0.15)
    const targets = new Array(BARS).fill(0.15)
    let freqBuffer: Uint8Array | null = null
    let raf = 0
    let frame = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const size = canvas.clientWidth
      canvas.width = size * dpr
      canvas.height = size * dpr
    }
    resize()
    window.addEventListener("resize", resize)

    const accent = () => {
      return alertRef.current
        ? { core: "255, 70, 70", glow: "255, 40, 40" }
        : { core: "80, 240, 255", glow: "40, 200, 255" }
    }

    const draw = () => {
      frame++
      const size = canvas.width
      const cx = size / 2
      const cy = size / 2
      const isActive = activeRef.current
      const isLive = isCallingRef.current
      const currentVolume = vapiVolumeRef.current
      const analyser = analyserRef?.current
      const useMic = micLive && !!analyser

      const { core, glow } = accent()
      ctx.clearRect(0, 0, size, size)

      if (isLive) {
        // DRIVE REACTOR ANIMATION DIRECTLY WITH THE PASSED VAPI VOICE VOLUME
        for (let i = 0; i < BARS; i++) {
          const spread = Math.sin(i * 0.1) * 0.2
          targets[i] = 0.15 + currentVolume * 0.85 + spread * Math.random()
        }
      } else if (useMic && analyser) {
        if (!freqBuffer || freqBuffer.length !== analyser.frequencyBinCount) {
          freqBuffer = new Uint8Array(analyser.frequencyBinCount)
        }
        analyser.getByteFrequencyData(freqBuffer)
        const bins = freqBuffer.length
        for (let i = 0; i < BARS; i++) {
          const half = BARS / 2
          const pos = i < half ? i : BARS - 1 - i
          const idx = Math.floor((pos / half) * bins * 0.8)
          targets[i] = 0.12 + (freqBuffer[idx] / 255) * 0.88
        }
      } else if (frame % 4 === 0) {
        for (let i = 0; i < BARS; i++) {
          if (isActive) {
            const base = Math.sin(i * 0.4 + frame * 0.05) * 0.5 + 0.5
            targets[i] = 0.2 + base * 0.6 * Math.random()
          } else {
            targets[i] = 0.12 + Math.random() * 0.08
          }
        }
      }

      const ease = isLive ? 0.35 : useMic ? 0.4 : 0.18
      for (let i = 0; i < BARS; i++) {
        values[i] += (targets[i] - values[i]) * ease
      }

      const innerR = size * 0.2
      const maxBar = size * 0.16

      for (let i = 0; i < BARS; i++) {
        const angle = (i / BARS) * Math.PI * 2 - Math.PI / 2
        const len = maxBar * values[i]
        const x1 = cx + Math.cos(angle) * innerR
        const y1 = cy + Math.sin(angle) * innerR
        const x2 = cx + Math.cos(angle) * (innerR + len)
        const y2 = cy + Math.sin(angle) * (innerR + len)
        ctx.strokeStyle = `rgba(${core}, ${0.35 + values[i] * 0.65})`
        ctx.lineWidth = size * 0.008
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(frame * (isLive ? 0.015 : 0.004))
      for (let seg = 0; seg < 3; seg++) {
        const r = innerR + maxBar + size * (0.02 + seg * 0.02)
        ctx.strokeStyle = `rgba(${glow}, ${0.5 - seg * 0.12})`
        ctx.lineWidth = size * 0.004
        for (let s = 0; s < 12; s++) {
          const a0 = (s / 12) * Math.PI * 2
          const a1 = a0 + Math.PI / 12
          ctx.beginPath()
          ctx.arc(0, 0, r, a0, a1)
          ctx.stroke()
        }
      }
      ctx.restore()

      let energy = 0
      for (let i = 0; i < BARS; i++) energy += values[i]
      energy /= BARS
      const pulse = isLive
        ? 0.7 + currentVolume * 0.3
        : useMic
        ? 0.55 + Math.min(energy * 1.6, 0.45)
        : isActive
        ? 0.85 + Math.sin(frame * 0.2) * 0.15
        : 0.6 + Math.sin(frame * 0.05) * 0.1

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR)
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * pulse})`)
      grad.addColorStop(0.35, `rgba(${core}, ${0.8 * pulse})`)
      grad.addColorStop(1, `rgba(${glow}, 0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = `rgba(${core}, ${pulse})`
      ctx.lineWidth = size * 0.006
      ctx.beginPath()
      ctx.arc(cx, cy, innerR * 0.7, 0, Math.PI * 2)
      ctx.stroke()

      ctx.save()
      ctx.translate(cx, cy)
      ctx.strokeStyle = `rgba(255,255,255,${0.75 * pulse})`
      ctx.lineWidth = size * 0.004
      ctx.beginPath()
      for (let t = 0; t < 3; t++) {
        const a = (t / 3) * Math.PI * 2 - Math.PI / 2
        const px = Math.cos(a) * innerR * 0.42
        const py = Math.sin(a) * innerR * 0.42
        if (t === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.restore()

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [micLive])

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-cyan-400/80">
          {isCallingRef.current ? "L.I.N.K. LIVE" : "SYSTEM ONLINE"}
        </span>
      </div>
    </div>
  )
}
