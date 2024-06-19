if (process.env.NODE_ENV === 'development') {
  require('preact/debug')
}

import { h, render } from 'preact' // eslint-disable-line import/first
import { App } from './app' // eslint-disable-line import/first

function main (): void {
  const root = document.getElementById('root')
  if (root == null) {
    console.error('no root element')
    return
  }
  render(<App />, root)
}
main()
