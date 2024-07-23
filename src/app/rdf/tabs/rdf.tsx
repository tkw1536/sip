import { type JSX } from 'preact'
import { loadRDF, setStoreLoading } from '../state/reducers/load'
import Spinner from '../../../components/spinner'
import { StyledDropArea } from '../../../components/drop-area'
import ErrorDisplay from '../../../components/error'
import { resetRDFInterface } from '../state/reducers/init'
import { useRDFStore } from '../state'
import { useCallback } from 'preact/hooks'

export default function RDFTab(): JSX.Element {
  const loadState = useRDFStore(s => s.loadStage)
  if (loadState === true) {
    return <InfoView />
  } else {
    return <WelcomeView />
  }
}

function WelcomeView(): JSX.Element {
  const apply = useRDFStore(s => s.apply)
  const loadStage = useRDFStore(s => s.loadStage)

  const handleLoadPathbuilder = useCallback(
    (file: File) => {
      apply([setStoreLoading, loadRDF(file)])
    },
    [apply, setStoreLoading, loadRDF],
  )

  if (loadStage === 'loading') {
    return <Spinner message='Loading RDF' />
  }

  return (
    <>
      <p>This tool provides an interface for visualizing rdf files.</p>
      <p>
        All processing happens on-device, meaning the server host can not access
        any data contained within your statements.
      </p>
      <StyledDropArea onDropFile={handleLoadPathbuilder}>
        Click or drag an <code>RDF/XML</code> file here
      </StyledDropArea>
      {typeof loadStage === 'object' && loadStage.error instanceof Error && (
        <>
          <p>
            <b>Unable to load rdf: </b>
          </p>
          <ErrorDisplay error={loadStage.error} />
        </>
      )}
    </>
  )
}

function InfoView(): JSX.Element {
  const apply = useRDFStore(s => s.apply)
  const filename = useRDFStore(s => s.filename)

  const handleClose = useCallback(
    (evt: Event): void => {
      evt.preventDefault()
      apply(resetRDFInterface(false))
    },
    [apply, resetRDFInterface],
  )

  const theFilename = filename !== '' ? filename : 'statements.rdf'
  return (
    <>
      <p>
        RDF <code>{theFilename}</code> successfully loaded.
      </p>
      <p>
        You can also <button onClick={handleClose}>Close</button> this file.
      </p>
    </>
  )
}
