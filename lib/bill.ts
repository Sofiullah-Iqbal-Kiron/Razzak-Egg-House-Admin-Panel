import { parseNumber } from "@/lib/bn"
import type { PaymentMethod } from "@/lib/products"

export type BillItem = {
  key: string
  productId?: string
  name: string
  unit: string
  /** Raw input text (Latin digits). */
  qty: string
  /** Raw input text (Latin digits). */
  price: string
}

export type Bill = {
  billNo: string
  date: Date
  customerName: string
  customerPhone: string
  items: BillItem[]
  discount: string
  paid: string
  payment: PaymentMethod
}

export function lineTotal(item: BillItem) {
  return parseNumber(item.qty) * parseNumber(item.price)
}

export function billTotals(bill: Pick<Bill, "items" | "discount" | "paid">) {
  const items = bill.items.filter((i) => parseNumber(i.qty) > 0)
  const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0)
  const discount = Math.min(parseNumber(bill.discount), subtotal)
  const total = subtotal - discount
  const paidRaw = bill.paid.trim()
  const paid = paidRaw === "" ? null : parseNumber(paidRaw)
  return {
    items,
    subtotal,
    discount,
    total,
    paid,
    /** Positive: customer still owes. Negative: change to return. */
    due: paid === null ? 0 : total - paid,
  }
}
