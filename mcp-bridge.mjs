#!/usr/bin/env node
import { appendFileSync } from 'fs'

const ENDPOINT = process.env.ATS_MCP_URL
const API_KEY  = process.env.ATS_MCP_KEY
const LOG      = 'C:\\Users\\sckim\\mcp-debug.log'

appendFileSync(LOG, `[${new Date().toISOString()}] Started. ENDPOINT=${ENDPOINT} KEY=${API_KEY ? 'set' : 'missing'}\n`)

if (!ENDPOINT || !API_KEY) {
  appendFileSync(LOG, 'ERROR: env vars missing — exiting\n')
  process.stderr.write('[zbhire-mcp] ERROR: ATS_MCP_URL and ATS_MCP_KEY must be set in claude_desktop_config.json\n')
  process.exit(1)
}

process.stdin.setEncoding('utf8')
let buffer = ''

process.stdin.on('data', (chunk) => {
  appendFileSync(LOG, `[stdin] ${chunk.slice(0, 200)}\n`)
  buffer += chunk
  const lines = buffer.split('\n')
  buffer = lines.pop()
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed) {
      try { handleMessage(JSON.parse(trimmed)) }
      catch { /* ignore malformed lines */ }
    }
  }
})

async function handleMessage(message) {
  appendFileSync(LOG, `[msg] ${JSON.stringify(message).slice(0, 200)}\n`)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(message),
    })

    if (res.status === 204) return

    const json = await res.json()
    appendFileSync(LOG, `[resp] ${JSON.stringify(json).slice(0, 200)}\n`)
    process.stdout.write(JSON.stringify(json) + '\n')
  } catch (err) {
    appendFileSync(LOG, `[err] ${err.message}\n`)
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id: message?.id ?? null,
      error: { code: -32603, message: String(err.message) },
    }) + '\n')
  }
}
