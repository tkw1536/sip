import { Component, ComponentChild, ComponentClass, createRef } from 'preact'
import Graph from '../../../../lib/graph'
import { NamespaceMap } from '../../../../lib/namespace'
import * as styles from './index.module.css'
import { UUIDPool } from '../../../../lib/utils/uuid'

export type GraphRendererProps<NodeLabel, EdgeLabel> = RendererProps<NodeLabel, EdgeLabel> & Size & { layout: string }

interface RendererProps<NodeLabel, EdgeLabel> {
  layout: string
  graph: Graph<NodeLabel, EdgeLabel>
  ns: NamespaceMap
  id: string // some globally unique id
}
export const defaultLayout = 'auto'
export abstract class GraphRenderer<NodeLabel, EdgeLabel> extends Component<GraphRendererProps<NodeLabel, EdgeLabel>> {
  /** toBlob renders a copy of the currently rendered graph into a blob */
  abstract toBlob (format: string): Promise<Blob>
}

/** asserts that a specific class is a graph renderer class */
export function assertGraphRendererClass<NodeLabel, EdgeLabel> () {
  return (constructor: GraphRendererClass<NodeLabel, EdgeLabel, GraphRendererProps<NodeLabel, EdgeLabel>>) => {}
}

/** An implemented GraphRenderer class */
export interface GraphRendererClass<NodeLabel, EdgeLabel, S> extends ComponentClass<S, any> {
  new (props: GraphRendererProps<NodeLabel, EdgeLabel>, context?: any): GraphRenderer<NodeLabel, EdgeLabel>

  readonly initializeClass: () => Promise<void>

  readonly rendererName: string
  readonly supportedLayouts: string[]
  readonly supportedExportFormats: string[]
}

type RenderProps<NodeLabel, EdgeLabel, S> = RendererProps<NodeLabel, EdgeLabel> & { renderer: GraphRendererClass<NodeLabel, EdgeLabel, S> }
interface RenderState { size?: [number, number] }
/**
 * Renderer instantiates a renderer onto the page
 */
export class Renderer<NodeLabel, EdgeLabel, S> extends Component<RenderProps<NodeLabel, EdgeLabel, S>, RenderState> {
  state: RenderState = { }

  async exportBlob (format: string): Promise<Blob> {
    const renderer = this.rendererRef.current
    if (renderer == null) {
      return await Promise.reject(new Error('no visible graph renderer'))
    }

    const rendererClass = renderer.constructor as GraphRendererClass<NodeLabel, EdgeLabel, S>
    if (!rendererClass.supportedExportFormats.includes(format)) {
      return await Promise.reject(new Error('format not supported'))
    }

    return await renderer.toBlob(format)
  }

  private readonly wrapperRef = createRef<HTMLDivElement>()
  private readonly rendererRef = createRef<GraphRenderer<NodeLabel, EdgeLabel>>()

  private observer: ResizeObserver | null = null

  private readonly onResize = ([entry]: ResizeObserverEntry[]): void => {
    const [width, height] = Renderer.getVisibleSize(entry.target)

    this.setState(({ size }) => {
      // if the previous size is identical, don't resize
      if ((size != null) && size[0] === width && size[1] === height) {
        return null
      }
      return { size: [width, height] }
    })
  }

  /* returns the size of the part of target that is visible in the view port */
  private static readonly getVisibleSize = (target: Element): [number, number] => {
    const { top, bottom, left, right } = target.getBoundingClientRect()

    return [
      Math.max(Math.min(right, window.innerWidth) - Math.max(left, 0), 0),
      Math.max(Math.min(bottom, window.innerHeight) - Math.max(top, 0), 0)
    ]
  }

  componentDidMount (): void {
    const { current } = this.wrapperRef
    if (this.observer == null && current !== null) {
      this.observer = new ResizeObserver(this.onResize)
      this.observer.observe(current)
    }
  }

  componentWillUnmount (): void {
    if (this.observer != null) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  render (): ComponentChild {
    const { renderer: Renderer, ...props } = this.props
    const { size } = this.state
    return (
      <div ref={this.wrapperRef} class={styles.wrapper}>
        {(size != null) && <Renderer ref={this.rendererRef} {...props} width={size[0]} height={size[1]} />}
      </div>
    )
  }
}

export interface Size { width: number, height: number }

export type ContextFlags = Readonly<{
  ns: NamespaceMap
  definitelyAcyclic: boolean
}>

export type MountFlags = Readonly<{
  container: HTMLElement
  layout: string
  size: Size
} & ContextFlags>

export abstract class LibraryBasedRenderer<NodeLabel, EdgeLabel, Mount, Context> extends GraphRenderer<NodeLabel, EdgeLabel> {
  private instance: { mount: Mount, ctx: Context, flags: MountFlags } | null = null

