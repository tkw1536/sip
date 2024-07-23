import { render } from 'preact'
import { ErrorBoundary } from '../../components/error'
import Layout from '../../components/layout'
import RDFViewerApp from '.'

function main(): void {
  const root = document.getElementById('root')
  if (root === null) {
    console.error('no root element')
    return
  }
  render(
    <ErrorBoundary>
      <Layout>
        <RDFViewerApp />
      </Layout>
    </ErrorBoundary>,
    root,
  )
}
main()
