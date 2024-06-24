import type { ElementDefinition, Core, CytoscapeOptions } from 'cytoscape'
import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'
import dagre from 'cytoscape-dagre'
import elk from 'cytoscape-elk'
import fcose from 'cytoscape-fcose'
import avsdf from 'cytoscape-avsdf'
import svg from 'cytoscape-svg'
import { ContextFlags, defaultLayout, DriverImpl, formatSVG, MountFlags, Size } from '.'
import { BundleEdge, BundleNode } from '../../graph/builders/bundle'
import { ModelEdge, ModelNode, modelNodeLabel } from '../../graph/builders/model'
cytoscape.use(cola)
cytoscape.use(dagre)
cytoscape.use(elk)
cytoscape.use(fcose)
cytoscape.use(avsdf)
cytoscape.use(svg)

type Elements = ElementDefinition[]
type Cytoscape = Core
type Options = Omit<CytoscapeOptions, 'container' | 'elements'>

abstract class CytoscapeDriver<NodeLabel, EdgeLabel> extends DriverImpl<NodeLabel, EdgeLabel, Elements, Cytoscape > {
  protected abstract addNodeImpl (elements: Elements, flags: ContextFlags, id: string, node: NodeLabel): Promise<undefined>
  protected abstract addEdgeImpl (elements: Elements, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Promise<undefined>

  readonly driverName = 'Cytoscape'
  readonly supportedLayouts = [defaultLayout, 'grid', 'circle', 'concentric', 'avsdf', 'dagre', 'breadthfirst', 'fcose', 'cola', 'elk']

  protected layoutOptions (layout: string, definitelyAcyclic: boolean): Options['layout'] {
    const maxSimulationTime = 365 * 24 * 60 * 60 * 1000 // 1 year
    switch (layout === defaultLayout ? (definitelyAcyclic ? 'elk' : 'cola') : layout) {
      case 'grid':
        return { name: 'grid' }
      case 'circle':
        return { name: 'circle' }
      case 'concentric':
        return { name: 'concentric' }
      case 'avsdf':
        return { name: 'avsdf' }
      case 'cola':
        return { name: 'cola', maxSimulationTime } as unknown as any
      case 'elk':
        return { name: 'elk', maxSimulationTime } as unknown as any
      case 'fcose':
        return { name: 'fcose', maxSimulationTime } as unknown as any
      case 'breadthfirst':
        return { name: 'breadthfirst' }
      case 'dagre': /* fallthrough */
      default:
        return { name: 'dagre', padding: 100 } as unknown as any
    }
  }

  protected options (layout: string, definitelyAcyclic: boolean): Options {
    return {
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-wrap': 'wrap',
            color: 'data(color)'

          }
        },
        {
          selector: 'node:selected',
          style: {
            'text-background-opacity': 1,
            'text-background-color': '#fff',
            'text-background-shape': 'roundrectangle',
            'text-background-padding': '5px',
            'text-border-color': '#888',
            'text-border-width': 1,
            'text-border-opacity': 1,
            'background-color': 'data(color)'
          }
        },
        {
          selector: 'edge',
          style: {
            width: 3,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }, {
          selector: 'edge[label]',
          style: {
            label: 'data(label)'
          }
        }, {
          selector: 'edge[label]:selected',
          style: {
            'text-background-opacity': 1,
            'text-background-color': '#fff',
            'text-background-shape': 'roundrectangle',
            'text-background-padding': '5px',
            'text-border-color': '#888',
            'text-border-width': 1,
            'text-border-opacity': 1
          }
        }
      ],
      layout: this.layoutOptions(layout, definitelyAcyclic)
    }
  }

  protected async newContextImpl (): Promise<Elements> {
    return []
  }

  protected async finalizeContextImpl (elements: Elements): Promise<undefined> {
    return undefined
  }

  protected mountImpl (elements: Elements, { container, layout, definitelyAcyclic }: MountFlags): Cytoscape {
    const options = this.options(layout, definitelyAcyclic)
    return cytoscape({
      container,
      elements,
      ...options
    })
  }

  protected resizeMountImpl (c: Cytoscape, elements: Elements, flags: MountFlags, { width, height }: Size): undefined {
    // automatically resized ?
    c.resize()
  }

  protected unmountImpl (c: Cytoscape, elements: unknown): void {
    c.destroy()
  }

  readonly supportedExportFormats = ['svg']
  protected async objectToBlobImpl (c: Cytoscape, elements: Elements, flags: MountFlags, format: string): Promise<Blob> {
    const svg = (c as any).svg() as string
    return await Promise.resolve(new Blob([svg], { type: formatSVG }))
  }
}

export class CytoBundleDriver extends CytoscapeDriver<BundleNode, BundleEdge> {
  private static _instance: CytoBundleDriver | null = null
  static get instance (): CytoBundleDriver {
    if (this._instance === null) {
      this._instance = new CytoBundleDriver()
    }
    return this._instance
  }

  protected async addNodeImpl (elements: Elements, { cm }: ContextFlags, id: string, node: BundleNode): Promise<undefined> {
    if (node.type === 'bundle') {
      const label = 'Bundle\n' + node.bundle.path.name
      const data = { id, label, color: cm.get(node.bundle) }
      elements.push({ data })
      return
    }
    if (node.type === 'field') {
      const label = node.field.path.name
      const data = { id, label, color: cm.get(node.field) }
      elements.push({ data })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl (elements: Elements, flags: ContextFlags, id: string, from: string, to: string, edge: BundleEdge): Promise<undefined> {
    if (edge.type === 'child_bundle') {
      const data = { id, source: from, target: to, color: 'black' }
      elements.push({ data })
      return
    }
    if (edge.type === 'field') {
      const data = { id, source: from, target: to, color: 'black' }
      elements.push({ data })
      return
    }
    throw new Error('never reached')
  }
}

export class CytoModelDriver extends CytoscapeDriver<ModelNode, ModelEdge> {
  private static _instance: CytoModelDriver | null = null
  static get instance (): CytoModelDriver {
    if (this._instance === null) {
      this._instance = new this()
    }
    return this._instance
  }

  protected async addNodeImpl (elements: Elements, { ns, cm }: ContextFlags, id: string, node: ModelNode): Promise<undefined> {
    const label = modelNodeLabel(node, ns)
    if (node.type === 'field') {
      const data = { id, label, color: cm.get(...node.fields) }
      elements.push({ data })
      return
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      const data = { id, label, color: 'black' }
      elements.push({ data })
      return
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      const data = { id, label, color: cm.get(...node.bundles) }
      elements.push({ data })
    }
  }

  protected async addEdgeImpl (elements: Elements, { ns }: ContextFlags, id: string, from: string, to: string, edge: ModelEdge): Promise<undefined> {
    if (edge.type === 'data') {
      const data = { id, source: from, target: to, label: ns.apply(edge.property), color: 'black' }
      elements.push({ data })
      return
    }
    if (edge.type === 'property') {
      const data = { id, source: from, target: to, label: ns.apply(edge.property), color: 'black' }
      elements.push({ data })
      return
    }
    throw new Error('never reached')
  }
}

// spellchecker:words avsdf breadthfirst roundrectangle fcose dagre
