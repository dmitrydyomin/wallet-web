import { renderBarcodeSvg, type BarcodeRenderer } from '../core/barcode.js'
import { h, img, loadFonts, px, text, type Size } from '../core/dom.js'
import { createPretextMeasurer, type TextMeasurer } from '../core/text.js'
import { layoutGooglePass, type GoogleFieldLayout, type GooglePassLayout, type GoogleTextBox } from './layout.js'
import { buildGooglePassModel, resolveGoogleSource, type GoogleModelOptions, type GooglePassInput, type GooglePassModel } from './model.js'
import { googlePassCss } from './styles.js'
import { googleTokens, type GoogleTokens, type GoogleVariant } from './tokens.js'

export interface GoogleRenderOptions extends GoogleModelOptions {
  /** `classic`: the pass card. `fullscreen`: the full-screen pass view. Default `classic`. */
  variant?: GoogleVariant
  zoom?: number
  fontFamily?: string
  tokens?: GoogleTokens
  measurer?: TextMeasurer
  barcodeRenderer?: BarcodeRenderer
}

export interface RenderedGooglePass {
  element: HTMLElement
  model: GooglePassModel
  layout: GooglePassLayout
  destroy(): void
}

/**
 * Render a Google Wallet event ticket from `{ class, object }`, decoded "Save to Google Wallet"
 * JWT claims, or the JWT string. Resolves once fonts are loaded and text is fitted.
 */
export async function renderGooglePass(input: GooglePassInput, options: GoogleRenderOptions = {}): Promise<RenderedGooglePass> {
  const tk = options.tokens ?? googleTokens
  const family = options.fontFamily ?? tk.fontFamily
  const variant = options.variant ?? 'classic'
  const model = buildGooglePassModel(resolveGoogleSource(input), options)
  const v = variant === 'classic' ? tk.classic : tk.fullscreen

  const [heroSize] = await Promise.all([
    model.hero ? imageSize(model.hero) : undefined,
    loadFonts(family, [400, 500, 600]),
  ])
  const layout = layoutGooglePass({
    model,
    variant,
    measurer: options.measurer ?? createPretextMeasurer(),
    heroSize,
    tokens: tk,
    fontFamily: family,
  })

  const element = document.createElement('div')
  element.className = 'google-wallet-pass'
  const root = element.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = googlePassCss(tk)
  root.append(style)

  const pass = h('section', { class: `gpass ${variant}`, part: 'pass', 'aria-label': [model.cardTitle, model.header].filter(Boolean).join(' – ') })
  pass.style.setProperty('--gw-font', family)
  pass.style.setProperty('--gw-bg', model.colors.background)
  pass.style.setProperty('--gw-text', model.colors.text)
  pass.style.setProperty('--gw-secondary', model.colors.secondaryText)
  pass.style.setProperty('--gw-separator', model.colors.separator)
  pass.style.setProperty('--gw-border', model.colors.border)
  if (options.zoom && options.zoom !== 1) pass.style.zoom = String(options.zoom)
  if (model.inactive) pass.classList.add('is-inactive')

  const logoSize = variant === 'classic' ? tk.classic.top.logo.size : tk.fullscreen.logo.size
  const logo = model.logo ? img(model.logo, 'logo', { width: logoSize, height: logoSize }) : null
  const title = layout.title ? textEl('title', layout.title) : null
  if (title) title.style.maxWidth = px(layout.titleWidth)
  const header = layout.header ? textEl('header', layout.header) : null
  const subheader = layout.subheader ? textEl('subheader', layout.subheader) : null
  const rows = layout.rows.length ? renderRows(layout.rows) : null
  const barcode = layout.barcode ? renderBarcode(layout.barcode) : null

  if (variant === 'classic') {
    const top = h('div', { class: 'top' })
    top.append(...[logo, title].filter(e => e !== null))
    const body = h('div', { class: 'body' })
    body.append(...[subheader, header, rows, barcode].filter(e => e !== null))
    pass.append(top, body)
  } else {
    pass.append(...[logo, title, header, subheader, barcode, rows].filter(e => e !== null))
  }
  pass.append(layout.hero && model.hero ? img(model.hero, 'hero', layout.hero) : h('div', { class: 'end' }))
  if (variant === 'classic') pass.append(h('div', { class: 'border' }))
  root.append(pass)

  const slot = pass.querySelector<HTMLElement>('.barcode-svg')
  if (slot && model.barcode) {
    ;(options.barcodeRenderer ?? renderBarcodeSvg)(model.barcode)
      .then(svg => (slot.innerHTML = svg))
      .catch(err => {
        console.warn('[wallet-web] barcode rendering failed', err)
        slot.textContent = model.barcode?.message ?? ''
      })
  }

  return {
    element,
    model,
    layout,
    destroy: () => element.remove(),
  }
}

function textEl(cls: string, box: GoogleTextBox): HTMLElement {
  const el = text(cls, box)
  if (box.rounded) el.classList.add('rounded')
  return el
}

function renderRows(rows: GoogleFieldLayout[][]): HTMLElement {
  const wrap = h('div', { class: 'rows' })
  for (const row of rows) {
    const el = h('div', { class: 'row' })
    for (const f of row) {
      const field = h('div', { class: 'field' })
      field.style.width = px(f.width)
      field.style.textAlign = f.align
      if (f.label) field.append(textEl('label', f.label))
      field.append(textEl('value', f.value))
      el.append(field)
    }
    wrap.append(el)
  }
  return wrap
}

function renderBarcode(b: NonNullable<GooglePassLayout['barcode']>): HTMLElement {
  const wrap = h('div', { class: 'barcode' })
  if (b.width > 0) {
    const box = h('div', { class: 'barcode-box' })
    box.style.padding = px(b.pad)
    const svg = h('div', { class: 'barcode-svg', role: 'img', 'aria-label': b.altText?.text ?? 'Barcode' })
    svg.style.width = px(b.width)
    svg.style.height = px(b.height)
    box.append(svg)
    wrap.append(box)
  }
  if (b.altText) wrap.append(textEl('alt-text', b.altText))
  return wrap
}

async function imageSize(src: string): Promise<Size | undefined> {
  const image = new Image()
  image.src = src
  try {
    await image.decode()
    return { width: image.naturalWidth, height: image.naturalHeight }
  } catch {
    return undefined
  }
}
