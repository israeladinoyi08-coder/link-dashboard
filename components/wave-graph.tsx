"use client"

import { useEffect, useRef } from "react"

type WaveGraphProps = {
  active: boolean
  alert: boolean
}

/** Central scrolling wave / frequency graph showing mock audio-data signal. */
export function WaveGraph({ active, alert }: WaveGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  const alertRef = useRef(alert)
  activeRef.current = active
  alertRef.current = alert

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let frame = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
    }
    resize()
    window.addEventListener("resize", resize)

    const draw = () => {
      frame++
      const w = canvas.width
      const h = canvas.height
      const isActive = activeRef.current
      const color = alertRef.current ? "255, 70, 70" : "80, 240, 255"
      const amp = (isActive ? 0.34 : 0.12) * h

      ctx.clearRect(0, 0, w, h)

      // Baseline bars behind the wave.
      const bars = 64
      const bw = w / bars
      for (let i = 0; i < bars; i++) {
        const v = isActive
          ? (Math.sin(i * 0.5 + frame * 0.08) * 0.5 + 0.5) * Math.random()
          : (Math.sin(i * 0.3 + frame * 0.02) * 0.5 + 0.5) * 0.2
        const bh = v * h * 0.7
        ctx.fillStyle = `rgba(${color}, ${0.06 + v * 0.14})`
        ctx.fillRect(i * bw + bw * 0.2, h - bh, bw * 0.6, bh)
      }

      // Main waveform.
      ctx.beginPath()
      for (let x = 0; x <= w; x += 2) {
        const t = x / w
        const y =
          h / 2 +
          Math.sin(t * 14 + frame * 0.12) * amp * Math.sin(t * Math.PI) +
          Math.sin(t * 40 + frame * 0.2) * amp * 0.25 * (isActive ? 1 : 0.3)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = `rgba(${color}, 0.9)`
      ctx.lineWidth = 2 * dpr
      ctx.shadowColor = `rgba(${color}, 0.8)`
      ctx.shadowBlur = 12 * dpr
      ctx.stroke()
      ctx.shadowBlur = 0

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
}
