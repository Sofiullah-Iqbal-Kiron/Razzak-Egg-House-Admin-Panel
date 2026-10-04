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
  /** Amount still owed from earlier purchases; added to the total. */
  due: string
  discount: string
}

export function itemName(item: BillItem, lang: Lang) {
  const product = PRODUCTS.find((p) => p.id === item.productId)
  return product ? product.name[lang] : (item.customName ?? "")
}

export function lineTotal(item: BillItem) {
  return parseNumber(item.qty) * parseNumber(item.price)
}

export function billTotals(bill: Pick<Bill, "items" | "due" | "discount">) {
  const items = bill.items.filter((i) => parseNumber(i.qty) > 0)
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0)
  const due = parseNumber(bill.due)
  const discount = Math.min(parseNumber(bill.discount), subtotal + due)
  return { items, subtotal, due, discount, total: subtotal + due - discount }
}
