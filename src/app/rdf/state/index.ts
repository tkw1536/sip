import { create } from 'zustand'
import { create as createFile, type Slice as FileSlice } from './file'
import { create as createModal, type Slice as ModalSlice } from './modal'
import { create as createNS, type Slice as NSSlice } from './ns'
import { create as createRDF, type Slice as RDFSlice } from './rdf'
import { create as createTab, type Slice as TabSlice } from './tab'

import { type Store } from 'rdflib'

/** the set of all states */
export type BoundState = FileSlice & ModalSlice & NSSlice & TabSlice & RDFSlice

/** contains all functions that reset the state */
export const resetters = new Set<() => void>()

/** contains all functions that load some state */
export const loaders = new Set<(store: Store) => Promise<Partial<BoundState>>>()

/** the store for rdf */
const useRDFStore = create<BoundState>()((...a) => ({
  ...createFile(...a),
  ...createModal(...a),
  ...createNS(...a),
  ...createRDF(...a),
  ...createTab(...a),
}))

export default useRDFStore
