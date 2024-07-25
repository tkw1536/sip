import { type JSX } from 'preact'
import { resetNamespaceMap, setNamespaceMap } from '../state/reducers/ns'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import NamespaceEditor from '../../../components/namespace-editor'
import { useCallback } from 'preact/hooks'
import { useInspectorStore } from '../state'

export default function MapTab(): JSX.Element {
  const apply = useInspectorStore(s => s.apply)
  const ns = useInspectorStore(s => s.ns)
  const nsVersion = useInspectorStore(s => s.namespaceVersion)

  const handleReset = useCallback((): void => {
    apply(resetNamespaceMap())
  }, [apply])

  const handleNewMap = useCallback(
    (ns: NamespaceMap): void => {
      apply(setNamespaceMap(ns))
    },
    [apply],
  )

  return (
    <>
      <p>
        The Namespace Map is used to shorten URIs for display within the
        inspector. The underlying pathbuilder always contains the full URIs, and
        namespaces are not saved across reloads.
        <br />
        The initial version is generated automatically from all URIs found in
        the pathbuilder. You can manually adjust it here, by adding, removing or
        editing abbreviations.
      </p>
      <NamespaceEditor
        ns={ns}
        nsKey={nsVersion}
        onReset={handleReset}
        onUpdate={handleNewMap}
      />
    </>
  )
}
