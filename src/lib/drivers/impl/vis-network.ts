import {
  type ContextFlags,
  DriverImpl,
  ErrorUnsupported,
  type MountFlags,
  type Size,
  defaultLayout,
} from '.'
import {
  type Data,
  type Network,
  type Options as VisOptions,
} from 'vis-network'
import { type DataSet } from 'vis-data'
import {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../graph/builders/bundle'
import * as styles from './vis-network.module.css'
import { Type } from '../../utils/media'
import { LazyValue } from '../../utils/once'
import { modelNodeLabel } from '../../graph/builders/model/dedup'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  ConceptModelNode,
  LiteralModelNode,
} from '../../graph/builders/model/types'

const Vis = new LazyValue(async () => await import('vis-network'))

abstract class VisNetworkDriver<
  NodeLabel,
  EdgeLabel,
  Options,
> extends DriverImpl<NodeLabel, EdgeLabel, Options, Dataset, Network> {
  protected abstract addNodeImpl(
    dataset: Dataset,
    flags: ContextFlags<Options>,
    id: string,
    node: NodeLabel,
  ): Promise<undefined>
  protected abstract addEdgeImpl(
    dataset: Dataset,
    flags: ContextFlags<Options>,
    id: string,
    from: string,
    to: string,
    edge: EdgeLabel,
  ): Promise<undefined>

  readonly driverName = 'vis-network'
  readonly supportedLayouts = [defaultLayout, 'hierarchical', 'force2atlas']

  protected options(layout: string, definitelyAcyclic: boolean): VisOptions {
    const hierarchical =
      layout === defaultLayout ? definitelyAcyclic : layout === 'hierarchical'

    return hierarchical
      ? {
          layout: {
            hierarchical: {
              direction: 'UD',
              sortMethod: 'directed',
              shakeTowards: 'roots',
            },
          },
          physics: {
            hierarchicalRepulsion: {
              avoidOverlap: 10,
            },
          },
        }
      : {
          physics: {
            barnesHut: {
              springConstant: 0,
              avoidOverlap: 10,
              damping: 0.09,
            },
          },
          edges: {
            smooth: {
              enabled: true,
              type: 'continuous',
              forceDirection: 'none',
              roundness: 0.6,
            },
          },
        }
  }

  protected async newContextImpl(): Promise<Dataset> {
    if (Object.hasOwn(globalThis, 'window')) {
      await Vis.load()
    }
    const { DataSet } = await import('vis-data')
    return new Dataset(new DataSet(), new DataSet())
  }

  protected async finalizeContextImpl(ctx: Dataset): Promise<Dataset> {
    return ctx
  }

  protected mountImpl(
    dataset: Dataset,
    { container, layout, definitelyAcyclic }: MountFlags<Options>,
  ): Network {
    container.classList.add(styles.container)

    const options = this.options(layout, definitelyAcyclic)
    options.autoResize = false
    return new Vis.value.Network(container, dataset.toData(), options)
  }

  protected resizeMountImpl(
    network: Network,
    dataset: Dataset,
    flags: MountFlags<Options>,
    { width, height }: Size,
  ): undefined {
    network.setSize(`${width}px`, `${height}px`)
    network.redraw()
  }

  protected unmountImpl(
    network: Network,
    dataset: Dataset,
    { container }: MountFlags<Options>,
  ): void {
    container.classList.remove(styles.container)
    network.destroy()
  }

  readonly supportedExportFormats = ['png']
  protected async exportImpl(
    dataset: Dataset,
    flags: ContextFlags<Options>,
    format: string,
    mount?: { mount: Network; flags: MountFlags<Options> },
  ): Promise<Blob> {
    if (typeof mount === 'undefined') throw ErrorUnsupported
    return await dataset.drawNetworkClone(mount.mount, 1000, 1000, Type.PNG, 1)
  }
}

export class VisNetworkBundleDriver extends VisNetworkDriver<
  BundleNode,
  BundleEdge,
  BundleOptions
