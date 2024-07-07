import { type BundleEdge, type BundleNode } from '../graph/builders/bundle'
import { type ModelEdge, type ModelNode } from '../graph/builders/model'
import { type RDFEdge, type RDFNode } from '../graph/builders/rdf'
import { Lazy } from '../utils/once'
import type Driver from './impl'

class DriverCollection<NodeLabel, EdgeLabel> {
  constructor(
    public readonly defaultDriver: string,
    ...loaders: Array<[string, () => Promise<Driver<NodeLabel, EdgeLabel>>]>
  ) {
    this.loaders = new Map(loaders)
    if (!this.loaders.has(this.defaultDriver))
      throw new Error('defaultDriver not contained in loaders')

    // setup lazy values
    for (const key of this.loaders.keys()) {
      this.values.set(key, new Lazy<Driver<NodeLabel, EdgeLabel>>())
    }
  }

  private readonly values = new Map<
    string,
    Lazy<Driver<NodeLabel, EdgeLabel>>
  >()
  private readonly loaders = new Map<
    string,
    () => Promise<Driver<NodeLabel, EdgeLabel>>
  >()

  public async get(name: string): Promise<Driver<NodeLabel, EdgeLabel>> {
    const lazy = this.values.get(name)
    if (typeof lazy === 'undefined') {
      throw new Error('unknown renderer ' + JSON.stringify(name))
    }

    const renderer = await lazy.Get(
      async (): Promise<Driver<NodeLabel, EdgeLabel>> => {
        const loader = this.loaders.get(name)
        if (typeof loader === 'undefined') {
          throw new Error('implementation error: loaders missing loader')
        }

        return await loader()
      },
    )

    if (renderer.driverName !== name) {
      throw new Error(
        'driver returned incorrect name: expected ' +
          name +
          ', but got ' +
          renderer.driverName,
      )
    }

    return renderer
  }

  get names(): string[] {
    return Array.from(this.loaders.keys())
  }
}

export const models = new DriverCollection<ModelNode, ModelEdge>(
  'GraphViz',
  [
    'GraphViz',
    async () =>
      await import('./impl/graphviz').then(
        m => new m.GraphVizModelDriver(false),
      ),
  ],
  [
    'GraphViz-compact',
    async () =>
      await import('./impl/graphviz').then(
        m => new m.GraphVizModelDriver(true),
      ),
  ],
  [
    'vis-network',
    async () =>
      await import('./impl/vis-network').then(
        m => new m.VisNetworkModelDriver(),
      ),
  ],
  [
    'Sigma.js',
    async () =>
      await import('./impl/sigma').then(m => new m.SigmaModelDriver()),
  ],
  [
    'Cytoscape',
    async () =>
      await import('./impl/cytoscape').then(m => m.CytoModelDriver.instance),
  ],
)

export const bundles = new DriverCollection<BundleNode, BundleEdge>(
  'GraphViz',
  [
    'GraphViz',
    async () =>
      await import('./impl/graphviz').then(m => new m.GraphVizBundleDriver()),
  ],
  [
    'vis-network',
    async () =>
      await import('./impl/vis-network').then(
        m => new m.VisNetworkBundleDriver(),
      ),
  ],
  [
    'Sigma.js',
    async () =>
      await import('./impl/sigma').then(m => new m.SigmaBundleDriver()),
  ],
  [
    'Cytoscape',
    async () =>
      await import('./impl/cytoscape').then(m => new m.CytoBundleDriver()),
  ],
)

export const triples = new DriverCollection<RDFNode, RDFEdge>('GraphViz', [
  'GraphViz',
  async () =>
    await import('./impl/graphviz').then(m => new m.GraphVizRDFDriver()),
])
