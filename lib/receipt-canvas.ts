import { billTotals, itemName, lineTotal, type Bill } from "@/lib/bill"
import {
  digits,
  formatDate,
  formatNumber,
  formatTime,
  parseNumber,
} from "@/lib/bn"
import { MEMO_LOGO_SRC } from "@/lib/logo"
import { SHOP } from "@/lib/shop"
import { T } from "@/lib/text"

/** 80mm paper at 203 dpi prints 72mm wide, which is 576 dots. */
export const PAPER_DOTS = 576

const PAD = 8
const RIGHT = PAPER_DOTS - PAD
const CENTER = PAPER_DOTS / 2

/** The lucide "egg" icon outline, drawn on a 24 unit grid. */
const EGG_PATH = "M12 2C8 2 4 8 4 14a8 8 0 0 0 16 0c0-6-4-12-8-12"

/** The font family next/font registered for --font-sans (Noto Serif Bengali). */
function fontFamily() {
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-sans")
    .trim()
  return family || "serif"
}

/** Logo width on the paper, in dots (about 15mm). */
const LOGO_DOTS = 120

/** The logo converted to pure black and white, ready to print. */
let logoCanvas: HTMLCanvasElement | null = null

/**
 * Loads the logo and dithers it to 1 bit: the thermal printer can only print
 * black dots, so colors become patterns. Without a logo file the memo falls
 * back to a simple egg icon.
 */
