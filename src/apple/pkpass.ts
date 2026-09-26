import { unzip } from 'fflate'
import { parseLenientJson } from './json.js'
import type { ApplePassSource, PassFiles, PassJson } from './types.js'

/** Read a `.pkpass` bundle (a zip archive) into a pass source. */
export async function readPkpass(input: Blob | ArrayBuffer | Uint8Array): Promise<ApplePassSource> {
  const bytes =
    input instanceof Uint8Array
      ? input
      : input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : new Uint8Array(await input.arrayBuffer())

  const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) =>
    unzip(bytes, (err, data) => (err ? reject(err) : resolve(data))),
  )

  // Some tools zip the pass inside a top-level folder; normalise paths relative to pass.json.
  const passPath = Object.keys(entries).find(p => p === 'pass.json' || p.endsWith('/pass.json'))
  if (!passPath) throw new Error('Invalid .pkpass: pass.json not found')
  const prefix = passPath.slice(0, -'pass.json'.length)

  const files: PassFiles = {}
  for (const [path, data] of Object.entries(entries)) {
    if (!path.startsWith(prefix) || path.endsWith('/') || path.includes('__MACOSX')) continue
    files[path.slice(prefix.length)] = data
  }

  const pass = parseLenientJson(new TextDecoder().decode(entries[passPath])) as PassJson
  delete files['pass.json']
  return { pass, files }
}

/** Fetch and read a `.pkpass` from a URL. */
export async function fetchPkpass(url: string, init?: RequestInit): Promise<ApplePassSource> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`Failed to fetch pass: ${res.status} ${res.statusText}`)
  return readPkpass(await res.arrayBuffer())
}
