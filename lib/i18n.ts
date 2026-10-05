export type Lang = "bn" | "en"

export const LANGS: { value: Lang; label: string }[] = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "English" },
]

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]

/** Writes Latin digits in the language's own digits. */
export function digits(value: string | number, lang: Lang) {
  const text = String(value)
  return lang === "bn"
    ? text.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
    : text
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

/** 1,23,456.5 style grouping in the language's digits. */
export function formatNumber(value: number, lang: Lang) {
  const rounded = Math.round(value * 100) / 100
  return rounded.toLocaleString(lang === "bn" ? "bn-BD" : "en-IN", {
    maximumFractionDigits: 2,
  })
}

export function formatTaka(value: number, lang: Lang) {
  return `৳ ${formatNumber(value, lang)}`
}

export function formatDate(date: Date, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatTime(date: Date, lang: Lang) {
  if (lang === "en") {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }
  const h = date.getHours()
  const h12 = h % 12 === 0 ? 12 : h % 12
  let period = "রাত"
  if (h >= 4 && h < 6) period = "ভোর"
  else if (h >= 6 && h < 12) period = "সকাল"
  else if (h >= 12 && h < 15) period = "দুপুর"
  else if (h >= 15 && h < 18) period = "বিকাল"
  else if (h >= 18 && h < 20) period = "সন্ধ্যা"
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${period} ${digits(`${h12}:${m}`, "bn")}`
}

const bn = {
  appName: "রাজ্জাক এগ হাউস",
  language: "ভাষা",
  theme: {
    toggle: "থিম বদলান",
    light: "লাইট",
    dark: "ডার্ক",
    system: "ডিভাইসের মতো",
  },
  printer: "প্রিন্টার",
  connecting: "সংযোগ হচ্ছে…",

  customerTitle: "ক্রেতার তথ্য",
  customerDescription: "তারিখ ও সময় ছাড়া সবকিছু ঐচ্ছিক।",
  date: "তারিখ",
  time: "সময়",
  hour: "ঘণ্টা",
  minute: "মিনিট",
  am: "পূর্বাহ্ণ",
  pm: "অপরাহ্ণ",
  pickDate: "তারিখ বাছাই করুন",
  customerName: "ক্রেতার নাম",
  customerNamePlaceholder: "ক্রেতার নাম লিখুন",
  mobile: "মোবাইল",
  mobilePlaceholder: "০১XXXXXXXXX",

  productsTitle: "পণ্য বাছাই করুন",
  productsDescription: "চাপ দিলে বিলে যোগ হবে, আবার চাপ দিলে পরিমাণ বাড়বে।",
  otherItem: "অন্য পণ্য",
  otherItemDescription: "তালিকায় নেই এমন পণ্য",

  billTitle: "বিলের পণ্য",
  billDescription: "পরিমাণ ও দর বদলাতে পারবেন।",
  emptyTitle: "এখনো কোনো পণ্য যোগ করা হয়নি",
  emptyDescription: "উপরের তালিকা থেকে পণ্য বাছাই করুন।",
  perUnit: (unit: string) => `প্রতি ${unit}`,
  quantity: "পরিমাণ",
  rate: "দর",
  total: "মোট",
  decrease: "কমান",
  increase: "বাড়ান",
  remove: (name: string) => `${name} বাদ দিন`,

  summaryTitle: "হিসাব",
  summaryDescription: "বকেয়া বা ছাড় দিন, মোট দেখুন।",
  due: "বকেয়া",
  discount: "ছাড়",
  subtotal: "সর্বমোট",
  grandTotal: "মোট টাকা",
  itemCount: "মোট আইটেম",

  previewTitle: "মেমো প্রিভিউ",
  previewDescription: "ঠিক এভাবেই কাগজে প্রিন্ট হবে।",
  print: "প্রিন্ট",
  printMemo: "মেমো প্রিন্ট করুন",
  printing: "প্রিন্ট হচ্ছে…",
  newBill: "নতুন বিল",
  newBillTitle: "নতুন বিল শুরু করবেন?",
  newBillDescription: "বর্তমান বিলের সব তথ্য মুছে যাবে।",
  cancel: "বাতিল",
  confirm: "হ্যাঁ, নতুন বিল",

  customTitle: "অন্য পণ্য যোগ করুন",
  customDescription: "এই পণ্যটি শুধু বর্তমান বিলে যোগ হবে।",
  itemName: "পণ্যের নাম",
  itemNamePlaceholder: "যেমন: চিড়া",
  unit: "একক",
  ratePerUnit: (unit: string) => `দর (প্রতি ${unit})`,
  addToBill: "বিলে যোগ করুন",

  printerTitle: "ব্লুটুথ প্রিন্টার",
  printerDescription:
    "Rongta RPP300 বা যেকোনো ৮০ মিমি ব্লুটুথ থার্মাল প্রিন্টার।",
  printerConnected: (name: string) => `${name} সংযুক্ত`,
  printerRemembered: (name: string) =>
    `${name}, প্রিন্টের সময় আবার সংযুক্ত হবে`,
  printerNone: "কোনো প্রিন্টার সংযুক্ত নেই",
  on: "চালু",
  off: "বন্ধ",
  printerStep1: "প্রিন্টার চালু করুন, ফোনের ব্লুটুথ ও লোকেশন অন রাখুন।",
  printerStep2:
    "নিচের বাটনে চাপ দিয়ে তালিকা থেকে প্রিন্টারটি (যেমন RPP300) বাছাই করুন।",
  printerStep3: "এরপর শুধু প্রিন্ট চাপলেই মেমো সরাসরি প্রিন্ট হবে।",
  findPrinter: "প্রিন্টার খুঁজুন",
  choosePrinter: "অন্য প্রিন্টার বাছাই",
  disconnect: "সংযোগ বিচ্ছিন্ন করুন",
  unsupportedTitle: "সরাসরি ব্লুটুথ প্রিন্ট সম্ভব নয়",
  unsupportedDescription:
    "অ্যান্ড্রয়েডে Google Chrome দিয়ে https লিংকে পেজটি খুলুন, অথবা সিস্টেম প্রিন্ট ব্যবহার করুন।",
  or: "অথবা",
  systemPrintHint:
    "ফোনের প্রিন্ট অপশন দিয়ে প্রিন্ট করুন (RawBT প্রিন্ট সার্ভিস ইনস্টল থাকলে)।",
  systemPrint: "সিস্টেম প্রিন্ট",

  toastPrinted: "মেমো প্রিন্ট হয়েছে",
  toastConnected: (name: string) => `${name} সংযুক্ত হয়েছে`,
  toastPrintFailed: "প্রিন্ট করা যায়নি",
  toastPrintFailedHint:
    "প্রিন্টার চালু ও কাছে আছে কিনা দেখুন, তারপর আবার চেষ্টা করুন।",
  errorNoBluetooth: "এই ব্রাউজারে ব্লুটুথ সাপোর্ট নেই।",
  errorNoWritable:
    "এই ডিভাইসে প্রিন্ট করার উপায় পাওয়া যায়নি। সঠিক প্রিন্টার বাছাই করুন।",

  // Printed memo
  cashMemo: "ক্যাশ মেমো",
  customer: "ক্রেতা",
  item: "পণ্য",
  noItems: "কোনো পণ্য যোগ করা হয়নি",
}

export type Dictionary = typeof bn

const en: Dictionary = {
  appName: "Razzak Egg House",
  language: "Language",
  theme: {
    toggle: "Toggle theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  printer: "Printer",
  connecting: "Connecting…",

  customerTitle: "Customer",
  customerDescription: "Everything except the date and time is optional.",
  date: "Date",
  time: "Time",
  hour: "Hour",
  minute: "Minute",
  am: "AM",
  pm: "PM",
  pickDate: "Pick a date",
  customerName: "Customer name",
  customerNamePlaceholder: "Enter customer name",
  mobile: "Mobile",
  mobilePlaceholder: "01XXXXXXXXX",

  productsTitle: "Choose products",
  productsDescription: "Tap to add to the bill, tap again to add one more.",
  otherItem: "Other item",
  otherItemDescription: "Something not in the list",

  billTitle: "Items in bill",
  billDescription: "Adjust the quantity and rate.",
  emptyTitle: "No items added yet",
  emptyDescription: "Choose products from the list above.",
  perUnit: (unit: string) => `per ${unit}`,
  quantity: "Qty",
  rate: "Rate",
  total: "Total",
  decrease: "Decrease",
  increase: "Increase",
  remove: (name: string) => `Remove ${name}`,

  summaryTitle: "Summary",
  summaryDescription: "Add any due or discount, and check the total.",
  due: "Due",
  discount: "Discount",
  subtotal: "Subtotal",
  grandTotal: "Total amount",
  itemCount: "Items",

  previewTitle: "Memo preview",
  previewDescription: "This is exactly what gets printed.",
  print: "Print",
  printMemo: "Print memo",
  printing: "Printing…",
  newBill: "New bill",
  newBillTitle: "Start a new bill?",
  newBillDescription: "Everything on the current bill will be cleared.",
  cancel: "Cancel",
  confirm: "Yes, new bill",

  customTitle: "Add another item",
  customDescription: "This item is added to the current bill only.",
  itemName: "Item name",
  itemNamePlaceholder: "e.g. Flattened rice",
  unit: "Unit",
  ratePerUnit: (unit: string) => `Rate (per ${unit})`,
  addToBill: "Add to bill",

  printerTitle: "Bluetooth printer",
  printerDescription: "Rongta RPP300 or any 80mm Bluetooth thermal printer.",
  printerConnected: (name: string) => `${name} connected`,
  printerRemembered: (name: string) => `${name}, reconnects when printing`,
  printerNone: "No printer connected",
  on: "On",
  off: "Off",
  printerStep1:
    "Turn on the printer, and keep the phone's Bluetooth and Location on.",
  printerStep2:
    "Tap the button below and pick the printer (e.g. RPP300) from the list.",
  printerStep3: "After that, just tap Print to print the memo directly.",
  findPrinter: "Find printer",
  choosePrinter: "Choose another printer",
  disconnect: "Disconnect",
  unsupportedTitle: "Direct Bluetooth printing is not available",
  unsupportedDescription:
    "Open this page in Google Chrome on Android over an https link, or use system print.",
  or: "or",
  systemPrintHint:
    "Print with the phone's print option (needs the RawBT print service).",
  systemPrint: "System print",

  toastPrinted: "Memo printed",
  toastConnected: (name: string) => `${name} connected`,
  toastPrintFailed: "Could not print",
  toastPrintFailedHint:
    "Check that the printer is on and nearby, then try again.",
  errorNoBluetooth: "This browser does not support Bluetooth.",
  errorNoWritable: "This device has no way to print. Pick the right printer.",

  cashMemo: "Cash Memo",
  customer: "Customer",
  item: "Item",
  noItems: "No items added",
}

export const DICTIONARIES: Record<Lang, Dictionary> = { bn, en }
