import type { Meta, StoryObj } from '@storybook/html-vite'
import { useMemo, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ApplePass, GooglePass, type ApplePassHandle } from '../src/react/index.js'
import { googleSamples } from './google-samples.js'
import { samples } from './samples.js'

function Demo() {
  const applePass = useMemo(() => samples.mockup(), [])
  const googlePass = useMemo(() => googleSamples.mockup(), [])
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [variant, setVariant] = useState<'classic' | 'fullscreen'>('classic')
  const apple = useRef<ApplePassHandle>(null)

  return (
    <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap', font: '14px system-ui' }}>
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
        <ApplePass ref={apple} pass={applePass} side={side} fallback={<div style={{ width: 358, height: 502 }}>Loading…</div>} />
        <button onClick={() => setSide(s => (s === 'front' ? 'back' : 'front'))}>Flip ({side})</button>
      </div>
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
        <GooglePass pass={googlePass} variant={variant} />
        <button onClick={() => setVariant(v => (v === 'classic' ? 'fullscreen' : 'classic'))}>Variant ({variant})</button>
      </div>
    </div>
  )
}

let root: Root | undefined

const meta: Meta = {
  title: 'React/Components',
  render: () => {
    root?.unmount()
    const el = document.createElement('div')
    root = createRoot(el)
    root.render(<Demo />)
    return el
  },
  globals: { backgrounds: { value: 'light' } },
}

export default meta

/** `<ApplePass>` and `<GooglePass>` with state-driven props. */
export const Components: StoryObj = {}
