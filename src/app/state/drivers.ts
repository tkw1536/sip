import { BundleEdge, BundleNode } from '../../lib/graph/builders/bundle'
import { ModelEdge, ModelNode } from '../../lib/graph/builders/model'
import Once, { Lazy } from '../../lib/utils/once'
import { Driver } from '../views/graph/renderers'

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
  private readonly initializer = new Map<any, Once>()
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

      // do the loading
      const driver = await loader()

      // get a once for the initialization of the class
      let once = this.initializer.get(driver.constructor)
      if (typeof once === 'undefined') {
        once = new Once()
        this.initializer.set(driver.constructor, once)
      }

      // initialize the class once
      await once.Do(driver.initializeClass.bind(driver))

      // and return the driver
      return driver
    })

    if (renderer.rendererName !== name) {
      throw new Error('driver returned incorrect name: expected ' + name + ', but got ' + renderer.rendererName)
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
    'vis-network',
    async () => await import('../views/graph/renderers/vis-network').then(m => m.VisNetworkModelDriver.instance)
  ],
  [
    'Sigma.js',
    async () => await import('../views/graph/renderers/sigma').then(m => m.SigmaModelDriver.instance)
  ],
  [
    'Cytoscape',
    async () => await import('../views/graph/renderers/cytoscape').then(m => m.CytoModelDriver.instance)
  ]
)

export const bundles = new DriverCollection<BundleNode, BundleEdge>(
  'vis-network',
  [
    'vis-network',
    async () => await import('../views/graph/renderers/vis-network').then(m => m.VisNetworkBundleDriver.instance)
  ],
  [
    'Sigma.js',
    async () => await import('../views/graph/renderers/sigma').then(m => m.SigmaBundleDriver.instance)
  ],
  [
    'Cytoscape',
    async () => await import('../views/graph/renderers/cytoscape').then(m => m.CytoBundleDriver.instance)
  ]
)
