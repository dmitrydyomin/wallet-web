import type { Size, TextBox } from '../core/dom.js'
import { allocateWidths, fitFontSize, type FontSpec, type TextMeasurer } from '../core/text.js'
import type { GoogleField, GooglePassModel } from './model.js'
import { googleTokens, type GoogleTokens, type GoogleVariant } from './tokens.js'

export type GoogleTextBox = TextBox & { rounded: boolean }

export interface GoogleFieldLayout {
  label: GoogleTextBox | null
  value: GoogleTextBox
  width: number
  align: 'left' | 'center' | 'right'
}

export interface GooglePassLayout {
  variant: GoogleVariant
  width: number
  /** Width of the card-title text box (classic: beside the logo). */
  titleWidth: number
  title: GoogleTextBox | null
  header: GoogleTextBox | null
  subheader: GoogleTextBox | null
  rows: GoogleFieldLayout[][]
  barcode: { kind: 'square' | 'linear'; width: number; height: number; pad: number; altText: GoogleTextBox | null } | null
  hero: Size | null
}

export interface GoogleLayoutInput {
  model: GooglePassModel
  variant: GoogleVariant
  measurer: TextMeasurer
  /** Natural size of the hero image, to keep its aspect ratio. */
  heroSize?: Size
  tokens?: GoogleTokens
  fontFamily?: string
}

type Style = { size: number; weight: number; lineHeight: number; letterSpacing?: number; rounded?: boolean }

export function layoutGooglePass(input: GoogleLayoutInput): GooglePassLayout {
  const tk = input.tokens ?? googleTokens
  const { model, measurer, variant } = input
  const family = input.fontFamily ?? tk.fontFamily
  const v = variant === 'classic' ? tk.classic : tk.fullscreen
  const inner = v.width - v.paddingX * 2

  const font = (s: Style, size = s.size): FontSpec => ({ family, size, weight: s.weight, letterSpacing: 'letterSpacing' in s ? s.letterSpacing : undefined })
  const box = (text: string, s: Style, size = s.size): GoogleTextBox => ({
    text,
    font: font(s, size),
    lineHeight: +((s.lineHeight * size) / s.size).toFixed(2),
    rounded: !!s.rounded,
  })

  const titleStyle = variant === 'classic' ? tk.classic.top.title : tk.fullscreen.title
  const titleWidth =
    variant === 'classic' ? v.width - tk.classic.top.logo.left - tk.classic.top.logo.size - tk.classic.top.titleGap - v.paddingX : inner

  // The event name shrinks to fit one line, then truncates.
  let header: GoogleTextBox | null = null
  if (model.header) {
    const fit = fitFontSize(measurer, model.header, font(v.header), inner, v.header.minSize)
    header = box(model.header, v.header, fit.size)
  }

  const rows = model.rows.map(row => layoutRow(row, inner, v.rows.gap, measurer, s => font(s), (t, s) => box(t, s), v))

  let barcode: GooglePassLayout['barcode'] = null
  if (model.barcode) {
    const square = model.barcode.format === 'qr' || model.barcode.format === 'aztec'
    const spec = square ? v.barcode.square : v.barcode.linear
    const width = Math.min(spec.width, inner - spec.pad * 2)
    let altText: GoogleTextBox | null = null
    if (model.barcode.altText) {
      const st = v.barcode.altText
      const fit = fitFontSize(measurer, model.barcode.altText, font(st), inner, st.size * 0.75)
      altText = box(model.barcode.altText, st, fit.size)
    }
    barcode = { kind: square ? 'square' : 'linear', width, height: spec.height, pad: spec.pad, altText }
  } else if (model.barcodeTextOnly) {
    barcode = { kind: 'linear', width: 0, height: 0, pad: 0, altText: box(model.barcodeTextOnly, v.barcode.altText) }
  }

  const aspect = input.heroSize ? input.heroSize.width / input.heroSize.height : v.hero.aspect
  return {
    variant,
    width: v.width,
    titleWidth,
    title: model.cardTitle ? box(model.cardTitle, titleStyle) : null,
    header,
    subheader: model.subheader ? box(model.subheader, v.subheader) : null,
    rows,
    barcode,
    hero: model.hero ? { width: v.width, height: +(v.width / aspect).toFixed(2) } : null,
  }
}

function layoutRow(
  row: GoogleField[],
  width: number,
  gap: number,
  measurer: TextMeasurer,
  font: (s: Style) => FontSpec,
  box: (text: string, s: Style) => GoogleTextBox,
  v: GoogleTokens['classic'] | GoogleTokens['fullscreen'],
): GoogleFieldLayout[] {
  const n = row.length
  const natural = row.map(f =>
    Math.ceil(Math.max(f.label ? measurer.width(f.label, font(v.label)) : 0, measurer.width(f.value, font(v.value)))),
  )
  const widths = allocateWidths(natural, width - gap * (n - 1))
  // Google aligns a row's items to the start, middle and end.
  const aligns: GoogleFieldLayout['align'][] = n === 1 ? ['left'] : n === 2 ? ['left', 'right'] : ['left', 'center', 'right']
  return row.map((f, i) => ({
    label: f.label ? box(f.label, v.label) : null,
    value: box(f.value, v.value),
    width: n === 1 ? width : widths[i]!,
    align: aligns[i] ?? 'left',
  }))
}
