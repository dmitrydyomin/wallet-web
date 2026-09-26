/**
 * Wallet's pass.json parser tolerates things JSON.parse rejects (BOM, trailing
 * commas), and real-world passes rely on that. Strip them before parsing.
 */
export function parseLenientJson(text: string): unknown {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  try {
    return JSON.parse(src)
  } catch {
    return JSON.parse(stripTrailingCommas(src))
  }
}

function stripTrailingCommas(src: string): string {
  let out = ''
  let inString = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!
    if (inString) {
      out += ch
      if (ch === '\\') out += src[++i] ?? ''
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      out += ch
      continue
    }
    if (ch === ',') {
      let j = i + 1
      while (j < src.length && /\s/.test(src[j]!)) j++
      if (src[j] === '}' || src[j] === ']') continue
    }
    out += ch
  }
  return out
}
