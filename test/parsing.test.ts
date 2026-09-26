import { describe, expect, it } from 'vitest'
import { strToU8, zipSync } from 'fflate'
import { parseLenientJson } from '../src/apple/json.js'
import { decodeStrings, parseStrings } from '../src/apple/strings.js'
import { readPkpass } from '../src/apple/pkpass.js'
import { parseColor } from '../src/core/color.js'
import { eventPass } from './helpers.js'

describe('parseLenientJson', () => {
  it('accepts BOM and trailing commas, leaving commas inside strings alone', () => {
    expect(parseLenientJson('\ufeff{"a": [1, 2,], "b": "x,}",}')).toEqual({ a: [1, 2], b: 'x,}' })
  })
})

describe('parseStrings', () => {
  it('parses quoted pairs, escapes and comments', () => {
    const text = '/* c */ "event" = "Konzert";\n// line\n"quote" = "say \\"hi\\"\\n";\nplain = "ok";'
    expect(parseStrings(text)).toEqual({ event: 'Konzert', quote: 'say "hi"\n', plain: 'ok' })
  })

  it('decodes UTF-16LE with BOM', () => {
    const s = '"a" = "ü";'
    const bytes = new Uint8Array(2 + s.length * 2)
    bytes.set([0xff, 0xfe])
    for (let i = 0; i < s.length; i++) bytes[2 + i * 2] = s.charCodeAt(i)
    expect(parseStrings(decodeStrings(bytes))).toEqual({ a: 'ü' })
  })
})

describe('parseColor', () => {
  it('parses rgb() and hex', () => {
    expect(parseColor('rgb(10, 20, 300)')).toEqual({ r: 10, g: 20, b: 255 })
    expect(parseColor('#0af')).toEqual({ r: 0, g: 170, b: 255 })
    expect(parseColor('nope')).toBeNull()
  })
})

describe('readPkpass', () => {
  it('unzips pass.json and files, tolerating a wrapping folder', async () => {
    const zip = zipSync({
      'MyPass/pass.json': strToU8(JSON.stringify(eventPass())),
      'MyPass/logo@2x.png': new Uint8Array([1, 2, 3]),
      'MyPass/de.lproj/pass.strings': strToU8('"Event" = "Veranstaltung";'),
    })
    const source = await readPkpass(zip)
    expect(source.pass.organizationName).toBe('Example Arena')
    expect(Object.keys(source.files!).sort()).toEqual(['de.lproj/pass.strings', 'logo@2x.png'])
  })
})
