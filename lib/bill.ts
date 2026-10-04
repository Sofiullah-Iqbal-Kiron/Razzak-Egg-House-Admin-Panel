import { parseNumber, type Lang } from "@/lib/i18n"
import { PRODUCTS, type Unit } from "@/lib/products"

export type BillItem = {
  key: string
  /** Set for predefined products, so the name follows the language. */
  productId?: string
  /** Name typed for a custom item. */
  customName?: string
  unit: Unit
  /** Raw input text (Latin digits). */
  qty: string
  /** Raw input text (Latin digits). */
  price: string
}

export type Bill = {
  date: Date
  customerName: string
  customerPhone: string
  items: BillItem[]
  discount: string
}

export function itemName(item: BillItem, lang: Lang) {
  const product = PRODUCTS.find((p) => p.id === item.productId)
  return product ? product.name[lang] : (item.customName ?? "")
}

export function lineTotal(item: BillItem) {
  return parseNumber(item.qty) * parseNumber(item.price)
}

export function billTotals(bill: Pick<Bill, "items" | "discount">) {
  const items = bill.items.filter((i) => parseNumber(i.qty) > 0)
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0)
  const discount = Math.min(parseNumber(bill.discount), subtotal)
  return { items, subtotal, discount, total: subtotal - discount }
}
