import { renderApplePass, type ApplePassInput, type RenderOptions, type RenderedPass } from './render.js'

/**
 * `<apple-wallet-pass src="ticket.pkpass" zoom="1">`. Set `.pass` to render from
 * a source object or bytes instead of a URL. Register with `defineApplePassElement()`.
 */
// On the server there is no HTMLElement; fall back to a stub so importing the package doesn't throw.
const Base: typeof HTMLElement = typeof HTMLElement === 'undefined' ? (class {} as typeof HTMLElement) : HTMLElement

export class ApplePassElement extends Base {
  static observedAttributes = ['src', 'zoom', 'side', 'locale']

  #pass: ApplePassInput | null = null
  #options: RenderOptions = {}
  #rendered: RenderedPass | null = null
  #token = 0

  get pass(): ApplePassInput | null {
    return this.#pass
  }
  set pass(value: ApplePassInput | null) {
    this.#pass = value
    void this.#render()
  }

  get options(): RenderOptions {
    return this.#options
  }
  set options(value: RenderOptions) {
    this.#options = value
    void this.#render()
  }

  get rendered(): RenderedPass | null {
    return this.#rendered
  }

  flip(side?: 'front' | 'back') {
    this.#rendered?.flip(side)
  }

  connectedCallback() {
    void this.#render()
  }

  disconnectedCallback() {
    this.#token++
    this.#rendered?.destroy()
    this.#rendered = null
  }

  attributeChangedCallback() {
    if (this.isConnected) void this.#render()
  }

  async #render() {
    if (!this.isConnected) return
    const input = this.#pass ?? this.getAttribute('src')
    const token = ++this.#token
    if (!input) return
    const zoom = this.getAttribute('zoom')
    const side = this.getAttribute('side')
    const locale = this.getAttribute('locale')
    try {
      const rendered = await renderApplePass(input, {
        ...this.#options,
        ...(zoom ? { zoom: Number(zoom) } : {}),
        ...(side === 'back' || side === 'front' ? { side } : {}),
        ...(locale ? { locale } : {}),
      })
      if (token !== this.#token) return rendered.destroy()
      this.#rendered?.destroy()
      this.#rendered = rendered
      this.replaceChildren(rendered.element)
      this.dispatchEvent(new CustomEvent('pass-rendered', { detail: rendered }))
    } catch (error) {
      if (token !== this.#token) return
      this.dispatchEvent(new CustomEvent('pass-error', { detail: error }))
    }
  }
}

export function defineApplePassElement(name = 'apple-wallet-pass') {
  if (!customElements.get(name)) customElements.define(name, class extends ApplePassElement {})
}
