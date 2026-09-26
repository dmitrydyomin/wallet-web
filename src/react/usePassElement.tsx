import { useEffect, useRef, useState, type CSSProperties, type DependencyList, type ReactNode, type RefObject } from 'react'

export type PassStatus = { state: 'idle' | 'loading' | 'ready' } | { state: 'error'; error: unknown }

interface Rendered {
  element: HTMLElement
  destroy(): void
}

/**
 * Runs an imperative pass renderer into a host element: shows loading/error states,
 * ignores stale results (fast prop changes, StrictMode double effects) and cleans up.
 * `render` runs again whenever `deps` change; return null to render nothing.
 */
export function usePassElement<R extends Rendered>(
  render: (() => Promise<R>) | null,
  deps: DependencyList,
  callbacks: { onRender?: (r: R) => void; onError?: (e: unknown) => void },
): { host: RefObject<HTMLDivElement | null>; rendered: RefObject<R | null>; status: PassStatus } {
  const host = useRef<HTMLDivElement>(null)
  const rendered = useRef<R | null>(null)
  const [status, setStatus] = useState<PassStatus>({ state: 'idle' })
  const latest = useRef(callbacks)
  latest.current = callbacks

  useEffect(() => {
    const el = host.current
    if (!el || !render) {
      setStatus({ state: 'idle' })
      return
    }
    let cancelled = false
    let result: R | null = null
    setStatus({ state: 'loading' })

    render().then(
      r => {
        if (cancelled) return r.destroy()
        result = r
        rendered.current = r
        el.replaceChildren(r.element)
        setStatus({ state: 'ready' })
        latest.current.onRender?.(r)
      },
      (error: unknown) => {
        if (cancelled) return
        setStatus({ state: 'error', error })
        latest.current.onError?.(error)
      },
    )

    return () => {
      cancelled = true
      if (result) {
        result.destroy()
        if (rendered.current === result) rendered.current = null
      }
    }
  }, deps)

  return { host, rendered, status }
}

export interface PassFrameProps {
  className?: string
  style?: CSSProperties
  /** Shown while the pass loads (fetching, unzipping, loading fonts). */
  fallback?: ReactNode
  /** Shown if the pass can't be read or isn't an event ticket. */
  errorFallback?: ReactNode | ((error: unknown) => ReactNode)
}

export function PassFrame({
  host,
  status,
  className,
  style,
  fallback = null,
  errorFallback = null,
}: PassFrameProps & { host: RefObject<HTMLDivElement | null>; status: PassStatus }) {
  return (
    <div className={className} style={{ display: 'inline-block', ...style }} data-state={status.state}>
      {status.state === 'loading' && fallback}
      {status.state === 'error' && (typeof errorFallback === 'function' ? errorFallback(status.error) : errorFallback)}
      {/* Managed imperatively: React never renders children into this node. */}
      <div ref={host} hidden={status.state !== 'ready'} />
    </div>
  )
}
