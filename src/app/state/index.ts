import type ColorMap from '../../lib/colormap'
import { type NamespaceMap } from '../../lib/namespace'
import { type Pathbuilder } from '../../lib/pathbuilder'
import { type PathTree } from '../../lib/pathtree'
import type NodeSelection from '../../lib/selection'
import type Deduplication from './state/deduplication'

export interface State {
  activeTab: string // the active tab

  loadStage: false | 'loading' | true | { error: unknown } // boolean indicating if file has been loaded, string for error
  filename: string

  pathbuilderVersion: number
  pathbuilder: Pathbuilder
  tree: PathTree

  namespaceVersion: number
  ns: NamespaceMap
  nsLoadError?: string

  colorVersion: number
  cm: ColorMap
  cmLoadError?: string

  selectionVersion: number
  selection: NodeSelection // the selection

  optionVersion: number
  modelDeduplication: Deduplication

  // renders for the graphs
  bundleGraphDriver: string
  bundleGraphLayout: string

  modelGraphDriver: string
  modelGraphLayout: string

  collapsed: NodeSelection
}

/** A reducer updates state */
export type Reducer = (state: State) => Partial<State> | Promise<Partial<State> | null> | null

export interface ReducerProps {
  state: State
  apply: (reducers: Reducer | Reducer[], callback?: (error?: unknown) => void) => void
}
