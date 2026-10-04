/**
 * Direct printing to a BLE thermal printer (e.g. Rongta RPP300BU) via the
 * Web Bluetooth API. Works in Chrome on Android over HTTPS (or localhost).
 */

// Minimal Web Bluetooth typings, the API isn't part of TypeScript's DOM lib.
type BtCharacteristic = {
  uuid: string
  properties: { write: boolean; writeWithoutResponse: boolean }
  writeValueWithResponse(data: BufferSource): Promise<void>
  writeValueWithoutResponse(data: BufferSource): Promise<void>
}
type BtService = {
  uuid: string
  getCharacteristics(): Promise<BtCharacteristic[]>
}
type BtServer = {
  connected: boolean
  connect(): Promise<BtServer>
  disconnect(): void
  getPrimaryServices(): Promise<BtService[]>
}
type BtDevice = EventTarget & { name?: string; gatt?: BtServer }
type Bluetooth = {
  getAvailability?(): Promise<boolean>
  requestDevice(options: {
    acceptAllDevices?: boolean
    optionalServices?: string[]
  }): Promise<BtDevice>
}

/** GATT services that cheap ESC/POS printers commonly expose for printing. */
const PRINTER_SERVICES = [
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC transparent UART (Rongta)
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "0000ae30-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
]
const PREFERRED_CHARACTERISTIC = "49535343-8841-43f4-a8d4-ecbe34729bb3"

/** Errors the UI translates into the current language. */
export class PrinterError extends Error {
  constructor(readonly code: "no-bluetooth" | "no-device" | "no-writable") {
    super(code)
    this.name = "PrinterError"
  }
}

export type PrinterStatus = "idle" | "connecting" | "connected" | "printing"

function bluetooth(): Bluetooth | undefined {
  if (typeof navigator === "undefined") return undefined
  return (navigator as Navigator & { bluetooth?: Bluetooth }).bluetooth
}

export function isBluetoothSupported() {
  return (
    typeof window !== "undefined" && window.isSecureContext && !!bluetooth()
  )
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

class BluetoothPrinter {
  device: BtDevice | null = null
  private characteristic: BtCharacteristic | null = null
  private chunkSize = 180
  private listeners = new Set<() => void>()
  status: PrinterStatus = "idle"

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getStatus = () => this.status

  private setStatus(status: PrinterStatus) {
    this.status = status
    this.listeners.forEach((l) => l())
  }

  get name() {
    return this.device?.name || "RPP300"
  }

  /** Opens Chrome's device picker. Must be called from a tap/click. */
  async connect() {
    const bt = bluetooth()
    if (!bt) throw new PrinterError("no-bluetooth")
    this.setStatus("connecting")
    try {
      const device = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      })
      if (this.device && this.device !== device) this.disconnect()
      this.device = device
      device.addEventListener("gattserverdisconnected", this.onDisconnected)
      await this.ensureConnected()
      this.setStatus("connected")
    } catch (error) {
      this.setStatus(this.characteristic ? "connected" : "idle")
      throw error
    }
  }

  disconnect() {
    this.device?.removeEventListener(
      "gattserverdisconnected",
      this.onDisconnected
    )
    this.device?.gatt?.disconnect()
    this.device = null
    this.characteristic = null
    this.setStatus("idle")
  }

  private onDisconnected = () => {
    // Keep the device so we can silently reconnect on the next print.
    this.characteristic = null
    if (this.status !== "printing") this.setStatus("idle")
  }

  get hasDevice() {
    return !!this.device
  }

  private async ensureConnected() {
    const gatt = this.device?.gatt
    if (!gatt) throw new PrinterError("no-device")
    if (gatt.connected && this.characteristic) return this.characteristic

    const server = await gatt.connect()
    const services = await server.getPrimaryServices()
    let fallback: BtCharacteristic | null = null
    for (const service of services) {
      for (const c of await service.getCharacteristics()) {
        if (!c.properties.write && !c.properties.writeWithoutResponse) continue
        if (c.uuid === PREFERRED_CHARACTERISTIC) {
          this.characteristic = c
          return c
        }
        fallback ??= c
      }
    }
    if (!fallback) {
      server.disconnect()
      throw new PrinterError("no-writable")
    }
    this.characteristic = fallback
    return fallback
  }

  private async writeChunk(
    c: BtCharacteristic,
    chunk: Uint8Array<ArrayBuffer>
  ) {
    for (let attempt = 0; ; attempt++) {
      try {
        if (c.properties.writeWithoutResponse) {
          await c.writeValueWithoutResponse(chunk)
        } else {
          await c.writeValueWithResponse(chunk)
        }
        return
      } catch (error) {
        if (attempt >= 3) throw error
        await sleep(50 * (attempt + 1))
      }
    }
  }

  async print(data: Uint8Array<ArrayBuffer>) {
    this.setStatus("printing")
    try {
      const c = await this.ensureConnected()
      let offset = 0
      let sent = 0
      while (offset < data.length) {
        const chunk = data.slice(offset, offset + this.chunkSize)
        try {
          await this.writeChunk(c, chunk)
        } catch (error) {
          // Packet too large for the link's MTU, fall back to the BLE minimum.
          if (this.chunkSize > 20) {
            this.chunkSize = 20
            continue
          }
          throw error
        }
        offset += chunk.length
        sent += chunk.length
        // Give the printer's small buffer time to drain.
        if (c.properties.writeWithoutResponse && sent >= 2048) {
          sent = 0
          await sleep(25)
        }
      }
      this.setStatus("connected")
    } catch (error) {
      this.setStatus(this.device?.gatt?.connected ? "connected" : "idle")
      throw error
    }
  }
}

export const printer = new BluetoothPrinter()
