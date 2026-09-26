import type { ApplePassSource, PassJson } from '../src/index.js'
import figmaIcon from './assets/figma/icon.png'
import figmaLogo from './assets/figma/logo.png'
import figmaStrip from './assets/figma/strip.jpg'
import bowlingIcon from './assets/figma-bowling/icon.png'
import bowlingLogo from './assets/figma-bowling/logo.png'
import bowlingStrip from './assets/figma-bowling/strip.png'
import * as img from './images.js'

const base = {
  formatVersion: 1,
  passTypeIdentifier: 'pass.com.example.events',
  teamIdentifier: 'ABCDE12345',
} satisfies Partial<PassJson>

const inDays = (days: number, hour = 20) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const samples = {
  /** Content of the "Apple Event Ticket" Figma mockup (node 1:64), for pixel comparison. */
  mockup: (): ApplePassSource => ({
    pass: {
      ...base,
      serialNumber: 'M-0001',
      organizationName: 'Star',
      description: 'Concert ticket',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(242, 109, 95)',
      labelColor: 'rgb(111, 53, 47)',
      barcodes: [{ format: 'PKBarcodeFormatPDF417', message: 'JUSTROCKIT-MAYDAY-2024-S5-5J', messageEncoding: 'iso-8859-1' }],
      eventTicket: {
        headerFields: [
          { key: 'date', label: 'Date', value: '5 May' },
          { key: 'time', label: 'Time', value: '19:30' },
        ],
        secondaryFields: [{ key: 'event', label: 'Event', value: 'Just Rock It! Mayday 2024 Tour' }],
        auxiliaryFields: [
          { key: 'location', label: 'Location', value: 'Taipei Arena' },
          { key: 'checkin', label: 'Check-in', value: '19:00' },
          { key: 'section', label: 'Section', value: '5' },
          { key: 'seat', label: 'Seat', value: '5J' },
        ],
        backFields: [{ key: 'venue', label: 'Venue', value: 'Taipei Arena, No. 2, Section 4, Nanjing East Road, Taipei' }],
      },
    },
    files: {
      'logo@3x.png': figmaLogo,
      'strip@2x.png': figmaStrip,
      'icon@3x.png': figmaIcon,
    },
  }),

  /** Content of the iPhone example in the Figma file ("Examples/Ticket", node 1:475). */
  mockupBowling: (): ApplePassSource => ({
    pass: {
      ...base,
      serialNumber: 'B-0033',
      organizationName: 'Bowled Over',
      description: 'Bowling ticket',
      logoText: 'Bowled Over',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(224, 93, 45)',
      labelColor: 'rgb(255, 177, 154)',
      barcodes: [{ format: 'PKBarcodeFormatQR', message: 'BOWLED-OVER-BONANZA-LANE-33', messageEncoding: 'iso-8859-1' }],
      eventTicket: {
        headerFields: [{ key: 'date', label: '5:00 PM', value: 'August 22' }],
        secondaryFields: [{ key: 'event', label: 'Bowl-a-Rama Alley', value: 'BOWLING BONANZA' }],
        auxiliaryFields: [{ key: 'lane', label: 'Lane', value: '33' }],
        backFields: [{ key: 'venue', label: 'Venue', value: 'Bowl-a-Rama Alley' }],
      },
    },
    files: {
      'logo@3x.png': bowlingLogo,
      'strip@3x.png': bowlingStrip,
      'icon@3x.png': bowlingIcon,
    },
  }),

  /** Strip layout: primary field over the strip image, QR code. */
  concert: (): ApplePassSource => ({
    pass: {
      ...base,
      serialNumber: 'C-0001',
      organizationName: 'Northside Arena',
      description: 'Concert ticket',
      logoText: 'Northside Arena',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(28, 22, 64)',
      labelColor: 'rgb(186, 174, 255)',
      barcodes: [{ format: 'PKBarcodeFormatQR', message: 'NSA-2026-0001-A12-7', messageEncoding: 'iso-8859-1', altText: 'NSA-0001' }],
      eventTicket: {
        headerFields: [{ key: 'date', label: 'Date', value: inDays(14), dateStyle: 'PKDateStyleMedium', timeStyle: 'PKDateStyleNone' }],
        primaryFields: [{ key: 'event', label: 'Artist', value: 'The Midnight Echoes' }],
        secondaryFields: [
          { key: 'doors', label: 'Doors', value: inDays(14, 19), timeStyle: 'PKDateStyleShort' },
          { key: 'show', label: 'Show', value: inDays(14, 20), timeStyle: 'PKDateStyleShort' },
          { key: 'gate', label: 'Gate', value: 'B' },
        ],
        auxiliaryFields: [
          { key: 'section', label: 'Section', value: '112' },
          { key: 'row', label: 'Row', value: 'F' },
          { key: 'seat', label: 'Seat', value: '7' },
          { key: 'price', label: 'Price', value: 89.5, currencyCode: 'USD' },
        ],
        backFields: [
          { key: 'holder', label: 'Ticket holder', value: 'Alex Morgan' },
          { key: 'venue', label: 'Venue', value: 'Northside Arena\n1200 Harbor Blvd\nSeattle, WA 98101' },
          { key: 'help', label: 'Questions?', value: 'Visit https://example.com/help or call +1 (206) 555-0142' },
          { key: 'terms', label: 'Terms & conditions', attributedValue: 'Read the <a href="https://example.com/terms">full terms</a>.', value: 'Read the full terms.' },
        ],
      },
    },
    files: {
      'logo@2x.png': img.logo(),
      'strip@2x.png': img.strip('#5b3cc4', '#e0457b'),
    },
  }),

  /** Background image layout: blurred background, thumbnail beside the primary field, PDF417. */
  theatre: (): ApplePassSource => ({
    pass: {
      ...base,
      serialNumber: 'T-0042',
      organizationName: 'Royal Playhouse',
      description: 'Theatre ticket',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(90, 20, 30)',
      labelColor: 'rgb(255, 210, 160)',
      barcodes: [{ format: 'PKBarcodeFormatPDF417', message: 'RP|2026|HAMLET|STALLS|K|14', messageEncoding: 'iso-8859-1' }],
      eventTicket: {
        headerFields: [{ key: 'seat', label: 'Seat', value: 'K14' }],
        primaryFields: [{ key: 'show', label: 'Performance', value: 'Hamlet' }],
        secondaryFields: [
          { key: 'date', label: 'Date', value: inDays(30, 19), dateStyle: 'PKDateStyleMedium' },
          { key: 'time', label: 'Curtain', value: inDays(30, 19), timeStyle: 'PKDateStyleShort' },
        ],
        auxiliaryFields: [
          { key: 'area', label: 'Area', value: 'Stalls' },
          { key: 'entrance', label: 'Entrance', value: 'West Door' },
        ],
        backFields: [{ key: 'runtime', label: 'Running time', value: 'Approximately 3 hours including one interval.' }],
      },
    },
    files: {
      'logo@2x.png': img.wordmark('ROYAL'),
      'background@2x.png': img.background(['#4a0e18', '#c0392b', '#f39c12']),
      'thumbnail@2x.png': img.thumbnail('#1f1f1f', 'HAMLET'),
    },
  }),

  /** Light pass without images, Aztec code, German localisation. */
  festival: (): ApplePassSource => ({
    pass: {
      ...base,
      serialNumber: 'F-7788',
      organizationName: 'Sommerfest',
      description: 'Festival pass',
      logoText: 'Sommerfest 2026',
      foregroundColor: 'rgb(20, 20, 20)',
      backgroundColor: 'rgb(255, 214, 10)',
      labelColor: 'rgb(110, 80, 0)',
      barcodes: [{ format: 'PKBarcodeFormatAztec', message: 'SF26-7788-WEEKEND', messageEncoding: 'utf-8', altText: '7788' }],
      eventTicket: {
        headerFields: [{ key: 'type', label: 'TYPE', value: 'WEEKEND' }],
        primaryFields: [{ key: 'name', label: 'EVENT', value: 'OPEN_AIR' }],
        secondaryFields: [
          { key: 'from', label: 'FROM', value: inDays(60, 12), dateStyle: 'PKDateStyleShort' },
          { key: 'to', label: 'TO', value: inDays(62, 23), dateStyle: 'PKDateStyleShort' },
        ],
        auxiliaryFields: [{ key: 'camp', label: 'CAMPING', value: 'INCLUDED' }],
        backFields: [{ key: 'info', label: 'INFO', value: 'INFO_TEXT' }],
      },
    },
    files: {
      'en.lproj/pass.strings': '"TYPE" = "Type"; "WEEKEND" = "Weekend"; "EVENT" = "Event"; "OPEN_AIR" = "Open Air Festival"; "FROM" = "From"; "TO" = "To"; "CAMPING" = "Camping"; "INCLUDED" = "Included"; "INFO" = "Info"; "INFO_TEXT" = "Wristbands are exchanged at the main gate.";',
      'de.lproj/pass.strings': '"TYPE" = "Typ"; "WEEKEND" = "Wochenende"; "EVENT" = "Veranstaltung"; "OPEN_AIR" = "Open-Air-Festival"; "FROM" = "Von"; "TO" = "Bis"; "CAMPING" = "Camping"; "INCLUDED" = "Inklusive"; "INFO" = "Info"; "INFO_TEXT" = "Bändchen gibt es am Haupteingang.";',
    },
  }),

  /** Code 128 and long values, to exercise Pretext shrinking and truncation. */
  stadium: (): ApplePassSource => ({
    pass: {
      ...base,
      serialNumber: 'S-9001',
      organizationName: 'City Stadium',
      description: 'Match ticket',
      logoText: 'Metropolitan City Football Club Stadium',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(0, 102, 68)',
      labelColor: 'rgb(170, 230, 200)',
      barcodes: [{ format: 'PKBarcodeFormatCode128', message: '900112345678', messageEncoding: 'iso-8859-1', altText: '9001 1234 5678' }],
      eventTicket: {
        headerFields: [
          { key: 'block', label: 'Block', value: 'N4' },
          { key: 'kickoff', label: 'Kick-off', value: '15:00' },
        ],
        primaryFields: [{ key: 'match', label: 'Match', value: 'Metropolitan City vs. Riverside Athletic' }],
        secondaryFields: [
          { key: 'comp', label: 'Competition', value: 'National Championship League Round 12' },
          { key: 'date', label: 'Date', value: inDays(3, 15), dateStyle: 'PKDateStyleMedium' },
        ],
        auxiliaryFields: [
          { key: 'entrance', label: 'Entrance', value: 'Turnstile 14' },
          { key: 'row', label: 'Row', value: '22' },
          { key: 'seat', label: 'Seat', value: '118' },
          { key: 'cat', label: 'Category', value: 'Adult Season Ticket Holder' },
        ],
        backFields: [{ key: 'policy', label: 'Ground regulations', value: 'Entry is subject to the ground regulations published at https://example.com/regs.' }],
      },
    },
    files: {
      'logo@2x.png': img.logo(),
      'strip@2x.png': img.strip('#00442d', '#16a34a'),
    },
  }),

  /** Expired pass: Wallet dims the barcode. */
  expired: (): ApplePassSource => {
    const s = samples.concert()
    return { ...s, pass: { ...s.pass, serialNumber: 'C-OLD', expirationDate: inDays(-1) } }
  },
}

export type SampleName = keyof typeof samples
