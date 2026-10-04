import { billTotals, itemName, lineTotal, type Bill } from "@/lib/bill"
import {
  DICTIONARIES,
  digits,
  formatDate,
  formatNumber,
  formatTime,
  parseNumber,
  type Lang,
} from "@/lib/i18n"
import { UNITS } from "@/lib/products"
import { SHOP } from "@/lib/shop"

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

/** Makes sure every weight used on the memo is loaded, Bengali glyphs included. */
export async function loadReceiptFonts() {
  // Only the web font itself: the local() fallback face may not exist.
  const primary = fontFamily().split(",")[0]
  await Promise.allSettled(
    [500, 600, 700, 800].map((w) =>
      document.fonts.load(`${w} 24px ${primary}`, "বাংলা ০১২৩ Razzak ৳")
    )
  )
}

/**
 * Draws the cash memo at the printer's native resolution. The printer has no
 * Bengali font, so the memo is printed as this picture.
 */
export function drawReceipt(bill: Bill, lang: Lang): HTMLCanvasElement {
  const t = DICTIONARIES[lang]
  const family = fontFamily()
  const { items, subtotal, due, discount, total } = billTotals(bill)

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

  // Logo: two eggs, like the lucide icon.
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

  // Shop
  font(40, 800)
  text(SHOP.name[lang], CENTER, "center")
  y += 32
  font(22, 600)
  text(SHOP.tagline[lang], CENTER, "center")

  // "Cash memo" badge
  y += 18
  font(28, 700)
  const badgeWidth = ctx.measureText(t.cashMemo).width + 48
  ctx.beginPath()
  ctx.roundRect(CENTER - badgeWidth / 2, y, badgeWidth, 46, 10)
  ctx.fill()
  y += 33
  ctx.fillStyle = "#fff"
  text(t.cashMemo, CENTER, "center")
  ctx.fillStyle = "#000"
  y += 24

  // Date and customer
  const meta: [string, string][] = [
    [t.date, `${formatDate(bill.date, lang)}, ${formatTime(bill.date, lang)}`],
  ]
  if (bill.customerName.trim())
    meta.push([t.customer, bill.customerName.trim()])
  if (bill.customerPhone.trim()) {
    meta.push([t.mobile, digits(bill.customerPhone.trim(), lang)])
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
  text(t.item, PAD)
  text(t.quantity, COL_QTY, "right")
  text(t.rate, COL_RATE, "right")
  text(t.total, RIGHT, "right")
  y += 10

  if (items.length === 0) {
    y += 42
    font(23, 600)
    text(t.noItems, CENTER, "center")
    y += 8
  }

  items.forEach((item, index) => {
    if (index > 0) {
      y += 6
      rule([2, 4], 1)
    }
    y += 34
    font(24, 700)
    const nameLines = wrap(itemName(item, lang), 220)
    text(nameLines[0], PAD)
    font(24, 600)
    text(formatNumber(parseNumber(item.qty), lang), COL_QTY, "right")
    text(formatNumber(parseNumber(item.price), lang), COL_RATE, "right")
    font(24, 800)
    text(formatNumber(lineTotal(item), lang), RIGHT, "right")
    font(24, 700)
    for (const line of nameLines.slice(1)) {
      y += 30
      text(line, PAD)
    }
    y += 27
    font(19, 600)
    text(`(${UNITS[item.unit][lang]})`, PAD)
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
  row(t.itemCount, formatNumber(items.length, lang))
  if (due > 0 || discount > 0) {
    row(t.subtotal, `৳ ${formatNumber(subtotal, lang)}`)
    if (due > 0) row(t.due, `+ ৳ ${formatNumber(due, lang)}`)
    if (discount > 0) row(t.discount, `- ৳ ${formatNumber(discount, lang)}`)
  }
  y += 16
  rule([], 3)
  y += 44
  font(32, 800)
  text(t.grandTotal, PAD)
  text(`৳ ${formatNumber(total, lang)}`, RIGHT, "right")
  y += 18
  rule([], 3)

  // Footer: shop / warehouse address
  y += 36
  font(22, 600)
  for (const line of wrap(SHOP.address[lang], RIGHT - PAD)) {
    text(line, CENTER, "center")
    y += 28
  }
  if (SHOP.phone) {
    text(`${t.mobile}: ${digits(SHOP.phone, lang)}`, CENTER, "center")
    y += 28
  }
  y -= 18

  const out = document.createElement("canvas")
  out.width = PAPER_DOTS
  out.height = Math.ceil(y)
  out.getContext("2d")!.drawImage(canvas, 0, 0)
  return out
}
