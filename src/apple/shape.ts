import type { AppleTokens } from './tokens.js'

/**
 * SVG path of the event ticket outline: a rectangle (optionally rounded) with
 * the notch arc cut out of the top edge. Used both as the card's mask and for
 * the border stroke, so the border follows the notch.
 */
export function eventTicketPath(tk: AppleTokens): string {
  const { width: w, height: h } = tk.card
  const r = Math.min(tk.card.radius, w / 2, h / 2)
  const { radius: nr, offset } = tk.notch
  const half = Math.sqrt(Math.max(0, nr * nr - offset * offset))
  const x1 = w / 2 - half
  const x2 = w / 2 + half
  const f = (n: number) => +n.toFixed(3)

  return [
    `M${f(r)} 0`,
    `H${f(x1)}`,
    // Minor arc dipping below the top edge, centre above it.
    `A${nr} ${nr} 0 0 0 ${f(x2)} 0`,
    `H${f(w - r)}`,
    r ? `A${r} ${r} 0 0 1 ${w} ${f(r)}` : '',
    `V${f(h - r)}`,
    r ? `A${r} ${r} 0 0 1 ${f(w - r)} ${h}` : '',
    `H${f(r)}`,
    r ? `A${r} ${r} 0 0 1 0 ${f(h - r)}` : '',
    `V${f(r)}`,
    r ? `A${r} ${r} 0 0 1 ${f(r)} 0` : '',
    'Z',
  ]
    .filter(Boolean)
    .join(' ')
}

/** CSS `mask` value that cuts the card to the ticket outline. */
export function eventTicketMask(tk: AppleTokens): string {
  const { width: w, height: h } = tk.card
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${eventTicketPath(tk)}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / 100% 100% no-repeat`
}

/** Inline SVG drawing the border inside the outline (a 2× stroke clipped to the shape, like Figma's inside stroke). */
export function eventTicketBorderSvg(tk: AppleTokens): string {
  const { width: w, height: h } = tk.card
  const d = eventTicketPath(tk)
  return `<svg class="border" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><defs><clipPath id="card-outline"><path d="${d}"/></clipPath></defs><path d="${d}" fill="none" stroke="${tk.card.border}" stroke-width="${tk.card.borderWidth * 2}" clip-path="url(#card-outline)"/></svg>`
}
