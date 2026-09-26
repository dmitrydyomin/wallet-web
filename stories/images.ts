/** Placeholder pass artwork drawn on a canvas, returned as PNG data URLs. */

function draw(width: number, height: number, paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  paint(canvas.getContext('2d')!, width, height)
  return canvas.toDataURL('image/png')
}

/** Logo glyph: a star in a ring, @2x (so 50×50pt → 100×100px). */
export function logo(color = '#fff'): string {
  return draw(100, 100, (ctx, w, h) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 12 : 28
      const a = (Math.PI / 5) * i - Math.PI / 2
      ctx.lineTo(w / 2 + r * Math.cos(a), h / 2 + r * Math.sin(a))
    }
    ctx.closePath()
    ctx.fill()
  })
}

/** Wide wordmark logo, to exercise the 160×50pt logo box. */
export function wordmark(text: string, color = '#fff'): string {
  return draw(320, 100, (ctx, w, h) => {
    ctx.fillStyle = color
    ctx.font = '800 64px Inter, Helvetica, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 0, h / 2, w)
  })
}

/** Event-ticket strip, 375×98pt @2x: a stage with spotlights. */
export function strip(from: string, to: string): string {
  return draw(750, 196, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, from)
    g.addColorStop(1, to)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    for (const [x, r, a] of [
      [0.15, 160, 0.35],
      [0.55, 220, 0.25],
      [0.9, 140, 0.3],
    ] as const) {
      const spot = ctx.createRadialGradient(w * x, h * 1.1, 0, w * x, h * 1.1, r)
      spot.addColorStop(0, `rgba(255,255,255,${a})`)
      spot.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = spot
      ctx.fillRect(0, 0, w, h)
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(0, 0, w, h)
  })
}

/** Background image, 180×220pt @2x; Wallet blurs it. */
export function background(colors: string[]): string {
  return draw(360, 440, (ctx, w, h) => {
    ctx.fillStyle = colors[0]!
    ctx.fillRect(0, 0, w, h)
    colors.slice(1).forEach((c, i) => {
      const g = ctx.createRadialGradient(w * (0.2 + 0.6 * (i % 2)), h * (0.2 + 0.3 * i), 0, w * 0.5, h * 0.5, w)
      g.addColorStop(0, c)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    })
  })
}

/** Thumbnail, up to 90×90pt @2x: a poster. */
export function thumbnail(color: string, label: string): string {
  return draw(180, 180, (ctx, w, h) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(20, 0, w - 40, h, 12)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '700 28px Inter, Helvetica, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, w / 2, h / 2 + 10, w - 60)
  })
}
