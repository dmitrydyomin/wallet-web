import { forwardRef, useImperativeHandle } from 'react'
import type { GooglePassInput } from '../google/model.js'
import { renderGooglePass, type GoogleRenderOptions, type RenderedGooglePass } from '../google/render.js'
import { PassFrame, usePassElement, type PassFrameProps } from './usePassElement.js'

export interface GooglePassProps extends GoogleRenderOptions, PassFrameProps {
  /**
   * The ticket: `{ class, object }`, decoded "Save to Google Wallet" JWT claims, or the JWT string.
   * Objects are compared by identity, so memoise them to avoid re-rendering the pass.
   */
  pass: GooglePassInput | null | undefined
  onRender?: (rendered: RenderedGooglePass) => void
  onError?: (error: unknown) => void
}

export interface GooglePassHandle {
  readonly rendered: RenderedGooglePass | null
}

/** Renders a Google Wallet event ticket. Client-only: it renders nothing on the server. */
export const GooglePass = forwardRef<GooglePassHandle, GooglePassProps>(function GooglePass(props, ref) {
  const { pass, className, style, fallback, errorFallback, onRender, onError, ...options } = props
  const { variant, zoom, fontFamily, locale, tokens, measurer, barcodeRenderer } = options
  const localeKey = Array.isArray(locale) ? locale.join(',') : locale

  const { host, rendered, status } = usePassElement(
    pass
      ? () =>
          renderGooglePass(pass, {
            variant,
            zoom,
            fontFamily,
            locale: localeKey?.includes(',') ? localeKey.split(',') : localeKey,
            tokens,
            measurer,
            barcodeRenderer,
          })
      : null,
    [pass, variant, zoom, fontFamily, localeKey, tokens, measurer, barcodeRenderer],
    { onRender, onError },
  )

  useImperativeHandle(ref, () => ({
    get rendered() {
      return rendered.current
    },
  }), [rendered])

  return <PassFrame host={host} status={status} className={className} style={style} fallback={fallback} errorFallback={errorFallback} />
})
