import { measureNaturalWidth, prepareWithSegments } from '@chenglou/pretext'

export interface FontSpec {
  family: string
  size: number
  weight?: number
  letterSpacing?: number
}

/** Canvas/CSS `font` shorthand for a spec. */
export function fontShorthand(font: FontSpec): string {
  return `${font.weight ?? 400} ${font.size}px ${font.family}`
}

/**
 * Measures the single-line width of text. Layout code depends on this
 * interface rather than on Pretext directly so it can run in tests without a
 * canvas.
 */
export interface TextMeasurer {
  width(text: string, font: FontSpec): number
}

/** Pretext-backed measurer with a cache, since layout re-measures the same strings at several sizes. */
export function createPretextMeasurer(): TextMeasurer {
  const cache = new Map<string, number>()
  return {
    width(text, font) {
      if (!text) return 0
      const key = `${fontShorthand(font)}|${font.letterSpacing ?? 0}|${text}`
      let w = cache.get(key)
      if (w === undefined) {
        const prepared = prepareWithSegments(text, fontShorthand(font), { letterSpacing: font.letterSpacing })
        w = measureNaturalWidth(prepared)
        cache.set(key, w)
      }
      return w
    },
  }
}

/** Largest font size in [min, max] (stepping by `step`) at which text fits in `maxWidth` on one line. */
export function fitFontSize(
  measurer: TextMeasurer,
  text: string,
  font: FontSpec,
  maxWidth: number,
  min: number,
  step = 0.5,
): { size: number; width: number; fits: boolean } {
  let size = font.size
  let width = measurer.width(text, font)
  if (width <= maxWidth) return { size, width, fits: true }

  // Text width scales ~linearly with size, so jump close to the answer first, then step down.
  size = Math.max(min, Math.floor(((font.size * maxWidth) / width) / step) * step)
  width = measurer.width(text, { ...font, size })
  while (width > maxWidth && size > min) {
    size = Math.max(min, size - step)
    width = measurer.width(text, { ...font, size })
  }
  // The linear estimate can undershoot; climb back up while it still fits.
  while (size + step <= font.size) {
    const w = measurer.width(text, { ...font, size: size + step })
    if (w > maxWidth) break
    size += step
    width = w
  }
  return { size, width, fits: width <= maxWidth }
}

/**
 * Split `available` width among items with natural widths. Items narrower than
 * an equal share keep their natural width; the rest split what is left
 * (water-filling), so one long value can't starve its neighbours.
 */
export function allocateWidths(natural: number[], available: number): number[] {
  const result = natural.slice()
  const total = natural.reduce((a, b) => a + b, 0)
  if (total <= available) return result

  let remaining = available
  let open = natural.map((_, i) => i)
  for (;;) {
    const share = remaining / open.length
    const small = open.filter(i => natural[i]! <= share)
    if (small.length === 0) {
      for (const i of open) result[i] = share
      return result
    }
    for (const i of small) remaining -= natural[i]!
    open = open.filter(i => natural[i]! > share)
    if (open.length === 0) return result
  }
}
