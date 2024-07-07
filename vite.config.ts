/// <reference types="vitest" />
import { defineConfig } from "vite"
import compileTime from "vite-plugin-compile-time"
import preact from "@preact/preset-vite"

export default defineConfig({
  plugins: [
    preact({ reactAliasesEnabled: false }),
    compileTime(),
  ],
  worker: {
    format: 'es'
  },
  test: {
    environment: 'happy-dom'
  },
})