  protected abstract newContext (flags: ContextFlags): Context
  protected abstract addNode (ctx: Context, flags: ContextFlags, id: string, node: NodeLabel): Context | undefined
  protected abstract addEdge (ctx: Context, flags: ContextFlags, id: string, from: string, to: string, edge: EdgeLabel): Context | undefined
  protected abstract finalizeContext (ctx: Context, flags: ContextFlags): Context | undefined

  protected abstract mount (ctx: Context, flags: MountFlags): Mount

  protected abstract resizeMount (mount: Mount, ctx: Context, flags: MountFlags, size: Size): Mount | undefined
  protected abstract unmount (object: Mount, ctx: Context, flags: MountFlags): void

  protected abstract objectToBlob (object: Mount, setup: Context, flags: MountFlags, format: string): Promise<Blob>

  private createRenderer (): void {
    const { current: container } = this.container
    if ((this.instance != null) || (container == null)) {
      return
    }

    const { graph, width, height, layout } = this.props
    const ids = new UUIDPool()

    const ctxFlags: ContextFlags = Object.freeze({
      ns: this.props.ns,
      definitelyAcyclic: this.props.graph.definitelyAcyclic
    })

    const flags: MountFlags = Object.freeze({
      container,
      layout,
      size: { width, height },
      ...ctxFlags
    })

    try {
      // create a new context
      let ctx = this.newContext(ctxFlags)

      // add all nodes and edges
      graph.getNodes().forEach(([id, node]) => {
        const nextContext = this.addNode(ctx, ctxFlags, ids.for(id), node)
        if (typeof nextContext === 'undefined') return
        ctx = nextContext
      })
      graph.getEdges().forEach(([id, from, to, edge]) => {
        const nextContext = this.addEdge(ctx, ctxFlags, ids.for(id), ids.for(from), ids.for(to), edge)
        if (typeof nextContext === 'undefined') return
        ctx = nextContext
      })

      // finalize the context
      const nextContext = this.finalizeContext(ctx, ctxFlags)
      if (typeof nextContext !== 'undefined') {
        ctx = nextContext
      }

      // mount it to the page
      const mount = this.mount(ctx, flags)

      this.instance = { mount, ctx, flags }
    } catch (e) {
      console.error('failed to render graph')
      console.error(e)
      return
    }

    this.updateRendererSize()
  }

  private destroyRenderer (): void {
    if (this.instance === null) return
    this.unmount(this.instance.mount, this.instance.ctx, this.instance.flags)
    this.instance = null
  }

  private updateRendererSize (): void {
    if (this.instance == null) return
    const { width, height } = this.props

    // call the resize function and store the new size
    const next = this.resizeMount(this.instance.mount, this.instance.ctx, this.instance.flags, { width, height })
    this.instance.flags = Object.freeze({ ...this.instance.flags, size: { width, height } })

    // update the mounted instance (if applicable)
    if (typeof next === 'undefined') return
    this.instance.mount = next
  }

  async toBlob (format: string): Promise<Blob> {
    if (this.instance == null) return await Promise.reject(new Error('renderer object not setup'))

    return await this.objectToBlob(this.instance.mount, this.instance.ctx, this.instance.flags, format)
  }

  componentDidMount (): void {
    this.createRenderer()
  }

  componentDidUpdate (previousProps: GraphRendererProps<NodeLabel, EdgeLabel>): void {
    const { width, height, graph } = this.props

    // if we got a new graph, re-create the network!
    if (previousProps.graph !== graph) {
      this.destroyRenderer()
      this.createRenderer()
      return // automatically resized properly
    }

    if (previousProps.width === width && previousProps.height !== height) {
      return // size didn't change => no need to do anything
    }

    this.updateRendererSize()
  }

  private readonly container = createRef<HTMLDivElement>()
  render (): ComponentChild {
    const { width, height } = this.props
    return <div style={{ width, height }} ref={this.container} />
  }
}
