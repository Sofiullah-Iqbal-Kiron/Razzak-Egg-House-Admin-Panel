const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]

/** Converts Latin digits in a string to Bengali digits. */
export function toBn(value: string | number) {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

/** Converts Bengali digits in a string to Latin digits. */
export function fromBn(value: string) {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
}

/** Parses user input that may contain Bengali digits into a number. */
export function parseNumber(value: string) {
  const n = parseFloat(fromBn(value).replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

/** Formats a number with Bengali digits and Indian-style grouping (১২,৩৪,৫৬৭). */
export function formatNumber(value: number) {
  const rounded = Math.round(value * 100) / 100
  return toBn(
    rounded.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  )
}

export function formatTaka(value: number) {
  return `৳ ${formatNumber(value)}`
}

/** Shows a stored (Latin-digit) input value with Bengali digits. */
export function displayInput(value: string) {
  return toBn(value)
}

/** dd-mm-yyyy in Bengali digits. */
export function formatDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  return toBn(`${dd}-${mm}-${date.getFullYear()}`)
}

/** 12-hour time with a Bengali period of day, e.g. "সকাল ১০:২৪". */
export function formatTime(date: Date) {
  const h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, "0")
  const h12 = h % 12 === 0 ? 12 : h % 12
  let period = "রাত"
  if (h >= 4 && h < 6) period = "ভোর"
  else if (h >= 6 && h < 12) period = "সকাল"
  else if (h >= 12 && h < 15) period = "দুপুর"
  else if (h >= 15 && h < 18) period = "বিকাল"
  else if (h >= 18 && h < 20) period = "সন্ধ্যা"
  return `${period} ${toBn(`${h12}:${m}`)}`
}

/** yyyy-mm-dd for <input type="date">. */
export function toDateInputValue(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  return `${date.getFullYear()}-${mm}-${dd}`
}

/** Bill number derived from the time it was created, e.g. ২৬১০০৪-১০২৪৫৫. */
export function makeBillNo(date: Date) {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(date.getFullYear() % 100)}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
}
