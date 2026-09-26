import type { BarcodeFormat, BarcodeModel } from '../core/barcode.js'
import { parseColor, toCss } from '../core/color.js'
import { formatFieldValue, type FormatOptions } from './format.js'
import { decodeStrings, parseStrings } from './strings.js'
import { appleTokens } from './tokens.js'
import type {
  ApplePassSource,
  PKBarcodeFormat,
  PKTextAlignment,
  PassBarcode,
  PassField,
  PassFiles,
  PassImageName,
} from './types.js'

export type { BarcodeModel }

export type Align = 'left' | 'center' | 'right' | 'natural'

export interface FieldModel {
  key: string
  label: string
  value: string
  align: Align
}

export interface BackFieldModel {
  key: string
  label: string
  value: string
  /** Sanitised HTML from `attributedValue` (only `<a href>` survives), if present. */
  html?: string
}

export interface EventTicketModel {
  organizationName: string
  description: string
  logoText?: string
  colors: { background: string; foreground: string; label: string }
  images: Partial<Record<PassImageName, string>>
  header: FieldModel[]
  primary: FieldModel[]
  secondary: FieldModel[]
  auxiliary: FieldModel[]
  back: BackFieldModel[]
  barcode?: BarcodeModel
  voided: boolean
  expired: boolean
  /** Revokes object URLs created for images. */
  dispose(): void
}

export interface ModelOptions extends FormatOptions {
  /** Preferred pixel density for images (1, 2 or 3). Defaults to devicePixelRatio. */
  scale?: number
}

const barcodeFormats: Partial<Record<PKBarcodeFormat, BarcodeFormat>> = {
  PKBarcodeFormatQR: 'qr',
  PKBarcodeFormatPDF417: 'pdf417',
  PKBarcodeFormatAztec: 'aztec',
  PKBarcodeFormatCode128: 'code128',
}

/** Resolve a pass source into everything the renderer needs: localised, formatted, with image URLs. */
export function buildEventTicketModel(source: ApplePassSource, opts: ModelOptions = {}): EventTicketModel {
  const { pass } = source
  const files = source.files ?? {}
  const structure = pass.eventTicket
  if (!structure) throw new Error('Only event tickets are supported (pass.json has no "eventTicket" key)')

  const lproj = pickLocalization(files, opts.locale)
  const strings = lproj ? readStrings(files[`${lproj}/pass.strings`]) : {}
  const t = (s: string | undefined) => (s === undefined ? undefined : (strings[s] ?? s))

  const locale = opts.locale ?? (lproj ? lproj.replace(/\.lproj$/, '') : undefined)
  const fmtOpts: FormatOptions = { ...opts, locale }

  const field = (f: PassField): FieldModel => ({
    key: f.key,
    label: t(f.label) ?? '',
    value: formatFieldValue(f, typeof f.value === 'string' ? t(f.value)! : f.value, fmtOpts),
    align: alignment(f.textAlignment),
  })
  const fields = (list: PassField[] | undefined, max: number) => (list ?? []).slice(0, max).map(field)

  const background = parseColor(pass.backgroundColor)
  const foreground = parseColor(pass.foregroundColor)
  const label = parseColor(pass.labelColor)
  const fg = foreground ? toCss(foreground) : appleTokens.defaults.foreground

  const urls: string[] = []
  const images: EventTicketModel['images'] = {}
  const scale = opts.scale ?? (typeof devicePixelRatio === 'number' ? devicePixelRatio : 2)
  for (const name of ['logo', 'strip', 'background', 'thumbnail', 'icon', 'footer'] as const) {
    const file = pickImage(files, name, scale, lproj)
    if (file === undefined) continue
    const url = toUrl(file)
    if (url.startsWith('blob:')) urls.push(url)
    images[name] = url
  }

  const expiration = pass.expirationDate ? Date.parse(pass.expirationDate) : NaN
  const now = (opts.now ?? new Date()).getTime()

  return {
    organizationName: t(pass.organizationName) ?? '',
    description: t(pass.description) ?? '',
    logoText: t(pass.logoText),
    colors: {
      background: background ? toCss(background) : appleTokens.defaults.background,
      foreground: fg,
      label: label ? toCss(label) : fg,
    },
    images,
    header: fields(structure.headerFields, appleTokens.maxFields.header),
    primary: fields(structure.primaryFields, appleTokens.maxFields.primary),
    secondary: fields(structure.secondaryFields, appleTokens.maxFields.secondary),
    auxiliary: fields(structure.auxiliaryFields, appleTokens.maxFields.auxiliary),
    back: (structure.backFields ?? []).map(f => {
      const base = field(f)
      const attributed = f.attributedValue !== undefined ? t(String(f.attributedValue)) : undefined
      return { key: base.key, label: base.label, value: base.value, html: attributed && sanitizeLinks(attributed) }
    }),
    barcode: pickBarcode(pass.barcodes, pass.barcode, t),
    voided: pass.voided === true,
    expired: Number.isFinite(expiration) && expiration <= now,
    dispose: () => urls.forEach(u => URL.revokeObjectURL(u)),
  }
}

