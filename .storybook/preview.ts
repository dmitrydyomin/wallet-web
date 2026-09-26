import type { Preview } from '@storybook/html-vite'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      options: {
        wallet: { name: 'Wallet', value: '#000000' },
        light: { name: 'Light', value: '#f2f2f7' },
      },
    },
  },
  initialGlobals: { backgrounds: { value: 'wallet' } },
}

export default preview
