/**
 * Generates the app's logo assets from the master ZB Designs artwork.
 *
 * The source file is black-on-opaque-white with no alpha channel, which shows
 * as a white box on the dark sidebar and on off-white page backgrounds. This
 * keys the white out to transparency (luminance becomes alpha, so antialiased
 * edges survive), splits the "ZB" monogram from the "DESIGNS" wordmark, and
 * writes trimmed, downscaled variants in both black and white.
 *
 * Usage: node scripts/generate-logo-assets.mjs <source.png>
 */
import { readFileSync, writeFileSync } from 'fs'
import { inflateSync, deflateSync } from 'zlib'
import { join } from 'path'

const SRC = process.argv[2]
const OUT_DIR = join(process.cwd(), 'public', 'logos')

// ── CRC32 (PNG chunk checksums) ──────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// ── Decode: 8-bit PNG (RGB or RGBA) → flat RGBA ──────────────────────────────
function decodePng(buf) {
  if (buf.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Not a PNG')
  }
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  const bitDepth = buf[24]
  const colorType = buf[25]
  const interlace = buf[28]

  if (bitDepth !== 8) throw new Error(`Unsupported bit depth ${bitDepth}`)
  if (interlace !== 0) throw new Error('Interlaced PNGs not supported')
  if (colorType !== 2 && colorType !== 6) throw new Error(`Unsupported color type ${colorType}`)

  const channels = colorType === 6 ? 4 : 3

  const idat = []
  let off = 8
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.subarray(off + 4, off + 8).toString('ascii')
    if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len))
    if (type === 'IEND') break
    off += 12 + len
  }

  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = Buffer.alloc(width * height * channels)

  // Reverse the per-scanline filters
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride)
    const cur = out.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null

    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0
      const b = prev ? prev[i] : 0
      const c = prev && i >= channels ? prev[i - channels] : 0
      let val = src[i]
      switch (filter) {
        case 0: break
        case 1: val += a; break
        case 2: val += b; break
        case 3: val += (a + b) >> 1; break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
          val += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
          break
        }
        default: throw new Error(`Bad filter ${filter}`)
      }
      cur[i] = val & 0xff
    }
  }

  // Normalize to RGBA
  const rgba = Buffer.alloc(width * height * 4)
  for (let i = 0, p = 0; i < width * height; i++, p += 4) {
    const s = i * channels
    rgba[p] = out[s]
    rgba[p + 1] = out[s + 1]
    rgba[p + 2] = out[s + 2]
    rgba[p + 3] = channels === 4 ? out[s + 3] : 255
  }
  return { width, height, data: rgba }
}

// ── Encode: flat RGBA → PNG ──────────────────────────────────────────────────
function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // RGBA
  ihdr[10] = 0  // deflate
  ihdr[11] = 0  // adaptive filtering
  ihdr[12] = 0  // no interlace

  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Transform helpers ────────────────────────────────────────────────────────

/** White background → transparent. Luminance becomes alpha, so edges stay smooth. */
function keyOutWhite({ width, height, data }, ink) {
  const out = Buffer.alloc(width * height * 4)
  for (let p = 0; p < data.length; p += 4) {
    const lum = (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114)
    out[p] = ink
    out[p + 1] = ink
    out[p + 2] = ink
    out[p + 3] = Math.round(255 - lum) // black ink → opaque, white bg → clear
  }
  return { width, height, data: out }
}

/** Rows/cols that contain no visible ink get trimmed away. */
function contentBounds({ width, height, data }, threshold = 8) {
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > threshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return { minX, minY, maxX, maxY }
}

function crop({ width, height, data }, x0, y0, w, h) {
  const out = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) {
    data.copy(out, y * w * 4, ((y0 + y) * width + x0) * 4, ((y0 + y) * width + x0 + w) * 4)
  }
  return { width: w, height: h, data: out }
}

