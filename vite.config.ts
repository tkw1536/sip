// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vitest" />
import prefresh from '@prefresh/vite'
import { defineConfig } from 'vite'
import macros from 'unplugin-parcel-macros'
import { resolve } from 'path'

export default defineConfig({
  plugins: [prefresh(), macros.vite()],
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      input: {
        inspector: resolve(__dirname, 'index.html'),
        rdf: resolve(__dirname, 'rdf', 'index.html'),
      },
    },
  },
  test: {
    environment: 'happy-dom',
  },
})
