"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { bn as bnLocale, enUS as enLocale } from "react-day-picker/locale"
import {
  BluetoothConnectedIcon,
  BluetoothIcon,
  ChevronDownIcon,
  EggIcon,
  MinusIcon,
  PackagePlusIcon,
  PhoneIcon,
  PlusIcon,
  PrinterIcon,
  ReceiptTextIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  billTotals,
  itemName,
  lineTotal,
  type Bill,
  type BillItem,
} from "@/lib/bill"
import {
  isBluetoothSupported,
  printer,
  PrinterError,
  type PrinterStatus,
} from "@/lib/bluetooth-printer"
import { canvasToEscPos } from "@/lib/escpos"
import {
  cleanNumberInput,
  DICTIONARIES,
  digits,
  formatDate,
  formatNumber,
  formatTaka,
  LANGS,
  parseNumber,
  toLatinDigits,
  type Dictionary,
  type Lang,
} from "@/lib/i18n"
import {
  PRODUCTS,
  UNIT_KEYS,
  UNITS,
  type Product,
  type Unit,
} from "@/lib/products"
import { drawReceipt, loadReceiptFonts, PAPER_DOTS } from "@/lib/receipt-canvas"

const LANG_KEY = "razzak-pos-lang"

let keySeq = 0
const nextKey = () => `item-${++keySeq}`

function readLang(): Lang {
  try {
    return window.localStorage.getItem(LANG_KEY) === "en" ? "en" : "bn"
  } catch {
    return "bn"
  }
}

function newBillState() {
  const now = new Date()
  return {
    /** The day chosen on the memo. */
    date: now,
    /** Time of day printed on the memo; refreshed when printing. */
    printedAt: now,
    customerName: "",
    customerPhone: "",
    items: [] as BillItem[],
    discount: "",
  }
}

type BillState = ReturnType<typeof newBillState>

function toBill(state: BillState): Bill {
  const date = new Date(state.printedAt)
  date.setFullYear(
    state.date.getFullYear(),
    state.date.getMonth(),
    state.date.getDate()
  )
  return {
    date,
    customerName: state.customerName,
    customerPhone: state.customerPhone,
    items: state.items,
    discount: state.discount,
  }
}

function printErrorMessage(error: unknown, t: Dictionary) {
  if (error instanceof PrinterError) {
    if (error.code === "no-bluetooth") return t.errorNoBluetooth
    if (error.code === "no-writable") return t.errorNoWritable
  }
  return error instanceof Error ? error.message : String(error)
}

const subscribeNothing = () => () => {}

