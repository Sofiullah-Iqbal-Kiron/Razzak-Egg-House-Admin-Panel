import { billTotals, lineTotal, type Bill } from "@/lib/bill"
import { formatDate, formatNumber, formatTime, toBn } from "@/lib/bn"
import { PAYMENT_METHODS } from "@/lib/products"
import { SHOP } from "@/lib/shop"

/** 80mm paper, 203 dpi → 72mm printable = 576 dots. */
export const PAPER_DOTS = 576

const PAD = 10
const RIGHT = PAPER_DOTS - PAD

const EGG_LEFT_PATH =
  "M22 4C12 4 4 18 4 29c0 9 8 16 18 16s18-7 18-16C40 18 32 4 22 4Z"
const EGG_RIGHT_PATH =
  "M43 2c-10 0-18 15-18 26 0 10 8 17 18 17s18-7 18-17C61 17 53 2 43 2Z"

/** The font family next/font registered for --font-sans (Hind Siliguri). */
function fontFamily() {
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-sans")
    .trim()
  return family || "sans-serif"
}

/** Make sure every weight we draw with is loaded, including Bengali glyphs. */
export async function loadReceiptFonts() {
  // Only the web font itself — the local() fallback face may not exist.
  const primary = fontFamily().split(",")[0]
  await Promise.allSettled(
    [400, 500, 600, 700].map((w) =>
      document.fonts.load(`${w} 24px ${primary}`, "বাংলা ০১২৩ Razzak ৳")
    )
  )
}

/**
 * Draws the cash memo at the printer's native resolution so that Bengali
 * text (which the printer has no built-in font for) can be sent as an image.
 */
