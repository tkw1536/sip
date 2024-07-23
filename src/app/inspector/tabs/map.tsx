import { type JSX } from 'preact'
import { type IReducerProps } from '../state'
import { resetNamespaceMap, setNamespaceMap } from '../state/reducers/ns'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import NamespaceEditor from '../../../components/namespace-editor'
import { useCallback } from 'preact/hooks'

export default function MapTab(props: IReducerProps): JSX.Element {
  const handleReset = useCallback((): void => {
    props.apply(resetNamespaceMap())
  }, [props.apply, resetNamespaceMap])

  const handleNewMap = useCallback(
    (ns: NamespaceMap): void => {
      props.apply(setNamespaceMap(ns))
    },
    [props.apply, setNamespaceMap],
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
        ns={props.state.ns}
        nsKey={props.state.namespaceVersion}
        onReset={handleReset}
        onUpdate={handleNewMap}
      />
    </>
  )
}
