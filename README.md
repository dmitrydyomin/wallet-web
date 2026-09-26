# wallet-web

Render Apple Wallet passes in the browser, as close as possible to the iOS Wallet app. Google Wallet support is planned.

**Supported now:** Apple event tickets (`eventTicket`), in both the strip-image and background/thumbnail layouts; QR, PDF417, Aztec and Code 128 barcodes; `.lproj` localisation; date, number and currency formatting; the back fields; voided and expired states.
**Not supported:** other pass styles, iOS 18 poster event tickets, NFC.

```ts
import { renderApplePass } from 'wallet-web'

const pass = await renderApplePass('/tickets/concert.pkpass', { zoom: 1 })
document.body.append(pass.element)
pass.flip('back')
```

The input can be a `.pkpass` URL, a `Blob`/`File`, an `ArrayBuffer`, or `{ pass, files }`, where `files` maps file names such as `logo@2x.png` to Blobs, bytes or URLs.

Or use the custom element:

```ts
import { defineApplePassElement } from 'wallet-web'
defineApplePassElement()
// <apple-wallet-pass src="/tickets/concert.pkpass" zoom="0.8"></apple-wallet-pass>
```

## How it works

1. `readPkpass` unzips the bundle. `buildEventTicketModel` resolves localisation, formats field values and picks the image variants.
2. `layoutEventTicket` uses [Pretext](https://github.com/chenglou/pretext) to measure text without reflow. It shrinks the primary field, the logo text and crowded rows the way Wallet does, and splits row widths between fields.
3. The DOM renderer draws the card inside a Shadow DOM. Barcodes are rendered lazily with bwip-js, or with your own `barcodeRenderer`.

Every visual constant lives in [`src/apple/tokens.ts`](src/apple/tokens.ts). Pass `tokens` to override them.

Fonts: SF Pro can't be served on the web. The default stack uses SF Pro when it is installed locally, then Inter. Load your web font before rendering, or pass `fontFamily`. The renderer waits for `document.fonts` so that Pretext measures the right font.

## Development

```sh
pnpm storybook   # sample passes + drop-in .pkpass viewer
pnpm test
pnpm build
```
