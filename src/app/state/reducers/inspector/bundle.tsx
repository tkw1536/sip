import { Reducer, State } from '../..'
import { defaultLayout } from '../../../../lib/drivers'
import { bundles } from '../../../../lib/drivers/collection'
import { PathTree } from '../../../../lib/pathtree'

export function newBundleRender (tree: PathTree): string {
  return bundles.defaultDriver
}

export function setBundleRenderer (name: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    bundleGraphRenderer: name,
    bundleGraphLayout: defaultLayout
  })
}

export function setBundleLayout (layout: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    bundleGraphLayout: layout
  })
}