> {
  protected async addNodeImpl(
    dataset: Dataset,
    { options: { cm } }: ContextFlags<BundleOptions>,
    id: string,
    node: BundleNode,
  ): Promise<undefined> {
    if (node.type === 'bundle') {
      dataset.addNode({
        id,
        label: 'Bundle\n' + node.bundle.path.name,
        color: cm.get(node.bundle),
        level: node.level,
      })
      return
    }
    if (node.type === 'field') {
      dataset.addNode({
        id,
        label: node.field.path.name,
        color: cm.get(node.field),
        level: node.level,
      })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl(
    dataset: Dataset,
    flags: ContextFlags<BundleOptions>,
    id: string,
    from: string,
    to: string,
    edge: BundleEdge,
  ): Promise<undefined> {
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

export class VisNetworkModelDriver extends VisNetworkDriver<
  ModelNode,
  ModelEdge,
  ModelOptions
> {
  protected async addNodeImpl(
    dataset: Dataset,
    {
      options: {
        ns,
        cm,
        display: {
          Components: { ConceptLabels: ConceptLabels },
        },
      },
    }: ContextFlags<ModelOptions>,
    id: string,
    node: ModelNode,
  ): Promise<undefined> {
    const label = modelNodeLabel(node, ns)
    if (node instanceof LiteralModelNode) {
      dataset.addNode({
        id,
        label,

        shape: 'box',
        color: cm.get(...node.fields),
      })
      return
    }
    if (node instanceof ConceptModelNode && node.bundles.size === 0) {
      dataset.addNode({
        id,
        label: ConceptLabels ? label : undefined,
        color: {
          background: cm.defaultColor,
          border: 'black',
        },
      })
      return
    }
    if (node instanceof ConceptModelNode && node.bundles.size > 0) {
      dataset.addNode({
        id,
        label,
        color: cm.get(...node.bundles),
      })
      return
    }
    throw new Error('never reached')
  }

  protected async addEdgeImpl(
    dataset: Dataset,
    { options }: ContextFlags<ModelOptions>,
    id: string,
    from: string,
    to: string,
    edge: ModelEdge,
  ): Promise<undefined> {
    dataset.addEdge({
      from,
      to,
      arrows: 'to',

      label: edge.label(options),
    })
  }
}

type VisNode<T extends string | number> = {
  id?: T
  shape?: Shape
  level?: number
  x?: number
  y?: number
} & VisCommon

type Shape =
  | 'ellipse'
  | 'circle'
  | 'database'
  | 'box'
  | 'text'
  | 'image'
  | 'circularImage'
  | 'diamond'
  | 'dot'
  | 'star'
  | 'triangle'
  | 'triangleDown'
  | 'hexagon'
  | 'square'
  | 'icon'

type VisEdge<T extends string | number> = {
  from: T
  to: T
  arrows?: 'to'
  id?: never // needed by dataset api
} & VisCommon

interface VisCommon {
  label?: string
  color?: string | { background: string; border: string }
  font?: string
}

class Dataset {
  readonly #nodes: DataSet<VisNode<string | number>>
  readonly #edges: DataSet<VisEdge<string | number>>

  constructor(
    nodes: DataSet<VisNode<string | number>>,
    edges: DataSet<VisEdge<string | number>>,
  ) {
    this.#nodes = nodes
    this.#edges = edges
  }

  addNode(node: VisNode<string | number>): string {
    const id = this.#nodes.add(node)[0] as string
    return id
  }

  addEdge(edge: VisEdge<string | number>): string {
    return this.#edges.add(edge)[0] as string
  }

  toData(): Data {
    return { nodes: this.#nodes, edges: this.#edges } as unknown as Data
  }

  /** drawNetworkClone draws a clone of this dataset from the given network */
  async drawNetworkClone(
    network: Network,
    width: number,
    height: number,
    type?: string,
    quality?: number,
  ): Promise<Blob> {
    const { DataSet } = await import('vis-data')

    // get the original canvas size
    const orgCanvas = (await draw(network)).canvas

    // copy nodes, edges, positions
    const nodes = this.#nodes.get()
    const edges = this.#edges.get()
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
    const networkClone = new Vis.value.Network(
      container,
      { nodes: nodeSet, edges: edgeSet } as unknown as Data,
      {
        autoResize: false,
        physics: false,
        layout: {
          randomSeed: network.getSeed(),
        },
      },
    )

    // reset the size and fit all the nodes on it
    networkClone.setSize(`${width}px`, `${height}px`)
    networkClone.moveTo({
      scale: Math.max(width / orgCanvas.width, height / orgCanvas.height),
    })
    networkClone.fit({ animation: false })

    return await draw(networkClone)
      .then(
        async ({ canvas }) =>
          await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              blob => {
                if (blob == null) {
                  reject(new Error('no blob'))
                  return
                }
                resolve(blob)
              },
              type,
              quality,
            )
          }),
      )
      .finally(() => {
        networkClone.destroy()
        document.body.removeChild(container)
      })
  }
}

async function draw(network: Network): Promise<CanvasRenderingContext2D> {
  return await new Promise(resolve => {
    network.once('afterDrawing', (ctx: CanvasRenderingContext2D) => {
      resolve(ctx)
    })
    network.redraw()
  })
}
