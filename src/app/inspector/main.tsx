import { render } from 'preact'
import InspectorApp from '.'
import { ErrorBoundary } from '../../components/error'
import Layout from '../../components/layout'

function main(): void {
  const root = document.getElementById('root')
  if (root === null) {
    console.error('no root element')
    return
  }
  render(
    <ErrorBoundary>
      <Layout>
        <InspectorApp />
      </Layout>
    </ErrorBoundary>,
    root,
  )
}
main()
