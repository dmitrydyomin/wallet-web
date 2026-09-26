/** Decode a pass.strings file, which may be UTF-8 or UTF-16 (with or without BOM). */
export function decodeStrings(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2))
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes.subarray(2))
  // BOM-less UTF-16 shows up as every other byte being zero for ASCII content.
  if (bytes.length >= 4 && bytes[1] === 0 && bytes[3] === 0) return new TextDecoder('utf-16le').decode(bytes)
  if (bytes.length >= 4 && bytes[0] === 0 && bytes[2] === 0) return new TextDecoder('utf-16be').decode(bytes)
  return new TextDecoder('utf-8').decode(bytes)
}

/** Parse the Apple `.strings` format: `"key" = "value";` with C-style comments. */
export function parseStrings(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  let i = 0
  const n = text.length

  const skip = () => {
    while (i < n) {
      const ch = text[i]!
      if (/\s/.test(ch) || ch === '﻿') i++
      else if (text.startsWith('//', i)) {
        const end = text.indexOf('\n', i)
        i = end < 0 ? n : end + 1
      } else if (text.startsWith('/*', i)) {
        const end = text.indexOf('*/', i + 2)
        i = end < 0 ? n : end + 2
      } else break
    }
  }

  const readToken = (): string | null => {
    skip()
    if (text[i] === '"') {
      i++
      let s = ''
      while (i < n && text[i] !== '"') {
        if (text[i] === '\\') {
          const esc = text[++i]
          i++
          if (esc === 'n') s += '\n'
          else if (esc === 't') s += '\t'
          else if (esc === 'r') s += '\r'
          else if (esc === 'U' || esc === 'u') {
            s += String.fromCharCode(parseInt(text.slice(i, i + 4), 16))
            i += 4
          } else s += esc ?? ''
        } else s += text[i++]
      }
      i++
      return s
    }
    // Unquoted keys/values are allowed for simple identifiers.
    const m = /^[A-Za-z0-9_.$:\/-]+/.exec(text.slice(i))
    if (!m) return null
    i += m[0].length
    return m[0]
  }

  while (i < n) {
    const key = readToken()
    if (key === null) {
      i++
      continue
    }
    skip()
    if (text[i] === '=') {
      i++
      const value = readToken()
      if (value !== null) out[key] = value
      skip()
    }
    if (text[i] === ';') i++
  }
  return out
}
