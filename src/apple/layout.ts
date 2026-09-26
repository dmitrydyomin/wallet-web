import { allocateWidths, fitFontSize, type FontSpec, type TextMeasurer } from '../core/text.js'
import type { BarcodeModel, EventTicketModel, FieldModel } from './model.js'
import { appleTokens, type AppleTokens } from './tokens.js'
import type { Size, TextBox } from '../core/dom.js'

export type { Size, TextBox }

export type TextAlign = 'left' | 'center' | 'right'


export interface FieldLayout {
  key: string
  label: TextBox | null
  value: TextBox
  /** Box width in design px. Text past it is ellipsised by CSS. */
  width: number
  align: TextAlign
}

export interface RowLayout {
  fields: FieldLayout[]
  width: number
}


export interface BarcodeLayout {
  kind: 'square' | 'pdf417' | 'code128'
  /** Size of the code itself, inside the white box. */
  width: number
  height: number
  padX: number
  padY: number
  altText: TextBox | null
}

export interface EventTicketLayout {
  width: number
  height: number
  paddingX: number
  header: { logo: Size | null; logoText: (TextBox & { width: number }) | null; fields: RowLayout }
  strip: Size | null
  primary: (FieldLayout & { overStrip: boolean }) | null
  thumbnail: Size | null
  secondary: RowLayout | null
  auxiliary: RowLayout | null
  barcode: BarcodeLayout | null
}

export interface LayoutInput {
  model: EventTicketModel
  measurer: TextMeasurer
  /** Natural pixel sizes of the loaded images (at their @Nx scale). */
  imageSizes: Partial<Record<'logo' | 'thumbnail', Size>>
  /** Pixel density of the images, to convert natural size to points. */
  imageScale?: number
  tokens?: AppleTokens
  fontFamily?: string
  displayFontFamily?: string
  uppercaseLabels?: boolean
}

