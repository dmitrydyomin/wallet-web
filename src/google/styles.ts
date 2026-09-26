import type { GoogleTokens } from './tokens.js'

export function googlePassCss(tk: GoogleTokens): string {
  const c = tk.classic
  const f = tk.fullscreen
  return /* css */ `
:host { display: inline-block; }
* { box-sizing: border-box; }
.gpass {
  position: relative;
  overflow: hidden;
  font-family: var(--gw-font);
  color: var(--gw-text);
  -webkit-font-smoothing: antialiased;
}
.rounded { font-variation-settings: "ROND" 100; }
.title, .header, .subheader, .label, .value, .alt-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.value, .alt-text { color: var(--gw-secondary); }
.logo { display: block; flex: none; border-radius: 50%; object-fit: cover; background: #fff; }
.hero { display: block; object-fit: cover; }
.row { display: flex; justify-content: space-between; gap: var(--gw-row-gap); }
.field { flex: none; min-width: 0; display: flex; flex-direction: column; }
.barcode { display: flex; flex-direction: column; align-items: center; }
.barcode-box { background: #fff; }
.barcode-svg svg { display: block; }
.alt-text { text-align: center; max-width: 100%; }
.is-inactive .barcode-box { opacity: 0.3; }

/* Classic card ("Pass (QR)") */
.classic {
  width: ${c.width}px;
  border-radius: ${c.radius}px;
  background: var(--gw-bg);
  --gw-row-gap: ${c.rows.gap}px;
}
.classic .top {
  display: flex;
  align-items: flex-start;
  height: ${c.top.height}px;
  padding: ${c.top.logo.top}px 0 0 ${c.top.logo.left}px;
  gap: ${c.top.titleGap}px;
  border-bottom: ${c.top.separator.width}px solid var(--gw-separator);
}
.classic .top .title { margin-top: ${(c.top.logo.size - c.top.title.lineHeight) / 2}px; }
.classic .body { padding: ${c.subheader.marginTop}px ${c.paddingX}px 0; }
.classic .subheader + .header { margin-top: ${c.header.marginTop}px; }
.classic .rows { margin-top: ${c.rows.marginTop}px; }
.classic .row + .row { margin-top: ${c.rows.spacing}px; }
.classic .barcode { margin-top: ${c.barcode.marginTop}px; }
.classic .barcode-box { border-radius: ${c.barcode.radius}px; }
.classic .alt-text { margin-top: ${c.barcode.altText.marginTop}px; }
.classic .hero { margin-top: ${c.hero.marginTop}px; }
.classic .end { height: ${c.paddingBottom}px; }
/* Drawn as an overlay so the hero image doesn't cover it. */
.classic .border {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 ${c.border.width}px var(--gw-border);
  pointer-events: none;
}

/* Full-screen pass view ("Pass (QR) [New]") */
.fullscreen {
  width: ${f.width}px;
  min-height: ${f.minHeight}px;
  padding-top: ${f.paddingTop}px;
  background: linear-gradient(var(--gw-bg) ${f.gradient.stop}%, color-mix(in srgb, var(--gw-bg) ${100 - f.gradient.darken * 100}%, black));
  text-align: center;
  --gw-row-gap: ${f.rows.gap}px;
}
.fullscreen .logo { margin: 0 auto; box-shadow: 0 0 0 ${f.logo.border.width}px ${f.logo.border.color}; }
.fullscreen .title { margin: ${f.title.marginTop}px auto 0; }
.fullscreen .header { margin: ${f.header.marginTop}px auto 0; }
.fullscreen .subheader { margin: ${f.subheader.marginTop}px auto 0; }
.fullscreen .barcode { margin-top: ${f.barcode.marginTop}px; }
.fullscreen .barcode-box { border-radius: ${f.barcode.radius}px; }
.fullscreen .alt-text { margin-top: ${f.barcode.altText.marginTop}px; }
.fullscreen .rows { margin-top: ${f.rows.marginTop}px; padding: 0 ${f.paddingX}px; text-align: left; }
.fullscreen .row + .row { margin-top: ${f.rows.spacing}px; }
.fullscreen .value { margin-top: ${f.value.marginTop}px; }
.fullscreen .hero { margin-top: ${f.hero.marginTop}px; }
.fullscreen .end { height: ${f.paddingBottom}px; }
`
}
