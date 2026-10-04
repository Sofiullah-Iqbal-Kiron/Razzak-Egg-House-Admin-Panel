import type { Lang } from "@/lib/i18n"

export const UNITS = {
  piece: { bn: "পিস", en: "piece" },
  hali: { bn: "হালি", en: "hali" },
  dozen: { bn: "ডজন", en: "dozen" },
  tray: { bn: "ট্রে", en: "tray" },
  kg: { bn: "কেজি", en: "kg" },
  packet: { bn: "প্যাকেট", en: "packet" },
} satisfies Record<string, Record<Lang, string>>

export type Unit = keyof typeof UNITS

export const UNIT_KEYS = Object.keys(UNITS) as Unit[]

export type Product = {
  id: string
  name: Record<Lang, string>
  unit: Unit
  price: number
}

/**
 * Predefined items shown in the product list.
 * Prices are only defaults and can be changed on every bill.
 */
export const PRODUCTS: Product[] = [
  {
    id: "lal-dim",
    name: { bn: "লাল ডিম", en: "Red egg" },
    unit: "hali",
    price: 50,
  },
  {
    id: "shada-dim",
    name: { bn: "সাদা ডিম", en: "White egg" },
    unit: "hali",
    price: 48,
  },
  {
    id: "deshi-dim",
    name: { bn: "দেশি মুরগির ডিম", en: "Deshi chicken egg" },
    unit: "hali",
    price: 80,
  },
  {
    id: "hasher-dim",
    name: { bn: "হাঁসের ডিম", en: "Duck egg" },
    unit: "hali",
    price: 80,
  },
  {
    id: "koyel-dim",
    name: { bn: "কোয়েল পাখির ডিম", en: "Quail egg" },
    unit: "dozen",
    price: 36,
  },
  {
    id: "lal-dim-tray",
    name: { bn: "লাল ডিম", en: "Red egg" },
    unit: "tray",
    price: 370,
  },
  {
    id: "shada-dim-tray",
    name: { bn: "সাদা ডিম", en: "White egg" },
    unit: "tray",
    price: 355,
  },
  {
    id: "muri",
    name: { bn: "মুড়ি", en: "Muri (puffed rice)" },
    unit: "kg",
    price: 90,
  },
]
