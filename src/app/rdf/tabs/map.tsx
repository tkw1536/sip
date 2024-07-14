import { Component, type ComponentChild } from 'preact'

import { type RReducerProps } from '../state'
import { resetNamespaceMap, setNamespaceMap } from '../state/reducers/ns'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import NamespaceEditor from '../../../lib/components/namespace-editor'

export default class MapTab extends Component<RReducerProps> {
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
          viewer.
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