/** Box-filter downscale — averages source pixels, giving clean antialiasing. */
function resize({ width, height, data }, targetW) {
  if (targetW >= width) return { width, height, data }
  const scale = width / targetW
  const targetH = Math.max(1, Math.round(height / scale))
  const out = Buffer.alloc(targetW * targetH * 4)

  for (let y = 0; y < targetH; y++) {
    const sy0 = Math.floor(y * scale)
    const sy1 = Math.min(height, Math.max(sy0 + 1, Math.floor((y + 1) * scale)))
    for (let x = 0; x < targetW; x++) {
      const sx0 = Math.floor(x * scale)
      const sx1 = Math.min(width, Math.max(sx0 + 1, Math.floor((x + 1) * scale)))
      let r = 0, g = 0, b = 0, a = 0, n = 0
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const p = (sy * width + sx) * 4
          r += data[p]; g += data[p + 1]; b += data[p + 2]; a += data[p + 3]
          n++
        }
      }
      const p = (y * targetW + x) * 4
      out[p] = Math.round(r / n)
      out[p + 1] = Math.round(g / n)
      out[p + 2] = Math.round(b / n)
      out[p + 3] = Math.round(a / n)
    }
  }
  return { width: targetW, height: targetH, data: out }
}

/** Finds the blank horizontal gap separating the monogram from the wordmark. */
function findRowGap({ width, height, data }, fromY, toY) {
  const rowHasInk = []
  for (let y = 0; y < height; y++) {
    let ink = false
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) { ink = true; break }
    }
    rowHasInk.push(ink)
  }
  let best = null, runStart = null
  for (let y = fromY; y <= toY; y++) {
    if (!rowHasInk[y]) {
      if (runStart === null) runStart = y
    } else if (runStart !== null) {
      const len = y - runStart
      if (!best || len > best.len) best = { start: runStart, end: y, len }
      runStart = null
    }
  }
  return best
}

function pad({ width, height, data }, px) {
  const w = width + px * 2, h = height + px * 2
  const out = Buffer.alloc(w * h * 4)
  for (let y = 0; y < height; y++) {
    data.copy(out, ((y + px) * w + px) * 4, y * width * 4, (y + 1) * width * 4)
  }
  return { width: w, height: h, data: out }
}

function write(name, img) {
  const path = join(OUT_DIR, name)
  writeFileSync(path, encodePng(img.width, img.height, img.data))
  console.log(`  ${name.padEnd(34)} ${img.width}x${img.height}`)
}

// ── Run ──────────────────────────────────────────────────────────────────────
const src = decodePng(readFileSync(SRC))
console.log(`Source: ${src.width}x${src.height}`)

const keyed = keyOutWhite(src, 0)
const b = contentBounds(keyed)
const full = crop(keyed, b.minX, b.minY, b.maxX - b.minX + 1, b.maxY - b.minY + 1)
console.log(`Trimmed to content: ${full.width}x${full.height}`)

// Split the ZB monogram from the DESIGNS wordmark at the widest blank band
const gap = findRowGap(full, Math.floor(full.height * 0.55), Math.floor(full.height * 0.9))
if (!gap) throw new Error('Could not locate the gap between the monogram and wordmark')
console.log(`Monogram/wordmark gap at rows ${gap.start}-${gap.end}`)

const monoRaw = crop(full, 0, 0, full.width, gap.start)
const mb = contentBounds(monoRaw)
const mono = crop(monoRaw, mb.minX, mb.minY, mb.maxX - mb.minX + 1, mb.maxY - mb.minY + 1)

const toWhite = img => ({
  ...img,
  data: (() => {
    const d = Buffer.from(img.data)
    for (let p = 0; p < d.length; p += 4) { d[p] = 255; d[p + 1] = 255; d[p + 2] = 255 }
    return d
  })(),
})

console.log('\nWriting assets:')
write('zb-designs-lockup.png',       resize(full, 720))
write('zb-designs-lockup-white.png', resize(toWhite(full), 720))
write('zb-designs-mark.png',         resize(mono, 320))
write('zb-designs-mark-white.png',   resize(toWhite(mono), 320))
write('zb-designs-icon.png',         resize(pad(mono, Math.round(mono.width * 0.06)), 256))
console.log('\nDone.')
