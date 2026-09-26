import { describe, expect, it } from 'vitest'
import { buildGooglePassModel, resolveGoogleSource } from '../src/google/model.js'
import { layoutGooglePass } from '../src/google/layout.js'
import { renderGooglePass } from '../src/google/render.js'
import { googleTokens } from '../src/google/tokens.js'
import { fakeMeasurer, googleTicket } from './helpers.js'

describe('buildGooglePassModel', () => {
  it('maps the default event ticket template', () => {
    const m = buildGooglePassModel(googleTicket(), { locale: 'en-US' })
    expect(m).toMatchObject({ cardTitle: 'Northside Arena', header: 'The Midnight Echoes', subheader: 'Main Hall' })
    expect(m.rows).toEqual([
      [
        { label: 'DATE', value: 'Mon, Oct 12' },
        { label: 'TIME', value: '8:00 PM' },
      ],
      [
        { label: 'SECTION', value: '112' },
        { label: 'ROW', value: 'F' },
        { label: 'SEAT', value: '7' },
      ],
    ])
    expect(m.barcode).toMatchObject({ format: 'qr', message: 'TICKET-1', altText: 'T-1' })
    expect(m.colors.dark).toBe(true)
    expect(m.colors.text).toBe('#ffffff')
  })

  it('resolves cardTemplateOverride field paths, including text modules by id', () => {
    const src = googleTicket({
      class: {
        hexBackgroundColor: '#e0e6ef',
        classTemplateInfo: {
          cardTemplateOverride: {
            cardRowTemplateInfos: [
              { oneItem: { item: { firstValue: { fields: [{ fieldPath: "object.textModulesData['member_id']" }] } } } },
              {
                twoItems: {
                  startItem: { firstValue: { fields: [{ fieldPath: 'object.seatInfo.gate' }] } },
                  endItem: { firstValue: { fields: [{ fieldPath: 'class.dateTime.start', dateFormat: 'TIME_ONLY' }] } },
                },
              },
            ],
          },
        },
      },
      object: {
        textModulesData: [{ id: 'member_id', header: 'MEMBER ID', body: '0000000000' }],
        seatInfo: { gate: { defaultValue: { language: 'en', value: 'B' } } },
      },
    })
    const m = buildGooglePassModel(src, { locale: 'en-US' })
    expect(m.rows).toEqual([
      [{ label: 'MEMBER ID', value: '0000000000' }],
      [
        { label: 'GATE', value: 'B' },
        { label: 'START', value: '8:00 PM' },
      ],
    ])
    expect(m.colors.text).toBe('#000000')
  })

  it('picks translated values for the locale', () => {
    const src = googleTicket({
      class: { eventName: { defaultValue: { language: 'en', value: 'Concert' }, translatedValues: [{ language: 'de', value: 'Konzert' }] } },
    })
    expect(buildGooglePassModel(src, { locale: 'de-DE' }).header).toBe('Konzert')
    expect(buildGooglePassModel(src, { locale: 'fr' }).header).toBe('Concert')
  })

  it('decodes a Save to Google Wallet JWT and matches the class by id', () => {
    const t = googleTicket()
    const claims = { iss: 'x', aud: 'google', typ: 'savetowallet', payload: { eventTicketClasses: [{ id: 'other' }, t.class], eventTicketObjects: [t.object] } }
    const b64 = (o: object) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
    const jwt = `${b64({ alg: 'RS256' })}.${b64(claims)}.sig`
    expect(resolveGoogleSource(jwt).class.id).toBe('issuer.concert')
    expect(resolveGoogleSource(`https://pay.google.com/gp/v/save/${jwt}`).object.id).toBe('issuer.ticket-1')
  })

  it('shows text for barcode types it cannot draw', () => {
    const m = buildGooglePassModel(googleTicket({ object: { barcode: { type: 'EAN_13', value: '4006381333931' } } }))
    expect(m.barcode).toBeUndefined()
    expect(m.barcodeTextOnly).toBe('4006381333931')
  })
})

describe('layoutGooglePass', () => {
  it('shrinks a long event name to fit, in both variants', () => {
    const src = googleTicket({ class: { eventName: { defaultValue: { language: 'en', value: 'An Extremely Long Event Name For Testing' } } } })
    const model = buildGooglePassModel(src)
    for (const variant of ['classic', 'fullscreen'] as const) {
      const l = layoutGooglePass({ model, variant, measurer: fakeMeasurer, fontFamily: 'Test' })
      const v = googleTokens[variant]
      expect(l.header!.font.size).toBeLessThan(v.header.size)
      expect(l.header!.font.size).toBeGreaterThanOrEqual(v.header.minSize)
    }
  })

  it('aligns row items start / middle / end', () => {
    const l = layoutGooglePass({ model: buildGooglePassModel(googleTicket()), variant: 'classic', measurer: fakeMeasurer })
    expect(l.rows[1]!.map(f => f.align)).toEqual(['left', 'center', 'right'])
  })
})

describe('renderGooglePass', () => {
  it('renders the classic card and the full-screen view', async () => {
    for (const variant of ['classic', 'fullscreen'] as const) {
      const r = await renderGooglePass(googleTicket(), { variant, measurer: fakeMeasurer, barcodeRenderer: async () => '<svg></svg>' })
      const root = r.element.shadowRoot!
      expect(root.querySelector(`.gpass.${variant}`)).not.toBeNull()
      expect(root.querySelector('.header')!.textContent).toBe('The Midnight Echoes')
      expect([...root.querySelectorAll('.label')].map(e => e.textContent)).toEqual(['DATE', 'TIME', 'SECTION', 'ROW', 'SEAT'])
    }
  })
})
