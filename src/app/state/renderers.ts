import { BundleEdge, BundleNode } from '../../lib/graph/builders/bundle'
import { ModelEdge, ModelNode } from '../../lib/graph/builders/model'
import Once, { Lazy } from "../../lib/utils/once"
import { GraphRendererClass } from '../views/graph/renderers'

class RendererCollection<R extends GraphRendererClass<NodeLabel, EdgeLabel, S>, NodeLabel, EdgeLabel, S> {
  constructor (public readonly defaultRenderer: string, ...loaders: Array<[string, () => Promise<R>]>) {
    this.loaders = new Map(loaders)
    if (!this.loaders.has(this.defaultRenderer)) throw new Error('defaultRenderer not contained in loaders')

    // setup lazy values
    for (const key of this.loaders.keys() ) {
      this.values.set(key, new Lazy<R>())
    }
  }

  private values = new Map<string, Lazy<R>>()
  private loaders = new Map<string, () => Promise<R>>()

  public async get (name: string): Promise<R> {
    const lazy = this.values.get(name)
    if (typeof lazy === 'undefined') {
      throw new Error('unknown renderer')
    }

    const renderer = await lazy.Get(async (): Promise<R> => {
      const loader = this.loaders.get(name)
      if (typeof loader === 'undefined') {
        throw new Error('implementation error: loaders missing loader')
      }

      // load and initialize the class
      const clz = await loader()
      await clz.initializeClass()
      return clz
    })

    if (renderer.rendererName !== name) {
      throw new Error('renderer returned incorrect name: expected ' + name + ', but got ' + renderer.rendererName)
    }

    return renderer
  }

  get names(): string[] {
    return Array.from(this.loaders.keys())
  }
}

export type ModelRenderer = GraphRendererClass<ModelNode, ModelEdge, any>
export const models = new RendererCollection<ModelRenderer, ModelNode, ModelEdge, any>(
  'vis-network',
  [
   'vis-network',
   async () => await import('../views/graph/renderers/vis-network').then(m => m.VisNetworkModelRenderer),
  ],
  [
    'Sigma.js',
    async () => await import('../views/graph/renderers/sigma').then(m => m.SigmaModelRenderer),
  ],
  [
    'Cytoscape',
    async () => await import('../views/graph/renderers/cytoscape').then(m => m.CytoModelRenderer)
  ]
)

export type BundleRenderer = GraphRendererClass<BundleNode, BundleEdge, any>
export const bundles = new RendererCollection<BundleRenderer, BundleNode, BundleEdge, any>(
  'vis-network',
  [
    'vis-network',
    async () => await import('../views/graph/renderers/vis-network').then(m => m.VisNetworkBundleRenderer),
   ],
   [
     'Sigma.js',
     async () => await import('../views/graph/renderers/sigma').then(m => m.SigmaBundleRenderer),
   ],
   [
     'Cytoscape',
     async () => await import('../views/graph/renderers/cytoscape').then(m => m.CytoBundleRenderer),
    ]
)
