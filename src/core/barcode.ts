export type BarcodeFormat = 'qr' | 'pdf417' | 'aztec' | 'code128'

/** A barcode to draw, independent of wallet platform. */
export interface BarcodeModel {
  format: BarcodeFormat
  message: string
  /** Character encoding of `message`, e.g. `iso-8859-1` or `utf-8`. */
  messageEncoding: string
  altText?: string
}

/** Render a barcode to an SVG string. Pluggable so apps can swap in their own encoder. */
export type BarcodeRenderer = (barcode: BarcodeModel) => Promise<string>

/** Default renderer, built on bwip-js. Loaded lazily so it doesn't weigh on passes without barcodes. */
export const renderBarcodeSvg: BarcodeRenderer = async barcode => {
  const bwip = await import('bwip-js/generic')
  const text = encodeMessage(barcode.message, barcode.messageEncoding)
  const base = { text, scale: 1, paddingwidth: 0, paddingheight: 0, barcolor: '000000', backgroundcolor: 'ffffff' }
  const dwg = bwip.drawingSVG()

  let svg: string
  switch (barcode.format) {
    case 'qr':
      svg = bwip.qrcode({ ...base, bcid: 'qrcode', eclevel: 'M' } as never, dwg)
      break
    case 'aztec':
      svg = bwip.azteccode({ ...base, bcid: 'azteccode' }, dwg)
      break
    case 'pdf417':
      svg = bwip.pdf417({ ...base, bcid: 'pdf417', columns: 4 } as never, dwg)
      break
    case 'code128':
      svg = bwip.code128({ ...base, bcid: 'code128', height: 10 }, dwg)
      break
  }
  const square = barcode.format === 'qr' || barcode.format === 'aztec'
  // Make the SVG fill its box; square codes keep their aspect, linear/stacked codes stretch.
  return svg.replace(
    /<svg\b([^>]*)>/,
    (_m, attrs: string) =>
      `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} width="100%" height="100%" preserveAspectRatio="${square ? 'xMidYMid meet' : 'none'}" shape-rendering="crispEdges">`,
  )
}

/**
 * bwip-js treats each char code as one byte. For UTF-8 messages, hand it the
 * UTF-8 bytes; for ISO-8859-1 (the Wallet default) the string is already bytes.
 */
function encodeMessage(message: string, encoding: string): string {
  if (!/^utf-?8$/i.test(encoding) || !/[^\x00-\x7f]/.test(message)) return message
  return String.fromCharCode(...new TextEncoder().encode(message))
}
