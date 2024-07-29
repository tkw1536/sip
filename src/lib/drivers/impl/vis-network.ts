import {
  type ContextDetails,
  DriverImpl,
  ErrorUnsupported,
  type MountInfo,
  type Refs,
  defaultLayout,
} from '.'
import { type Data, Network, type Options as VisOptions } from 'vis-network'
import { DataSet } from 'vis-data'
import buttonCSS from 'vis-network/dist/dist/vis-network.min.css?inline'
import {
  type BundleOptions,
  type BundleEdge,
  type BundleNode,
} from '../../graph/builders/bundle'
import { Type } from '../../utils/media'
import {
  type ModelOptions,
  type ModelEdge,
  type ModelNode,
  type ModelAttachmentKey,
} from '../../graph/builders/model/labels'
import {
  type Renderable,
  type Element,
  type ElementWithAttachments,
} from '../../graph/builders'
import {
  type RDFEdge,
  type RDFNode,
  type RDFOptions,
} from '../../graph/builders/rdf'
import { type Attributes } from 'graphology-types'
import { type Size } from '../../../components/hooks/observer'

type NodeAttributes = Omit<VisNode<string | number>, 'id'>
type EdgeAttributes = Omit<VisEdge<string | number>, 'from' | 'to'>

interface NetworkContext {
  network: Network
  styles: HTMLStyleElement
}

abstract class VisNetworkDriver<
  NodeLabel extends Renderable<Options, AttachmentKey>,
  EdgeLabel extends Renderable<Options, AttachmentKey>,
  Options,
  AttachmentKey extends string,
> extends DriverImpl<
  NodeLabel,
  EdgeLabel,
  Options,
  AttachmentKey,
  NodeAttributes,
  EdgeAttributes,
  null,
  Dataset,
  NetworkContext
> {
  readonly driverName = 'vis-network'
  readonly layouts = [defaultLayout, 'hierarchical', 'force2atlas']

  protected options(seed: number, layout: string): VisOptions {
    const hierarchical =
      layout === defaultLayout
        ? this.graph.definitelyAcyclic
        : layout === 'hierarchical'

    return hierarchical
      ? {
          layout: {
            randomSeed: seed,
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
          layout: {
            randomSeed: seed,
          },
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

  protected newContextImpl(): Dataset {
    return new Dataset(new DataSet(), new DataSet())
  }

  protected async initializeImpl(ctx: Dataset): Promise<Dataset> {
    return ctx
  }

  protected mountImpl(
    {
      context: dataset,
      flags: { layout },
      seed,
    }: ContextDetails<Dataset, Options>,
    element: HTMLElement,
    refs: Refs,
  ): NetworkContext {
    // inject styles for buttons
    const styles = document.createElement('style')
    styles.setAttribute('type', 'text/css')
    styles.innerHTML = buttonCSS
    document.head.appendChild(styles)

    const options = this.options(seed, layout)
    options.autoResize = false
    if (typeof options.interaction === 'undefined') {
      options.interaction = {}
    }
    options.interaction = {
      ...(options.interaction ?? {}),
      keyboard: true,
      navigationButtons: true,
    }

    const network = new Network(element, dataset.toData(), options)
    network.on('startStabilizing', () => {
      refs.animating(true)
    })
    network.on('stabilized', () => {
      refs.animating(false)
    })
    return { network, styles }
  }

  protected resizeMountImpl(
    details: ContextDetails<Dataset, Options>,
    { mount: { network } }: MountInfo<NetworkContext>,
    { width, height }: Size,
  ): void {
    network.setSize(`${width}px`, `${height}px`)
    network.redraw()
  }

  protected unmountImpl(
    details: ContextDetails<Dataset, Options>,
    { mount: { network, styles }, element }: MountInfo<NetworkContext>,
  ): void {
    styles.remove()
    network.destroy()
  }

  readonly exportFormats = ['png']
  protected async exportImpl(
    { context: dataset }: ContextDetails<Dataset, Options>,
    info: MountInfo<NetworkContext> | null,
    format: string,
  ): Promise<Blob> {
    if (info === null) throw ErrorUnsupported
    return await dataset.drawNetworkClone(
      info.mount.network,
      1000,
      1000,
      Type.PNG,
      1,
    )
  }

  protected startSimulationImpl(
    details: ContextDetails<Dataset, Options>,
    { mount: { network }, refs }: MountInfo<NetworkContext>,
  ): void {
    network.startSimulation()
  }

  protected stopSimulationImpl(
    details: ContextDetails<Dataset, Options>,
    { mount: { network }, refs }: MountInfo<NetworkContext>,
  ): void {
    network.stopSimulation()
  }

  protected placeNode(
    dataset: Dataset,
    id: string,
    attributes: NodeAttributes,
    cluster?: null | undefined,
  ): void {
    dataset.addNode({
      ...attributes,
      id,
    })
  }

  protected placeEdge(
    dataset: Dataset,
    id: string,
    from: string,
    to: string,
    attributes: EdgeAttributes,
    cluster?: null | undefined,
  ): Dataset | void {
    dataset.addEdge({
      ...attributes,
      from,
      to,
    })
  }

  protected createCluster(context: Dataset, id: string): null {
    return null
  }
  protected placeCluster(
    context: Dataset,
    id: string,
    cluster: null,
  ): Dataset | void {}

  protected attributes(
    type: 'node' | 'edge',
    { color, label, tooltip }: Element,
  ): NodeAttributes | EdgeAttributes {
    if (type === 'node') {
      return {
        color: {
          background: color ?? 'white',
          border: 'black',
        },
        title: tooltip ?? undefined,
        label: label ?? undefined,
      }
    }

    return {
      color: color ?? undefined,
      label: label ?? undefined,
      title: tooltip ?? undefined,

      arrows: 'to',
    }
  }
}

export class VisNetworkBundleDriver extends VisNetworkDriver<
  BundleNode,
  BundleEdge,
  BundleOptions,
  never
> {}

export class VisNetworkModelDriver extends VisNetworkDriver<
  ModelNode,
  ModelEdge,
  ModelOptions,
  ModelAttachmentKey
> {
  protected renderAttachedNode(
    parent: ModelNode,
    attachment: ModelAttachmentKey,
    element: Element,
  ): Attributes {
    return {
      shape: 'box',
      ...super.renderAttachedNode(parent, attachment, element),
    }
  }
}

export class VisNetworkRDFDriver extends VisNetworkDriver<
  RDFNode,
  RDFEdge,
  RDFOptions,
  never
> {
  protected renderSimpleNode(
    { node }: RDFNode,
    element: ElementWithAttachments<never>,
  ): Attributes {
    return {
      shape: node.termType !== 'Literal' ? 'ellipse' : 'box',
      ...this.attributes('node', element),
    }
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
  title?: string
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
    const networkClone = new Network(
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
