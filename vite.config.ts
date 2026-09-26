import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    lib: {
      entry: {
        'wallet-web': resolve(import.meta.dirname, 'src/index.ts'),
        react: resolve(import.meta.dirname, 'src/react/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@chenglou/pretext', 'fflate', /^bwip-js/, 'react', /^react\//, 'react-dom'],
      output: {
        // The React entry touches the DOM in effects; mark it for React Server Components setups.
        banner: chunk => (chunk.isEntry && chunk.name === 'react' ? "'use client';" : ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
  },
})
