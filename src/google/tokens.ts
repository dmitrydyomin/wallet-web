/**
 * Visual constants for Google Wallet passes, in dp. Figma frames are drawn at
 * 3× (px / 3 = dp): "Pass (QR)" (node 1:123) is the classic card,
 * "Pass (QR) [New]" (node 1:137) the full-screen pass view.
 * Text line heights are Google Sans Flex's "normal" (≈1.26 × size).
 */
const lh = (size: number) => +(size * 1.26).toFixed(2)

export const googleTokens = {
  fontFamily: '"Google Sans Flex", "Google Sans", Roboto, Arial, sans-serif',

  defaults: { background: '#e0e6ef' },
  /**
   * Text and hairline colors on light / dark backgrounds. The mockup's separator (#cdd2dc) and
   * border (#c8cdca) on #e0e6ef are ~8–10% black, so hairlines are expressed as overlays.
   */
  lightText: { text: '#000000', secondary: '#202124', separator: 'rgba(0, 0, 0, 0.085)', border: 'rgba(0, 0, 0, 0.1)' },
  darkText: { text: '#ffffff', secondary: '#ffffff', separator: 'rgba(255, 255, 255, 0.16)', border: 'rgba(255, 255, 255, 0.12)' },

  classic: {
    width: 320,
    radius: 22.33,
    border: { width: 0.67 },
    paddingX: 12,
    top: {
      height: 55,
      logo: { size: 26, left: 12.33, top: 15.33 },
      titleGap: 13,
      title: { size: 14, weight: 500, lineHeight: lh(14) },
      separator: { width: 0.67 },
    },
    subheader: { size: 14, weight: 500, lineHeight: lh(14), marginTop: 11.67, rounded: false },
    header: { size: 26.17, weight: 500, lineHeight: lh(26.17), marginTop: 3, minSize: 18, rounded: true },
    rows: { marginTop: 13.33, spacing: 10, gap: 12 },
    label: { size: 11.33, weight: 400, lineHeight: lh(11.33), letterSpacing: 0.11, rounded: false },
    value: { size: 14.17, weight: 500, lineHeight: lh(14.17), rounded: false },
    barcode: {
      marginTop: 23,
      radius: 13,
      square: { width: 108.33, height: 108.33, pad: 20.67 },
      /** Not in mockup. */
      linear: { width: 240, height: 64, pad: 16 },
      altText: { size: 14.17, weight: 500, lineHeight: lh(14.17), marginTop: 10.33, rounded: false },
    },
    hero: { marginTop: 9, aspect: 1032 / 336 },
    /** Bottom padding when there is no hero image (not in mockup). */
    paddingBottom: 16,
  },

  fullscreen: {
    width: 360,
    /** The frame is a full phone screen; content shorter than this still fills it. */
    minHeight: 808,
    paddingTop: 103.83,
    paddingX: 16,
    /** Background runs from the pass color to a 5% darker shade. */
    gradient: { stop: 24.52, darken: 0.05 },
    logo: { size: 68.67, border: { width: 1, color: '#dddedb' } },
    title: { size: 14, weight: 500, lineHeight: lh(14), marginTop: 16.17 },
    header: { size: 38.17, weight: 600, lineHeight: lh(38.17), marginTop: 6.67, minSize: 24, rounded: true },
    subheader: { size: 14, weight: 500, lineHeight: lh(14), marginTop: 6.67, rounded: false },
    barcode: {
      marginTop: 15,
      radius: 11.67,
      square: { width: 108.33, height: 108.33, pad: 20.67 },
      /** Not in mockup. */
      linear: { width: 260, height: 64, pad: 16 },
      altText: { size: 12.33, weight: 600, lineHeight: lh(12.33), marginTop: 7.67, rounded: true },
    },
    rows: { marginTop: 34.33, spacing: 12, gap: 12 },
    label: { size: 12.33, weight: 400, lineHeight: lh(12.33), letterSpacing: 0.25, rounded: false },
    value: { size: 13.67, weight: 600, lineHeight: lh(13.67), marginTop: 2.33, rounded: true },
    hero: { marginTop: 28, aspect: 1032 / 336 },
    paddingBottom: 24,
  },
} as const

export type GoogleTokens = typeof googleTokens
export type GoogleVariant = 'classic' | 'fullscreen'
