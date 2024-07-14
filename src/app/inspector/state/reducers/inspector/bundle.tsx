import { type IReducer, type IState } from '../..'
import { bundles } from '../../../../../lib/drivers/collection'
import { defaultLayout } from '../../../../../lib/drivers/impl'
import { type PathTree } from '../../../../../lib/pathbuilder/pathtree'

export function newBundleDriver(tree: PathTree): string {
  return bundles.defaultDriver
}

export function setBundleDriver(name: string): IReducer {
  return ({ tree }: IState): Partial<IState> => ({
    bundleGraphDriver: name,
    bundleGraphLayout: defaultLayout,
  })
}

export function setBundleLayout(layout: string): IReducer {
  return ({ tree }: IState): Partial<IState> => ({
    bundleGraphLayout: layout,
  })
}
