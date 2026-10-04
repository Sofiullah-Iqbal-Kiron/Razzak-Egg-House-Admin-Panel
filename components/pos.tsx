"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import {
  BanknoteIcon,
  BluetoothConnectedIcon,
  BluetoothIcon,
  CalendarDaysIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  EyeIcon,
  MinusIcon,
  PackagePlusIcon,
  PhoneIcon,
  PlusIcon,
  PrinterIcon,
  RotateCcwIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react"

import { EggLogo } from "@/components/egg-logo"
import { Receipt } from "@/components/receipt"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { billTotals, lineTotal, type Bill, type BillItem } from "@/lib/bill"
import {
  isBluetoothSupported,
  printer,
  type PrinterStatus,
} from "@/lib/bluetooth-printer"
import {
  formatDate,
  formatNumber,
  formatTaka,
  fromBn,
  makeBillNo,
  parseNumber,
  toBn,
  toDateInputValue,
} from "@/lib/bn"
import {
  PAYMENT_METHODS,
  PRODUCTS,
  UNITS,
  type PaymentMethod,
  type Product,
} from "@/lib/products"
import { canvasToEscPos } from "@/lib/escpos"
import { drawReceipt, loadReceiptFonts } from "@/lib/receipt-canvas"
import { SHOP } from "@/lib/shop"
import { cn } from "@/lib/utils"

const subscribe = () => () => {}

/** The POS depends on the device clock, so it only renders in the browser. */
export function PosApp() {
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  if (!mounted) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        লোড হচ্ছে…
      </div>
    )
  }
  return <Pos />
}

let keySeq = 0
const nextKey = () => `item-${++keySeq}`

function newBillState() {
  const now = new Date()
  return {
    createdAt: now,
    billNo: makeBillNo(now),
    dateValue: toDateInputValue(now),
    customerName: "",
    customerPhone: "",
    items: [] as BillItem[],
    discount: "",
    paid: "",
    payment: "cash" as PaymentMethod,
  }
}

type BillState = ReturnType<typeof newBillState>

function toBill(state: BillState): Bill {
  // Selected day + the time the bill was created / printed.
  const [y, m, d] = state.dateValue.split("-").map(Number)
  const date = new Date(state.createdAt)
  if (y && m && d) date.setFullYear(y, m - 1, d)
  return {
    billNo: state.billNo,
    date,
    customerName: state.customerName,
    customerPhone: state.customerPhone,
    items: state.items,
    discount: state.discount,
    paid: state.paid,
    payment: state.payment,
  }
}

