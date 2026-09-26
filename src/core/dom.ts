import { fontShorthand, type FontSpec } from './text.js'

/** A run of text with its fitted font, as produced by the layout engines. */
export interface TextBox {
  text: string
  font: FontSpec
  lineHeight: number
}

export interface Size {
  width: number
  height: number
}

export function text(cls: string, box: TextBox, color?: string): HTMLElement {
  const el = h('span', { class: cls })
  el.textContent = box.text
  el.style.font = `${fontShorthand(box.font)}`
  el.style.lineHeight = px(box.lineHeight)
  if (box.font.letterSpacing) el.style.letterSpacing = px(box.font.letterSpacing)
  if (color) el.style.color = color
  if ('width' in box && typeof box.width === 'number') el.style.maxWidth = px(box.width)
  return el
}

export function img(src: string, cls: string, size: Size, alt = ''): HTMLImageElement {
  const el = h('img', { class: cls, src, alt, draggable: 'false' })
  el.style.width = px(size.width)
  el.style.height = px(size.height)
  return el
}

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  return el
}

export const px = (n: number) => `${n}px`

/** Make sure web fonts are loaded before measuring, or Pretext would measure a fallback font. */
export async function loadFonts(family: string, weights: number[]): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  await Promise.all(
    [...new Set(weights)].map(w => document.fonts.load(`${w} 16px ${family}`).catch(() => undefined)),
  )
}
