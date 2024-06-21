import type { ElementDefinition, Core, CytoscapeOptions } from 'cytoscape'
import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'
import dagre from 'cytoscape-dagre'
import elk from 'cytoscape-elk'
import fcose from 'cytoscape-fcose'
import avsdf from 'cytoscape-avsdf'
import svg from 'cytoscape-svg'
import { assertGraphRendererClass, LibraryBasedRenderer, Size } from '.'
import { BundleEdge, BundleNode } from '../../../../lib/graph/builders/bundle'
import { ModelEdge, ModelNode } from '../../../../lib/graph/builders/model'
cytoscape.use(cola)
cytoscape.use(dagre)
cytoscape.use(elk)
cytoscape.use(fcose)
cytoscape.use(avsdf)
cytoscape.use(svg)

type Elements = ElementDefinition[]
type Cytoscape = Core
type Options = Omit<CytoscapeOptions, 'container' | 'elements'>

abstract class CytoscapeRenderer<NodeLabel, EdgeLabel> extends LibraryBasedRenderer<NodeLabel, EdgeLabel, Cytoscape, Elements> {
  protected abstract addNode (elements: Elements, id: number, node: NodeLabel): undefined
  protected abstract addEdge (elements: Elements, from: number, to: number, edge: EdgeLabel): undefined

  static readonly rendererName = 'Cytoscape'
  static readonly supportedLayouts = ['auto', 'grid', 'circle', 'concentric', 'avsdf', 'dagre', 'breadthfirst', 'fcose', 'cola', 'elk']

  protected layoutOptions (definitelyAcyclic: boolean): Options['layout'] {
    let { layout } = this.props
    if (layout === 'auto') {
      layout = definitelyAcyclic ? 'elk' : 'cola'
    }

    const maxSimulationTime = 365 * 24 * 60 * 60 * 1000 // 1 year
    switch (this.props.layout) {
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

  protected options (definitelyAcyclic: boolean): Options {
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
            'text-border-opacity': 1
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
      layout: this.layoutOptions(definitelyAcyclic)
    }
  }

  protected beginSetup (container: HTMLElement, size: Size): Elements {
    return []
  }

  protected endSetup (elements: Elements, container: HTMLElement, size: Size, definitelyAcyclic: boolean): Cytoscape {
    const options = this.options(definitelyAcyclic)
    return cytoscape({
      container,
      elements,
      ...options
    })
  }

  protected resizeObject (c: Cytoscape, elements: Elements, { width, height }: Size): undefined {
    c.resize()
    // automatically resized ?
  }

  protected destroyObject (c: Cytoscape, elements: Elements): void {
    c.destroy()
  }

  static readonly supportedExportFormats = ['svg']
  protected async objectToBlob (cy: Cytoscape, elements: Elements, format: string): Promise<Blob> {
    const svg = (cy as any).svg() as string
    return await Promise.resolve(new Blob([svg], { type: 'image/svg' }))
  }
}

@assertGraphRendererClass<BundleNode, BundleEdge>()
export class CytoBundleRenderer extends CytoscapeRenderer<BundleNode, BundleEdge> {
  protected addNode (elements: Elements, id: number, node: BundleNode): undefined {
    const idStr = id.toString()
    if (node.type === 'bundle') {
      const label = 'Bundle\n' + node.bundle.path().name
      const data = { id: idStr, label, color: 'blue' }
      elements.push({ data })
      return
    }
    if (node.type === 'field') {
      const label = node.field.path().name
      const data = { id: idStr, label, color: 'orange' }
      elements.push({ data })
      return
    }
    throw new Error('never reached')
  }

  protected addEdge (elements: Elements, from: number, to: number, edge: BundleEdge): undefined {
    const fromStr = from.toString()
    const toStr = to.toString()
    const idStr = fromStr + '-' + toStr

    if (edge.type === 'child_bundle') {
      const data = { id: idStr, source: fromStr, target: toStr, color: 'black' }
      elements.push({ data })
      return
    }
    if (edge.type === 'field') {
      const data = { id: idStr, source: fromStr, target: toStr, color: 'black' }
      elements.push({ data })
      return
    }
    throw new Error('never reached')
  }
}
@assertGraphRendererClass<ModelNode, ModelEdge>()
export class CytoModelRenderer extends CytoscapeRenderer<ModelNode, ModelEdge> {
  protected addNode (elements: Elements, id: number, node: ModelNode): undefined {
    const idStr = id.toString()
    const { ns } = this.props
    if (node.type === 'field') {
      const data = { id: idStr, label: node.field.path().name, color: 'orange' }
      elements.push({ data })
      return
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      const data = { id: idStr, label: ns.apply(node.clz), color: 'blue' }
      elements.push({ data })
      return
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      const names = Array.from(node.bundles).map((bundle) => 'Bundle ' + bundle.path().name).join('\n\n')
      const label = ns.apply(node.clz) + '\n\n' + names

      const data = { id: idStr, label, color: 'blue' }
      elements.push({ data })
    }
  }

  protected addEdge (elements: Elements, from: number, to: number, edge: ModelEdge): undefined {
    const { ns } = this.props

    const fromStr = from.toString()
    const toStr = to.toString()
    const idStr = fromStr + '-' + toStr

    if (edge.type === 'data') {
      const data = { id: idStr, source: fromStr, target: toStr, label: ns.apply(edge.field.path().datatypeProperty), color: 'black' }
      elements.push({ data })
      return
    }
    if (edge.type === 'property') {
      const data = { id: idStr, source: fromStr, target: toStr, label: ns.apply(edge.property), color: 'black' }
      elements.push({ data })
      return
    }
    throw new Error('never reached')
  }
}

// spellchecker:words avsdf breadthfirst roundrectangle fcose dagre