function Pos() {
  const [state, setState] = React.useState(newBillState)
  const [customOpen, setCustomOpen] = React.useState(false)
  const [printerOpen, setPrinterOpen] = React.useState(false)
  const [notice, setNotice] = React.useState<Notice | null>(null)
  const printerStatus = React.useSyncExternalStore(
    printer.subscribe,
    printer.getStatus,
    () => "idle" as PrinterStatus
  )
  const bluetoothSupported = isBluetoothSupported()
  const pageStyleRef = React.useRef<HTMLStyleElement | null>(null)

  const bill = toBill(state)
  const totals = billTotals(bill)
  const hasItems = totals.items.length > 0

  const update = (patch: Partial<BillState>) =>
    setState((s) => ({ ...s, ...patch }))

  const updateItem = (key: string, patch: Partial<BillItem>) =>
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.key === key ? { ...i, ...patch } : i)),
    }))

  const removeItem = (key: string) =>
    setState((s) => ({ ...s, items: s.items.filter((i) => i.key !== key) }))

  const addProduct = (product: Product) =>
    setState((s) => {
      const existing = s.items.find((i) => i.productId === product.id)
      if (existing) {
        return {
          ...s,
          items: s.items.map((i) =>
            i === existing ? { ...i, qty: String(parseNumber(i.qty) + 1) } : i
          ),
        }
      }
      return {
        ...s,
        items: [
          ...s.items,
          {
            key: nextKey(),
            productId: product.id,
            name: product.name,
            unit: product.unit,
            qty: "1",
            price: String(product.price),
          },
        ],
      }
    })

  const addCustom = (item: Omit<BillItem, "key">) =>
    setState((s) => ({
      ...s,
      items: [...s.items, { ...item, key: nextKey() }],
    }))

  const reset = () => {
    if (
      state.items.length > 0 &&
      !window.confirm("নতুন বিল শুরু করবেন? বর্তমান বিলের সব তথ্য মুছে যাবে।")
    ) {
      return
    }
    setState(newBillState())
  }

  /** Fallback: the browser/Android print dialog (e.g. via the RawBT print service). */
  const systemPrint = () => {
    if (!hasItems) return
    // Stamp the bill with the actual print time before printing.
    flushSync(() => update({ createdAt: new Date() }))

    // Size the page to the receipt so the thermal printer doesn't feed blank paper.
    const area = document.getElementById("print-area")
    const heightMm = area ? Math.ceil((area.scrollHeight * 25.4) / 96) + 6 : 200
    if (!pageStyleRef.current) {
      pageStyleRef.current = document.createElement("style")
      document.head.appendChild(pageStyleRef.current)
    }
    pageStyleRef.current.textContent = `@page { size: 80mm ${heightMm}mm; margin: 0; }`

    window.print()
  }

  /** Direct print to the Bluetooth thermal printer. */
  const bluetoothPrint = async () => {
    if (!hasItems || printerStatus === "printing") return
    const printed = { ...state, createdAt: new Date() }
    setState(printed)
    try {
      // Picking a printer has to start right inside the tap, before any await.
      if (!printer.hasDevice) await printer.connect()
      setNotice({ kind: "info", text: "প্রিন্ট হচ্ছে…" })
      await loadReceiptFonts()
      const data = canvasToEscPos(drawReceipt(toBill(printed)))
      await printer.print(data)
      setNotice({ kind: "success", text: "মেমো প্রিন্ট হয়েছে" })
    } catch (error) {
      setNotice(errorNotice(error))
    }
  }

  const print = bluetoothSupported ? bluetoothPrint : systemPrint
  const printing = printerStatus === "printing"

  const connectPrinter = async () => {
    try {
      await printer.connect()
      setNotice({ kind: "success", text: `${printer.name} সংযুক্ত হয়েছে` })
    } catch (error) {
      setNotice(errorNotice(error))
    }
  }

  React.useEffect(() => {
    if (notice?.kind !== "success") return
    const t = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(t)
  }, [notice])

  return (
    <>
      <div className="screen-only min-h-svh bg-muted/60 pb-28 lg:pb-10">
        <header className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
            <EggLogo className="h-11 w-14" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl leading-tight font-bold">{SHOP.name}</h1>
              <p className="truncate text-sm opacity-90">
                <span className="font-semibold text-brand-yellow">
                  {SHOP.nameEn}
                </span>{" "}
                · {SHOP.tagline}
              </p>
            </div>
            <Button
              variant="secondary"
              className="h-10 max-w-40 px-3"
              onClick={() => setPrinterOpen(true)}
            >
              {printerStatus === "idle" ? (
                <BluetoothIcon />
              ) : (
                <BluetoothConnectedIcon className="text-primary" />
              )}
              <span className="truncate">
                {printerStatus === "idle"
                  ? "প্রিন্টার"
                  : printerStatus === "connecting"
                    ? "সংযোগ হচ্ছে…"
                    : printer.name}
              </span>
            </Button>
          </div>
        </header>

        {notice && (
          <div className="mx-auto max-w-6xl px-3 pt-3 sm:px-4">
            <div
              role="status"
              className={cn(
                "flex items-start gap-2 rounded-2xl px-4 py-3 text-sm",
                notice.kind === "error" && "bg-destructive/10 text-destructive",
                notice.kind === "success" && "bg-primary/10 text-primary",
                notice.kind === "info" && "bg-secondary"
              )}
            >
              {notice.kind === "error" ? (
                <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
              ) : (
                <CircleCheckIcon className="mt-0.5 size-4 shrink-0" />
              )}
              <p className="flex-1">{notice.text}</p>
              <button
                type="button"
                aria-label="বন্ধ করুন"
                onClick={() => setNotice(null)}
                className="opacity-70 hover:opacity-100"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </div>
        )}

        <main className="mx-auto grid max-w-6xl gap-4 px-3 py-4 sm:px-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4">
            {/* Bill info */}
            <Section>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">বিক্রয় মেমো</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  বিল নং {toBn(state.billNo)}
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field
                  icon={<CalendarDaysIcon />}
                  label="তারিখ"
                  htmlFor="bill-date"
                >
                  <Input
                    id="bill-date"
                    type="date"
                    className="h-11"
                    value={state.dateValue}
                    onChange={(e) => update({ dateValue: e.target.value })}
                  />
                </Field>
                <Field
                  icon={<UserIcon />}
                  label="ক্রেতার নাম (ঐচ্ছিক)"
                  htmlFor="customer-name"
                >
                  <Input
                    id="customer-name"
                    className="h-11"
                    placeholder="ক্রেতার নাম লিখুন…"
                    value={state.customerName}
                    onChange={(e) => update({ customerName: e.target.value })}
                  />
                </Field>
                <Field
                  icon={<PhoneIcon />}
                  label="মোবাইল (ঐচ্ছিক)"
                  htmlFor="customer-phone"
                >
                  <Input
                    id="customer-phone"
                    type="tel"
                    inputMode="tel"
                    className="h-11"
                    placeholder="০১XXXXXXXXX"
                    value={toBn(state.customerPhone)}
                    onChange={(e) =>
                      update({
                        customerPhone: fromBn(e.target.value).replace(
                          /[^0-9+]/g,
                          ""
                        ),
                      })
                    }
                  />
                </Field>
              </div>
            </Section>

            {/* Product picker */}
            <Section>
              <h2 className="text-base font-semibold">পণ্য বাছাই করুন</h2>
              <p className="text-xs text-muted-foreground">
                পণ্যে চাপ দিলে বিলে যোগ হবে, আবার চাপ দিলে পরিমাণ বাড়বে।
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {PRODUCTS.map((product) => {
                  const inBill = state.items.find(
                    (i) => i.productId === product.id
                  )
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className={cn(
                        "relative flex flex-col items-start rounded-2xl border bg-background p-3 text-left transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/30 active:translate-y-px",
                        inBill && "border-primary bg-primary/5"
                      )}
                    >
                      <span className="pr-7 font-semibold">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        প্রতি {product.unit}
                      </span>
                      <span className="mt-1 text-sm font-semibold text-primary">
                        {formatTaka(product.price)}
                      </span>
                      {inBill && (
                        <span className="absolute top-2 right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                          {formatNumber(parseNumber(inBill.qty))}
                        </span>
                      )}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setCustomOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-primary/50 p-3 text-sm font-medium text-primary transition-colors outline-none hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <PackagePlusIcon className="size-5" />
                  অন্য পণ্য
                </button>
              </div>
            </Section>

            {/* Bill items */}
            <Section>
              <h2 className="text-base font-semibold">
                বিলের পণ্য{" "}
                {state.items.length > 0 && (
                  <span className="text-muted-foreground">
                    ({toBn(state.items.length)})
                  </span>
                )}
              </h2>
              {state.items.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                  এখনো কোনো পণ্য যোগ করা হয়নি
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {state.items.map((item) => (
                    <ItemRow
                      key={item.key}
                      item={item}
                      onChange={(patch) => updateItem(item.key, patch)}
                      onRemove={() => removeItem(item.key)}
                    />
                  ))}
                </ul>
              )}
            </Section>

            {/* Totals & payment */}
            <Section>
              <h2 className="text-base font-semibold">হিসাব ও পেমেন্ট</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="ছাড় (টাকা)" htmlFor="discount">
                  <NumberInput
                    id="discount"
                    className="h-11"
                    placeholder="০"
                    value={state.discount}
                    onValueChange={(discount) => update({ discount })}
                  />
                </Field>
                <Field label="ক্রেতা দিয়েছেন (টাকা)" htmlFor="paid">
                  <NumberInput
                    id="paid"
                    className="h-11"
                    placeholder="পুরো টাকা"
                    value={state.paid}
                    onValueChange={(paid) => update({ paid })}
                  />
                </Field>
              </div>

              <div className="mt-3">
                <span className="text-sm font-medium">পেমেন্ট পদ্ধতি</span>
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <Button
                      key={method.id}
                      variant={
                        state.payment === method.id ? "default" : "outline"
                      }
                      className="h-11"
                      aria-pressed={state.payment === method.id}
                      onClick={() => update({ payment: method.id })}
                    >
                      {method.id === "cash" && <BanknoteIcon />}
                      {method.label}
                    </Button>
                  ))}
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-1.5 rounded-2xl bg-primary/5 p-4 text-sm">
                <dt className="text-muted-foreground">সর্বমোট</dt>
                <dd className="text-right">{formatTaka(totals.subtotal)}</dd>
                {totals.discount > 0 && (
                  <>
                    <dt className="text-muted-foreground">ছাড়</dt>
                    <dd className="text-right">
                      - {formatTaka(totals.discount)}
                    </dd>
                  </>
                )}
                <dt className="text-base font-semibold">মোট টাকা</dt>
                <dd className="text-right text-xl font-bold text-primary">
                  {formatTaka(totals.total)}
                </dd>
                {totals.paid !== null && totals.due > 0 && (
                  <>
                    <dt className="font-medium text-destructive">বাকি</dt>
                    <dd className="text-right font-semibold text-destructive">
                      {formatTaka(totals.due)}
                    </dd>
                  </>
                )}
                {totals.paid !== null && totals.due < 0 && (
                  <>
                    <dt className="font-medium">ফেরত দিতে হবে</dt>
                    <dd className="text-right font-semibold">
                      {formatTaka(-totals.due)}
                    </dd>
                  </>
                )}
              </dl>

              <div className="mt-4 hidden grid-cols-[auto_1fr] gap-2 lg:grid">
                <Button variant="outline" className="h-12 px-5" onClick={reset}>
                  <RotateCcwIcon />
                  নতুন বিল
                </Button>
                <Button
                  className="h-12 text-base"
                  onClick={print}
                  disabled={!hasItems || printing}
                >
                  <PrinterIcon />
                  {printing ? "প্রিন্ট হচ্ছে…" : "মেমো প্রিন্ট করুন"}
                </Button>
              </div>
            </Section>
          </div>

          {/* Live preview */}
          <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
            <h2 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-semibold text-muted-foreground">
              <EyeIcon className="size-4" />
              মেমো প্রিভিউ
            </h2>
            <div className="receipt-paper mx-auto w-full max-w-[320px] overflow-hidden rounded-sm shadow-md ring-1 ring-black/5">
              <Receipt bill={bill} />
            </div>
            <p className="mt-3 px-1 text-center text-xs text-muted-foreground">
              ৮০ মিমি থার্মাল প্রিন্টারের জন্য তৈরি · {formatDate(bill.date)}
            </p>
          </aside>
        </main>

        {/* Mobile action bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <Button
              variant="outline"
              size="icon-lg"
              className="size-12"
              aria-label="নতুন বিল"
              onClick={reset}
            >
              <RotateCcwIcon />
            </Button>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-xs text-muted-foreground">মোট টাকা</div>
              <div className="truncate text-lg font-bold text-primary">
                {formatTaka(totals.total)}
              </div>
            </div>
            <Button
              className="h-12 px-5 text-base"
              onClick={print}
              disabled={!hasItems || printing}
            >
              <PrinterIcon />
              {printing ? "প্রিন্ট হচ্ছে…" : "প্রিন্ট"}
            </Button>
          </div>
        </div>
      </div>

      {/* The only thing that is printed. Kept off-screen so it can be measured. */}
      <div id="print-area" aria-hidden="true">
        <Receipt bill={bill} />
      </div>

      <CustomItemDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        onAdd={addCustom}
      />
      <PrinterDialog
        open={printerOpen}
        onOpenChange={setPrinterOpen}
        status={printerStatus}
        supported={bluetoothSupported}
        onConnect={connectPrinter}
        onSystemPrint={() => {
          setPrinterOpen(false)
          systemPrint()
        }}
        canPrint={hasItems}
      />
    </>
  )
}

