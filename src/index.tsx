/* eslint-disable import/first */
if (import.meta.env.DEV) {
  await import('preact/debug')
}

import { render } from 'preact'
import { App } from './app'
import { ErrorBoundary } from './lib/components/error'

function main(): void {
  const root = document.getElementById('root')
  if (root === null) {
    console.error('no root element')
    return
  }
  render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
    root,
  )
}
main()
