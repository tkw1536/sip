import { assertGraphRendererClass, ContextFlags, defaultLayout, LibraryBasedRenderer, MountFlags, Size } from '.'
import { Data, Network, Options } from 'vis-network'
import { DataSet } from 'vis-data'
import { ModelEdge, ModelNode } from '../../../../lib/graph/builders/model'
import { BundleEdge, BundleNode } from '../../../../lib/graph/builders/bundle'
import * as styles from './vis-network.module.css'

abstract class VisNetworkRenderer<NodeLabel, EdgeLabel> extends LibraryBasedRenderer<NodeLabel, EdgeLabel, Network, Dataset> {
  protected abstract addNode (dataset: Dataset, flags: ContextFlags, id: string, node: NodeLabel): undefined
  protected abstract addEdge (dataset: Dataset, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): undefined

  static readonly rendererName = 'vis-network'
  static readonly supportedLayouts = [defaultLayout, 'hierarchical', 'force2atlas']
  static readonly initializeClass = async (): Promise<void> => {}

  protected options (layout: string, definitelyAcyclic: boolean): Options {
    const hierarchical = layout === defaultLayout ? definitelyAcyclic : layout === 'hierarchical'

    return hierarchical
      ? {
          layout: {
            hierarchical: {
              direction: 'UD',
              sortMethod: 'directed',
              shakeTowards: 'roots'
            }
          },
          physics: {
            hierarchicalRepulsion: {
              avoidOverlap: 10
            }
          }
        }
      : {
          physics: {
            barnesHut: {
              springConstant: 0,
              avoidOverlap: 10,
              damping: 0.09
            }
          },
          edges: {
            smooth: {
              enabled: true,
              type: 'continuous',
              forceDirection: 'none',
              roundness: 0.6
            }
          }
        }
  }

  protected newContext (): Dataset {
    return new Dataset()
  }

  protected finalizeContext (ctx: Dataset): undefined {
    return undefined
  }

  protected mount (dataset: Dataset, { container, layout, definitelyAcyclic }: MountFlags): Network {
    container.classList.add(styles.container)

    const options = this.options(layout, definitelyAcyclic)
    options.autoResize = false
    return new Network(container, dataset.toData(), options)
  }

  protected resizeMount (network: Network, dataset: Dataset, flags: MountFlags, { width, height }: Size): undefined {
    network.setSize(`${width}px`, `${height}px`)
    network.redraw()
  }

  protected unmount (network: Network, dataset: Dataset, { container }: MountFlags): void {
    container.classList.remove(styles.container)
    network.destroy()
  }

  static readonly supportedExportFormats = ['png']
  protected async objectToBlob (network: Network, dataset: Dataset, flags: MountFlags, format: string): Promise<Blob> {
    return await dataset.drawNetworkClone(network, 1000, 1000, 'image/png', 1)
  }
}

@assertGraphRendererClass<BundleNode, BundleEdge>()
export class VisNetworkBundleRenderer extends VisNetworkRenderer<BundleNode, BundleEdge> {
  protected addNode (dataset: Dataset, flags: ContextFlags, id: string, node: BundleNode): undefined {
    if (node.type === 'bundle') {
      dataset.addNode({ id, label: 'Bundle\n' + node.bundle.path().name, level: node.level })
      return
    }
    if (node.type === 'field') {
      dataset.addNode({ id, label: node.field.path().name, color: 'orange', level: node.level })
      return
    }
    throw new Error('never reached')
  }

  protected addEdge (dataset: Dataset, flags: ContextFlags, id: string, from: string, to: string, edge: BundleEdge): undefined {
    if (edge.type === 'child_bundle') {
      dataset.addEdge({ from, to, arrows: 'to' })
      return
    }
    if (edge.type === 'field') {
      dataset.addEdge({ from, to, arrows: 'to' })
      return
    }
    throw new Error('never reached')
  }
}

