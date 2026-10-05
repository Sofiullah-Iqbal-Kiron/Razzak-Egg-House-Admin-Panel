const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]

/** Writes Latin digits as Bengali digits. */
export function digits(value: string | number) {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

/** Converts Bengali digits to Latin digits. */
export function toLatinDigits(value: string) {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
}

/** Parses typed text (Bengali or Latin digits) into a number. */
export function parseNumber(value: string) {
  const n = parseFloat(toLatinDigits(value).replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

/** Keeps only digits and a single decimal point, as Latin digits. */
export function cleanNumberInput(value: string) {
  const raw = toLatinDigits(value).replace(/[^0-9.]/g, "")
  const [whole, ...rest] = raw.split(".")
  return rest.length ? `${whole}.${rest.join("")}` : whole
}

/** ১,২৩,৪৫৬.৫ style grouping in Bengali digits. */
export function formatNumber(value: number) {
  const rounded = Math.round(value * 100) / 100
  return rounded.toLocaleString("bn-BD", { maximumFractionDigits: 2 })
}

export function formatTaka(value: number) {
  return `৳ ${formatNumber(value)}`
}

/** e.g. ৫ অক্টোবর, ২০২৬ */
export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

/** e.g. বিকাল ৩:০৫ */
export function formatTime(date: Date) {
  const h = date.getHours()
  const h12 = h % 12 === 0 ? 12 : h % 12
  let period = "রাত"
  if (h >= 4 && h < 6) period = "ভোর"
  else if (h >= 6 && h < 12) period = "সকাল"
  else if (h >= 12 && h < 15) period = "দুপুর"
  else if (h >= 15 && h < 18) period = "বিকাল"
  else if (h >= 18 && h < 20) period = "সন্ধ্যা"
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${period} ${digits(`${h12}:${m}`)}`
}
