"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { bn as bnLocale } from "react-day-picker/locale"
import {
  BluetoothConnectedIcon,
  BluetoothIcon,
  ChevronDownIcon,
  EggIcon,
  ExternalLinkIcon,
  PhoneIcon,
  PlusIcon,
  PrinterIcon,
  ReceiptTextIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react"

import { ModeToggle } from "@/components/mode-toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { canvasToEscPos } from "@/lib/escpos"
import { cacheLoadedFiles, registerServiceWorker } from "@/lib/pwa"
import { LOGO_SRC } from "@/lib/logo"
import {
  cleanNumberInput,
  digits,
  formatDate,
  formatNumber,
  formatTaka,
  formatTime,
  toLatinDigits,
} from "@/lib/bn"
import { PRODUCTS } from "@/lib/products"
import { DEVELOPER, SHOP } from "@/lib/shop"
import { T } from "@/lib/text"
import { drawReceipt, loadReceiptFonts, PAPER_DOTS } from "@/lib/receipt-canvas"

let keySeq = 0
const nextKey = () => `item-${++keySeq}`

type TimeItem = { value: number; label: string }

const timeItem = (value: number): TimeItem => ({
  value,
  label: digits(String(value).padStart(2, "0")),
})

const HOURS = Array.from({ length: 12 }, (_, i) => timeItem(i + 1))
const MINUTES = Array.from({ length: 60 }, (_, i) => timeItem(i))

/** Matches typed Bengali or Latin digits, e.g. "৫", "5" or "05" finds ০৫. */
function matchTimeItem(item: TimeItem, query: string) {
  const typed = toLatinDigits(query.trim())
  if (!typed) return true
  const padded = String(item.value).padStart(2, "0")
  return padded.startsWith(typed) || String(item.value).startsWith(typed)
}

function newBillState() {
  const now = new Date()
  return {
    /** The day chosen on the memo. */
    date: now,
    /** Time of day on the memo, "HH:mm", prefilled with the current time. */
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    customerName: "",
    customerPhone: "",
    items: PRODUCTS.map((p): BillItem => ({
      key: p.id,
      productId: p.id,
      qty: "",
      price: "",
    })),
    due: "",
    deposit: "",
  }
}

type BillState = ReturnType<typeof newBillState>

function toBill(state: BillState): Bill {
  const [hours, minutes] = state.time.split(":").map(Number)
  const date = new Date(state.date)
  date.setHours(hours || 0, minutes || 0, 0, 0)
  return {
    date,
    customerName: state.customerName,
    customerPhone: state.customerPhone,
    items: state.items,
    due: state.due,
    deposit: state.deposit,
  }
}

function printErrorMessage(error: unknown) {
  if (error instanceof PrinterError) {
    if (error.code === "no-bluetooth") return T.errorNoBluetooth
    if (error.code === "no-writable") return T.errorNoWritable
    if (error.code === "no-device") return T.errorNotFound
  }
  return T.errorUnknown
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

  const [state, setState] = React.useState(newBillState)
  const [fontsReady, setFontsReady] = React.useState(false)
  const [dateOpen, setDateOpen] = React.useState(false)
  const [timeOpen, setTimeOpen] = React.useState(false)
  const [logoFailed, setLogoFailed] = React.useState(false)
  const [printerOpen, setPrinterOpen] = React.useState(false)
  const [resetOpen, setResetOpen] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const [printImage, setPrintImage] = React.useState<string | null>(null)
  const pageStyleRef = React.useRef<HTMLStyleElement | null>(null)

  const printerStatus = React.useSyncExternalStore(
    printer.subscribe,
    printer.getStatus,
    () => "idle" as PrinterStatus
  )

  const bill = toBill(state)
  const [hour24, minute] = state.time.split(":").map(Number)
  const isPm = hour24 >= 12
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const setTime = (h12: number, m: number, pm: boolean) => {
    const h = (h12 % 12) + (pm ? 12 : 0)
    update({
      time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    })
  }
  const totals = billTotals(bill)
  const hasItems = totals.items.length > 0
  const printing = printerStatus === "printing"
  const printerConnected = printerStatus === "connected" || printing
  const bluetoothSupported = mounted && isBluetoothSupported()

  React.useEffect(() => {
    loadReceiptFonts().then(() => {
      setFontsReady(true)
      // The memo fonts and logo are loaded now; keep them for offline use.
      cacheLoadedFiles()
    })
    registerServiceWorker()
    printer.restore()
  }, [])

  // The preview is the exact image that gets printed.
  const deferredState = React.useDeferredValue(state)
  const previewUrl = React.useMemo(() => {
    if (!mounted || !fontsReady) return null
    return drawReceipt(toBill(deferredState)).toDataURL()
  }, [mounted, fontsReady, deferredState])

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

  /** Adds an empty "other item" row for a product not in the catalog. */
  const addOtherRow = () =>
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        { key: nextKey(), customName: "", qty: "", price: "" },
      ],
    }))

  /** Props for a text input that edits a number shown in Bengali digits. */
  const numberInput = (value: string, onValue: (value: string) => void) => ({
    type: "text",
    inputMode: "decimal" as const,
    autoComplete: "off",
    value: digits(value),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onValue(cleanNumberInput(e.target.value)),
    onFocus: (e: React.FocusEvent<HTMLInputElement>) =>
      e.currentTarget.select(),
  })

  /** Fallback: the Android/browser print dialog, e.g. through RawBT. */
  const systemPrint = () => {
    if (!hasItems) return
    const canvas = drawReceipt(bill)
    // Size the page to the memo so the printer does not feed blank paper.
    const heightMm = Math.ceil((canvas.height * 72) / PAPER_DOTS) + 4
    if (!pageStyleRef.current) {
      pageStyleRef.current = document.createElement("style")
      document.head.appendChild(pageStyleRef.current)
    }
    pageStyleRef.current.textContent = `@page { size: 80mm ${heightMm}mm; margin: 0; }`
    flushSync(() => setPrintImage(canvas.toDataURL()))
    window.print()
  }

  /** Prints straight to the Bluetooth thermal printer. */
  const bluetoothPrint = async () => {
    if (!hasItems || printing) return
    try {
      // Choosing a printer must start inside the tap, before any await.
      if (!printer.hasDevice) await printer.connect()
      await loadReceiptFonts()
      await printer.print(canvasToEscPos(drawReceipt(bill)))
      toast.add({ type: "success", title: T.toastPrinted })
    } catch (error) {
      // Closing Chrome's printer list is not an error.
      if (error instanceof DOMException && error.name === "NotFoundError")
        return
      toast.add({
        type: "error",
        title: T.toastPrintFailed,
        description: `${printErrorMessage(error)} ${T.toastPrintFailedHint}`,
        priority: "high",
      })
    }
  }

  const print = bluetoothSupported ? bluetoothPrint : systemPrint

  const connectPrinter = async () => {
    try {
      await printer.connect()
      toast.add({ type: "success", title: T.toastConnected(printer.name) })
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError")
        return
      toast.add({
        type: "error",
        title: T.toastPrintFailed,
        description: printErrorMessage(error),
      })
    }
  }

  const printLabel = (label: string) =>
    printing ? (
      <>
        <Spinner data-icon="inline-start" />
        {T.printing}
      </>
    ) : (
      <>
        <PrinterIcon data-icon="inline-start" />
        {label}
      </>
    )

  const previewImage = previewUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={previewUrl}
      alt={T.previewTitle}
      className="mx-auto w-full max-w-80 rounded-lg border"
    />
  ) : (
    <Skeleton className="mx-auto aspect-[1/2] w-full max-w-80" />
  )

  const newBillButton = (
    <Button
      variant="outline"
      size="lg"
      disabled={state.items.length === 0}
      onClick={() => setResetOpen(true)}
    >
      <RotateCcwIcon data-icon="inline-start" />
      {T.newBill}
    </Button>
  )

  /** Clears the bill and closes the confirmation (and the phone preview). */
  const confirmNewBill = () => {
    setState(newBillState())
    setResetOpen(false)
    setPreviewOpen(false)
  }

  const printButton = (
    <Button
      size="lg"
      className="flex-1"
      disabled={!hasItems || printing}
      onClick={print}
    >
      {printLabel(T.printMemo)}
    </Button>
  )

  const printerBody = (
    <div className="flex flex-col gap-4">
      {bluetoothSupported ? (
        <>
          <Item variant="muted" size="sm">
            <ItemMedia variant="icon">
              {printerConnected ? (
                <BluetoothConnectedIcon />
              ) : (
                <BluetoothIcon />
              )}
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="line-clamp-2">
                {printerConnected
                  ? T.printerConnected(printer.name)
                  : printerStatus === "connecting"
                    ? T.connecting
                    : printer.hasDevice
                      ? T.printerRemembered(printer.name)
                      : T.printerNone}
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              <Badge variant={printerConnected ? "default" : "secondary"}>
                {printerConnected ? T.on : T.off}
              </Badge>
            </ItemActions>
          </Item>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">
            <li>{T.printerStep1}</li>
            <li>{T.printerStep2}</li>
            <li>{T.printerStep3}</li>
          </ol>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              className="sm:flex-1"
              disabled={printerStatus === "connecting" || printing}
              onClick={connectPrinter}
            >
              <BluetoothIcon data-icon="inline-start" />
              {printer.hasDevice ? T.choosePrinter : T.findPrinter}
            </Button>
            {printer.hasDevice && (
              <Button
                variant="outline"
                size="lg"
                className="sm:flex-1"
                disabled={printing}
                onClick={() => printer.disconnect()}
              >
                {T.disconnect}
              </Button>
            )}
          </div>
        </>
      ) : (
        <Alert variant="destructive">
          <BluetoothIcon />
          <AlertTitle>{T.unsupportedTitle}</AlertTitle>
          <AlertDescription>{T.unsupportedDescription}</AlertDescription>
        </Alert>
      )}
      <FieldSeparator>{T.or}</FieldSeparator>
      <p className="text-sm text-muted-foreground">{T.systemPrintHint}</p>
      <Button
        variant="outline"
        size="lg"
        disabled={!hasItems}
        onClick={() => {
          setPrinterOpen(false)
          systemPrint()
        }}
      >
        <PrinterIcon data-icon="inline-start" />
        {T.systemPrint}
      </Button>
    </div>
  )

  return (
    <>
      <div className="min-h-svh bg-muted/40 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6">
        <header className="sticky top-0 z-10 bg-primary text-primary-foreground shadow-sm">
          <div className="mx-auto flex max-w-[1100px] items-center gap-2 px-3 py-2.5 sm:px-4">
            {logoFailed ? (
              <EggIcon className="shrink-0" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={LOGO_SRC}
                alt=""
                className="size-10 shrink-0 rounded-xl bg-white object-contain p-0.5"
                onError={() => setLogoFailed(true)}
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <h1 className="truncate font-semibold">{T.appName}</h1>
              <p className="truncate text-xs opacity-80">{SHOP.address}</p>
            </div>
            <ModeToggle labels={T.theme} variant="secondary" />
            <Button
              variant="secondary"
              aria-label={T.printerTitle}
              onClick={() => setPrinterOpen(true)}
            >
              {printerConnected ? (
                <BluetoothConnectedIcon data-icon="inline-start" />
              ) : (
                <BluetoothIcon data-icon="inline-start" />
              )}
              <span className="hidden max-w-32 truncate sm:inline">
                {printerStatus === "connecting"
                  ? T.connecting
                  : printerConnected
                    ? printer.name
                    : T.printer}
              </span>
            </Button>
          </div>
        </header>

        {/*
          Phone: one column, preview in a drawer.
          Tablet and up (including large monitors): cards stacked in one
          column, with the memo preview in its own sticky panel on the right.
        */}
        <main className="mx-auto grid max-w-[1100px] items-start gap-3 p-3 sm:gap-4 sm:p-4 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-3 sm:gap-4 md:col-start-1 md:row-start-1">
            <Card>
              <CardHeader>
                <CardTitle>{T.customerTitle}</CardTitle>
                <CardDescription>{T.customerDescription}</CardDescription>
              </CardHeader>
              <CardContent className="@container">
                <FieldGroup className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
                  <Field>
                    <FieldLabel htmlFor="bill-date">{T.date}</FieldLabel>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            id="bill-date"
                            variant="outline"
                            className="min-w-0 justify-between text-left font-normal"
                          />
                        }
                      >
                        <span className="truncate">
                          {formatDate(state.date)}
                        </span>
                        <ChevronDownIcon data-icon="inline-end" />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={state.date}
                          defaultMonth={state.date}
                          locale={bnLocale}
                          numerals="beng"
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
                    <FieldLabel htmlFor="bill-time">{T.time}</FieldLabel>
                    <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            id="bill-time"
                            variant="outline"
                            className="min-w-0 justify-between text-left font-normal"
                          />
                        }
                      >
                        <span className="truncate">
                          {formatTime(bill.date)}
                        </span>
                        <ChevronDownIcon data-icon="inline-end" />
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto max-w-[calc(100vw-1.5rem)]"
                        align="start"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Combobox
                            items={HOURS}
                            value={HOURS[hour12 - 1]}
                            onValueChange={(item) =>
                              item && setTime(item.value, minute, isPm)
                            }
                            itemToStringLabel={(item) => item.label}
                            itemToStringValue={(item) => String(item.value)}
                            filter={matchTimeItem}
                            autoHighlight
                          >
                            <ComboboxInput
                              aria-label={T.hour}
                              inputMode="numeric"
                              className="w-20"
                            />
                            <ComboboxContent>
                              <ComboboxEmpty>{T.noMatch}</ComboboxEmpty>
                              <ComboboxList>
                                {(item: TimeItem) => (
                                  <ComboboxItem key={item.value} value={item}>
                                    {item.label}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                          <span aria-hidden="true">:</span>
                          <Combobox
                            items={MINUTES}
                            value={MINUTES[minute]}
                            onValueChange={(item) =>
                              item && setTime(hour12, item.value, isPm)
                            }
                            itemToStringLabel={(item) => item.label}
                            itemToStringValue={(item) => String(item.value)}
                            filter={matchTimeItem}
                            autoHighlight
                          >
                            <ComboboxInput
                              aria-label={T.minute}
                              inputMode="numeric"
                              className="w-20"
                            />
                            <ComboboxContent>
                              <ComboboxEmpty>{T.noMatch}</ComboboxEmpty>
                              <ComboboxList>
                                {(item: TimeItem) => (
                                  <ComboboxItem key={item.value} value={item}>
                                    {item.label}
                                  </ComboboxItem>
                                )}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                          <ToggleGroup
                            variant="outline"
                            value={[isPm ? "pm" : "am"]}
                            onValueChange={(value) =>
                              value[0] &&
                              setTime(hour12, minute, value[0] === "pm")
                            }
                          >
                            <ToggleGroupItem value="am">{T.am}</ToggleGroupItem>
                            <ToggleGroupItem value="pm">{T.pm}</ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </Field>
                  <Field className="col-span-2 @md:col-span-1">
                    <FieldLabel htmlFor="customer-name">
                      {T.customerName}
                    </FieldLabel>
                    <Input
                      id="customer-name"
                      autoComplete="off"
                      placeholder={T.customerNamePlaceholder}
                      value={state.customerName}
                      onChange={(e) => update({ customerName: e.target.value })}
                    />
                  </Field>
                  <Field className="col-span-2 @md:col-span-1">
                    <FieldLabel htmlFor="customer-phone">{T.mobile}</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <PhoneIcon />
                      </InputGroupAddon>
                      <InputGroupInput
                        id="customer-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="off"
                        placeholder={T.mobilePlaceholder}
                        value={digits(state.customerPhone)}
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
                <CardTitle>{T.productsTitle}</CardTitle>
                <CardDescription>{T.productsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[34%] px-1">{T.item}</TableHead>
                      <TableHead className="px-1">{T.quantity}</TableHead>
                      <TableHead className="px-1">{T.rate} (৳)</TableHead>
                      <TableHead className="px-1 text-right">
                        {T.total} (৳)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.items.map((item) => {
                      const name = itemName(item)
                      const total = lineTotal(item)
                      return (
                        <TableRow key={item.key}>
                          <TableCell className="px-1 font-medium whitespace-normal">
                            {item.productId ? (
                              name
                            ) : (
                              <InputGroup className="h-9">
                                <InputGroupInput
                                  aria-label={T.itemName}
                                  placeholder={T.otherItem}
                                  value={item.customName ?? ""}
                                  onChange={(e) =>
                                    updateItem(item.key, {
                                      customName: e.target.value,
                                    })
                                  }
                                />
                                <InputGroupAddon align="inline-end">
                                  <InputGroupButton
                                    variant="destructive"
                                    size="icon-xs"
                                    aria-label={T.remove(name)}
                                    onClick={() => removeItem(item.key)}
                                  >
                                    <Trash2Icon />
                                  </InputGroupButton>
                                </InputGroupAddon>
                              </InputGroup>
                            )}
                          </TableCell>
                          <TableCell className="px-1">
                            <Input
                              aria-label={`${name} ${T.quantity}`}
                              placeholder={digits("0")}
                              className="h-9"
                              {...numberInput(item.qty, (qty) =>
                                updateItem(item.key, { qty })
                              )}
                            />
                          </TableCell>
                          <TableCell className="px-1">
                            <Input
                              aria-label={`${name} ${T.rate}`}
                              placeholder={digits("0")}
                              className="h-9"
                              {...numberInput(item.price, (price) =>
                                updateItem(item.key, { price })
                              )}
                            />
                          </TableCell>
                          <TableCell
                            className={cn(
                              "px-1 text-right font-medium",
                              total === 0 && "text-muted-foreground"
                            )}
                          >
                            {formatNumber(total)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto sm:self-start"
                  onClick={addOtherRow}
                >
                  <PlusIcon data-icon="inline-start" />
                  {T.addOtherItem}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{T.summaryTitle}</CardTitle>
                <CardDescription>{T.summaryDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FieldGroup>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="due">{T.due}</FieldLabel>
                    <InputGroup className="h-9 max-w-40">
                      <InputGroupAddon>
                        <InputGroupText>৳</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="due"
                        placeholder={digits("0")}
                        {...numberInput(state.due, (due) => update({ due }))}
                      />
                    </InputGroup>
                  </Field>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="deposit">{T.deposit}</FieldLabel>
                    <InputGroup className="h-9 max-w-40">
                      <InputGroupAddon>
                        <InputGroupText>৳</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="deposit"
                        placeholder={digits("0")}
                        {...numberInput(state.deposit, (deposit) =>
                          update({ deposit })
                        )}
                      />
                    </InputGroup>
                  </Field>
                </FieldGroup>
                <Separator />
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <span>{T.itemCount}</span>
                    <span>{formatNumber(totals.items.length)}</span>
                  </div>
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <span>{T.subtotal}</span>
                    <span>{formatTaka(totals.subtotal)}</span>
                  </div>
                  {totals.due > 0 && (
                    <div className="flex justify-between gap-4 text-muted-foreground">
                      <span>{T.due}</span>
                      <span>+ {formatTaka(totals.due)}</span>
                    </div>
                  )}
                  {totals.deposit > 0 && (
                    <div className="flex justify-between gap-4 text-muted-foreground">
                      <span>{T.deposit}</span>
                      <span>- {formatTaka(totals.deposit)}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 text-lg font-semibold">
                    <span>{T.remaining}</span>
                    <span>{formatTaka(totals.remaining)}</span>
                  </div>
                  {totals.change > 0 && (
                    <div className="flex justify-between gap-4 font-semibold">
                      <span>{T.change}</span>
                      <span>{formatTaka(totals.change)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="hidden md:sticky md:top-18 md:col-start-2 md:row-span-2 md:row-start-1 md:block">
            <Card className="max-h-[calc(100svh-5.5rem)]">
              <CardHeader>
                <CardTitle>{T.previewTitle}</CardTitle>
                <CardDescription>{T.previewDescription}</CardDescription>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto">
                {previewImage}
              </CardContent>
              <CardFooter className="flex-wrap gap-2">
                {newBillButton}
                {printButton}
              </CardFooter>
            </Card>
          </aside>
        </main>

        <footer className="mx-auto flex max-w-[1100px] flex-col items-center gap-3 px-3 pt-2 pb-6 text-center text-sm text-muted-foreground sm:px-4">
          <Separator />
          <p className="flex flex-wrap items-center justify-center gap-x-1.5">
            {T.developedBy}
            <Button
              variant="link"
              size="sm"
              className="h-auto px-0"
              nativeButton={false}
              render={
                <a
                  href={DEVELOPER.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={T.developerProfile}
                />
              }
            >
              {DEVELOPER.name}
              <ExternalLinkIcon data-icon="inline-end" />
            </Button>
          </p>
        </footer>

        {/* Phone action bar. */}
        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-lg"
              aria-label={T.previewTitle}
              onClick={() => setPreviewOpen(true)}
            >
              <ReceiptTextIcon />
            </Button>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs text-muted-foreground">
                {T.remaining}
              </span>
              <span className="truncate text-lg font-semibold">
                {formatTaka(totals.remaining)}
              </span>
            </div>
            <Button size="lg" disabled={!hasItems || printing} onClick={print}>
              {printLabel(T.print)}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{T.newBillTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {T.newBillDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{T.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNewBill}>
              {T.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* The only thing the browser prints (system print). */}
      <div id="print-area" aria-hidden="true">
        {printImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={printImage} alt="" />
        )}
      </div>

      {isMobile && (
        <Drawer
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          showSwipeHandle
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{T.previewTitle}</DrawerTitle>
              <DrawerDescription>{T.previewDescription}</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {previewImage}
            </div>
            <DrawerFooter className="flex-row">
              {newBillButton}
              {printButton}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {isMobile ? (
        <Drawer
          open={printerOpen}
          onOpenChange={setPrinterOpen}
          showSwipeHandle
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{T.printerTitle}</DrawerTitle>
              <DrawerDescription>{T.printerDescription}</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {printerBody}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={printerOpen} onOpenChange={setPrinterOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{T.printerTitle}</DialogTitle>
              <DialogDescription>{T.printerDescription}</DialogDescription>
            </DialogHeader>
            {printerBody}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
