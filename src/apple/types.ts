/**
 * Subset of the Apple Wallet pass.json schema relevant to rendering.
 * https://developer.apple.com/documentation/walletpasses/pass
 */

export type PKTextAlignment =
  | 'PKTextAlignmentLeft'
  | 'PKTextAlignmentCenter'
  | 'PKTextAlignmentRight'
  | 'PKTextAlignmentNatural'

export type PKDateStyle =
  | 'PKDateStyleNone'
  | 'PKDateStyleShort'
  | 'PKDateStyleMedium'
  | 'PKDateStyleLong'
  | 'PKDateStyleFull'

export type PKNumberStyle =
  | 'PKNumberStyleDecimal'
  | 'PKNumberStylePercent'
  | 'PKNumberStyleScientific'
  | 'PKNumberStyleSpellOut'

export type PKBarcodeFormat =
  | 'PKBarcodeFormatQR'
  | 'PKBarcodeFormatPDF417'
  | 'PKBarcodeFormatAztec'
  | 'PKBarcodeFormatCode128'

export interface PassField {
  key: string
  value: string | number
  label?: string
  attributedValue?: string | number
  changeMessage?: string
  textAlignment?: PKTextAlignment
  dateStyle?: PKDateStyle
  timeStyle?: PKDateStyle
  ignoresTimeZone?: boolean
  isRelative?: boolean
  numberStyle?: PKNumberStyle
  currencyCode?: string
  dataDetectorTypes?: string[]
}

export interface PassStructure {
  headerFields?: PassField[]
  primaryFields?: PassField[]
  secondaryFields?: PassField[]
  auxiliaryFields?: PassField[]
  backFields?: PassField[]
}

export interface PassBarcode {
  format: PKBarcodeFormat
  message: string
  messageEncoding?: string
  altText?: string
}

export interface PassJson {
  formatVersion: number
  passTypeIdentifier?: string
  serialNumber?: string
  teamIdentifier?: string
  organizationName?: string
  description?: string
  logoText?: string
  foregroundColor?: string
  backgroundColor?: string
  labelColor?: string
  barcode?: PassBarcode
  barcodes?: PassBarcode[]
  relevantDate?: string
  expirationDate?: string
  voided?: boolean
  suppressStripShine?: boolean
  eventTicket?: PassStructure
  boardingPass?: PassStructure & { transitType?: string }
  coupon?: PassStructure
  storeCard?: PassStructure
  generic?: PassStructure
  [key: string]: unknown
}

export type PassImageName = 'icon' | 'logo' | 'strip' | 'background' | 'thumbnail' | 'footer'

/** Image files keyed by their file name (e.g. `logo@2x.png`, `de.lproj/strip.png`). */
export type PassFiles = Record<string, Blob | Uint8Array | string>

/**
 * A pass that has been read from a `.pkpass` bundle or assembled by hand.
 * Image values may be Blobs, raw bytes, or URLs (http(s), blob:, data:).
 */
export interface ApplePassSource {
  pass: PassJson
  files?: PassFiles
}
