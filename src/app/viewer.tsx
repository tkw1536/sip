import { Component, ComponentChild } from 'preact'

import ExportView from './views/export'
import ListView from './views/list'
import BundleGraphView from './views/graph/bundle'

import { Pathbuilder } from '../lib/pathbuilder'
import { NamespaceMap } from '../lib/namespace'
import MapView from './views/map'
import { NodeLike, PathTree } from '../lib/pathtree'
import Selection from '../lib/selection'
import ModelGraphView from './views/graph/model'
import GraphConfigView from './views/config'
import Deduplication, { defaultValue as deduplicationDefault } from './state/deduplication'
import { bundles, models } from '../lib/drivers/collection'
import { defaultLayout } from '../lib/drivers/impl'
import Tabs, { Label, Tab } from '../lib/components/tabs'
import ColorMap from '../lib/colormap'
import { applyColorPreset, ColorPreset } from './state/preset'
import DocsView from './docs'

export type ViewProps = {} & ViewerProps & ViewerState & ViewerReducers
interface ViewerProps {
  pathbuilder: Pathbuilder
  filename: string
  id: string
}
interface ViewerState {
  pathbuilderVersion: number // this number is updated every time the pathbuilder changes
  tree: PathTree // the tree corresponding to the pathbuilder

  namespaceVersion: number // this number is updated every time the namespaceMap is updated
  ns: NamespaceMap // the current namespace map

  colorVersion: number
  cm: ColorMap

  selectionVersion: number
  selection: Selection // the selection

  optionVersion: number
  deduplication: Deduplication

  // renders for the graphs
  bundleGraphRenderer: string
  bundleGraphLayout: string

  modelGraphRenderer: string
  modelGraphLayout: string

  collapsed: Selection

  activeTabIndex: number
}
interface ViewerReducers {
  deleteNS: (long: string) => void
  updateNS: (long: string, newShort: string) => void
  addNS: (long: string, short: string) => void
  resetNS: () => void

  updateSelection: (pairs: Array<[string, boolean]>) => void
  selectAll: () => void
  selectNone: () => void

  toggleCollapsed: (id: string) => void
  collapseAll: () => void
  expandAll: () => void

  setColor: (node: NodeLike, color: string) => void
  applyColorPreset: (preset: ColorPreset) => void

  setDeduplication: (dup: Deduplication) => void

  setBundleRenderer: (renderer: string) => void
  setBundleLayout: (layout: string) => void

  setModelRenderer: (renderer: string) => void
  setModelLayout: (layout: string) => void

  setActiveTab: (newIndex: number) => void
}

export class Viewer extends Component<ViewerProps & { onClose: () => void }, ViewerState> {
  state: ViewerState = this.initState(this.props.pathbuilder)
  private initState (pb: Pathbuilder, previous?: ViewerState): ViewerState {
    const paths = new Set<string>()
    pb.paths.forEach(p => {
      paths.add(p.datatypeProperty)
      p.pathArray.forEach(p => paths.add(p))
    })

    const tree = previous?.tree ?? PathTree.fromPathbuilder(pb)

    const ns = NamespaceMap.generate(paths)
    const selection = Selection.all()
    const collapsed = Selection.none()

    const deduplication = previous?.deduplication ?? deduplicationDefault
    const cm = applyColorPreset(tree, ColorPreset.BlueAndOrange)

    const selectionVersion = (previous?.selectionVersion ?? -1) + 1
    const namespaceVersion = (previous?.namespaceVersion ?? -1) + 1
    const pathbuilderVersion = (previous?.pathbuilderVersion ?? -1) + 1
    const optionVersion = (previous?.optionVersion ?? -1) + 1
    const colorVersion = (previous?.colorVersion ?? -1) + 1

    const bundleGraphRenderer = previous?.bundleGraphRenderer ?? bundles.defaultDriver
    const bundleGraphLayout = previous?.bundleGraphLayout ?? defaultLayout
    const modelGraphRenderer = previous?.modelGraphRenderer ?? models.defaultDriver
    const modelGraphLayout = previous?.modelGraphLayout ?? defaultLayout

    const activeTabIndex = previous?.activeTabIndex ?? 0

    return {
      namespaceVersion,
      ns,
      pathbuilderVersion,
      tree,
      selectionVersion,
      selection,

      collapsed,

      colorVersion,
      cm,

      optionVersion,
      deduplication,

      bundleGraphRenderer,
      bundleGraphLayout,
      modelGraphRenderer,
      modelGraphLayout,

      activeTabIndex
    }
  }

  private readonly updateSelection = (pairs: Array<[string, boolean]>): void => {
    this.setState(({ selection, selectionVersion }) => ({
      selection: selection.with(pairs),
      selectionVersion: selectionVersion + 1
    }))
  }

  private readonly selectAll = (): void => {
    this.setState(({ selectionVersion }) => ({
      selection: Selection.all(),
      selectionVersion: selectionVersion + 1
    }))
  }

  private readonly selectNone = (): void => {
    this.setState(({ selectionVersion }) => ({
      selection: Selection.none(),
      selectionVersion: selectionVersion + 1
    }))
  }