/** Compute sizes and fitted font sizes for every element of an event ticket's front. */
export function layoutEventTicket(input: LayoutInput): EventTicketLayout {
  const tk = input.tokens ?? appleTokens
  const { model, measurer } = input
  const textFamily = input.fontFamily ?? tk.fontFamily
  const displayFamily = input.displayFontFamily ?? input.fontFamily ?? tk.displayFontFamily
  // Pick the cut from the style's nominal size and keep it when shrinking, so measurement stays consistent.
  const family = (size: number) => (size >= tk.displayMinSize ? displayFamily : textFamily)
  const uppercase = input.uppercaseLabels ?? tk.label.uppercase
  const imgScale = input.imageScale ?? 2

  const W = tk.card.width
  const inner = W - tk.card.paddingX * 2

  const labelFont: FontSpec = { family: family(tk.label.size), size: tk.label.size, weight: tk.label.weight, letterSpacing: tk.label.letterSpacing }
  const labelBox = (text: string): TextBox | null =>
    text ? { text: uppercase ? text.toLocaleUpperCase() : text, font: labelFont, lineHeight: tk.label.lineHeight } : null

  type ValueStyle = { size: number; weight: number; lineHeight: number; minSize: number }

  const fitRow = (
    fields: FieldModel[],
    width: number,
    style: ValueStyle,
    gap: number,
    naturalAlign: (i: number, n: number) => TextAlign,
    allowSpan = true,
  ): RowLayout => {
    const n = fields.length
    const labels = fields.map(f => labelBox(f.label))
    const labelWidths = labels.map(l => (l ? measurer.width(l.text, l.font) : 0))
    const available = width - gap * Math.max(0, n - 1)
    const fam = family(style.size)

    const naturalAt = (size: number) =>
      fields.map((f, i) => Math.max(labelWidths[i]!, measurer.width(f.value, { family: fam, size, weight: style.weight })))

    // Shrink the whole row uniformly until it fits, then fall back to splitting the width.
    let size: number = style.size
    let natural = naturalAt(size)
    while (sum(natural) > available && size > style.minSize) {
      size = Math.max(style.minSize, size - 0.5)
      natural = naturalAt(size)
    }
    const widths = allocateWidths(natural.map(Math.ceil), available)

    return {
      width,
      fields: fields.map((f, i) => {
        const align = f.align === 'natural' ? naturalAlign(i, n) : f.align
        // A lone field with explicit centre/right alignment spans the row so the alignment is visible.
        const spans = allowSpan && n === 1 && align !== 'left'
        return {
          key: f.key,
          label: labels[i]!,
          value: { text: f.value, font: { family: fam, size, weight: style.weight }, lineHeight: scaleLineHeight(style, size) },
          width: spans ? available : widths[i]!,
          align,
        }
      }),
    }
  }

  // Header: logo on the left, header fields pinned right, logo text takes whatever is left.
  const logo = input.imageSizes.logo ? fitBox(input.imageSizes.logo, imgScale, tk.header.logoMaxWidth, tk.header.logoMaxHeight) : null
  const logoSpace = logo ? logo.width + tk.header.logoTextGap : 0
  const headerFields = fitRow(model.header, inner - logoSpace, tk.headerValue, tk.header.gap, () => 'right', false)
  const headerFieldsWidth = sum(headerFields.fields.map(f => f.width)) + tk.header.gap * Math.max(0, headerFields.fields.length - 1)
  let logoText: EventTicketLayout['header']['logoText'] = null
  if (model.logoText) {
    const room = Math.max(0, inner - logoSpace - headerFieldsWidth - (headerFields.fields.length ? tk.header.gap : 0))
    const font = { family: family(tk.logoText.size), size: tk.logoText.size, weight: tk.logoText.weight }
    const fit = fitFontSize(measurer, model.logoText, font, room, tk.logoText.minSize)
    logoText = { text: model.logoText, font: { ...font, size: fit.size }, lineHeight: scaleLineHeight(tk.logoText, fit.size), width: room }
  }

  const strip = model.images.strip ? { width: W, height: tk.strip.height } : null
  const thumbnail = !strip && input.imageSizes.thumbnail
    ? fitBox(input.imageSizes.thumbnail, imgScale, tk.thumbnail.maxWidth, tk.thumbnail.maxHeight)
    : null
  const thumbSpace = thumbnail ? thumbnail.width + tk.thumbnail.gap : 0

  let primary: EventTicketLayout['primary'] = null
  const p = model.primary[0]
  if (p) {
    const style = strip ? tk.primary.strip : tk.primary.plain
    const width = inner - thumbSpace
    const font = { family: family(style.size), size: style.size, weight: style.weight }
    const fit = fitFontSize(measurer, p.value, font, width, style.minSize)
    primary = {
      key: p.key,
      label: labelBox(p.label),
      value: { text: p.value, font: { ...font, size: fit.size }, lineHeight: scaleLineHeight(style, fit.size) },
      width,
      align: p.align === 'natural' ? 'left' : p.align,
      overStrip: !!strip,
    }
  }

  // Wallet's natural alignment in a row: first field hugs the left edge, last hugs the right.
  const rowAlign = (i: number, n: number): TextAlign => (n > 1 && i === n - 1 ? 'right' : 'left')
  const secondary = model.secondary.length ? fitRow(model.secondary, inner - thumbSpace, tk.secondary, tk.rows.gap, rowAlign) : null
  const auxiliary = model.auxiliary.length ? fitRow(model.auxiliary, inner, tk.auxiliary, tk.rows.gap, rowAlign) : null

  return {
    width: W,
    height: tk.card.height,
    paddingX: tk.card.paddingX,
    header: { logo, logoText, fields: headerFields },
    strip,
    primary,
    thumbnail,
    secondary,
    auxiliary,
    barcode: model.barcode ? layoutBarcode(model.barcode, inner, measurer, family(tk.barcode.altText.size), tk) : null,
  }
}

function layoutBarcode(barcode: BarcodeModel, inner: number, measurer: TextMeasurer, family: string, tk: AppleTokens): BarcodeLayout {
  const kind: BarcodeLayout['kind'] = barcode.format === 'qr' || barcode.format === 'aztec' ? 'square' : barcode.format
  const spec = tk.barcode[kind]
  const width = Math.min(spec.width, inner - spec.padX * 2)

  let altText: TextBox | null = null
  if (barcode.altText) {
    const st = tk.barcode.altText
    const font = { family, size: st.size, weight: st.weight }
    const fit = fitFontSize(measurer, barcode.altText, font, width, st.minSize)
    altText = { text: barcode.altText, font: { ...font, size: fit.size }, lineHeight: st.lineHeight }
  }
  return { kind, width, height: spec.height, padX: spec.padX, padY: spec.padY, altText }
}

/** Scale an image (natural px at `scale`) into a max box in points, preserving aspect ratio. */
function fitBox(natural: Size, scale: number, maxW: number, maxH: number): Size {
  const w = natural.width / scale
  const h = natural.height / scale
  const k = Math.min(1, maxW / w, maxH / h)
  return { width: Math.round(w * k), height: Math.round(h * k) }
}

function scaleLineHeight(style: { size: number; lineHeight: number }, size: number): number {
  return Math.ceil((style.lineHeight * size) / style.size)
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
