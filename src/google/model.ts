import type { BarcodeFormat, BarcodeModel } from '../core/barcode.js'
import { luminance, parseColor, toCss } from '../core/color.js'
import { googleTokens } from './tokens.js'
import type {
  CardRowTemplateInfo,
  EventTicketClass,
  EventTicketObject,
  FieldReference,
  GoogleBarcodeType,
  GooglePassSource,
  LocalizedString,
  SaveToWalletClaims,
  TemplateItem,
  TextModuleData,
} from './types.js'

export interface GoogleField {
  label: string
  value: string
}

export interface GooglePassModel {
  cardTitle: string
  /** Big title: the event name. */
  header: string
  /** Small line next to the header: the venue name. */
  subheader: string
  logo?: string
  hero?: string
  colors: { background: string; text: string; secondaryText: string; separator: string; border: string; dark: boolean }
  /** Card rows, each with 1–3 fields. */
  rows: GoogleField[][]
  barcode?: BarcodeModel
  /** The barcode type can't be drawn; only its alternate text / value is shown. */
  barcodeTextOnly?: string
  inactive: boolean
}

export interface GoogleModelOptions {
  locale?: string | string[]
}

export type GooglePassInput = GooglePassSource | SaveToWalletClaims | string

/**
 * Accept `{ class, object }`, decoded "Save to Google Wallet" JWT claims, or the JWT
 * itself. The JWT signature is not verified: this is for display only.
 */
export function resolveGoogleSource(input: GooglePassInput): GooglePassSource {
  if (typeof input === 'string') return resolveGoogleSource(decodeJwt(input))
  if ('payload' in input) {
    const object = input.payload.eventTicketObjects?.[0]
    if (!object) throw new Error('Only event tickets are supported (JWT payload has no eventTicketObjects)')
    const cls = input.payload.eventTicketClasses?.find(c => c.id === object.classId) ?? input.payload.eventTicketClasses?.[0]
    if (!cls) throw new Error(`JWT payload does not include the ticket class ${object.classId}`)
    return { class: cls, object }
  }
  return input
}

function decodeJwt(jwt: string): SaveToWalletClaims {
  const token = jwt.includes('/save/') ? jwt.slice(jwt.lastIndexOf('/') + 1) : jwt
  const part = token.split('.')[1]
  if (!part) throw new Error('Invalid JWT')
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as SaveToWalletClaims
}

const barcodeFormats: Partial<Record<GoogleBarcodeType, BarcodeFormat>> = {
  QR_CODE: 'qr',
  PDF_417: 'pdf417',
  AZTEC: 'aztec',
  CODE_128: 'code128',
}

export function buildGooglePassModel(source: GooglePassSource, opts: GoogleModelOptions = {}): GooglePassModel {
  const { class: cls, object: obj } = source
  const wanted = opts.locale
    ? Array.isArray(opts.locale)
      ? opts.locale
      : [opts.locale]
    : typeof navigator !== 'undefined'
      ? [...(navigator.languages ?? [navigator.language])]
      : []
  const t = (s: LocalizedString | undefined) => localize(s, wanted)
  const locale = wanted[0]

  const bgRgb = parseColor(obj.hexBackgroundColor) ?? parseColor(cls.hexBackgroundColor) ?? parseColor(googleTokens.defaults.background)!
  // Google picks dark or light text from the background.
  const dark = luminance(bgRgb) < 0.4
  const palette = dark ? googleTokens.darkText : googleTokens.lightText

  const ctx: ResolveContext = { cls, obj, t, locale }
  const override = cls.classTemplateInfo?.cardTemplateOverride?.cardRowTemplateInfos
  const rows = (override ? override.map(r => templateRow(r, ctx)) : defaultRows(ctx))
    .map(row => row.filter(f => f.value !== ''))
    .filter(row => row.length > 0)

  const format = obj.barcode?.type ? barcodeFormats[obj.barcode.type] : undefined
  const barcode =
    format && obj.barcode?.value
      ? { format, message: obj.barcode.value, messageEncoding: 'utf-8', altText: obj.barcode.alternateText }
      : undefined

  return {
    cardTitle: t(cls.localizedIssuerName) || cls.issuerName || '',
    header: t(cls.eventName),
    subheader: t(cls.venue?.name),
    logo: (obj.logo ?? cls.logo)?.sourceUri.uri,
    hero: (obj.heroImage ?? cls.heroImage)?.sourceUri.uri,
    colors: { background: toCss(bgRgb), text: palette.text, secondaryText: palette.secondary, separator: palette.separator, border: palette.border, dark },
    rows,
    barcode,
    barcodeTextOnly: !barcode && obj.barcode ? obj.barcode.alternateText || obj.barcode.value : undefined,
    inactive: obj.state === 'EXPIRED' || obj.state === 'INACTIVE' || obj.state === 'COMPLETED',
  }
}

function localize(s: LocalizedString | undefined, wanted: string[]): string {
  if (!s) return ''
  const all = [...(s.translatedValues ?? []), ...(s.defaultValue ? [s.defaultValue] : [])]
  const norm = (x: string) => x.toLowerCase().replace(/_/g, '-')
  for (const w of wanted) {
    const hit = all.find(v => norm(v.language) === norm(w)) ?? all.find(v => norm(v.language).split('-')[0] === norm(w).split('-')[0])
    if (hit) return hit.value
  }
  return s.defaultValue?.value ?? all[0]?.value ?? ''
}

