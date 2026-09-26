import { describe, expect, it } from 'vitest'
import { allocateWidths, fitFontSize } from '../src/core/text.js'
import { layoutEventTicket } from '../src/apple/layout.js'
import { buildEventTicketModel, pickLocalization, sanitizeLinks } from '../src/apple/model.js'
import { appleTokens } from '../src/apple/tokens.js'
import { eventPass, fakeMeasurer } from './helpers.js'

const family = 'Test'

describe('fitFontSize', () => {
  it('keeps the max size when text fits and shrinks when it does not', () => {
    const font = { family, size: 30 }
    expect(fitFontSize(fakeMeasurer, 'Short', font, 300, 16).size).toBe(30)
    const long = fitFontSize(fakeMeasurer, 'A much longer event title', font, 300, 16)
    expect(long.size).toBeLessThan(30)
    expect(long.width).toBeLessThanOrEqual(300)
    expect(fakeMeasurer.width('A much longer event title', { family, size: long.size + 0.5 })).toBeGreaterThan(300)
  })

  it('reports when even the minimum size overflows', () => {
    expect(fitFontSize(fakeMeasurer, 'x'.repeat(200), { family, size: 30 }, 100, 16)).toMatchObject({ size: 16, fits: false })
  })
})

describe('allocateWidths', () => {
  it('lets narrow items keep their width and splits the rest', () => {
    expect(allocateWidths([20, 500, 500], 320)).toEqual([20, 150, 150])
    expect(allocateWidths([10, 20], 100)).toEqual([10, 20])
  })
})

describe('layoutEventTicket', () => {
  const layout = (pass = eventPass()) =>
    layoutEventTicket({
      model: buildEventTicketModel({ pass }, { scale: 2 }),
      measurer: fakeMeasurer,
      imageSizes: { logo: { width: 200, height: 60 } },
      imageScale: 2,
      fontFamily: family,
    })

  it('aligns row fields like Wallet: first left, last right', () => {
    const l = layout()
    expect(l.auxiliary!.fields.map(f => f.align)).toEqual(['left', 'left', 'right'])
    expect(l.header.fields.fields[0]!.align).toBe('right')
  })

  it('uppercases labels and scales the logo into points', () => {
    const l = layout()
    expect(l.secondary!.fields[0]!.label!.text).toBe('LOCATION')
    expect(l.header.logo).toEqual({ width: 100, height: 30 })
  })

  it('shrinks a crowded row to fit the card, down to the minimum size', () => {
    const pass = eventPass()
    pass.eventTicket!.secondaryFields = [
      { key: 'a', label: 'Venue', value: 'The Grand Municipal Auditorium' },
      { key: 'b', label: 'Doors', value: '19:00' },
    ]
    const row = layout(pass).secondary!
    const inner = appleTokens.card.width - appleTokens.card.paddingX * 2
    const size = row.fields[0]!.value.font.size
    expect(size).toBeLessThan(appleTokens.secondary.size)
    expect(size).toBeGreaterThanOrEqual(appleTokens.secondary.minSize)
    const total = row.fields.reduce((s, f) => s + f.width, 0) + appleTokens.rows.gap
    expect(total).toBeLessThanOrEqual(inner + 1)
  })

  it('drops fields beyond Wallet limits', () => {
    const pass = eventPass()
    pass.eventTicket!.primaryFields = [
      { key: 'a', value: 'One' },
      { key: 'b', value: 'Two' },
    ]
    expect(layout(pass).primary!.key).toBe('a')
  })
})

describe('buildEventTicketModel', () => {
  it('localises labels and values from pass.strings', () => {
    const files = { 'de.lproj/pass.strings': '"Event" = "Veranstaltung"; "The Band" = "Die Band";', 'en.lproj/pass.strings': '' }
    const model = buildEventTicketModel({ pass: eventPass(), files }, { locale: 'de-AT' })
    expect(model.primary[0]).toMatchObject({ label: 'Veranstaltung', value: 'Die Band' })
  })

  it('falls back through barcodes to a supported format', () => {
    const pass = eventPass({ barcodes: [{ format: 'PKBarcodeFormatNFC' as never, message: 'x' }, { format: 'PKBarcodeFormatPDF417', message: 'y' }] })
    expect(buildEventTicketModel({ pass }).barcode?.format).toBe('pdf417')
  })

  it('rejects non-event passes', () => {
    expect(() => buildEventTicketModel({ pass: { formatVersion: 1, generic: {} } })).toThrow(/event tickets/)
  })

  it('flags expired passes', () => {
    const model = buildEventTicketModel({ pass: eventPass({ expirationDate: '2020-01-01T00:00:00Z' }) })
    expect(model.expired).toBe(true)
  })
})

describe('pickLocalization', () => {
  it('matches exact, then language, then en', () => {
    const files = { 'en.lproj/pass.strings': '', 'zh-Hans.lproj/pass.strings': '', 'pt-BR.lproj/pass.strings': '' }
    expect(pickLocalization(files, 'zh-Hans')).toBe('zh-Hans.lproj')
    expect(pickLocalization(files, 'pt-PT')).toBe('pt-BR.lproj')
    expect(pickLocalization(files, 'fr')).toBe('en.lproj')
  })
})

describe('sanitizeLinks', () => {
  it('keeps safe anchors only', () => {
    expect(sanitizeLinks('<b>Hi</b> <a href="https://x.com">site</a> <a href="javascript:alert(1)">bad</a><script>x</script>')).toBe(
      'Hi <a href="https://x.com" target="_blank" rel="noopener noreferrer">site</a> badx',
    )
  })
})

describe('header', () => {
  it('keeps a single header field at its natural width so logo text has room', () => {
    const l = layoutEventTicket({
      model: buildEventTicketModel({ pass: eventPass() }, { scale: 2 }),
      measurer: fakeMeasurer,
      imageSizes: { logo: { width: 100, height: 100 } },
      fontFamily: family,
    })
    const inner = appleTokens.card.width - appleTokens.card.paddingX * 2
    expect(l.header.fields.fields[0]!.width).toBeLessThan(inner / 2)
    expect(l.header.logoText!.width).toBeGreaterThan(100)
  })
})
