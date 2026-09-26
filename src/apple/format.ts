import type { PKDateStyle, PassField } from './types.js'

export interface FormatOptions {
  locale?: string | string[]
  /** Time zone used for dates unless the field sets `ignoresTimeZone`. Defaults to the viewer's. */
  timeZone?: string
  /** Reference time for `isRelative` fields. */
  now?: Date
}

const dateStyles: Record<PKDateStyle, Intl.DateTimeFormatOptions['dateStyle'] | undefined> = {
  PKDateStyleNone: undefined,
  PKDateStyleShort: 'short',
  PKDateStyleMedium: 'medium',
  PKDateStyleLong: 'long',
  PKDateStyleFull: 'full',
}

/** Turn a field value into display text the way Wallet does (dates, numbers, currency). */
export function formatFieldValue(field: PassField, value: string | number, opts: FormatOptions = {}): string {
  if (field.dateStyle || field.timeStyle || field.isRelative) {
    const formatted = typeof value === 'string' ? formatDate(value, field, opts) : null
    if (formatted !== null) return formatted
  }

  if (field.currencyCode || field.numberStyle) {
    const num = typeof value === 'number' ? value : Number(value)
    if (Number.isFinite(num) && value !== '') return formatNumber(num, field, opts.locale)
  }

  return String(value)
}

function formatNumber(num: number, field: PassField, locale?: string | string[]): string {
  if (field.currencyCode) {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: field.currencyCode }).format(num)
  }
  switch (field.numberStyle) {
    case 'PKNumberStylePercent':
      return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(num)
    case 'PKNumberStyleScientific':
      return new Intl.NumberFormat(locale, { notation: 'scientific' }).format(num)
    // Intl has no spell-out; fall back to decimal rather than inventing words.
    default:
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }).format(num)
  }
}

const isoRe = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i

function formatDate(value: string, field: PassField, opts: FormatOptions): string | null {
  const m = isoRe.exec(value.trim())
  if (!m) return null
  const [, y, mo, d, h = '0', mi = '0', s = '0', tz] = m
  const wall = Date.UTC(+y!, +mo! - 1, +d!, +h, +mi, +s)
  const offsetMin = tz ? parseOffset(tz) : 0
  const instant = new Date(wall - offsetMin * 60_000)

  if (field.isRelative) return formatRelative(instant, opts)

  const dateStyle = dateStyles[field.dateStyle ?? 'PKDateStyleNone']
  const timeStyle = dateStyles[field.timeStyle ?? 'PKDateStyleNone']
  if (!dateStyle && !timeStyle) return value

  // ignoresTimeZone: show the wall-clock time written in the pass, wherever the viewer is.
  const fmt = new Intl.DateTimeFormat(opts.locale, {
    dateStyle,
    timeStyle: timeStyle === 'full' || timeStyle === 'long' ? (field.ignoresTimeZone ? 'medium' : timeStyle) : timeStyle,
    timeZone: field.ignoresTimeZone ? 'UTC' : opts.timeZone,
  })
  return fmt.format(field.ignoresTimeZone ? new Date(wall) : instant)
}

function parseOffset(tz: string): number {
  if (tz.toUpperCase() === 'Z') return 0
  const sign = tz[0] === '-' ? -1 : 1
  const digits = tz.slice(1).replace(':', '')
  return sign * (+digits.slice(0, 2) * 60 + +digits.slice(2, 4))
}

function formatRelative(date: Date, opts: FormatOptions): string {
  const now = opts.now ?? new Date()
  const diffSec = (date.getTime() - now.getTime()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ]
  const rtf = new Intl.RelativeTimeFormat(opts.locale, { numeric: 'auto' })
  for (const [unit, secs] of units) {
    if (Math.abs(diffSec) >= secs || unit === 'second') return rtf.format(Math.round(diffSec / secs), unit)
  }
  return rtf.format(0, 'second')
}
