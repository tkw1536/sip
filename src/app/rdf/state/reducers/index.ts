import { type Store } from 'rdflib'
import { type NamespaceMap } from '../../../../lib/pathbuilder/namespace'
import { type Reducer } from '../../../../lib/state_management'

export interface RState {
  showModal: boolean
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
