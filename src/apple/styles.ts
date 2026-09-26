import type { AppleTokens } from './tokens.js'

export function eventTicketCss(tk: AppleTokens): string {
  const r = tk.notch.radius
  // Top-centre semicircle cut out of the card, plus a hairline of antialiasing.
  const notchMask = `radial-gradient(circle ${r}px at 50% 0, transparent ${r - 0.5}px, #000 ${r}px)`
  return /* css */ `
:host { display: inline-block; }
* { box-sizing: border-box; }
.pass {
  width: ${tk.card.width}px;
  height: ${tk.card.height}px;
  perspective: 1400px;
  -webkit-font-smoothing: antialiased;
  font-family: var(--wp-font);
  text-rendering: optimizeLegibility;
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
  border-radius: ${tk.card.radius}px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.shadow {
  position: absolute;
  inset: 0;
  border-radius: ${tk.card.radius}px;
  box-shadow: ${tk.card.shadow};
  -webkit-mask: ${notchMask};
  mask: ${notchMask};
  pointer-events: none;
}
.front {
  background: var(--wp-bg);
  color: var(--wp-fg);
  -webkit-mask: ${notchMask};
  mask: ${notchMask};
}
.back {
  transform: rotateY(180deg);
  background: ${tk.back.background};
  color: #000;
  display: flex;
  flex-direction: column;
}

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
  height: ${tk.header.height}px;
  margin-top: ${tk.header.paddingTop}px;
  padding: 0 ${tk.card.paddingX}px;
  gap: ${tk.header.logoTextGap}px;
}
.logo { display: block; flex: none; object-fit: contain; }
.logo-text { flex: 1 1 auto; min-width: 0; }
.header-fields { display: flex; gap: ${tk.header.fieldGap}px; margin-left: auto; flex: none; }

.field { flex: none; min-width: 0; }
.label { color: var(--wp-label); display: block; }
.value { color: var(--wp-fg); display: block; }
.label, .value, .logo-text, .alt-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.strip { position: relative; overflow: hidden; }
.strip > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.strip .primary {
  position: relative;
  margin: 0 ${tk.card.paddingX}px;
  padding-top: ${tk.primary.strip.paddingTop}px;
}

.top { display: flex; padding: 0 ${tk.card.paddingX}px; gap: ${tk.thumbnail.gap}px; }
.top-main { flex: 1 1 auto; min-width: 0; }
.top .primary { margin-top: ${tk.primary.plain.marginTop}px; }
.thumbnail { flex: none; object-fit: contain; margin-top: ${tk.primary.plain.marginTop}px; }

.row { display: flex; justify-content: space-between; gap: ${tk.rows.gap}px; margin-top: ${tk.rows.spacing}px; }
.row.first { margin-top: ${tk.rows.firstMarginTop}px; }
.rows { padding: 0 ${tk.card.paddingX}px; }
.top .row { padding: 0; }

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
  padding: ${tk.barcode.boxPadding}px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.barcode-svg svg { display: block; }
.alt-text { color: #000; text-align: center; margin-top: ${tk.barcode.altText.marginTop}px; max-width: 100%; }
.is-invalid .barcode-box { opacity: 0.25; }

.info-button, .done-button {
  appearance: none;
  border: 0;
  cursor: pointer;
  font: inherit;
}
.info-button {
  position: absolute;
  right: 10px;
  bottom: 10px;
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
  padding: 14px ${tk.card.paddingX}px 10px;
  font-size: 17px;
  font-weight: 600;
  gap: 12px;
}
.back-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.done-button { background: none; color: ${tk.back.link}; font-size: 17px; font-weight: 600; padding: 0; }
.back-list {
  flex: 1 1 auto;
  overflow-y: auto;
  margin: 0 ${tk.card.paddingX}px ${tk.card.paddingX}px;
  background: #fff;
  border-radius: 10px;
  padding: 0 ${tk.card.paddingX}px;
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
