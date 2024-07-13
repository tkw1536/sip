import type ColorMap from '../../../lib/pathbuilder/annotations/colormap'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import { type Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'
import {
  type Diagnostic,
  type PathTree,
} from '../../../lib/pathbuilder/pathtree'
import type NodeSelection from '../../../lib/pathbuilder/annotations/selection'
import type Deduplication from './state/deduplication'
import {
  type Reducer as ReducerT,
  type ReducerProps as ReducerPropsT,
} from '../../../lib/state_management'

export interface State {
  activeTab: string // the active tab

  loadStage: false | 'loading' | true | { error: unknown } // boolean indicating if file has been loaded, string for error
  filename: string

  pathbuilderVersion: number
  pathbuilder: Pathbuilder
  tree: PathTree
  diagnostics: Diagnostic[]

  hideEqualParentPaths: boolean

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

  rdfGraphDriver: string
  rdfGraphLayout: string

  collapsed: NodeSelection
}

export type Reducer = ReducerT<State>
export type ReducerProps = ReducerPropsT<State>
