import { describe, expect, it } from 'vitest'
import { linkify, renderApplePass } from '../src/apple/render.js'
import { eventPass, fakeMeasurer } from './helpers.js'

describe('renderApplePass', () => {
  it('renders fields, colors and barcode into a shadow root', async () => {
    const rendered = await renderApplePass(
      { pass: eventPass() },
      { measurer: fakeMeasurer, barcodeRenderer: async () => '<svg id="bc"></svg>', locale: 'en-US' },
    )
    const root = rendered.element.shadowRoot!
    const front = root.querySelector('.front')!
    expect(front.querySelector('.primary .value')!.textContent).toBe('The Band')
    expect([...front.querySelectorAll('.rows .label')].map(e => e.textContent)).toEqual(['LOCATION', 'DOORS', 'SECTION', 'ROW', 'SEAT'])
    expect((root.querySelector('.pass') as HTMLElement).style.getPropertyValue('--wp-bg')).toBe('rgb(20, 30, 60)')
    await Promise.resolve()
    expect(root.querySelector('#bc')).not.toBeNull()
  })

  it('flips to the back and back again', async () => {
    const rendered = await renderApplePass({ pass: eventPass() }, { measurer: fakeMeasurer, barcodeRenderer: async () => '', infoButton: true })
    const root = rendered.element.shadowRoot!
    ;(root.querySelector('.info-button') as HTMLButtonElement).click()
    expect(root.querySelector('.flipper')!.classList.contains('is-flipped')).toBe(true)
    ;(root.querySelector('.done-button') as HTMLButtonElement).click()
    expect(root.querySelector('.flipper')!.classList.contains('is-flipped')).toBe(false)
    expect(root.querySelector('.back-value a[href^="https://example.com"]')).not.toBeNull()
  })
})

describe('linkify', () => {
  it('links urls, emails and phones and escapes the rest', () => {
    expect(linkify('<b> mail a@b.co')).toBe('&lt;b&gt; mail <a href="mailto:a@b.co" target="_blank" rel="noopener noreferrer">a@b.co</a>')
    expect(linkify('call +1 (555) 123-4567')).toContain('href="tel:+15551234567"')
  })
})
