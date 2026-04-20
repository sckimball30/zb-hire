#!/usr/bin/env node
/**
 * zbhire ATS — MCP bridge for Claude Desktop
 *
 * The Claude desktop app communicates with MCP servers over stdio.
 * This script reads JSON-RPC messages from stdin, forwards them to
 * the Vercel-hosted /api/mcp endpoint, and writes responses to stdout.
 *
 * Claude Desktop config (see setup instructions below):
 *   C:\Users\<you>\AppData\Roaming\Claude\claude_desktop_config.json
 */

const ENDPOINT = process.env.ATS_MCP_URL
const API_KEY  = process.env.ATS_MCP_KEY

if (!ENDPOINT || !API_KEY) {
  process.stderr.write(
    '[zbhire-mcp] ERROR: ATS_MCP_URL and ATS_MCP_KEY env vars must be set in claude_desktop_config.json\n'
  )
  process.exit(1)
}

process.stdin.setEncoding('utf8')
let buffer = ''

process.stdin.on('data', (chunk) => {
  buffer += chunk
  const lines = buffer.split('\n')
  buffer = lines.pop() // keep any incomplete trailing line
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed) {
      try { handleMessage(JSON.parse(trimmed)) }
      catch { /* ignore malformed lines */ }
    }
  }
})

async function handleMessage(message) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(message),
    })

    // 204 = notification acknowledged, no body to return
    if (res.status === 204) return

    const json = await res.json()
    process.stdout.write(JSON.stringify(json) + '\n')
  } catch (err) {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id: message?.id ?? null,
      error: { code: -32603, message: String(err.message) },
    }) + '\n')
  }
}
