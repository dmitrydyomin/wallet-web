import { h, img, loadFonts, px, text } from '../core/dom.js'
import { createPretextMeasurer, type TextMeasurer } from '../core/text.js'
import { renderBarcodeSvg, type BarcodeRenderer } from '../core/barcode.js'
import {
  layoutEventTicket,
  type EventTicketLayout,
  type FieldLayout,
  type RowLayout,
  type Size,
  type TextBox,
} from './layout.js'
import { buildEventTicketModel, type EventTicketModel, type ModelOptions } from './model.js'
import { fetchPkpass, readPkpass } from './pkpass.js'
import { eventTicketBorderSvg } from './shape.js'
import { eventTicketCss } from './styles.js'
import { appleTokens, type AppleTokens } from './tokens.js'
import type { ApplePassSource } from './types.js'

export type ApplePassInput = ApplePassSource | Blob | ArrayBuffer | Uint8Array | string

export interface RenderOptions extends ModelOptions {
  /** Uniform scale of the card; 1 renders at design size (tokens.card.width px wide). */
  zoom?: number
  /** Font for text below `tokens.displayMinSize`; also used for larger text unless `displayFontFamily` is set. */
  fontFamily?: string
  displayFontFamily?: string
  /** Wallet shows field labels in uppercase. */
  uppercaseLabels?: boolean
  /** Start on the back of the pass. */
  side?: 'front' | 'back'
  /**
   * Show an ⓘ button that flips to the back fields. Off by default: iOS puts pass
   * details in a menu outside the card, so apps usually wire `flip()` to their own UI.
   */
  infoButton?: boolean
  tokens?: AppleTokens
  measurer?: TextMeasurer
  barcodeRenderer?: BarcodeRenderer
}

export interface RenderedPass {
  /** Host element; its shadow root holds the pass. */
  element: HTMLElement
  model: EventTicketModel
  layout: EventTicketLayout
  flip(side?: 'front' | 'back'): void
  destroy(): void
}

/** Load a pass from any supported input: a source object, `.pkpass` bytes/Blob, or a `.pkpass` URL. */
export async function loadApplePass(input: ApplePassInput): Promise<ApplePassSource> {
  if (typeof input === 'string') return fetchPkpass(input)
  if (input instanceof Blob || input instanceof ArrayBuffer || input instanceof Uint8Array) return readPkpass(input)
  return input
}

/**
 * Render an Apple Wallet event ticket. Resolves once fonts are loaded and text is fitted;
 * the barcode fills in asynchronously.
 */
export async function renderApplePass(input: ApplePassInput, options: RenderOptions = {}): Promise<RenderedPass> {
  const tk = options.tokens ?? appleTokens
  const family = options.fontFamily ?? tk.fontFamily
  const displayFamily = options.displayFontFamily ?? options.fontFamily ?? tk.displayFontFamily
  const source = await loadApplePass(input)
  const imageScale = options.scale ?? (typeof devicePixelRatio === 'number' ? Math.min(3, Math.max(1, Math.round(devicePixelRatio))) : 2)
  const model = buildEventTicketModel(source, { ...options, scale: imageScale })

  const [imageSizes] = await Promise.all([
    loadImageSizes(model),
    loadFonts(family, [tk.label.weight, tk.auxiliary.weight, tk.barcode.altText.weight]),
    loadFonts(displayFamily, [tk.headerValue.weight, tk.secondary.weight, tk.logoText.weight]),
  ])

  const layout = layoutEventTicket({
    model,
    measurer: options.measurer ?? createPretextMeasurer(),
    imageSizes,
    imageScale,
    tokens: tk,
    fontFamily: family,
    displayFontFamily: displayFamily,
    uppercaseLabels: options.uppercaseLabels,
  })

  const element = document.createElement('div')
  element.className = 'wallet-pass'
  const root = element.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = eventTicketCss(tk)
  root.append(style)

  const pass = h('div', { class: 'pass', part: 'pass' })
  pass.style.setProperty('--wp-font', family)
  pass.style.setProperty('--wp-bg', model.colors.background)
  pass.style.setProperty('--wp-fg', model.colors.foreground)
  pass.style.setProperty('--wp-label', model.colors.label)
  if (options.zoom && options.zoom !== 1) pass.style.zoom = String(options.zoom)

  const flipper = h('div', { class: 'flipper' })
  const infoButton = options.infoButton === true && model.back.length > 0
  const flip = (side?: 'front' | 'back') => {
    const toBack = side ? side === 'back' : !flipper.classList.contains('is-flipped')
    flipper.classList.toggle('is-flipped', toBack)
    front.inert = toBack
    back.inert = !toBack
  }

  const front = renderFront(model, layout, tk, infoButton ? () => flip('back') : null)
  const back = renderBack(model, () => flip('front'))
  flipper.append(front, back)
  pass.append(h('div', { class: 'glow' }), flipper)
  root.append(pass)
  flip(options.side === 'back' && model.back.length ? 'back' : 'front')

  const barcodeSlot = front.querySelector<HTMLElement>('.barcode-svg')
  if (barcodeSlot && model.barcode) {
    const renderer = options.barcodeRenderer ?? renderBarcodeSvg
    renderer(model.barcode)
      .then(svg => (barcodeSlot.innerHTML = svg))
      .catch(err => {
        console.warn('[wallet-web] barcode rendering failed', err)
        barcodeSlot.textContent = model.barcode?.message ?? ''
      })
  }

  return {
    element,
    model,
    layout,
    flip,
    destroy() {
      element.remove()
      model.dispose()
    },
  }
}

