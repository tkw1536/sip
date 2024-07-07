// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import compileTime from 'vite-plugin-compile-time'
import prefresh from '@prefresh/vite'

export default defineConfig({
  plugins: [
    prefresh(),
    compileTime()
  ],
  worker: {
    format: 'es'
  },
  test: {
    environment: 'happy-dom'
  }
})
