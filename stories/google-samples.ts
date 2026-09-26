import type { GooglePassSource, LocalizedString } from '../src/index.js'
import googleHero from './assets/figma-google/hero.png'
import googleLogo from './assets/figma-google/logo-new.png'
import * as img from './images.js'

const ls = (value: string): LocalizedString => ({ defaultValue: { language: 'en-US', value } })
const image = (uri: string) => ({ sourceUri: { uri } })

const inDays = (days: number, hour = 20) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.toISOString().slice(0, 10)}T${String(hour).padStart(2, '0')}:00:00-07:00`
}

export const googleSamples = {
  /** Content of the Google Figma mockups ("Pass (QR)" / "Pass (QR) [New]"), as an event ticket with a custom row. */
  mockup: (): GooglePassSource => ({
    class: {
      id: 'issuer.mockup',
      issuerName: 'My Best Buy™',
      eventName: ls('First Last'),
      venue: { name: ls('Name') },
      hexBackgroundColor: '#e0e6ef',
      logo: image(googleLogo),
      heroImage: image(googleHero),
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [{ oneItem: { item: { firstValue: { fields: [{ fieldPath: "object.textModulesData['member_id']" }] } } } }],
        },
      },
    },
    object: {
      id: 'issuer.mockup-1',
      classId: 'issuer.mockup',
      state: 'ACTIVE',
      barcode: { type: 'QR_CODE', value: '0000000000', alternateText: '0000000000' },
      textModulesData: [{ id: 'member_id', header: 'MEMBER ID', body: '0000000000' }],
    },
  }),

  /** Google's default event ticket template: date/time and seat rows. */
  concert: (): GooglePassSource => ({
    class: {
      id: 'issuer.concert',
      issuerName: 'Northside Arena',
      eventName: ls('The Midnight Echoes'),
      venue: { name: ls('Northside Arena, Seattle') },
      dateTime: { start: inDays(14) },
      hexBackgroundColor: '#1c1640',
      logo: image(img.logo('#1c1640')),
      heroImage: image(img.strip('#5b3cc4', '#e0457b')),
    },
    object: {
      id: 'issuer.concert-1',
      classId: 'issuer.concert',
      state: 'ACTIVE',
      barcode: { type: 'QR_CODE', value: 'NSA-2026-0001-112-F-7', alternateText: 'NSA-0001' },
      seatInfo: { section: ls('112'), row: ls('F'), seat: ls('7'), gate: ls('B') },
    },
  }),

  /** Long names and a PDF417 code, to exercise shrinking and truncation. */
  stadium: (): GooglePassSource => ({
    class: {
      id: 'issuer.stadium',
      issuerName: 'Metropolitan City Football Club Stadium',
      eventName: ls('Metropolitan City vs. Riverside Athletic'),
      venue: { name: ls('Metropolitan City Stadium, North Stand') },
      dateTime: { start: inDays(3, 15) },
      hexBackgroundColor: '#006644',
      logo: image(img.logo('#006644')),
      customSectionLabel: ls('BLOCK'),
    },
    object: {
      id: 'issuer.stadium-1',
      classId: 'issuer.stadium',
      state: 'ACTIVE',
      barcode: { type: 'PDF_417', value: '900112345678', alternateText: '9001 1234 5678' },
      seatInfo: { section: ls('N4 Upper Tier'), row: ls('22'), seat: ls('118') },
    },
  }),
}

export type GoogleSampleName = keyof typeof googleSamples
