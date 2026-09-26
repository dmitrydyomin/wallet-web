/**
 * Visual constants for the iOS Wallet pass, in design pixels (1 = 1pt on iOS).
 * The card is laid out at `card.width` and scaled as a whole with CSS `zoom`.
 *
 * Values come from the "Apple Event Ticket" frame in the Figma mockup
 * (Apple-Google-wallet-event-passes, node 1:64) unless marked "not in mockup".
 */
export const appleTokens = {
  /**
   * SF Pro is not web-licensed, so it's only used when installed locally; Inter is the closest free substitute.
   * Like iOS, text of `displayMinSize` pt and up uses the Display cut.
   */
  fontFamily: '"SF Pro Text", "SF Pro", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
  displayFontFamily: '"SF Pro Display", "SF Pro", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
  displayMinSize: 20,

  card: {
    width: 358,
    height: 502,
    radius: 0,
    paddingX: 16,
    /** 1px inside stroke that follows the card outline, notch included. */
    border: 'rgba(0, 0, 0, 0.16)',
    borderWidth: 1,
  },

  /** Soft glow under the card in the pass's background color (from the iPhone example, node 1:481). */
  glow: { insetX: 20, top: 30, bottom: -10, blur: 18, opacity: 0.35, radius: 12 },

  /** Top-centre cutout marking an event ticket: a circle centred `offset` above the top edge (63×16 visible arc). */
  notch: { radius: 39, offset: 23 },

  header: {
    paddingY: 12,
    /** Content height: label (10) + 21pt value (25). */
    height: 35,
    logoMaxWidth: 160,
    logoMaxHeight: 32,
    /** Logo → logo text (from the iPhone example). */
    logoTextGap: 6,
    /** Logo/logo text → header fields, and between header fields. */
    gap: 16,
  },

  /** From the iPhone example header ("Bowled Over"). */
  logoText: { size: 19, weight: 500, lineHeight: 25, minSize: 13 },

  label: { size: 11, weight: 600, lineHeight: 10, letterSpacing: 0, uppercase: true },

  headerValue: { size: 21, weight: 400, lineHeight: 25, minSize: 13 },

  primary: {
    /** Primary field drawn over the strip image (not in mockup). */
    strip: { size: 30, weight: 400, lineHeight: 36, minSize: 16, paddingTop: 10 },
    /** Primary field on a plain/background-image pass, beside the thumbnail (not in mockup). */
    plain: { size: 26, weight: 400, lineHeight: 32, minSize: 16, marginTop: 4 },
  },

  secondary: { size: 21, weight: 400, lineHeight: 25, minSize: 13 },
  auxiliary: { size: 17, weight: 400, lineHeight: 20, minSize: 11 },

  rows: {
    /** Fields area padding above the first row. */
    paddingTop: 12,
    /** Vertical gap between the secondary and auxiliary rows. */
    spacing: 24,
    /** Minimum horizontal gap between fields in a row. */
    gap: 12,
  },

  strip: { height: 92 },

  /** Not in mockup. */
  thumbnail: { maxWidth: 90, maxHeight: 90, gap: 12 },

  barcode: {
    /** White box sits 16pt above the card's bottom edge. */
    marginBottom: 16,
    boxRadius: 5,
    /** Code size and box padding per barcode kind. */
    pdf417: { width: 205, height: 54, padX: 13.5, padY: 26 },
    /** Not in mockup; matches the PDF417 box. */
    code128: { width: 205, height: 54, padX: 13.5, padY: 26 },
    /** From the iPhone example's QR code. */
    square: { width: 115, height: 115, padX: 8, padY: 8 },
    /** Not in mockup. */
    altText: { size: 11, weight: 500, lineHeight: 14, marginTop: 4, minSize: 8 },
  },

  /** App icon (icon.png) in the bottom-left corner. */
  icon: { size: 20, inset: 7, radius: 4, border: 'rgba(0, 0, 0, 0.16)' },

  /** Not in mockup. */
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
