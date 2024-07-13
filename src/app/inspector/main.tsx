import { render } from 'preact'
import { App } from '.'
import { ErrorBoundary } from '../../lib/components/error'
import Layout from '../../lib/components/layout'

function main(): void {
  const root = document.getElementById('root')
  if (root === null) {
    console.error('no root element')
    return
  }
  render(
    <ErrorBoundary>
      <Layout>
        <App />
      </Layout>
    </ErrorBoundary>,
    root,
  )
}
main()
