/**
 * Visual constants for the iOS Wallet pass, in design pixels (1 = 1pt on iOS).
 * The card is laid out at `card.width` and scaled as a whole with CSS `zoom`.
 *
 * These are first-pass values; replace them with measurements from the Figma
 * mockups. Everything the renderer draws is driven from here.
 */
export const appleTokens = {
  /** SF Pro is not web-licensed, so it's only used when installed locally; Inter is the closest free substitute. */
  fontFamily: '"SF Pro Text", "SF Pro", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',

  card: {
    width: 360,
    height: 460,
    radius: 12,
    paddingX: 16,
    shadow: '0 1px 2px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.18)',
  },

  /** Semicircular cutout at the top centre that marks a pass as an event ticket. */
  notch: { radius: 16 },

  header: {
    paddingTop: 6,
    height: 50,
    logoMaxWidth: 160,
    logoMaxHeight: 44,
    logoTextGap: 8,
    fieldGap: 14,
  },

  logoText: { size: 17, weight: 600, minSize: 13 },

  label: { size: 11, weight: 600, lineHeight: 14, letterSpacing: 0.3, uppercase: true },

  headerValue: { size: 17, weight: 400, lineHeight: 22, minSize: 12 },

  primary: {
    /** Primary field drawn over the strip image. */
    strip: { size: 30, weight: 400, lineHeight: 36, minSize: 16, paddingTop: 10 },
    /** Primary field on a plain/background-image pass, beside the thumbnail. */
    plain: { size: 26, weight: 400, lineHeight: 32, minSize: 16, marginTop: 6 },
  },

  field: { size: 17, weight: 400, lineHeight: 22, minSize: 11 },

  rows: { gap: 12, spacing: 10, firstMarginTop: 10 },

  /** Apple's event-ticket strip is 375×98pt, stretched to the card width. */
  strip: { aspect: 375 / 98 },

  thumbnail: { maxWidth: 90, maxHeight: 90, gap: 12 },

  barcode: {
    marginBottom: 18,
    boxRadius: 8,
    boxPadding: 10,
    squareSize: 140,
    pdf417: { width: 260, height: 84 },
    code128: { width: 260, height: 72 },
    altText: { size: 11, weight: 500, lineHeight: 14, marginTop: 6, minSize: 8 },
  },

  back: {
    background: '#f2f2f7',
    rowPaddingY: 12,
    label: { size: 13, weight: 400, lineHeight: 18 },
    value: { size: 17, weight: 400, lineHeight: 22 },
    link: '#007aff',
  },

  /** Colors Wallet falls back to when pass.json omits them. */
  defaults: {
    background: 'rgb(255, 255, 255)',
    foreground: 'rgb(0, 0, 0)',
  },

  /** Field count limits Wallet applies to event tickets; extras are dropped. */
  maxFields: { header: 3, primary: 1, secondary: 4, auxiliary: 4 },
} as const

export type AppleTokens = typeof appleTokens
