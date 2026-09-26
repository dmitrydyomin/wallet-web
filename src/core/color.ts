export interface RGB {
  r: number
  g: number
  b: number
}

/**
 * Parse a pass color. Apple specifies `rgb(r, g, b)`; hex and `rgba()` are
 * accepted too since hand-written passes use them and Wallet tolerates them.
 */
export function parseColor(input: string | undefined | null): RGB | null {
  if (!input) return null
  const s = input.trim().toLowerCase()

  const fn = /^rgba?\(\s*([\d.]+)\s*,?\s*([\d.]+)\s*,?\s*([\d.]+)\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/.exec(s)
  if (fn) return clamp({ r: +fn[1]!, g: +fn[2]!, b: +fn[3]! })

  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s)
  if (hex) {
    let h = hex[1]!
    if (h.length === 3) h = h.replace(/./g, c => c + c)
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
  }
  return null
}

function clamp({ r, g, b }: RGB): RGB {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return { r: c(r), g: c(g), b: c(b) }
}

export function toCss({ r, g, b }: RGB, alpha = 1): string {
  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** WCAG relative luminance, 0 (black) – 1 (white). */
export function luminance({ r, g, b }: RGB): number {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