function renderFront(model: EventTicketModel, layout: EventTicketLayout, tk: AppleTokens, onInfo: (() => void) | null): HTMLElement {
  const front = h('section', { class: 'face front', part: 'front', 'aria-label': model.description || model.organizationName })
  if (model.voided || model.expired) front.classList.add('is-invalid')

  if (model.images.background) {
    const bg = h('div', { class: 'bg-image' })
    bg.style.backgroundImage = `url("${model.images.background}")`
    front.append(bg)
  }

  const content = h('div', { class: 'content' })
  front.append(content)

  // Header
  const header = h('header', { class: 'header' })
  const { logo, logoText, fields } = layout.header
  if (logo && model.images.logo) header.append(img(model.images.logo, 'logo', logo, model.organizationName))
  if (logoText) header.append(text('logo-text', logoText, model.colors.foreground))
  if (fields.fields.length) {
    const hf = h('div', { class: 'header-fields' })
    hf.append(...fields.fields.map(renderField))
    header.append(hf)
  }
  content.append(header)

  // Strip with primary field overlaid, or primary (and secondary row) beside the thumbnail.
  let secondaryInTop = false
  if (layout.strip && model.images.strip) {
    const strip = h('div', { class: 'strip' })
    strip.style.height = px(layout.strip.height)
    strip.append(img(model.images.strip, '', layout.strip))
    if (layout.primary) strip.append(renderPrimary(layout.primary, true))
    content.append(strip)
  } else if (layout.primary || layout.thumbnail) {
    const top = h('div', { class: 'top' })
    const main = h('div', { class: 'top-main' })
    if (layout.primary) main.append(renderPrimary(layout.primary, false))
    if (layout.secondary && layout.thumbnail) {
      main.append(renderRows([layout.secondary]))
      secondaryInTop = true
    }
    top.append(main)
    if (layout.thumbnail && model.images.thumbnail) top.append(img(model.images.thumbnail, 'thumbnail', layout.thumbnail))
    content.append(top)
  }

  const rows = [secondaryInTop ? null : layout.secondary, layout.auxiliary].filter(r => r !== null)
  if (rows.length) {
    const el = renderRows(rows)
    if (secondaryInTop) el.classList.add('continued')
    content.append(el)
  }

  if (layout.barcode) {
    const area = h('div', { class: 'barcode-area' })
    const box = h('div', { class: 'barcode-box' })
    box.style.padding = `${px(layout.barcode.padY)} ${px(layout.barcode.padX)}`
    const svg = h('div', { class: 'barcode-svg', role: 'img', 'aria-label': model.barcode?.altText ?? 'Barcode' })
    svg.style.width = px(layout.barcode.width)
    svg.style.height = px(layout.barcode.height)
    box.append(svg)
    if (layout.barcode.altText) {
      const alt = text('alt-text', layout.barcode.altText)
      alt.style.width = px(layout.barcode.width)
      box.append(alt)
    }
    area.append(box)
    content.append(area)
  }

  if (model.images.icon) content.append(h('img', { class: 'icon', src: model.images.icon, alt: '', draggable: 'false' }))

  if (onInfo) {
    const btn = h('button', { class: 'info-button', type: 'button', 'aria-label': 'Pass details' })
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9.5"/><path d="M12 10.5v6" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none"/></svg>'
    btn.addEventListener('click', onInfo)
    content.append(btn)
  }
  front.insertAdjacentHTML('beforeend', eventTicketBorderSvg(tk))
  return front
}

