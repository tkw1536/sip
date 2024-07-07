import { type Reducer, type State } from '../..'
import { bundles } from '../../../../lib/drivers/collection'
import { defaultLayout } from '../../../../lib/drivers/impl'
import { type PathTree } from '../../../../lib/pathbuilder/pathtree'

export function newBundleDriver(tree: PathTree): string {
  return bundles.defaultDriver
}

export function setBundleDriver(name: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    bundleGraphDriver: name,
    bundleGraphLayout: defaultLayout,
  })
}

export function setBundleLayout(layout: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    bundleGraphLayout: layout,
  })
}
