import { type JSX } from 'preact'

import { useRDFStore } from '../state'
import { resetNamespaceMap, setNamespaceMap } from '../state/reducers/ns'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import NamespaceEditor from '../../../components/namespace-editor'
import { useCallback } from 'preact/hooks'

export default function MapTab(): JSX.Element {
  const apply = useRDFStore(s => s.apply)
  const ns = useRDFStore(s => s.ns)
  const namespaceVersion = useRDFStore(s => s.namespaceVersion)

  const handleReset = useCallback((): void => {
    apply(resetNamespaceMap())
  }, [apply, resetNamespaceMap])

  const handleNewMap = useCallback((ns: NamespaceMap): void => {
    apply(setNamespaceMap(ns))
  }, [])

  return (
    <>
      <p>
        The Namespace Map is used to shorten URIs for display within the viewer.
      </p>
      <NamespaceEditor
        ns={ns}
        nsKey={namespaceVersion}
        onReset={handleReset}
        onUpdate={handleNewMap}
      />
    </>
  )
}