function renderBack(model: EventTicketModel, onDone: () => void): HTMLElement {
  const back = h('section', { class: 'face back', part: 'back', 'aria-label': 'Pass details' })
  const header = h('div', { class: 'back-header' })
  const title = h('span', { class: 'back-title' })
  title.textContent = model.organizationName || model.description
  const done = h('button', { class: 'done-button', type: 'button' })
  done.textContent = 'Done'
  done.addEventListener('click', onDone)
  header.append(title, done)

  const list = h('div', { class: 'back-list' })
  for (const f of model.back) {
    const row = h('div', { class: 'back-field' })
    if (f.label) {
      const label = h('div', { class: 'back-label' })
      label.textContent = f.label
      row.append(label)
    }
    const value = h('div', { class: 'back-value' })
    value.innerHTML = f.html ?? linkify(f.value)
    row.append(value)
    list.append(row)
  }
  back.append(header, list)
  return back
}

function renderPrimary(p: FieldLayout, overStrip: boolean): HTMLElement {
  const el = h('div', { class: 'primary field' })
  el.style.width = px(p.width)
  el.style.textAlign = p.align
  const value = text('value', p.value)
  // Over a strip the big value sits above its label; on plain passes the label leads.
  if (p.label) el.append(...(overStrip ? [value, text('label', p.label)] : [text('label', p.label), value]))
  else el.append(value)
  return el
}

function renderRows(rows: RowLayout[]): HTMLElement {
  const wrap = h('div', { class: 'rows' })
  for (const row of rows) {
    const el = h('div', { class: 'row' })
    el.append(...row.fields.map(renderField))
    wrap.append(el)
  }
  return wrap
}

function renderField(f: FieldLayout): HTMLElement {
  const el = h('div', { class: 'field', 'data-key': f.key })
  el.style.width = px(f.width)
  el.style.textAlign = f.align
  if (f.label) el.append(text('label', f.label))
  el.append(text('value', f.value))
  return el
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Wallet auto-detects links, emails and phone numbers in back field values. */
export function linkify(value: string): string {
  const re = /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'])|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(\+?\d[\d\s().-]{6,}\d)/g
  let out = ''
  let last = 0
  for (let m; (m = re.exec(value)); ) {
    out += escapeHtml(value.slice(last, m.index))
    const [match, url, email, phone] = m
    const href = url ? url : email ? `mailto:${email}` : `tel:${phone!.replace(/[^\d+]/g, '')}`
    out += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(match)}</a>`
    last = re.lastIndex
  }
  return out + escapeHtml(value.slice(last))
}

async function loadImageSizes(model: EventTicketModel): Promise<Partial<Record<'logo' | 'thumbnail', Size>>> {
  const out: Partial<Record<'logo' | 'thumbnail', Size>> = {}
  await Promise.all(
    (['logo', 'thumbnail'] as const).map(async name => {
      const src = model.images[name]
      if (!src) return
      const image = new Image()
      image.src = src
      try {
        await image.decode()
        out[name] = { width: image.naturalWidth, height: image.naturalHeight }
      } catch {
        // Broken image: lay out as if it were absent.
      }
    }),
  )
  return out
}

