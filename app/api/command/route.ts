import { NextResponse } from "next/server"

// In-memory store for the latest command received from n8n (or any POST source).
// NOTE: This resets whenever the serverless instance is recycled — it is meant
// for live/ephemeral hardware-hook signalling, not durable storage.
type CommandState = {
  command: string
  search_query: string
  timestamp: number
  receivedAt: string
}

let latestCommand: CommandState = {
  command: "IDLE",
  search_query: "",
  timestamp: 0,
  receivedAt: new Date(0).toISOString(),
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const command = typeof payload.command === "string" ? payload.command.trim().toUpperCase() : ""
  const search_query = typeof payload.search_query === "string" ? payload.search_query.trim() : ""

  if (!command) {
    return NextResponse.json({ ok: false, error: "Missing 'command' field" }, { status: 400 })
  }

  const now = Date.now()
  latestCommand = {
    command,
    search_query,
    timestamp: now,
    receivedAt: new Date(now).toISOString(),
  }

  return NextResponse.json({ ok: true, ...latestCommand })
}

export async function GET() {
  return NextResponse.json(latestCommand, {
    headers: { "Cache-Control": "no-store" },
  })
}
