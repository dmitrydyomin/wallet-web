import type { Meta, StoryObj } from '@storybook/html-vite'
import { renderGooglePass, type GoogleVariant, type RenderedGooglePass } from '../src/index.js'
import { googleSamples, type GoogleSampleName } from './google-samples.js'

interface Args {
  sample: GoogleSampleName
  variant: GoogleVariant
  zoom: number
  locale: string
  eventName: string
  backgroundColor: string
}

let current: RenderedGooglePass | undefined

const meta: Meta<Args> = {
  title: 'Google Wallet/Event Ticket',
  args: { sample: 'mockup', variant: 'classic', zoom: 1, locale: 'en-US', eventName: '', backgroundColor: '' },
  argTypes: {
    sample: { control: 'select', options: Object.keys(googleSamples) },
    variant: { control: 'inline-radio', options: ['classic', 'fullscreen'] },
    zoom: { control: { type: 'range', min: 0.5, max: 2, step: 0.05 } },
    locale: { control: 'select', options: ['en-US', 'en-GB', 'de-DE', 'ja-JP'] },
    backgroundColor: { control: 'color' },
  },
  loaders: [
    async ({ args }) => {
      const source = structuredClone(googleSamples[args.sample]())
      if (args.eventName) source.class.eventName = { defaultValue: { language: 'en', value: args.eventName } }
      if (args.backgroundColor) source.class.hexBackgroundColor = args.backgroundColor
      current?.destroy()
      current = await renderGooglePass(source, { variant: args.variant, zoom: args.zoom, locale: args.locale })
      return { rendered: current }
    },
  ],
  render: (_args, { loaded }) => (loaded.rendered as RenderedGooglePass).element,
  globals: { backgrounds: { value: 'light' } },
}

export default meta
type Story = StoryObj<Args>

export const Mockup: Story = { name: 'Figma mockup (classic)', args: { sample: 'mockup', variant: 'classic' } }
export const MockupFullscreen: Story = { name: 'Figma mockup (new, full screen)', args: { sample: 'mockup', variant: 'fullscreen' } }
export const Concert: Story = { args: { sample: 'concert' } }
export const ConcertFullscreen: Story = { name: 'Concert (full screen)', args: { sample: 'concert', variant: 'fullscreen' } }
export const LongText: Story = { name: 'Long text (shrink & truncate)', args: { sample: 'stadium' } }

/** Both Figma mockups side by side, like the file's Google page. */
export const Mockups: Story = {
  name: 'Figma mockups',
  loaders: [
    async ({ args }) => ({
      passes: await Promise.all(
        (['classic', 'fullscreen'] as const).map(variant => renderGooglePass(googleSamples.mockup(), { variant, zoom: args.zoom })),
      ),
    }),
  ],
  render: (_args, { loaded }) => {
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:40px;justify-content:center;align-items:flex-start;padding:24px'
    row.append(...(loaded.passes as RenderedGooglePass[]).map(p => p.element))
    return row
  },
  parameters: { layout: 'fullscreen', controls: { include: ['zoom'] } },
}
