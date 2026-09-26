import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'wallet-web',
    },
    rollupOptions: {
      external: ['@chenglou/pretext', 'fflate', /^bwip-js/],
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
  },
})
