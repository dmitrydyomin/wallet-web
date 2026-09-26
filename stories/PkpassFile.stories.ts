import type { Meta, StoryObj } from '@storybook/html-vite'
import { renderApplePass, type RenderedPass } from '../src/index.js'

interface Args {
  zoom: number
}

const meta: Meta<Args> = {
  title: 'Apple Wallet/Open .pkpass',
  args: { zoom: 1 },
  argTypes: { zoom: { control: { type: 'range', min: 0.5, max: 2, step: 0.05 } } },
}

export default meta

/** Pick or drop a real .pkpass file to preview it. */
export const FromFile: StoryObj<Args> = {
  name: 'From file',
  render: args => {
    const wrap = document.createElement('div')
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:16px;font:14px Inter,system-ui,sans-serif;color:#ccc'

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pkpass,application/vnd.apple.pkpass'
    const status = document.createElement('div')
    status.textContent = 'Choose or drop a .pkpass file (event tickets only)'
    const slot = document.createElement('div')

    let current: RenderedPass | undefined
    const show = async (file: File) => {
      status.textContent = file.name
      try {
        current?.destroy()
        current = await renderApplePass(file, { zoom: args.zoom })
        slot.replaceChildren(current.element)
      } catch (err) {
        status.textContent = `${file.name}: ${err instanceof Error ? err.message : String(err)}`
      }
    }

    input.addEventListener('change', () => input.files?.[0] && show(input.files[0]))
    wrap.addEventListener('dragover', e => e.preventDefault())
    wrap.addEventListener('drop', e => {
      e.preventDefault()
      const file = e.dataTransfer?.files[0]
      if (file) void show(file)
    })

    wrap.append(input, status, slot)
    return wrap
  },
}
