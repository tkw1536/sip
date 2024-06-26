import { type Reducer, type State } from '../..'
import { defaultLayout } from '../../../../lib/drivers'
import { bundles } from '../../../../lib/drivers/collection'
import { type PathTree } from '../../../../lib/pathtree'

export function newBundleDriver (tree: PathTree): string {
  return bundles.defaultDriver
}

export function setBundleDriver (name: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    bundleGraphDriver: name,
    bundleGraphLayout: defaultLayout
  })
}

export function setBundleLayout (layout: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    bundleGraphLayout: layout
  })
}
