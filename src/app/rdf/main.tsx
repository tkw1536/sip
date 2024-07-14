import { render } from 'preact'
import { ErrorBoundary } from '../../lib/components/error'
import Layout from '../../lib/components/layout'
import { App } from '.'

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