export const UNITS = {
  piece: "পিস",
  hali: "হালি",
  dozen: "ডজন",
  tray: "ট্রে",
  kg: "কেজি",
  packet: "প্যাকেট",
} satisfies Record<string, string>

export type Unit = keyof typeof UNITS

export const UNIT_KEYS = Object.keys(UNITS) as Unit[]

export type Product = {
  id: string
  name: string
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
    name: "লাল ডিম",
    unit: "hali",
    price: 50,
  },
  {
    id: "shada-dim",
    name: "সাদা ডিম",
    unit: "hali",
    price: 48,
  },
  {
    id: "deshi-dim",
    name: "দেশি মুরগির ডিম",
    unit: "hali",
    price: 80,
  },
  {
    id: "hasher-dim",
    name: "হাঁসের ডিম",
    unit: "hali",
    price: 80,
  },
  {
    id: "koyel-dim",
    name: "কোয়েল পাখির ডিম",
    unit: "dozen",
    price: 36,
  },
  {
    id: "lal-dim-tray",
    name: "লাল ডিম",
    unit: "tray",
    price: 370,
  },
  {
    id: "shada-dim-tray",
    name: "সাদা ডিম",
    unit: "tray",
    price: 355,
  },
  {
    id: "muri",
    name: "মুড়ি",
    unit: "kg",
    price: 90,
  },
]