async function loadLogo() {
  if (logoCanvas) return
  const img = new Image()
  img.src = MEMO_LOGO_SRC
  await img.decode()
  const width = LOGO_DOTS
  const height = Math.round((img.naturalHeight / img.naturalWidth) * width)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, width, height)
  const image = ctx.getImageData(0, 0, width, height)
  const px = image.data
  // Grayscale, with a little extra contrast so the outlines stay strong.
  const gray = new Float32Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    const lum =
      px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114
    gray[i] = Math.min(255, Math.max(0, (lum - 128) * 1.25 + 128 + 12))
  }
  // Floyd-Steinberg dithering.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const old = gray[i]
      const value = old < 128 ? 0 : 255
      const err = old - value
      gray[i] = value
      if (x + 1 < width) gray[i + 1] += (err * 7) / 16
      if (y + 1 < height) {
        if (x > 0) gray[i + width - 1] += (err * 3) / 16
        gray[i + width] += (err * 5) / 16
        if (x + 1 < width) gray[i + width + 1] += err / 16
      }
    }
  }
  for (let i = 0; i < gray.length; i++) {
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = gray[i]
    px[i * 4 + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  logoCanvas = canvas
}

/** Makes sure the fonts (Bengali glyphs included) and the logo are ready. */
export async function loadReceiptFonts() {
  // Only the web font itself: the local() fallback face may not exist.
  const primary = fontFamily().split(",")[0]
  await Promise.allSettled([
    ...[500, 600, 700, 800].map((w) =>
      document.fonts.load(`${w} 24px ${primary}`, "বাংলা ০১২৩ ৳")
    ),
    loadLogo(),
  ])
}

/**
 * Draws the cash memo at the printer's native resolution. The printer has no
 * Bengali font, so the memo is printed as this picture.
 */
export function drawReceipt(bill: Bill): HTMLCanvasElement {
  const family = fontFamily()
  const { items, subtotal, due, deposit, remaining, change } = billTotals(bill)

  // Draw onto a tall scratch canvas, then crop to the used height.
  const canvas = document.createElement("canvas")
  canvas.width = PAPER_DOTS
  canvas.height = 1200 + items.length * 140
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#000"
  ctx.strokeStyle = "#000"

  let y = 6

  const font = (size: number, weight = 600) => {
    ctx.font = `${weight} ${size}px ${family}`
  }
  const text = (value: string, x: number, align: CanvasTextAlign = "left") => {
    ctx.textAlign = align
    ctx.fillText(value, x, y)
  }
  const rule = (dash: number[] = [], width = 2) => {
    ctx.save()
    ctx.setLineDash(dash)
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(PAD, y)
    ctx.lineTo(RIGHT, y)
    ctx.stroke()
    ctx.restore()
  }
  /** Splits text into lines that fit `maxWidth` in the current font. */
  const wrap = (value: string, maxWidth: number) => {
    const lines: string[] = []
    let current = ""
    for (const word of value.split(/\s+/)) {
      const next = current ? `${current} ${word}` : word
      if (current && ctx.measureText(next).width > maxWidth) {
        lines.push(current)
        current = word
      } else {
        current = next
      }
    }
    if (current) lines.push(current)
    return lines
  }

  // Logo
  if (logoCanvas) {
    ctx.drawImage(logoCanvas, CENTER - logoCanvas.width / 2, y)
    y += logoCanvas.height + 34
  } else {
    // No logo file yet: two eggs, like the lucide icon.
    const egg = new Path2D(EGG_PATH)
    ctx.save()
    ctx.lineWidth = 1.6
    ctx.lineJoin = "round"
    for (const [dx, scale] of [
      [-34, 2.6],
      [2, 2.9],
    ]) {
      ctx.save()
      ctx.translate(CENTER + dx, y + (2.9 - scale) * 24)
      ctx.scale(scale, scale)
      ctx.fillStyle = "#fff"
      ctx.fill(egg)
      ctx.stroke(egg)
      ctx.restore()
    }
    ctx.restore()
    y += 2.9 * 24 + 44
  }

  // Shop name
  font(40, 800)
  text(SHOP.name, CENTER, "center")
  y += 32
  font(22, 600)
  const phones = SHOP.phones.map((p) => digits(p)).join("  ·  ")
  text(phones, CENTER, "center")

  // "Cash memo" badge
  y += 18
  font(28, 700)
  const badgeWidth = ctx.measureText(T.cashMemo).width + 48
  ctx.beginPath()
  ctx.roundRect(CENTER - badgeWidth / 2, y, badgeWidth, 46, 10)
  ctx.fill()
  y += 33
  ctx.fillStyle = "#fff"
  text(T.cashMemo, CENTER, "center")
  ctx.fillStyle = "#000"
  y += 24

  // Customer (the date and time are printed in the footer)
  const meta: [string, string][] = []
  if (bill.customerName.trim())
    meta.push([T.customer, bill.customerName.trim()])
  if (bill.customerPhone.trim()) {
    meta.push([T.mobile, digits(bill.customerPhone.trim())])
  }
  font(23, 600)
  const labelWidth = Math.max(...meta.map(([l]) => ctx.measureText(l).width))
  for (const [label, value] of meta) {
    y += 32
    font(23, 600)
    text(label, PAD)
    text(":", PAD + labelWidth + 8)
    font(23, 700)
    wrap(value, RIGHT - (PAD + labelWidth + 26)).forEach((line, i) => {
      if (i > 0) y += 30
      text(line, PAD + labelWidth + 26)
    })
  }

  // Items
  const COL_QTY = 330
  const COL_RATE = 446
  y += 18
  rule([8, 6])
  y += 32
  font(23, 800)
  text(T.item, PAD)
  text(T.quantity, COL_QTY, "right")
  text(T.rate, COL_RATE, "right")
  text(T.total, RIGHT, "right")
  y += 10

  if (items.length === 0) {
    y += 42
    font(23, 600)
    text(T.noItems, CENTER, "center")
    y += 8
  }

  items.forEach((item, index) => {
    if (index > 0) {
      y += 6
      rule([2, 4], 1)
    }
    y += 34
    font(24, 700)
    const nameLines = wrap(itemName(item), 220)
    text(nameLines[0], PAD)
    font(24, 600)
    text(formatNumber(parseNumber(item.qty)), COL_QTY, "right")
    text(formatNumber(parseNumber(item.price)), COL_RATE, "right")
    font(24, 800)
    text(formatNumber(lineTotal(item)), RIGHT, "right")
    font(24, 700)
    for (const line of nameLines.slice(1)) {
      y += 30
      text(line, PAD)
    }
    y += 8
  })

  // Totals
  y += 18
  rule([8, 6])
  const row = (label: string, value: string) => {
    y += 34
    font(24, 600)
    text(label, PAD)
    text(value, RIGHT, "right")
  }
  row(T.itemCount, formatNumber(items.length))
  if (due > 0 || deposit > 0) {
    row(T.subtotal, `৳ ${formatNumber(subtotal)}`)
    if (due > 0) row(T.due, `+ ৳ ${formatNumber(due)}`)
    if (deposit > 0) row(T.deposit, `- ৳ ${formatNumber(deposit)}`)
  }
  y += 16
  rule([], 3)
  y += 44
  font(32, 800)
  text(T.remaining, PAD)
  text(`৳ ${formatNumber(remaining)}`, RIGHT, "right")
  y += 18
  rule([], 3)
  if (change > 0) {
    y += 40
    font(28, 800)
    text(T.change, PAD)
    text(`৳ ${formatNumber(change)}`, RIGHT, "right")
    y += 14
    rule([], 3)
  }

  // Footer: date and time, then the shop / warehouse address
  y += 36
  font(22, 600)
  text(`${formatDate(bill.date)}, ${formatTime(bill.date)}`, CENTER, "center")
  y += 28
  for (const line of wrap(SHOP.address, RIGHT - PAD)) {
    text(line, CENTER, "center")
    y += 28
  }
  y -= 18

  const out = document.createElement("canvas")
  out.width = PAPER_DOTS
  out.height = Math.ceil(y)
  out.getContext("2d")!.drawImage(canvas, 0, 0)
  return out
}
