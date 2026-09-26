import { StrictMode, createRef } from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApplePass, GooglePass, type ApplePassHandle } from '../src/react/index.js'
import type { ApplePassSource } from '../src/apple/types.js'
import { eventPass, fakeMeasurer, googleTicket } from './helpers.js'

const barcodeRenderer = async () => '<svg></svg>'
const shadow = (container: HTMLElement) => container.querySelector('.wallet-pass')?.shadowRoot ?? null

describe('<ApplePass>', () => {
  it('shows the fallback, then the rendered pass', async () => {
    const source: ApplePassSource = { pass: eventPass() }
    const onRender = vi.fn()
    const { container, getByText, queryByText } = render(
      <ApplePass pass={source} measurer={fakeMeasurer} barcodeRenderer={barcodeRenderer} fallback={<span>Loading…</span>} onRender={onRender} />,
    )
    expect(getByText('Loading…')).toBeTruthy()
    await waitFor(() => expect(shadow(container)).not.toBeNull())
    expect(queryByText('Loading…')).toBeNull()
    expect(shadow(container)!.querySelector('.primary .value')!.textContent).toBe('The Band')
    expect(onRender).toHaveBeenCalledTimes(1)
  })

  it('renders a single pass under StrictMode double effects', async () => {
    const { container } = render(
      <StrictMode>
        <ApplePass pass={{ pass: eventPass() }} measurer={fakeMeasurer} barcodeRenderer={barcodeRenderer} />
      </StrictMode>,
    )
    await waitFor(() => expect(shadow(container)).not.toBeNull())
    expect(container.querySelectorAll('.wallet-pass')).toHaveLength(1)
  })

  it('flips when the side prop changes and through the ref', async () => {
    const source: ApplePassSource = { pass: eventPass() }
    const ref = createRef<ApplePassHandle>()
    const props = { pass: source, measurer: fakeMeasurer, barcodeRenderer, ref }
    const { container, rerender } = render(<ApplePass {...props} />)
    await waitFor(() => expect(ref.current?.rendered).not.toBeNull())
    const flipper = () => shadow(container)!.querySelector('.flipper')!

    rerender(<ApplePass {...props} side="back" />)
    expect(flipper().classList.contains('is-flipped')).toBe(true)
    act(() => ref.current!.flip('front'))
    expect(flipper().classList.contains('is-flipped')).toBe(false)
  })

  it('shows the error fallback for non-event passes', async () => {
    const onError = vi.fn()
    const { findByText } = render(
      <ApplePass
        pass={{ pass: { formatVersion: 1, generic: {} } }}
        errorFallback={e => <span>Error: {(e as Error).message}</span>}
        onError={onError}
      />,
    )
    expect(await findByText(/Only event tickets/)).toBeTruthy()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('cleans up on unmount', async () => {
    const source: ApplePassSource = { pass: eventPass() }
    const ref = createRef<ApplePassHandle>()
    const { container, unmount } = render(<ApplePass pass={source} measurer={fakeMeasurer} barcodeRenderer={barcodeRenderer} ref={ref} />)
    await waitFor(() => expect(ref.current?.rendered).not.toBeNull())
    const el = container.querySelector('.wallet-pass')!
    unmount()
    expect(el.isConnected).toBe(false)
  })
})

describe('<GooglePass>', () => {
  it('renders the requested variant', async () => {
    const source = googleTicket()
    const { container } = render(<GooglePass pass={source} variant="fullscreen" measurer={fakeMeasurer} barcodeRenderer={barcodeRenderer} />)
    await waitFor(() => expect(container.querySelector('.google-wallet-pass')?.shadowRoot?.querySelector('.gpass.fullscreen')).toBeTruthy())
  })
})
