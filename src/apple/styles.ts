import { eventTicketMask } from './shape.js'
import type { AppleTokens } from './tokens.js'

export function eventTicketCss(tk: AppleTokens): string {
  const mask = eventTicketMask(tk)
  const px = tk.card.paddingX
  return /* css */ `
:host { display: inline-block; }
* { box-sizing: border-box; }
.pass {
  width: ${tk.card.width}px;
  height: ${tk.card.height}px;
  position: relative;
  perspective: 1400px;
  -webkit-font-smoothing: antialiased;
  font-family: var(--wp-font);
  text-rendering: optimizeLegibility;
}
.glow {
  position: absolute;
  left: ${tk.glow.insetX}px;
  right: ${tk.glow.insetX}px;
  top: ${tk.glow.top}px;
  bottom: ${tk.glow.bottom}px;
  border-radius: ${tk.glow.radius}px;
  background: var(--wp-bg);
  filter: blur(${tk.glow.blur}px);
  opacity: ${tk.glow.opacity};
  pointer-events: none;
}
.flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.1, 0.2, 1);
}
.flipper.is-flipped { transform: rotateY(180deg); }
.face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  -webkit-mask: ${mask};
  mask: ${mask};
}
.front { background: var(--wp-bg); color: var(--wp-fg); }
.back {
  transform: rotateY(180deg);
  background: ${tk.back.background};
  color: #000;
  display: flex;
  flex-direction: column;
}
.border { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

.bg-image {
  position: absolute;
  inset: -24px;
  background-size: cover;
  background-position: center;
  filter: blur(10px);
}
.content { position: relative; height: 100%; }

.header {
  display: flex;
  align-items: center;
  box-sizing: content-box;
  height: ${tk.header.height}px;
  padding: ${tk.header.paddingY}px ${px}px;
  gap: ${tk.header.logoTextGap}px;
}
.logo { display: block; flex: none; object-fit: contain; }
.logo-text { flex: 0 1 auto; min-width: 0; }
.header-fields { display: flex; gap: ${tk.header.gap}px; margin-left: auto; flex: none; }

/* Column flex so the labels' negative block margins (below) don't collapse with the value's. */
.field { flex: none; min-width: 0; display: flex; flex-direction: column; }
.label {
  color: var(--wp-label);
  display: block;
  /* Uppercase-aware punctuation, as in the mockup. */
  font-feature-settings: "case" 1;
}
.value { color: var(--wp-fg); display: block; }
.label, .value, .logo-text, .alt-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* Labels use a 10px line box, tighter than the glyphs: pad the clip box so
     ascenders/descenders aren't cut, and cancel the padding out of the layout. */
  padding-block: 3px;
  margin-block: -3px;
}

.strip { position: relative; overflow: hidden; }
.strip > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.strip .primary { position: relative; margin: 0 ${px}px; padding-top: ${tk.primary.strip.paddingTop}px; }

.top { display: flex; padding: 0 ${px}px; gap: ${tk.thumbnail.gap}px; }
.top-main { flex: 1 1 auto; min-width: 0; }
.top .primary { margin-top: ${tk.primary.plain.marginTop}px; }
.thumbnail { flex: none; object-fit: contain; margin-top: ${tk.primary.plain.marginTop}px; }

.rows { padding: ${tk.rows.paddingTop}px ${px}px 0; }
/* Secondary row beside the thumbnail; the auxiliary row then follows at row spacing. */
.top .rows { padding: ${tk.rows.paddingTop}px 0 0; }
.rows.continued { padding-top: ${tk.rows.spacing}px; }
.row { display: flex; justify-content: space-between; gap: ${tk.rows.gap}px; }
.row + .row { margin-top: ${tk.rows.spacing}px; }

.barcode-area {
  position: absolute;
  left: 0;
  right: 0;
  bottom: ${tk.barcode.marginBottom}px;
  display: flex;
  justify-content: center;
}
.barcode-box {
  background: #fff;
  border-radius: ${tk.barcode.boxRadius}px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.barcode-svg svg { display: block; }
.alt-text { color: #000; text-align: center; margin-top: ${tk.barcode.altText.marginTop}px; max-width: 100%; }
.is-invalid .barcode-box { opacity: 0.25; }

.icon {
  position: absolute;
  left: ${tk.icon.inset}px;
  bottom: ${tk.icon.inset}px;
  width: ${tk.icon.size}px;
  height: ${tk.icon.size}px;
  border-radius: ${tk.icon.radius}px;
  box-shadow: 0 0 0 0.5px ${tk.icon.border};
  object-fit: cover;
}

.info-button, .done-button {
  appearance: none;
  border: 0;
  cursor: pointer;
  font: inherit;
}
.info-button {
  position: absolute;
  right: 7px;
  bottom: 7px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  color: var(--wp-fg);
  opacity: 0.8;
  padding: 0;
  display: grid;
  place-items: center;
}
.info-button svg { width: 22px; height: 22px; }

.back-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px ${px}px 10px;
  font-size: 17px;
  font-weight: 600;
  gap: 12px;
}
.back-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.done-button { background: none; color: ${tk.back.link}; font-size: 17px; font-weight: 600; padding: 0; }
.back-list {
  flex: 1 1 auto;
  overflow-y: auto;
  margin: 0 ${px}px ${px}px;
  background: #fff;
  border-radius: 10px;
  padding: 0 ${px}px;
}
.back-field { padding: ${tk.back.rowPaddingY}px 0; }
.back-field + .back-field { border-top: 0.5px solid rgba(60, 60, 67, 0.29); }
.back-label { font-size: ${tk.back.label.size}px; line-height: ${tk.back.label.lineHeight}px; color: rgba(60, 60, 67, 0.6); }
.back-value {
  font-size: ${tk.back.value.size}px;
  line-height: ${tk.back.value.lineHeight}px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.back-value a { color: ${tk.back.link}; text-decoration: none; }
`
}
