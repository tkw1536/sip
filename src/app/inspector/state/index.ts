import type ColorMap from '../../../lib/pathbuilder/annotations/colormap'
import { type NamespaceMap } from '../../../lib/pathbuilder/namespace'
import { type Pathbuilder } from '../../../lib/pathbuilder/pathbuilder'
import {
  type Diagnostic,
  type PathTree,
} from '../../../lib/pathbuilder/pathtree'
import type NodeSelection from '../../../lib/pathbuilder/annotations/selection'
import type Deduplication from './state/deduplication'
import { type Reducer, type ReducerProps } from '../../../lib/state_management'
import { type ModelDisplay } from '../../../lib/graph/builders/model/labels'

export interface IState {
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

  colorVersion: number
  cm: ColorMap
  cmLoadError?: string

  selectionVersion: number
  selection: NodeSelection // the selection

  modelGraphOptionVersion: number
  modelDeduplication: Deduplication
  modelDisplay: ModelDisplay

  // renders for the graphs
  bundleGraphDriver: string
  bundleGraphLayout: string
  bundleGraphSeed: number | null

  modelGraphDriver: string
  modelGraphLayout: string
  modelGraphSeed: number | null

  collapsed: NodeSelection
}

export type IReducer = Reducer<IState>
export type IReducerProps = ReducerProps<IState>
