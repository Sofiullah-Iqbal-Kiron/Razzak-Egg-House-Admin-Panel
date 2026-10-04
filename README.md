# Razzak Egg House — POS / Cash Memo

A single-page, Bengali-language sales screen for **রাজ্জাক এগ হাউস**. Pick
products, adjust quantity and price, and print an 80mm cash memo. No login, no
database, and nothing is saved.

## Printing

### Direct Bluetooth printing (recommended)

The **Rongta RPP300BU** is dual-mode Bluetooth (SPP + BLE). Chrome on Android
can talk to it directly through Web Bluetooth:

1. Open the site in **Google Chrome on Android** over **https** (Web Bluetooth
   does not work over plain http, except on `localhost`).
2. Turn on the printer, phone Bluetooth and Location.
3. Tap **প্রিন্টার** (top right) → **প্রিন্টার খুঁজুন**, and pick the printer
   from Chrome's list.
4. Tap **প্রিন্ট**. The memo prints straight away.

The printer has no Bengali font. So the memo is drawn as a 576-dot-wide image
(`lib/receipt-canvas.ts`) and sent as ESC/POS raster data (`lib/escpos.ts`,
`lib/bluetooth-printer.ts`).

> If another app (such as RawBT or Rongta's own app) is holding the printer's
> Bluetooth connection, close it first.

### System print (fallback)

**প্রিন্টার → সিস্টেম প্রিন্ট** opens Android's print dialog with an
80mm-wide page. Install the
[RawBT print service](https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter)
and choose it as the printer.

## Customising

- Products and default prices: `lib/products.ts`
- Shop name, address, phone, and memo footer: `lib/shop.ts`

## Development

```bash
bun install
bun run dev        # http://localhost:3000
bun run typecheck
bun run lint
```

## Deployment

`.github/workflows/pages.yml` builds a static export and deploys it to
GitHub Pages on every push to `master`. Enable it once under
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

The app also deploys to Vercel as-is, with no extra settings.
