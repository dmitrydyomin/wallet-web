import { forwardRef, useEffect, useImperativeHandle } from 'react'
// Import the renderer directly, not the package index: the index also defines a
// custom element (extends HTMLElement), which would break server-side rendering.
import { renderApplePass, type ApplePassInput, type RenderOptions, type RenderedPass } from '../apple/render.js'
import { PassFrame, usePassElement, type PassFrameProps } from './usePassElement.js'

export interface ApplePassProps extends RenderOptions, PassFrameProps {
  /**
   * The pass: a `.pkpass` URL, a File/Blob/ArrayBuffer/Uint8Array, or `{ pass, files }`.
   * Objects are compared by identity, so memoise them to avoid re-rendering the pass.
   */
  pass: ApplePassInput | null | undefined
  /** Which side faces the viewer. Changing it animates the flip. */
  side?: 'front' | 'back'
  onRender?: (rendered: RenderedPass) => void
  onError?: (error: unknown) => void
}

export interface ApplePassHandle {
  flip(side?: 'front' | 'back'): void
  /** The current rendering, with its model and computed layout. */
  readonly rendered: RenderedPass | null
}

/** Renders an Apple Wallet pass. Client-only: it renders nothing on the server. */
export const ApplePass = forwardRef<ApplePassHandle, ApplePassProps>(function ApplePass(props, ref) {
  const { pass, side = 'front', className, style, fallback, errorFallback, onRender, onError, ...options } = props
  // Primitive options are compared by value; objects and functions (tokens, measurer, barcodeRenderer, now) by identity.
  const { zoom, fontFamily, displayFontFamily, uppercaseLabels, infoButton, locale, timeZone, scale, now, tokens, measurer, barcodeRenderer } =
    options
  const localeKey = Array.isArray(locale) ? locale.join(',') : locale

  const { host, rendered, status } = usePassElement(
    pass
      ? () =>
          renderApplePass(pass, {
            zoom,
            fontFamily,
            displayFontFamily,
            uppercaseLabels,
            infoButton,
            locale: localeKey?.includes(',') ? localeKey.split(',') : localeKey,
            timeZone,
            scale,
            now,
            tokens,
            measurer,
            barcodeRenderer,
            // Initial side only; later changes flip the existing pass (effect below).
            side,
          })
      : null,
    [pass, zoom, fontFamily, displayFontFamily, uppercaseLabels, infoButton, localeKey, timeZone, scale, now, tokens, measurer, barcodeRenderer],
    { onRender, onError },
  )

  useImperativeHandle(ref, () => ({
    flip: s => rendered.current?.flip(s),
    get rendered() {
      return rendered.current
    },
  }), [rendered])

  useEffect(() => {
    rendered.current?.flip(side)
  }, [side, rendered])

  return <PassFrame host={host} status={status} className={className} style={style} fallback={fallback} errorFallback={errorFallback} />
})
