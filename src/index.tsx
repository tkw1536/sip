import { h, render } from 'preact'
import { App } from './app'

function main (): void {
  const root = document.getElementById('root')
  if (root == null) {
    console.error('no root element')
    return
  }
  render(<App />, root)
}
main()
