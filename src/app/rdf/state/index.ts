import { type Reducer, type ReducerProps } from '../../../lib/state_management'
import { type Store } from 'rdflib'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'

export interface RState {
  activeTab: string // the active tab

  loadStage: false | 'loading' | true | { error: unknown } // boolean indicating if file has been loaded, string for error
  filename: string

  store: Store

  ns: NamespaceMap
  namespaceVersion: number

  rdfGraphDriver: string
  rdfGraphLayout: string
  rdfGraphSeed: number | null
}

export type RReducer = Reducer<RState>
export type RReducerProps = ReducerProps<RState>
