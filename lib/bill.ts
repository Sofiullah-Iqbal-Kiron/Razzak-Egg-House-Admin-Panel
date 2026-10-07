import { parseNumber } from "@/lib/bn"
import { PRODUCTS } from "@/lib/products"
import { T } from "@/lib/text"

export type BillItem = {
  key: string
  /** Set for catalog products. */
  productId?: string
  /** Name typed for an "other item" row. */
  customName?: string
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
  /** Amount the customer is paying now; deducted from the total. */
  deposit: string
}

export function itemName(item: BillItem) {
  const product = PRODUCTS.find((p) => p.id === item.productId)
  return product ? product.name : item.customName?.trim() || T.otherItem
}

export function lineTotal(item: BillItem) {
  return parseNumber(item.qty) * parseNumber(item.price)
}

export function billTotals(bill: Pick<Bill, "items" | "due" | "deposit">) {
  const items = bill.items.filter((i) => parseNumber(i.qty) > 0)
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0)
  const due = parseNumber(bill.due)
  const total = subtotal + due
  const deposit = parseNumber(bill.deposit)
  return {
    items,
    subtotal,
    due,
    total,
    deposit,
    /** What the customer still owes. */
    remaining: Math.max(0, total - deposit),
    /** Change to give back when the deposit is more than the total. */
    change: Math.max(0, deposit - total),
  }
}
