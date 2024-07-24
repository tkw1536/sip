import { type Store } from 'rdflib'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import { type Reducer } from '../../../lib/state_management'
import { create as createTab, type Slice as TabSlice } from './tab'
import { create as createRDF, type Slice as RDFSlice } from './rdf'
import { create as createNS, type Slice as NSSlice } from './ns'
import { create as createLoad, type Slice as LoadSlice } from './load'
import { create } from 'zustand'

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

export type BoundState = TabSlice & RDFSlice & NSSlice & LoadSlice

/** contains all functions that reset the state */
export const resetters = new Set<() => void>()

/** contains all functions that load some state */
export const loaders = new Set<(store: Store) => Promise<Partial<BoundState>>>()

const useRDFStore = create<BoundState>()((...a) => ({
  ...createTab(...a),
  ...createRDF(...a),
  ...createNS(...a),
  ...createLoad(...a),
}))

export default useRDFStore
