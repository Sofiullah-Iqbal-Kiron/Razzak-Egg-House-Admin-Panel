export type Product = {
  id: string
  name: string
  unit: string
  price: number
}

/**
 * Predefined items shown in the product picker.
 * Prices are only defaults — they can be changed on every bill.
 */
export const PRODUCTS: Product[] = [
  { id: "lal-dim", name: "লাল ডিম", unit: "হালি", price: 50 },
  { id: "shada-dim", name: "সাদা ডিম", unit: "হালি", price: 48 },
  { id: "deshi-dim", name: "দেশি মুরগির ডিম", unit: "হালি", price: 80 },
  { id: "hasher-dim", name: "হাঁসের ডিম", unit: "হালি", price: 80 },
  { id: "koyel-dim", name: "কোয়েল পাখির ডিম", unit: "ডজন", price: 36 },
  { id: "lal-dim-tray", name: "লাল ডিম", unit: "ট্রে", price: 370 },
  { id: "shada-dim-tray", name: "সাদা ডিম", unit: "ট্রে", price: 355 },
  { id: "muri", name: "মুড়ি", unit: "কেজি", price: 90 },
]

export const UNITS = ["পিস", "হালি", "ডজন", "ট্রে", "কেজি", "প্যাকেট"]

export const PAYMENT_METHODS = [
  { id: "cash", label: "ক্যাশ" },
  { id: "bkash", label: "বিকাশ" },
  { id: "nagad", label: "নগদ" },
  { id: "rocket", label: "রকেট" },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"]
