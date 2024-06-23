import { BundleEdge, BundleNode } from '../graph/builders/bundle'
import { ModelEdge, ModelNode } from '../graph/builders/model'
import { Lazy } from '../utils/once'
import Driver from './impl'

class DriverCollection<NodeLabel, EdgeLabel> {
  constructor (public readonly defaultDriver: string, ...loaders: Array<[string, () => Promise<Driver<NodeLabel, EdgeLabel>>]>) {
    this.loaders = new Map(loaders)
    if (!this.loaders.has(this.defaultDriver)) throw new Error('defaultDriver not contained in loaders')

    // setup lazy values
    for (const key of this.loaders.keys()) {
      this.values.set(key, new Lazy<Driver<NodeLabel, EdgeLabel>>())
    }
  }

  private readonly values = new Map<string, Lazy<Driver<NodeLabel, EdgeLabel>>>()
  private readonly loaders = new Map<string, () => Promise<Driver<NodeLabel, EdgeLabel>>>()

  public async get (name: string): Promise<Driver<NodeLabel, EdgeLabel>> {
    const lazy = this.values.get(name)
    if (typeof lazy === 'undefined') {
      throw new Error('unknown renderer')
    }

    const renderer = await lazy.Get(async (): Promise<Driver<NodeLabel, EdgeLabel>> => {
      const loader = this.loaders.get(name)
      if (typeof loader === 'undefined') {
        throw new Error('implementation error: loaders missing loader')
      }

      return await loader()
    })

    if (renderer.driverName !== name) {
      throw new Error('driver returned incorrect name: expected ' + name + ', but got ' + renderer.driverName)
    }

    return renderer
  }

  get names (): string[] {
    return Array.from(this.loaders.keys())
  }
}

export const models = new DriverCollection<ModelNode, ModelEdge>(
  'vis-network',
  [
    'GraphViz',
    async () => await import('./impl/graphviz').then(m => m.GraphVizModelDriver.instance)
  ],
  [
    'vis-network',
    async () => await import('./impl/vis-network').then(m => m.VisNetworkModelDriver.instance)
  ],
  [
    'Sigma.js',
    async () => await import('./impl/sigma').then(m => m.SigmaModelDriver.instance)
  ],
  [
    'Cytoscape',
    async () => await import('./impl/cytoscape').then(m => m.CytoModelDriver.instance)
  ]
)

export const bundles = new DriverCollection<BundleNode, BundleEdge>(
  'GraphViz',
  [
    'GraphViz',
    async () => await import('./impl/graphviz').then(m => m.GraphVizBundleDriver.instance)
  ],
  [
    'vis-network',
    async () => await import('./impl/vis-network').then(m => m.VisNetworkBundleDriver.instance)
  ],
  [
    'Sigma.js',
    async () => await import('./impl/sigma').then(m => m.SigmaBundleDriver.instance)
  ],
  [
    'Cytoscape',
    async () => await import('./impl/cytoscape').then(m => m.CytoBundleDriver.instance)
  ]
)