# wallet-web

[![npm](https://img.shields.io/npm/v/wallet-web)](https://www.npmjs.com/package/wallet-web)
[![CI](https://github.com/dmitrydyomin/wallet-web/actions/workflows/ci.yml/badge.svg)](https://github.com/dmitrydyomin/wallet-web/actions/workflows/ci.yml)

Render Apple Wallet and Google Wallet event tickets in the browser, matched to the iOS Wallet and Google Wallet apps (and to our Figma mockups).

**[Live demo (Storybook)](https://dmitrydyomin.github.io/wallet-web/)**: sample passes, the Figma mockups, React components, and a viewer for your own `.pkpass` files.

**Apple:** event tickets (`eventTicket`), in both the strip-image and background/thumbnail layouts; `.lproj` localisation; date, number and currency formatting; back fields; voided and expired states.
**Google:** event tickets (`EventTicketClass` + `EventTicketObject`, or a "Save to Google Wallet" JWT), as the classic card or the new full-screen view; Google's default template and `cardTemplateOverride` rows; localized strings.
**Both:** QR, PDF417, Aztec and Code 128 barcodes; React components.
**Not supported:** other pass types, iOS 18 poster event tickets, NFC.

## React

```tsx
import { ApplePass, GooglePass } from 'wallet-web/react'

<ApplePass pass="/tickets/concert.pkpass" side={side} fallback={<Spinner />} />
<GooglePass pass={{ class: ticketClass, object: ticketObject }} variant="fullscreen" />
```

Objects passed as `pass` are compared by identity, so memoise them. Both components are client-only (the entry is marked `'use client'`) and accept every render option as a prop, plus `fallback`, `errorFallback`, `onRender` and `onError`. `<ApplePass>` exposes `flip()` through its ref.

## Vanilla

```ts
import { renderApplePass } from 'wallet-web'

const pass = await renderApplePass('/tickets/concert.pkpass', { zoom: 1 })
document.body.append(pass.element)
pass.flip('back')
```

```ts
import { renderGooglePass } from 'wallet-web'

const google = await renderGooglePass(saveToWalletJwt, { variant: 'classic' })
document.body.append(google.element)
```

Apple input can be a `.pkpass` URL, a `Blob`/`File`, an `ArrayBuffer`, or `{ pass, files }`, where `files` maps file names such as `logo@2x.png` to Blobs, bytes or URLs.

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

Every visual constant lives in [`src/apple/tokens.ts`](src/apple/tokens.ts) and [`src/google/tokens.ts`](src/google/tokens.ts), with the Figma node each value comes from. Pass `tokens` to override them.

Fonts: Google passes use Google Sans Flex (on Google Fonts). SF Pro can't be served on the web. The default stack uses SF Pro when it is installed locally, then Inter. Load your web font before rendering, or pass `fontFamily`. The renderer waits for `document.fonts` so that Pretext measures the right font.

## Development

Storybook is published to GitHub Pages at https://dmitrydyomin.github.io/wallet-web/ on every push to `main`.

```sh
pnpm storybook   # sample passes + drop-in .pkpass viewer
pnpm test
pnpm build
```

## Releasing

Releases are published to npm by [GitHub Actions](.github/workflows/release.yml) when a version tag is pushed:

```sh
npm version patch   # or minor / major: bumps package.json, commits, tags vX.Y.Z
git push --follow-tags
```

The workflow checks that the tag matches `package.json`, runs the typecheck, tests and build, then publishes with provenance. It authenticates through npm [trusted publishing](https://docs.npmjs.com/trusted-publishers) (package settings → Trusted publisher → GitHub Actions, workflow `release.yml`), falling back to an `NPM_TOKEN` repository secret.