type Notice = { kind: "success" | "error" | "info"; text: string }

function errorNotice(error: unknown): Notice | null {
  // The user closed Chrome's device picker — nothing to report.
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return null
  }
  const message = error instanceof Error ? error.message : String(error)
  return {
    kind: "error",
    text: `প্রিন্ট করা যায়নি: ${message}। প্রিন্টার চালু ও কাছে আছে কিনা দেখুন, তারপর আবার চেষ্টা করুন।`,
  }
}

function PrinterDialog({
  open,
  onOpenChange,
  status,
  supported,
  onConnect,
  onSystemPrint,
  canPrint,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: PrinterStatus
  supported: boolean
  onConnect: () => void
  onSystemPrint: () => void
  canPrint: boolean
}) {
  const connected = status === "connected" || status === "printing"
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ব্লুটুথ প্রিন্টার</DialogTitle>
          <DialogDescription>
            Rongta RPP300 বা যেকোনো ৮০ মিমি ব্লুটুথ থার্মাল প্রিন্টার।
          </DialogDescription>
        </DialogHeader>

        {supported ? (
          <div className="grid gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  connected ? "bg-primary" : "bg-muted-foreground/40"
                )}
              />
              <span className="flex-1 font-medium">
                {connected
                  ? `${printer.name} সংযুক্ত`
                  : status === "connecting"
                    ? "সংযোগ হচ্ছে…"
                    : printer.hasDevice
                      ? `${printer.name} — প্রিন্টের সময় আবার সংযুক্ত হবে`
                      : "কোনো প্রিন্টার সংযুক্ত নেই"}
              </span>
            </div>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>প্রিন্টার চালু করুন এবং ফোনের ব্লুটুথ ও লোকেশন অন রাখুন।</li>
              <li>
                নিচের বাটনে চাপ দিয়ে তালিকা থেকে প্রিন্টারটি (যেমন RPP300)
                বাছাই করুন।
              </li>
              <li>এরপর শুধু “প্রিন্ট” চাপলেই মেমো সরাসরি প্রিন্ট হবে।</li>
            </ol>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="h-11"
                onClick={onConnect}
                disabled={status === "connecting" || status === "printing"}
              >
                <BluetoothIcon />
                {printer.hasDevice
                  ? "অন্য প্রিন্টার বাছাই"
                  : "প্রিন্টার খুঁজুন"}
              </Button>
              {printer.hasDevice && (
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => printer.disconnect()}
                  disabled={status === "printing"}
                >
                  সংযোগ বিচ্ছিন্ন করুন
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
            এই ব্রাউজারে সরাসরি ব্লুটুথ প্রিন্ট সম্ভব নয়। অ্যান্ড্রয়েডে Google
            Chrome দিয়ে (https লিংকে) পেজটি খুলুন, অথবা নিচের সিস্টেম প্রিন্ট
            ব্যবহার করুন।
          </p>
        )}

        <div className="grid gap-2 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            বিকল্প: ফোনের প্রিন্ট অপশন দিয়ে প্রিন্ট (RawBT প্রিন্ট সার্ভিস
            ইনস্টল থাকলে)।
          </p>
          <Button
            variant="outline"
            className="h-11"
            onClick={onSystemPrint}
            disabled={!canPrint}
          >
            <PrinterIcon />
            সিস্টেম প্রিন্ট
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-4 shadow-xs ring-1 ring-foreground/5 sm:p-5">
      {children}
    </section>
  )
}