  /** deleteNS deletes a specific entry from the namespace map */
  private readonly deleteNS = (long: string): void => {
    this.setState(({ namespaceVersion }) => ({
      ns: this.state.ns.remove(long),
      namespaceVersion: namespaceVersion + 1
    }))
  }

  /** updateNS updates the given long with the newShort */
  private readonly updateNS = (long: string, newShort: string): void => {
    this.setState(({ namespaceVersion }) => {
      const mp = this.state.ns.toMap()
      if (!mp.has(long)) {
        return null
      }

      // update and use a new map!
      mp.set(long, newShort)

      return { ns: NamespaceMap.fromMap(mp), namespaceVersion: namespaceVersion + 1 }
    })
  }

  private readonly addNS = (long: string, short: string): void => {
    this.setState(({ namespaceVersion, ns }) => {
      // if we already have the short or the long don't do anything
      if (ns.hasShort(short) || ns.hasLong(long)) {
        return null
      }

      return {
        ns: ns.add(long, short),
        namespaceVersion: namespaceVersion + 1
      }
    })
  }

  /** resetNS resets the namespaces to default */
  private readonly resetNS = (): void => {
    this.setState((state) => {
      const { ns } = this.initState(this.props.pathbuilder, state)
      return { ns, namespaceVersion: state.namespaceVersion + 1 }
    })
  }

  private readonly toggleCollapsed = (value: string): void => {
    this.setState(
      ({ collapsed }) => ({
        collapsed: collapsed.toggle(value)
      })
    )
  }

  private readonly collapseAll = (): void => {
    this.setState({ collapsed: Selection.all() })
  }

  private readonly expandAll = (): void => {
    this.setState({ collapsed: Selection.none() })
  }

  private readonly setDeduplication = (dup: Deduplication): void => {
    this.setState(({ optionVersion }) => ({ deduplication: dup, optionVersion: optionVersion + 1 }))
  }

  private readonly setBundleRenderer = (renderer: string): void => {
    this.setState({
      bundleGraphRenderer: renderer,
      bundleGraphLayout: defaultLayout
    })
  }

  private readonly setBundleLayout = (layout: string): void => {
    this.setState({ bundleGraphLayout: layout })
  }

  private readonly setModelRenderer = (renderer: string): void => {
    this.setState({
      modelGraphRenderer: renderer,
      modelGraphLayout: defaultLayout
    })
  }

  private readonly setModelLayout = (layout: string): void => {
    this.setState({ modelGraphLayout: layout })
  }

  private readonly setActiveTab = (newTab: number): void => {
    this.setState({ activeTabIndex: newTab })
  }

  private readonly setColor = (node: NodeLike, color: string): void => {
    this.setState(({ colorVersion, cm }) => ({ cm: cm.set(node, color), colorVersion: colorVersion + 1 }))
  }

  private readonly applyColorPreset = (preset: ColorPreset): void => {
    this.setState(({ colorVersion, tree }) => {
      return { cm: applyColorPreset(tree, preset), colorVersion: colorVersion + 1 }
    })
  }

  render (): ComponentChild {
    const { onClose, ...props } = this.props
    const callbacks: ViewerReducers = {
      deleteNS: this.deleteNS,
      updateNS: this.updateNS,
      addNS: this.addNS,
      resetNS: this.resetNS,
      updateSelection: this.updateSelection,
      selectAll: this.selectAll,
      selectNone: this.selectNone,
      toggleCollapsed: this.toggleCollapsed,
      collapseAll: this.collapseAll,
      expandAll: this.expandAll,
      setDeduplication: this.setDeduplication,
      setBundleRenderer: this.setBundleRenderer,
      setBundleLayout: this.setBundleLayout,
      setModelRenderer: this.setModelRenderer,
      setModelLayout: this.setModelLayout,
      setActiveTab: this.setActiveTab,
      setColor: this.setColor,
      applyColorPreset: this.applyColorPreset
    }
    const view = { ...props, ...this.state, ...callbacks }

    const handleActiveTab = this.setActiveTab
    return (
      <Tabs onChangeTab={handleActiveTab} activeIndex={this.state.activeTabIndex}>
        <Label><b>Supreme Inspector for Pathbuilders</b></Label>
        <Tab title='Overview'>
          <ListView {...view} />
        </Tab>
        <Tab title='Bundle Graph'>
          <BundleGraphView {...view} />
        </Tab>
        <Tab title='Model Graph'>
          <ModelGraphView {...view} />
        </Tab>
        <Tab title='Namespace Map &#9881;&#65039;'>
          <MapView {...view} />
        </Tab>
        <Tab title='Graph Backends &#9881;&#65039;'>
          <GraphConfigView {...view} />
        </Tab>
        <Tab title='Export'>
          <ExportView {...view} />
        </Tab>
        <Tab title='Close'>
          <p>
            To close this pathbuilder click the following button.
            You can also just close this tab.
          </p>
          <p>
            <button onClick={onClose}>Close</button>
          </p>
        </Tab>
        <Tab title='Docs'>
          <DocsView />
        </Tab>
      </Tabs>
    )
  }
}
