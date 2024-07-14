import { Component, type ComponentChild } from 'preact'
import { type IReducerProps } from '../state'
import {
  resetNamespaceMap,
  setNamespaceMap,
} from '../state/reducers/ns'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import NamespaceEditor from '../../../components/namespace-editor'

export default class MapTab extends Component<IReducerProps> {
  readonly #handleReset = (): void => {
    this.props.apply(resetNamespaceMap())
  }
  readonly #handleNewMap = (ns: NamespaceMap): void => {
    this.props.apply(setNamespaceMap(ns))
  }
  render(): ComponentChild {
    return (
      <>
        <p>
          The Namespace Map is used to shorten URIs for display within the
          inspector. The underlying pathbuilder always contains the full URIs,
          and namespaces are not saved across reloads.
          <br />
          The initial version is generated automatically from all URIs found in
          the pathbuilder. You can manually adjust it here, by adding, removing
          or editing abbreviations.
        </p>
        <NamespaceEditor
          ns={this.props.state.ns}
          nsKey={this.props.state.namespaceVersion}
          onReset={this.#handleReset}
          onUpdate={this.#handleNewMap}
        />
      </>
    )
  }
}