@assertGraphRendererClass<ModelNode, ModelEdge>()
export class VisNetworkModelRenderer extends VisNetworkRenderer<ModelNode, ModelEdge> {
  protected addNode (dataset: Dataset, { ns }: ContextFlags, id: string, node: ModelNode): undefined {
    if (node.type === 'field') {
      dataset.addNode({
        id,
        label: node.field.path().name,

        shape: 'box',
        color: 'orange'
      })
      return
    }
    if (node.type === 'class' && node.bundles.size === 0) {
      dataset.addNode({
        id,
        label: ns.apply(node.clz)
      })
      return
    }
    if (node.type === 'class' && node.bundles.size > 0) {
      const names = Array.from(node.bundles).map((bundle) => 'Bundle ' + bundle.path().name).join('\n\n')
      const label = ns.apply(node.clz) + '\n\n' + names

      dataset.addNode({
        id,
        label
      })
      return
    }
    throw new Error('never reached')
  }

  protected addEdge (dataset: Dataset, { ns }: ContextFlags, id: string, from: string, to: string, edge: ModelEdge): undefined {
    if (edge.type === 'data') {
      dataset.addEdge({
        from,
        to,
        arrows: 'to',

        label: ns.apply(edge.field.path().datatypeProperty)
      })
      return
    }
    if (edge.type === 'property') {
      dataset.addEdge({
        from,
        to,
        arrows: 'to',

        label: ns.apply(edge.property)
      })
      return
    }
    throw new Error('never reached')
  }
}

type VisNode<T extends string | number> = {
  id?: T
  shape?: Shape
  level?: number
  x?: number
  y?: number
} & VisCommon

type Shape = 'ellipse' | 'circle' | 'database' | 'box' | 'text' | 'image' | 'circularImage' | 'diamond' | 'dot' | 'star' | 'triangle' | 'triangleDown' | 'hexagon' | 'square' | 'icon'

type VisEdge<T extends string | number> = {
  from: T
  to: T
  arrows?: 'to'
  id?: never // needed by dataset api
} & VisCommon

interface VisCommon {
  label?: string
  color?: string
  font?: string
}

class Dataset {
  private readonly nodes = new DataSet<VisNode<string | number>>()
  private readonly edges = new DataSet<VisEdge<string | number>>()

  addNode (node: VisNode<string | number>): string {
    const id = this.nodes.add(node)[0] as string
    return id
  }

  addEdge (edge: VisEdge<string | number>): string {
    return this.edges.add(edge)[0] as string
  }

  toData (): Data {
    return { nodes: this.nodes, edges: this.edges } as unknown as Data
  }

  /** drawNetworkClone draws a clone of this dataset from the given network */
  async drawNetworkClone (network: Network, width: number, height: number, type?: string, quality?: number): Promise<Blob> {
    // get the original canvas size
    const orgCanvas = (await draw(network)).canvas

    // copy nodes, edges, positions
    const nodes = this.nodes.get()
    const edges = this.edges.get()
    const positions = network.getPositions()

    // create a new set of nodes
    const nodeSet = new DataSet<VisNode<string | number>>()
    nodes.forEach(node => {
      const { x, y } = positions[node.id]
      nodeSet.add({ ...node, x, y })
    })

    // create a new set of edges
    const edgeSet = new DataSet<VisEdge<string>>()
    edges.forEach(edge => edgeSet.add(edge))

    // create a temporary container with the original size
    const container = document.createElement('div')
    container.style.boxSizing = 'border-box'
    container.style.width = `${orgCanvas.width}px`
    container.style.height = `${orgCanvas.height}px`
    document.body.append(container)

    // create a clone of the network
    const networkClone = new Network(container, { nodes: nodeSet, edges: edgeSet } as unknown as any, {
      autoResize: false,
      physics: false,
      layout: {
        randomSeed: network.getSeed()
      }
    })

    // reset the size and fit all the nodes on it
    networkClone.setSize(`${width}px`, `${height}px`)
    networkClone.moveTo({ scale: Math.max(width / orgCanvas.width, height / orgCanvas.height) })
    networkClone.fit({ animation: false })

    return await draw(networkClone)
      .then(async ({ canvas }) => await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob == null) {
            reject(new Error('no blob'))
            return
          }
          resolve(blob)
        }, type, quality)
      })

      ).finally(() => {
        networkClone.destroy()
        document.body.removeChild(container)
      })
  }
}

async function draw (network: Network): Promise<CanvasRenderingContext2D> {
  return await new Promise((resolve) => {
    network.once('afterDrawing', (ctx) => resolve(ctx))
    network.redraw()
  })
}