function Field({
  label,
  htmlFor,
  icon,
  children,
}: {
  label: string
  htmlFor: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-muted-foreground [&_svg]:size-4"
      >
        {icon}
        {label}
      </Label>
      {children}
    </div>
  )
}

/** Numeric text input that shows Bengali digits but stores Latin digits. */
function NumberInput({
  value,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <Input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={toBn(value)}
      onChange={(e) => {
        const raw = fromBn(e.target.value).replace(/[^0-9.]/g, "")
        const [whole, ...rest] = raw.split(".")
        onValueChange(rest.length ? `${whole}.${rest.join("")}` : whole)
      }}
      onFocus={(e) => e.currentTarget.select()}
      {...props}
    />
  )
}

function ItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: BillItem
  onChange: (patch: Partial<BillItem>) => void
  onRemove: () => void
}) {
  const qty = parseNumber(item.qty)
  const step = (delta: number) =>
    onChange({
      qty: String(Math.max(0, Math.round((qty + delta) * 100) / 100)),
    })

  return (
    <li className="rounded-2xl border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{item.name}</p>
          <p className="text-xs text-muted-foreground">প্রতি {item.unit}</p>
        </div>
        <Button
          variant="destructive"
          size="icon"
          aria-label={`${item.name} বাদ দিন`}
          onClick={onRemove}
        >
          <Trash2Icon />
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[auto_8rem_1fr]">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            পরিমাণ ({item.unit})
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="icon-lg"
              aria-label="কমান"
              onClick={() => step(-1)}
              disabled={qty <= 0}
            >
              <MinusIcon />
            </Button>
            <NumberInput
              aria-label="পরিমাণ"
              className="h-9 w-14 text-center"
              value={item.qty}
              onValueChange={(v) => onChange({ qty: v })}
            />
            <Button
              variant="secondary"
              size="icon-lg"
              aria-label="বাড়ান"
              onClick={() => step(1)}
            >
              <PlusIcon />
            </Button>
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">দর (৳)</span>
          <NumberInput
            aria-label="দর"
            className="h-9"
            value={item.price}
            onValueChange={(v) => onChange({ price: v })}
          />
        </label>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground">মোট</span>
          <span className="flex h-9 items-center font-bold whitespace-nowrap">
            {formatTaka(lineTotal(item))}
          </span>
        </div>
      </div>
    </li>
  )
}

function CustomItemDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: Omit<BillItem, "key">) => void
}) {
  const [name, setName] = React.useState("")
  const [unit, setUnit] = React.useState(UNITS[0])
  const [qty, setQty] = React.useState("1")
  const [price, setPrice] = React.useState("")

  const canAdd = name.trim() !== "" && parseNumber(qty) > 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canAdd) return
    onAdd({ name: name.trim(), unit, qty, price: price || "0" })
    setName("")
    setQty("1")
    setPrice("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>অন্য পণ্য যোগ করুন</DialogTitle>
            <DialogDescription>
              তালিকায় না থাকা পণ্য শুধু এই বিলের জন্য যোগ হবে।
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field label="পণ্যের নাম" htmlFor="custom-name">
              <Input
                id="custom-name"
                className="h-11"
                placeholder="যেমন: চিড়া"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground">
                একক
              </span>
              <div className="flex flex-wrap gap-1.5">
                {UNITS.map((u) => (
                  <Button
                    key={u}
                    type="button"
                    size="sm"
                    variant={unit === u ? "default" : "outline"}
                    aria-pressed={unit === u}
                    onClick={() => setUnit(u)}
                  >
                    {u}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="পরিমাণ" htmlFor="custom-qty">
                <NumberInput
                  id="custom-qty"
                  className="h-11"
                  value={qty}
                  onValueChange={setQty}
                />
              </Field>
              <Field label={`দর (প্রতি ${unit}, ৳)`} htmlFor="custom-price">
                <NumberInput
                  id="custom-price"
                  className="h-11"
                  placeholder="০"
                  value={price}
                  onValueChange={setPrice}
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="h-11" />}>
              বাতিল
            </DialogClose>
            <Button type="submit" className="h-11" disabled={!canAdd}>
              <PlusIcon />
              বিলে যোগ করুন
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
