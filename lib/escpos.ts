/**
 * Minimal ESC/POS encoder: prints a canvas as a 1-bit raster image.
 * Bengali has no printer font, so the whole memo is sent as a picture.
 */

const ESC = 0x1b
const GS = 0x1d

/** Rows per GS v 0 block: small blocks keep cheap printers' buffers happy. */
const BAND_ROWS = 96

export function canvasToEscPos(canvas: HTMLCanvasElement, feedLines = 4) {
  const { width, height } = canvas
  const bytesPerRow = Math.ceil(width / 8)
  const pixels = canvas.getContext("2d")!.getImageData(0, 0, width, height).data

  const chunks: Uint8Array[] = [new Uint8Array([ESC, 0x40])] // initialize

  for (let top = 0; top < height; top += BAND_ROWS) {
    const rows = Math.min(BAND_ROWS, height - top)
    const block = new Uint8Array(8 + bytesPerRow * rows)
    block.set([
      GS,
      0x76,
      0x30,
      0x00,
      bytesPerRow & 0xff,
      (bytesPerRow >> 8) & 0xff,
      rows & 0xff,
      (rows >> 8) & 0xff,
    ])
    for (let r = 0; r < rows; r++) {
      for (let x = 0; x < width; x++) {
        const i = ((top + r) * width + x) * 4
        // Luminance threshold, a little generous so thin strokes stay dark.
        const lum =
          pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114
        if (pixels[i + 3] > 0 && lum < 170) {
          block[8 + r * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7)
        }
      }
    }
    chunks.push(block)
  }

  chunks.push(new Uint8Array([ESC, 0x64, feedLines])) // feed paper out

  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}