interface ResolveContext {
  cls: EventTicketClass
  obj: EventTicketObject
  t: (s: LocalizedString | undefined) => string
  locale?: string
}

/** Google's default event ticket rows: date & time, then seat information. */
function defaultRows(ctx: ResolveContext): GoogleField[][] {
  const start = ctx.cls.dateTime?.start
  const seat = ctx.obj.seatInfo
  const label = (custom: LocalizedString | undefined, fallback: string) => ctx.t(custom) || fallback
  return [
    [
      { label: 'DATE', value: start ? formatDate(start, 'DATE_ONLY', ctx.locale) : '' },
      { label: 'TIME', value: start ? formatDate(start, 'TIME_ONLY', ctx.locale) : '' },
    ],
    [
      { label: label(ctx.cls.customSectionLabel, 'SECTION'), value: ctx.t(seat?.section) },
      { label: label(ctx.cls.customRowLabel, 'ROW'), value: ctx.t(seat?.row) },
      { label: label(ctx.cls.customSeatLabel, 'SEAT'), value: ctx.t(seat?.seat) },
    ],
    [{ label: label(ctx.cls.customGateLabel, 'GATE'), value: ctx.t(seat?.gate) }],
  ]
}

function templateRow(row: CardRowTemplateInfo, ctx: ResolveContext): GoogleField[] {
  return rowItems(row).map(item => templateItem(item, ctx))
}

function rowItems(row: CardRowTemplateInfo): TemplateItem[] {
  if (row.threeItems) return [row.threeItems.startItem, row.threeItems.middleItem, row.threeItems.endItem]
  if (row.twoItems) return [row.twoItems.startItem, row.twoItems.endItem]
  if (row.oneItem) return [row.oneItem.item]
  return []
}

function templateItem(item: TemplateItem, ctx: ResolveContext): GoogleField {
  const first = item.firstValue?.fields.map(f => resolveField(f, ctx)).find(f => f.value !== '')
  const second = item.secondValue?.fields.map(f => resolveField(f, ctx)).find(f => f.value !== '')
  if (!first) return { label: '', value: '' }
  return second ? { label: first.label, value: `${first.value} · ${second.value}` } : first
}

const defaultLabels: Record<string, string> = {
  'object.seatInfo.seat': 'SEAT',
  'object.seatInfo.row': 'ROW',
  'object.seatInfo.section': 'SECTION',
  'object.seatInfo.gate': 'GATE',
  'object.ticketHolderName': 'TICKET HOLDER',
  'object.ticketNumber': 'TICKET NUMBER',
  'object.ticketType': 'TICKET TYPE',
  'class.dateTime.start': 'START',
  'class.dateTime.end': 'END',
  'class.dateTime.doorsOpen': 'DOORS OPEN',
  'class.venue.name': 'VENUE',
  'class.venue.address': 'ADDRESS',
}

/** Resolve a template `fieldPath` like `object.textModulesData['member_id']` or `class.dateTime.start`. */
export function resolveField(ref: FieldReference, ctx: ResolveContext): GoogleField {
  const segments: string[] = []
  for (const m of ref.fieldPath.matchAll(/([A-Za-z_$][\w$]*)|\[\s*['"]([^'"]*)['"]\s*\]|\[(\d+)\]/g)) {
    segments.push(m[1] ?? m[2] ?? m[3]!)
  }
  const [root, ...rest] = segments
  let node: unknown = root === 'class' ? ctx.cls : root === 'object' ? ctx.obj : undefined
  for (const seg of rest) {
    if (node === undefined || node === null) break
    // `textModulesData['id']` addresses a list item by its id.
    node = Array.isArray(node) && !/^\d+$/.test(seg) ? node.find((x: { id?: string }) => x?.id === seg) : (node as Record<string, unknown>)[seg]
  }

  if (node && typeof node === 'object' && ('header' in node || 'body' in node || 'localizedBody' in node)) {
    const m = node as TextModuleData
    return { label: ctx.t(m.localizedHeader) || m.header || '', value: ctx.t(m.localizedBody) || m.body || '' }
  }

  const path = segments.join('.')
  const label = defaultLabels[path] ?? (segments.at(-1) ?? '').replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase()
  let value = ''
  if (typeof node === 'string' || typeof node === 'number') value = String(node)
  else if (node && typeof node === 'object') value = ctx.t(node as LocalizedString)
  if (value && /dateTime\./.test(path)) value = formatDate(value, ref.dateFormat ?? 'DATE_TIME', ctx.locale)
  return { label, value }
}

/** Format an event time as the wall-clock time at the venue (the offset written in the string). */
function formatDate(value: string, format: NonNullable<FieldReference['dateFormat']>, locale?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value)
  if (!m) return value
  const wall = new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +(m[4] ?? 0), +(m[5] ?? 0)))
  const opts: Record<typeof format, Intl.DateTimeFormatOptions> = {
    DATE_TIME: { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
    DATE_ONLY: { weekday: 'short', month: 'short', day: 'numeric' },
    TIME_ONLY: { hour: 'numeric', minute: '2-digit' },
    DATE_TIME_YEAR: { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
    DATE_YEAR: { year: 'numeric', month: 'short', day: 'numeric' },
    YEAR_MONTH: { year: 'numeric', month: 'short' },
    YEAR_MONTH_DAY: { year: 'numeric', month: '2-digit', day: '2-digit' },
  }
  return new Intl.DateTimeFormat(locale, { ...opts[format], timeZone: 'UTC' }).format(wall)
}