export function drawReceipt(bill: Bill): HTMLCanvasElement {
  const family = fontFamily()
  const { items, subtotal, discount, total, paid, due } = billTotals(bill)
  const payment = PAYMENT_METHODS.find((p) => p.id === bill.payment)?.label

  // Draw onto a tall scratch canvas, then crop to the used height.
  const canvas = document.createElement("canvas")
  canvas.width = PAPER_DOTS
  canvas.height = 1400 + items.length * 120
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#000"
  ctx.strokeStyle = "#000"
  ctx.textBaseline = "alphabetic"

  let y = 8

  const font = (size: number, weight = 500) => {
    ctx.font = `${weight} ${size}px ${family}`
  }
  const text = (value: string, x: number, align: CanvasTextAlign = "left") => {
    ctx.textAlign = align
    ctx.fillText(value, x, y)
  }
  const line = (dash: number[] = [], width = 2) => {
    ctx.save()
    ctx.setLineDash(dash)
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(PAD, y)
    ctx.lineTo(RIGHT, y)
    ctx.stroke()
    ctx.restore()
  }
  /** Splits text into lines that fit `maxWidth` with the current font. */
  const wrap = (value: string, maxWidth: number) => {
    const words = value.split(/\s+/)
    const lines: string[] = []
    let current = ""
    for (const word of words) {
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
  const eggLeft = new Path2D(EGG_LEFT_PATH)
  const eggRight = new Path2D(EGG_RIGHT_PATH)
  ctx.save()
  const scale = 1.4
  ctx.translate(PAPER_DOTS / 2 - 32 * scale, y)
  ctx.scale(scale, scale)
  ctx.lineWidth = 3
  ctx.fillStyle = "#fff"
  ctx.fill(eggLeft)
  ctx.stroke(eggLeft)
  ctx.fill(eggRight)
  ctx.stroke(eggRight)
  ctx.restore()
  ctx.fillStyle = "#000"
  y += 48 * scale + 40

  // Shop
  font(42, 700)
  text(SHOP.name, PAPER_DOTS / 2, "center")
  y += 30
  font(22, 600)
  text(SHOP.nameEn, PAPER_DOTS / 2, "center")
  y += 30
  font(22, 500)
  text(SHOP.tagline, PAPER_DOTS / 2, "center")
  if (SHOP.address) {
    y += 28
    text(SHOP.address, PAPER_DOTS / 2, "center")
  }
  if (SHOP.phone) {
    y += 28
    text(`মোবাইল: ${toBn(SHOP.phone)}`, PAPER_DOTS / 2, "center")
  }

  // "Cash memo" badge
  y += 18
  font(28, 700)
  const badge = "ক্যাশ মেমো"
  const badgeW = ctx.measureText(badge).width + 48
  ctx.beginPath()
  ctx.roundRect(PAPER_DOTS / 2 - badgeW / 2, y, badgeW, 44, 10)
  ctx.fill()
  y += 32
  ctx.fillStyle = "#fff"
  text(badge, PAPER_DOTS / 2, "center")
  ctx.fillStyle = "#000"
  y += 26

  // Meta
  const meta: [string, string][] = [
    ["বিল নং", toBn(bill.billNo)],
    ["তারিখ", `${formatDate(bill.date)}, ${formatTime(bill.date)}`],
    ["ক্রেতা", bill.customerName.trim() || "-"],
  ]
  if (bill.customerPhone.trim()) {
    meta.push(["মোবাইল", toBn(bill.customerPhone.trim())])
  }
  for (const [label, value] of meta) {
    y += 30
    font(23, 500)
    text(label, PAD)
    text(":", 110)
    font(23, 600)
    const lines = wrap(value, RIGHT - 126)
    lines.forEach((l, i) => {
      if (i > 0) y += 28
      text(l, 126)
    })
  }

  // Items table
  const COL_QTY = 330
  const COL_RATE = 444
  y += 18
  line([8, 6])
  y += 32
  font(23, 700)
  text("পণ্য", PAD)
  text("পরিমাণ", COL_QTY, "right")
  text("দর", COL_RATE, "right")
  text("মোট", RIGHT, "right")
  y += 10

  if (items.length === 0) {
    y += 40
    font(23, 500)
    text("কোনো পণ্য যোগ করা হয়নি", PAPER_DOTS / 2, "center")
    y += 10
  }

  items.forEach((item, index) => {
    if (index > 0) {
      y += 4
      line([2, 4], 1)
    }
    y += 32
    font(24, 600)
    const nameLines = wrap(item.name, 230)
    text(nameLines[0], PAD)
    font(24, 500)
    text(formatNumber(Number(item.qty) || 0), COL_QTY, "right")
    text(formatNumber(Number(item.price) || 0), COL_RATE, "right")
    font(24, 700)
    text(formatNumber(lineTotal(item)), RIGHT, "right")
    font(24, 600)
    for (const l of nameLines.slice(1)) {
      y += 28
      text(l, PAD)
    }
    y += 26
    font(19, 500)
    text(`(${item.unit})`, PAD)
  })

  // Totals
  y += 16
  line([8, 6])
  const row = (label: string, value: string, weight = 500) => {
    y += 32
    font(24, weight)
    text(label, PAD)
    text(value, RIGHT, "right")
  }
  row("মোট আইটেম", toBn(items.length))
  if (discount > 0) {
    row("সর্বমোট", `৳ ${formatNumber(subtotal)}`)
    row("ছাড়", `- ৳ ${formatNumber(discount)}`)
  }
  y += 14
  line([], 3)
  y += 40
  font(32, 700)
  text("মোট টাকা", PAD)
  text(`৳ ${formatNumber(total)}`, RIGHT, "right")
  y += 14
  line([], 3)
  if (paid !== null) {
    row("পরিশোধ", `৳ ${formatNumber(paid)}`)
    if (due > 0) row("বাকি", `৳ ${formatNumber(due)}`, 700)
    if (due < 0) row("ফেরত", `৳ ${formatNumber(-due)}`, 700)
  }
  row("পেমেন্ট পদ্ধতি", payment ?? "-")

  // Footer
  y += 18
  line([8, 6])
  y += 34
  font(23, 500)
  text("আমাদের সাথে থাকার জন্য", PAPER_DOTS / 2, "center")
  y += 36
  font(30, 700)
  text("ধন্যবাদ", PAPER_DOTS / 2, "center")
  y += 30
  font(20, 500)
  text(`${SHOP.nameEn} • ${SHOP.footer}`, PAPER_DOTS / 2, "center")
  y += 16

  const out = document.createElement("canvas")
  out.width = PAPER_DOTS
  out.height = Math.ceil(y)
  out.getContext("2d")!.drawImage(canvas, 0, 0)
  return out
}
