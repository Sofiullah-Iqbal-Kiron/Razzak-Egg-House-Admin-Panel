# Razzak Egg House: POS and Cash Memo

A single, open sales page for **রাজ্জাক এগ হাউস**. Pick products, adjust
quantity and price, and print an 80mm cash memo. No login, no database, and
nothing about a bill is saved.

- Bengali by default, with an English switch (remembered on the device).
- Built only from shadcn/ui components on the project's `base-rhea` preset.
- One font everywhere, on screen and on paper:
  [Noto Serif Bengali](https://fonts.google.com/noto/specimen/Noto+Serif+Bengali).

## Printing

### Direct Bluetooth printing (recommended)

The **Rongta RPP300BU** is dual mode Bluetooth (SPP + BLE). Chrome on Android
talks to it directly through Web Bluetooth:

1. Open the site in **Google Chrome on Android** over **https** (Web Bluetooth
   does not work over plain http, except on `localhost`).
2. Turn on the printer, and the phone's Bluetooth and Location.
3. Tap **প্রিন্টার** (top right), then **প্রিন্টার খুঁজুন**, and pick the
   printer from Chrome's list.
4. Tap **মেমো প্রিন্ট করুন**. The memo prints straight away.

The printer has no Bengali font, so the memo is drawn as a 576 dot wide image
(`lib/receipt-canvas.ts`) and sent as ESC/POS raster data (`lib/escpos.ts`,
`lib/bluetooth-printer.ts`). The on-screen preview is that same image.

> If another app (such as RawBT or Rongta's own app) holds the printer's
> Bluetooth connection, close it first.

### System print (fallback)

**প্রিন্টার**, then **সিস্টেম প্রিন্ট**, opens Android's print dialog with a
page sized to the memo. Install the
[RawBT print service](https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter)
and choose it as the printer.

## Customising

- Products, units and default prices: `lib/products.ts`
- Shop name, tagline, footer address and phone: `lib/shop.ts`
- All interface and memo text, in both languages: `lib/i18n.ts`

## Development

This project is managed with bun.

```bash
bun install
bun run dev        # http://localhost:3000
bun run typecheck
bun run lint
```

### shadcn/ui skill and MCP

The shadcn skill (`.claude/skills/shadcn`, from `bunx skills add shadcn/ui`) and
the shadcn MCP server (`.mcp.json`, from `shadcn mcp init --client claude`) are
installed for this project only. Claude Code picks them up when a session
starts in this folder.

## Deployment

`.github/workflows/pages.yml` builds a static export and deploys it to GitHub
Pages on every push to `master`. Enable it once under
**Settings, Pages, Build and deployment, Source: GitHub Actions**.

The app also deploys to Vercel as is, with no extra settings.