export default function Page() {
  // The POS depends on the device clock and browser APIs, so it renders
  // on the client only.
  const mounted = React.useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  )

  const [lang, setLang] = React.useState<Lang>(() =>
    typeof window === "undefined" ? "bn" : readLang()
  )
  const [state, setState] = React.useState(newBillState)
  const [fontsReady, setFontsReady] = React.useState(false)
  const [dateOpen, setDateOpen] = React.useState(false)
  const [customOpen, setCustomOpen] = React.useState(false)
  const [printerOpen, setPrinterOpen] = React.useState(false)
  const [printImage, setPrintImage] = React.useState<string | null>(null)
  const [custom, setCustom] = React.useState({
    name: "",
    unit: "piece" as Unit,
    qty: "1",
    price: "",
  })
  const pageStyleRef = React.useRef<HTMLStyleElement | null>(null)

  const printerStatus = React.useSyncExternalStore(
    printer.subscribe,
    printer.getStatus,
    () => "idle" as PrinterStatus
  )

  const t = DICTIONARIES[lang]
  const bill = toBill(state)
  const totals = billTotals(bill)
  const hasItems = totals.items.length > 0
  const printing = printerStatus === "printing"
  const printerConnected = printerStatus === "connected" || printing
  const bluetoothSupported = mounted && isBluetoothSupported()

  React.useEffect(() => {
    document.documentElement.lang = lang
    try {
      window.localStorage.setItem(LANG_KEY, lang)
    } catch {
      // Storage can be unavailable (private mode); the language still works.
    }
  }, [lang])

  React.useEffect(() => {
    loadReceiptFonts().then(() => setFontsReady(true))
  }, [])

  // The preview is the exact image that gets printed.
  const deferredState = React.useDeferredValue(state)
  const previewUrl = React.useMemo(() => {
    if (!mounted || !fontsReady) return null
    return drawReceipt(toBill(deferredState), lang).toDataURL()
  }, [mounted, fontsReady, deferredState, lang])

  if (!mounted) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

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
            unit: product.unit,
            qty: "1",
            price: String(product.price),
          },
        ],
      }
    })

  const stepQty = (item: BillItem, delta: number) => {
    const qty = Math.max(
      0,
      Math.round((parseNumber(item.qty) + delta) * 100) / 100
    )
    updateItem(item.key, { qty: String(qty) })
  }

  const addCustom = (event: React.FormEvent) => {
    event.preventDefault()
    if (!custom.name.trim() || parseNumber(custom.qty) <= 0) return
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        {
          key: nextKey(),
          customName: custom.name.trim(),
          unit: custom.unit,
          qty: custom.qty,
          price: custom.price || "0",
        },
      ],
    }))
    setCustom({ name: "", unit: custom.unit, qty: "1", price: "" })
    setCustomOpen(false)
  }

  /** Props for a text input that edits a number in the current language's digits. */
  const numberInput = (value: string, onValue: (value: string) => void) => ({
    type: "text",
    inputMode: "decimal" as const,
    autoComplete: "off",
    value: digits(value, lang),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onValue(cleanNumberInput(e.target.value)),
    onFocus: (e: React.FocusEvent<HTMLInputElement>) =>
      e.currentTarget.select(),
  })

  /** Fallback: the Android/browser print dialog, e.g. through RawBT. */
  const systemPrint = () => {
    if (!hasItems) return
    const printed = { ...state, printedAt: new Date() }
    const canvas = drawReceipt(toBill(printed), lang)
    // Size the page to the memo so the printer does not feed blank paper.
    const heightMm = Math.ceil((canvas.height * 72) / PAPER_DOTS) + 4
    if (!pageStyleRef.current) {
      pageStyleRef.current = document.createElement("style")
      document.head.appendChild(pageStyleRef.current)
    }
    pageStyleRef.current.textContent = `@page { size: 80mm ${heightMm}mm; margin: 0; }`
    flushSync(() => {
      setState(printed)
      setPrintImage(canvas.toDataURL())
    })
    window.print()
  }

  /** Prints straight to the Bluetooth thermal printer. */
  const bluetoothPrint = async () => {
    if (!hasItems || printing) return
    const printed = { ...state, printedAt: new Date() }
    setState(printed)
    try {
      // Choosing a printer must start inside the tap, before any await.
      if (!printer.hasDevice) await printer.connect()
      await loadReceiptFonts()
      await printer.print(canvasToEscPos(drawReceipt(toBill(printed), lang)))
      toast.add({ type: "success", title: t.toastPrinted })
    } catch (error) {
      // Closing Chrome's printer list is not an error.
      if (error instanceof DOMException && error.name === "NotFoundError")
        return
      toast.add({
        type: "error",
        title: t.toastPrintFailed,
        description: `${printErrorMessage(error, t)} ${t.toastPrintFailedHint}`,
        priority: "high",
      })
    }
  }

  const print = bluetoothSupported ? bluetoothPrint : systemPrint

  const connectPrinter = async () => {
    try {
      await printer.connect()
      toast.add({ type: "success", title: t.toastConnected(printer.name) })
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError")
        return
      toast.add({
        type: "error",
        title: t.toastPrintFailed,
        description: printErrorMessage(error, t),
      })
    }
  }

  const printButtonContent = printing ? (
    <>
      <Spinner data-icon="inline-start" />
      {t.printing}
    </>
  ) : (
    <>
      <PrinterIcon data-icon="inline-start" />
      {t.printMemo}
    </>
  )

  return (
    <>
      <div className="min-h-svh bg-muted/40 pb-24 lg:pb-8">
        <header className="border-b bg-background">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
            <Item size="sm" className="flex-1 px-0">
              <ItemMedia variant="icon">
                <EggIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-base">{t.appName}</ItemTitle>
                <ItemDescription>{t.tagline}</ItemDescription>
              </ItemContent>
            </Item>
            <ToggleGroup
              aria-label={t.language}
              variant="outline"
              size="sm"
              spacing={0}
              value={[lang]}
              onValueChange={(value) => value[0] && setLang(value[0] as Lang)}
            >
              {LANGS.map((l) => (
                <ToggleGroupItem key={l.value} value={l.value}>
                  {l.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrinterOpen(true)}
            >
              {printerConnected ? (
                <BluetoothConnectedIcon data-icon="inline-start" />
              ) : (
                <BluetoothIcon data-icon="inline-start" />
              )}
              {printerStatus === "connecting"
                ? t.connecting
                : printerConnected
                  ? printer.name
                  : t.printer}
            </Button>
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.customerTitle}</CardTitle>
                <CardDescription>{t.customerDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup className="grid gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="bill-date">{t.date}</FieldLabel>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            id="bill-date"
                            variant="outline"
                            className="justify-between text-left font-normal"
                          />
                        }
                      >
                        {formatDate(state.date, lang)}
                        <ChevronDownIcon data-icon="inline-end" />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={state.date}
                          defaultMonth={state.date}
                          locale={lang === "bn" ? bnLocale : enLocale}
                          numerals={lang === "bn" ? "beng" : "latn"}
                          onSelect={(date) => {
                            if (!date) return
                            update({ date })
                            setDateOpen(false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="customer-name">
                      {t.customerName}
                    </FieldLabel>
                    <Input
                      id="customer-name"
                      placeholder={t.customerNamePlaceholder}
                      value={state.customerName}
                      onChange={(e) => update({ customerName: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="customer-phone">{t.mobile}</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <PhoneIcon />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="customer-phone"
                        type="tel"
                        inputMode="tel"
                        placeholder={t.mobilePlaceholder}
                        value={digits(state.customerPhone, lang)}
                        onChange={(e) =>
                          update({
                            customerPhone: toLatinDigits(
                              e.target.value
                            ).replace(/[^0-9+]/g, ""),
                          })
                        }
                      />
                    </InputGroup>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.productsTitle}</CardTitle>
                <CardDescription>{t.productsDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <ItemGroup className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {PRODUCTS.map((product) => {
                    const inBill = state.items.find(
                      (i) => i.productId === product.id
                    )
                    return (
                      <Item
                        key={product.id}
                        variant={inBill ? "muted" : "outline"}
                        size="sm"
                        className="text-left"
                        render={<button type="button" />}
                        onClick={() => addProduct(product)}
                      >
                        <ItemContent>
                          <ItemTitle>{product.name[lang]}</ItemTitle>
                          <ItemDescription>
                            {formatTaka(product.price, lang)} /{" "}
                            {UNITS[product.unit][lang]}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          {inBill ? (
                            <Badge>
                              {formatNumber(parseNumber(inBill.qty), lang)}
                            </Badge>
                          ) : (
                            <PlusIcon />
                          )}
                        </ItemActions>
                      </Item>
                    )
                  })}
                  <Item
                    variant="outline"
                    size="sm"
                    className="border-dashed text-left"
                    render={<button type="button" />}
                    onClick={() => setCustomOpen(true)}
                  >
                    <ItemMedia variant="icon">
                      <PackagePlusIcon />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{t.otherItem}</ItemTitle>
                      <ItemDescription>
                        {t.otherItemDescription}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                </ItemGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.billTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                {state.items.length === 0 ? (
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ReceiptTextIcon />
                      </EmptyMedia>
                      <EmptyTitle>{t.emptyTitle}</EmptyTitle>
                      <EmptyDescription>{t.emptyDescription}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ItemGroup className="gap-2">
                    {state.items.map((item) => {
                      const name = itemName(item, lang)
                      return (
                        <Item key={item.key} variant="outline" size="sm">
                          <ItemContent>
                            <ItemTitle>{name}</ItemTitle>
                            <ItemDescription>
                              {t.perUnit(UNITS[item.unit][lang])}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t.remove(name)}
                              onClick={() => removeItem(item.key)}
                            >
                              <Trash2Icon />
                            </Button>
                          </ItemActions>
                          <ItemFooter className="flex-wrap">
                            <ButtonGroup aria-label={t.quantity}>
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label={t.decrease}
                                disabled={parseNumber(item.qty) <= 0}
                                onClick={() => stepQty(item, -1)}
                              >
                                <MinusIcon />
                              </Button>
                              <Input
                                aria-label={t.quantity}
                                className="w-16 text-center"
                                {...numberInput(item.qty, (qty) =>
                                  updateItem(item.key, { qty })
                                )}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label={t.increase}
                                onClick={() => stepQty(item, 1)}
                              >
                                <PlusIcon />
                              </Button>
                            </ButtonGroup>
                            <InputGroup className="w-36">
                              <InputGroupAddon>
                                <InputGroupText>৳</InputGroupText>
                              </InputGroupAddon>
                              <InputGroupInput
                                aria-label={t.rate}
                                {...numberInput(item.price, (price) =>
                                  updateItem(item.key, { price })
                                )}
                              />
                            </InputGroup>
                            <span className="ml-auto font-medium">
                              {formatTaka(lineTotal(item), lang)}
                            </span>
                          </ItemFooter>
                        </Item>
                      )
                    })}
                  </ItemGroup>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.summaryTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FieldGroup>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="discount">{t.discount}</FieldLabel>
                    <InputGroup className="max-w-40">
                      <InputGroupAddon>
                        <InputGroupText>৳</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="discount"
                        placeholder={digits("0", lang)}
                        {...numberInput(state.discount, (discount) =>
                          update({ discount })
                        )}
                      />
                    </InputGroup>
                  </Field>
                </FieldGroup>
                <Separator />
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t.itemCount}</span>
                    <span>{formatNumber(totals.items.length, lang)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t.subtotal}</span>
                    <span>{formatTaka(totals.subtotal, lang)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t.discount}</span>
                      <span>- {formatTaka(totals.discount, lang)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{t.grandTotal}</span>
                    <span>{formatTaka(totals.total, lang)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:sticky lg:top-4 lg:self-start">
            <CardHeader>
              <CardTitle>{t.previewTitle}</CardTitle>
              <CardDescription>{t.previewDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={t.previewTitle}
                  className="mx-auto w-full max-w-80 rounded-lg border"
                />
              ) : (
                <Skeleton className="mx-auto aspect-[1/2] w-full max-w-80" />
              )}
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="outline"
                      disabled={state.items.length === 0}
                    />
                  }
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  {t.newBill}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.newBillTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.newBillDescription}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setState(newBillState())}>
                      {t.confirm}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                className="flex-1"
                disabled={!hasItems || printing}
                onClick={print}
              >
                {printButtonContent}
              </Button>
            </CardFooter>
          </Card>
        </main>

        <div className="fixed inset-x-0 bottom-0 border-t bg-background p-3 lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs text-muted-foreground">
                {t.grandTotal}
              </span>
              <span className="truncate text-lg font-semibold">
                {formatTaka(totals.total, lang)}
              </span>
            </div>
            <Button size="lg" disabled={!hasItems || printing} onClick={print}>
              {printButtonContent}
            </Button>
          </div>
        </div>
      </div>

      {/* The only thing the browser prints (system print). */}
      <div id="print-area" aria-hidden="true">
        {printImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={printImage} alt="" />
        )}
      </div>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <form onSubmit={addCustom} className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>{t.customTitle}</DialogTitle>
              <DialogDescription>{t.customDescription}</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="custom-name">{t.itemName}</FieldLabel>
                <Input
                  id="custom-name"
                  placeholder={t.itemNamePlaceholder}
                  value={custom.name}
                  onChange={(e) =>
                    setCustom({ ...custom, name: e.target.value })
                  }
                  autoFocus
                />
              </Field>
              <Field>
                <FieldTitle id="custom-unit">{t.unit}</FieldTitle>
                <ToggleGroup
                  aria-labelledby="custom-unit"
                  variant="outline"
                  size="sm"
                  className="flex-wrap"
                  value={[custom.unit]}
                  onValueChange={(value) =>
                    value[0] && setCustom({ ...custom, unit: value[0] as Unit })
                  }
                >
                  {UNIT_KEYS.map((unit) => (
                    <ToggleGroupItem key={unit} value={unit}>
                      {UNITS[unit][lang]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <FieldGroup className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="custom-qty">{t.quantity}</FieldLabel>
                  <Input
                    id="custom-qty"
                    {...numberInput(custom.qty, (qty) =>
                      setCustom({ ...custom, qty })
                    )}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="custom-price">
                    {t.ratePerUnit(UNITS[custom.unit][lang])}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupText>৳</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="custom-price"
                      placeholder={digits("0", lang)}
                      {...numberInput(custom.price, (price) =>
                        setCustom({ ...custom, price })
                      )}
                    />
                  </InputGroup>
                </Field>
              </FieldGroup>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                {t.cancel}
              </DialogClose>
              <Button
                type="submit"
                disabled={!custom.name.trim() || parseNumber(custom.qty) <= 0}
              >
                <PlusIcon data-icon="inline-start" />
                {t.addToBill}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={printerOpen} onOpenChange={setPrinterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.printerTitle}</DialogTitle>
            <DialogDescription>{t.printerDescription}</DialogDescription>
          </DialogHeader>
          {bluetoothSupported ? (
            <div className="flex flex-col gap-4">
              <Item variant="muted" size="sm">
                <ItemMedia variant="icon">
                  {printerConnected ? (
                    <BluetoothConnectedIcon />
                  ) : (
                    <BluetoothIcon />
                  )}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {printerConnected
                      ? t.printerConnected(printer.name)
                      : printerStatus === "connecting"
                        ? t.connecting
                        : printer.hasDevice
                          ? t.printerRemembered(printer.name)
                          : t.printerNone}
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Badge variant={printerConnected ? "default" : "secondary"}>
                    {printerConnected ? t.on : t.off}
                  </Badge>
                </ItemActions>
              </Item>
              <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">
                <li>{t.printerStep1}</li>
                <li>{t.printerStep2}</li>
                <li>{t.printerStep3}</li>
              </ol>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  disabled={printerStatus === "connecting" || printing}
                  onClick={connectPrinter}
                >
                  <BluetoothIcon data-icon="inline-start" />
                  {printer.hasDevice ? t.choosePrinter : t.findPrinter}
                </Button>
                {printer.hasDevice && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={printing}
                    onClick={() => printer.disconnect()}
                  >
                    {t.disconnect}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <BluetoothIcon />
              <AlertTitle>{t.unsupportedTitle}</AlertTitle>
              <AlertDescription>{t.unsupportedDescription}</AlertDescription>
            </Alert>
          )}
          <FieldSeparator>{t.or}</FieldSeparator>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{t.systemPrintHint}</p>
            <Button
              variant="outline"
              disabled={!hasItems}
              onClick={() => {
                setPrinterOpen(false)
                systemPrint()
              }}
            >
              <PrinterIcon data-icon="inline-start" />
              {t.systemPrint}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