function alignment(a: PKTextAlignment | undefined): Align {
  switch (a) {
    case 'PKTextAlignmentLeft':
      return 'left'
    case 'PKTextAlignmentCenter':
      return 'center'
    case 'PKTextAlignmentRight':
      return 'right'
    default:
      return 'natural'
  }
}

function pickBarcode(
  barcodes: PassBarcode[] | undefined,
  legacy: PassBarcode | undefined,
  t: (s: string | undefined) => string | undefined,
): BarcodeModel | undefined {
  // Wallet uses the first entry of `barcodes` it supports, falling back to the legacy `barcode` key.
  const b = [...(barcodes ?? []), ...(legacy ? [legacy] : [])].find(b => barcodeFormats[b.format])
  if (!b) return undefined
  return {
    format: barcodeFormats[b.format]!,
    message: b.message,
    messageEncoding: b.messageEncoding ?? 'iso-8859-1',
    altText: t(b.altText),
  }
}

/** Choose the `.lproj` folder that best matches the requested locales. */
export function pickLocalization(files: PassFiles, locale?: string | string[]): string | undefined {
  const available = new Set<string>()
  for (const path of Object.keys(files)) {
    const m = /^([^/]+\.lproj)\//.exec(path)
    if (m) available.add(m[1]!)
  }
  if (available.size === 0) return undefined

  const wanted = locale
    ? Array.isArray(locale)
      ? locale
      : [locale]
    : typeof navigator !== 'undefined'
      ? [...(navigator.languages ?? [navigator.language])]
      : []
  const norm = (s: string) => s.toLowerCase().replace(/_/g, '-')
  const byNorm = new Map([...available].map(a => [norm(a.replace(/\.lproj$/, '')), a]))

  for (const w of wanted) {
    const exact = byNorm.get(norm(w))
    if (exact) return exact
    const lang = norm(w).split('-')[0]!
    for (const [key, dir] of byNorm) if (key === lang || key.startsWith(`${lang}-`)) return dir
  }
  return byNorm.get('en') ?? byNorm.get('base') ?? [...available][0]
}

function readStrings(file: PassFiles[string] | undefined): Record<string, string> {
  if (file === undefined) return {}
  if (typeof file === 'string') return parseStrings(file)
  if (file instanceof Uint8Array) return parseStrings(decodeStrings(file))
  return {} // Blob strings would need async reading; readPkpass always yields bytes.
}

/** Pick the image variant closest to the desired scale, preferring a localised copy. */
function pickImage(files: PassFiles, name: PassImageName, scale: number, lproj?: string) {
  const order = scale >= 2.5 ? [3, 2, 1] : scale >= 1.5 ? [2, 3, 1] : [1, 2, 3]
  const dirs = lproj ? [`${lproj}/`, ''] : ['']
  for (const dir of dirs) {
    for (const s of order) {
      const file = files[`${dir}${name}${s === 1 ? '' : `@${s}x`}.png`]
      if (file !== undefined) return file
    }
  }
  return undefined
}

function toUrl(file: Blob | Uint8Array | string): string {
  if (typeof file === 'string') return file
  const blob = file instanceof Uint8Array ? new Blob([file as Uint8Array<ArrayBuffer>], { type: 'image/png' }) : file
  return URL.createObjectURL(blob)
}

/** Keep text and `<a href>` with safe schemes; drop every other tag and attribute. */
export function sanitizeLinks(html: string): string {
  const escape = (s: string) => s.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  let out = ''
  let last = 0
  const re = /<a\s+[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/gi
  for (let m; (m = re.exec(html)); ) {
    out += escape(stripTags(html.slice(last, m.index)))
    const href = (m[1] ?? m[2] ?? m[3] ?? '').trim()
    const text = escape(stripTags(m[4] ?? ''))
    out += /^(https?:|mailto:|tel:)/i.test(href) ? `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${text}</a>` : text
    last = re.lastIndex
  }
  return out + escape(stripTags(html.slice(last)))
}

function stripTags(s: string): string {
  return s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
}
