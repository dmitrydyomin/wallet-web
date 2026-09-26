import type { TextMeasurer } from '../src/core/text.js'
import type { PassJson } from '../src/apple/types.js'

/** Every character is 0.6em wide: deterministic stand-in for Pretext in jsdom. */
export const fakeMeasurer: TextMeasurer = {
  width: (text, font) => text.length * font.size * 0.6 + (font.letterSpacing ?? 0) * text.length,
}

export function eventPass(overrides: Partial<PassJson> = {}): PassJson {
  return {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.example.event',
    serialNumber: '123',
    teamIdentifier: 'ABCDE12345',
    organizationName: 'Example Arena',
    description: 'Concert ticket',
    logoText: 'Arena',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(20, 30, 60)',
    labelColor: 'rgb(200, 200, 220)',
    barcodes: [{ format: 'PKBarcodeFormatQR', message: 'TICKET-123', messageEncoding: 'iso-8859-1', altText: '123' }],
    eventTicket: {
      headerFields: [{ key: 'date', label: 'Date', value: 'Oct 12' }],
      primaryFields: [{ key: 'event', label: 'Event', value: 'The Band' }],
      secondaryFields: [
        { key: 'loc', label: 'Location', value: 'Main Hall' },
        { key: 'door', label: 'Doors', value: '19:00' },
      ],
      auxiliaryFields: [
        { key: 'sec', label: 'Section', value: 'A' },
        { key: 'row', label: 'Row', value: '12' },
        { key: 'seat', label: 'Seat', value: '7' },
      ],
      backFields: [{ key: 'terms', label: 'Terms', value: 'See https://example.com/terms or call +1 555 123 4567' }],
    },
    ...overrides,
  }
}
