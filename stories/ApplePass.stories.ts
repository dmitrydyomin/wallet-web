import type { Meta, StoryObj } from '@storybook/html-vite'
import { renderApplePass, type ApplePassSource, type RenderedPass } from '../src/index.js'
import { samples, type SampleName } from './samples.js'

interface Args {
  sample: SampleName
  zoom: number
  side: 'front' | 'back'
  uppercaseLabels: boolean
  locale: string
  logoText: string
  primaryValue: string
  backgroundColor: string
  foregroundColor: string
  labelColor: string
}

/** Apply story controls on top of a sample pass. Empty controls leave the sample untouched. */
function withOverrides(source: ApplePassSource, args: Args): ApplePassSource {
  const pass = structuredClone(source.pass)
  if (args.logoText) pass.logoText = args.logoText
  if (args.backgroundColor) pass.backgroundColor = args.backgroundColor
  if (args.foregroundColor) pass.foregroundColor = args.foregroundColor
  if (args.labelColor) pass.labelColor = args.labelColor
  const primary = pass.eventTicket?.primaryFields?.[0]
  if (args.primaryValue && primary) primary.value = args.primaryValue
  return { ...source, pass }
}

let current: RenderedPass | undefined

const meta: Meta<Args> = {
  title: 'Apple Wallet/Event Ticket',
  args: {
    sample: 'mockup',
    zoom: 1,
    side: 'front',
    uppercaseLabels: true,
    locale: 'en-US',
    logoText: '',
    primaryValue: '',
    backgroundColor: '',
    foregroundColor: '',
    labelColor: '',
  },
  argTypes: {
    sample: { control: 'select', options: Object.keys(samples) },
    zoom: { control: { type: 'range', min: 0.5, max: 2, step: 0.05 } },
    side: { control: 'inline-radio', options: ['front', 'back'] },
    locale: { control: 'select', options: ['en-US', 'en-GB', 'de-DE', 'ja-JP'] },
    backgroundColor: { control: 'color' },
    foregroundColor: { control: 'color' },
    labelColor: { control: 'color' },
  },
  loaders: [
    async ({ args }) => {
      current?.destroy()
      current = await renderApplePass(withOverrides(samples[args.sample](), args), {
        zoom: args.zoom,
        side: args.side,
        uppercaseLabels: args.uppercaseLabels,
        locale: args.locale,
      })
      return { rendered: current }
    },
  ],
  render: (_args, { loaded }) => (loaded.rendered as RenderedPass).element,
}

export default meta
type Story = StoryObj<Args>

export const Mockup: Story = { name: 'Figma mockup', args: { sample: 'mockup' } }
export const MockupBowling: Story = { name: 'Figma mockup 2 (iPhone example)', args: { sample: 'mockupBowling' } }

/** Both Figma mockups side by side, to compare against the file's Apple page. */
export const Mockups: Story = {
  name: 'Figma mockups',
  loaders: [
    async ({ args }) => ({
      passes: await Promise.all(
        (['mockup', 'mockupBowling'] as const).map(name => renderApplePass(samples[name](), { zoom: args.zoom, locale: args.locale })),
      ),
    }),
  ],
  render: (_args, { loaded }) => {
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:40px;justify-content:center;padding:24px'
    row.append(...(loaded.passes as RenderedPass[]).map(p => p.element))
    return row
  },
  parameters: { controls: { include: ['zoom'] } },
  globals: { backgrounds: { value: 'light' } },
}
export const Concert: Story = { args: { sample: 'concert' } }
export const Theatre: Story = { args: { sample: 'theatre' } }
export const Festival: Story = { args: { sample: 'festival' } }
export const FestivalGerman: Story = { name: 'Festival (de)', args: { sample: 'festival', locale: 'de-DE' } }
export const LongText: Story = { name: 'Long text (shrink & truncate)', args: { sample: 'stadium' } }
export const Expired: Story = { args: { sample: 'expired' } }
export const Back: Story = { args: { sample: 'concert', side: 'back' } }

/** Side by side, to compare layouts at a glance. */
export const Gallery: Story = {
  loaders: [
    async ({ args }) => ({
      passes: await Promise.all(
        (Object.keys(samples) as SampleName[]).map(name => renderApplePass(samples[name](), { zoom: 0.8, locale: args.locale })),
      ),
    }),
  ],
  render: (_args, { loaded }) => {
    const grid = document.createElement('div')
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px;justify-content:center;padding:24px'
    grid.append(...(loaded.passes as RenderedPass[]).map(p => p.element))
    return grid
  },
  parameters: { layout: 'fullscreen', controls: { include: ['locale'] } },
}
