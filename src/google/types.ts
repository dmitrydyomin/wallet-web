/**
 * Subset of the Google Wallet REST resources relevant to rendering event tickets.
 * https://developers.google.com/wallet/reference/rest/v1/eventticketclass
 * https://developers.google.com/wallet/reference/rest/v1/eventticketobject
 */

export interface TranslatedString {
  language: string
  value: string
}

export interface LocalizedString {
  defaultValue?: TranslatedString
  translatedValues?: TranslatedString[]
}

export interface GoogleImage {
  sourceUri: { uri: string }
  contentDescription?: LocalizedString
}

export type GoogleBarcodeType =
  | 'QR_CODE'
  | 'PDF_417'
  | 'AZTEC'
  | 'CODE_128'
  | 'CODE_39'
  | 'EAN_13'
  | 'EAN_8'
  | 'UPC_A'
  | 'ITF_14'
  | 'DATA_MATRIX'
  | 'TEXT_ONLY'

export interface GoogleBarcode {
  type?: GoogleBarcodeType
  value?: string
  alternateText?: string
}

export interface TextModuleData {
  id?: string
  header?: string
  body?: string
  localizedHeader?: LocalizedString
  localizedBody?: LocalizedString
}

export interface EventDateTime {
  start?: string
  end?: string
  doorsOpen?: string
}

export interface EventVenue {
  name?: LocalizedString
  address?: LocalizedString
}

export interface EventSeat {
  seat?: LocalizedString
  row?: LocalizedString
  section?: LocalizedString
  gate?: LocalizedString
}

export interface FieldReference {
  fieldPath: string
  dateFormat?: 'DATE_TIME' | 'DATE_ONLY' | 'TIME_ONLY' | 'DATE_TIME_YEAR' | 'DATE_YEAR' | 'YEAR_MONTH' | 'YEAR_MONTH_DAY'
}

export interface TemplateItem {
  firstValue?: { fields: FieldReference[] }
  secondValue?: { fields: FieldReference[] }
}

export interface CardRowTemplateInfo {
  oneItem?: { item: TemplateItem }
  twoItems?: { startItem: TemplateItem; endItem: TemplateItem }
  threeItems?: { startItem: TemplateItem; middleItem: TemplateItem; endItem: TemplateItem }
}

export interface ClassTemplateInfo {
  cardTemplateOverride?: { cardRowTemplateInfos?: CardRowTemplateInfo[] }
}

export interface EventTicketClass {
  id: string
  issuerName?: string
  localizedIssuerName?: LocalizedString
  eventName?: LocalizedString
  logo?: GoogleImage
  wideLogo?: GoogleImage
  heroImage?: GoogleImage
  hexBackgroundColor?: string
  venue?: EventVenue
  dateTime?: EventDateTime
  textModulesData?: TextModuleData[]
  classTemplateInfo?: ClassTemplateInfo
  customSectionLabel?: LocalizedString
  customRowLabel?: LocalizedString
  customSeatLabel?: LocalizedString
  customGateLabel?: LocalizedString
  [key: string]: unknown
}

export interface EventTicketObject {
  id: string
  classId: string
  state?: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'INACTIVE' | 'STATE_UNSPECIFIED'
  barcode?: GoogleBarcode
  seatInfo?: EventSeat
  ticketHolderName?: string
  ticketNumber?: string
  ticketType?: LocalizedString
  hexBackgroundColor?: string
  logo?: GoogleImage
  heroImage?: GoogleImage
  textModulesData?: TextModuleData[]
  validTimeInterval?: { start?: { date: string }; end?: { date: string } }
  [key: string]: unknown
}

/** A ticket to render: the object plus the class it references. */
export interface GooglePassSource {
  class: EventTicketClass
  object: EventTicketObject
}

/** Claims of a "Save to Google Wallet" JWT. */
export interface SaveToWalletClaims {
  payload: {
    eventTicketClasses?: EventTicketClass[]
    eventTicketObjects?: EventTicketObject[]
  }
  [key: string]: unknown
}
