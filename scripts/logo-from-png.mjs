/**
 * Turns a logo rendered on a white background into a trimmed, transparent,
 * web-sized PNG — preserving full color.
 *
 * The white is removed with a flood fill from the image border rather than by
 * luminance, because a luminance key would eat the logo's own yellows and
 * highlights. Downscaling uses premultiplied alpha so edges don't pick up a
 * white fringe.
 *
 * Usage: node scripts/logo-from-png.mjs <source.png> <out.png> [targetWidth]
 */
import { readFileSync, writeFileSync } from 'fs'
import { inflateSync, deflateSync } from 'zlib'

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()
const crc32 = buf => {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function decodePng(buf) {
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  const colorType = buf[25]
  if (buf[24] !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`Unsupported PNG (bitDepth=${buf[24]} colorType=${colorType})`)
  }
  const ch = colorType === 6 ? 4 : 3

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
  const stride = width * ch
  const out = Buffer.alloc(stride * height)

  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)]
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride)
    const cur = out.subarray(y * stride, (y + 1) * stride)
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0
      const b = prev ? prev[i] : 0
      const c = prev && i >= ch ? prev[i - ch] : 0
      let v = src[i]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[i] = v & 0xff
    }
  }

  const rgba = Buffer.alloc(width * height * 4)
  for (let i = 0, p = 0; i < width * height; i++, p += 4) {
    const s = i * ch
    rgba[p] = out[s]; rgba[p + 1] = out[s + 1]; rgba[p + 2] = out[s + 2]
    rgba[p + 3] = ch === 4 ? out[s + 3] : 255
  }
  return { width, height, data: rgba }
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Flood fill near-white from the border inward; interior whites are kept. */
function removeBackground({ width, height, data }, threshold = 238) {
  const isLight = i => {
    const p = i * 4
    return data[p] >= threshold && data[p + 1] >= threshold && data[p + 2] >= threshold
  }
  const bg = new Uint8Array(width * height)
  const stack = []

  for (let x = 0; x < width; x++) {
    stack.push(x, (height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    stack.push(y * width, y * width + width - 1)
  }

  while (stack.length) {
    const i = stack.pop()
    if (bg[i] || !isLight(i)) continue
    bg[i] = 1
    const x = i % width, y = (i / width) | 0
    if (x > 0) stack.push(i - 1)
    if (x < width - 1) stack.push(i + 1)
    if (y > 0) stack.push(i - width)
    if (y < height - 1) stack.push(i + width)
  }

  let cleared = 0
  for (let i = 0; i < width * height; i++) {
    if (bg[i]) { data[i * 4 + 3] = 0; cleared++ }
  }
  console.log(`  background pixels cleared: ${((cleared / (width * height)) * 100).toFixed(1)}%`)
  return { width, height, data }
}

function trim({ width, height, data }) {
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
    }
  }
  const w = maxX - minX + 1, h = maxY - minY + 1
  const out = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) {
    data.copy(out, y * w * 4, ((minY + y) * width + minX) * 4, ((minY + y) * width + minX + w) * 4)
  }
  return { width: w, height: h, data: out }
}

/** Box downscale in premultiplied space so transparent pixels can't bleed white. */
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
          const al = data[p + 3] / 255
          r += data[p] * al; g += data[p + 1] * al; b += data[p + 2] * al
          a += data[p + 3]
          n++
        }
      }
      const avgA = a / n
      const p = (y * targetW + x) * 4
      if (avgA < 0.5) {
        out[p] = out[p + 1] = out[p + 2] = out[p + 3] = 0
      } else {
        const un = (avgA / 255) * n
        out[p] = Math.min(255, Math.round(r / un))
        out[p + 1] = Math.min(255, Math.round(g / un))
        out[p + 2] = Math.min(255, Math.round(b / un))
        out[p + 3] = Math.round(avgA)
      }
    }
  }
  return { width: targetW, height: targetH, data: out }
}

const [src, dest, widthArg] = process.argv.slice(2)
const targetW = Number(widthArg ?? 1600)

const img = decodePng(readFileSync(src))
console.log(`Source: ${img.width}x${img.height}`)
const keyed = removeBackground(img)
const trimmed = trim(keyed)
console.log(`Trimmed: ${trimmed.width}x${trimmed.height}`)
const final = resize(trimmed, targetW)
writeFileSync(dest, encodePng(final.width, final.height, final.data))
console.log(`Wrote ${dest} — ${final.width}x${final.height}`)
