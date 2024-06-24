import { Reducer, State } from '../..'
import { defaultLayout } from '../../../../lib/drivers'
import { models } from '../../../../lib/drivers/collection'
import { PathTree } from '../../../../lib/pathtree'
import Deduplication from '../../state/deduplication'

export function newModelRender (tree: PathTree): string {
  return models.defaultDriver
}

export function setModelRenderer (name: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    modelGraphRenderer: name,
    modelGraphLayout: defaultLayout
  })
}

export function setModelLayout (layout: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    modelGraphLayout: layout
  })
}

export function newDeduplication (tree: PathTree): Deduplication {
  return Deduplication.Bundle
}

export function setDeduplication (dup: Deduplication): Reducer {
  return ({ optionVersion }: State): Partial<State> => ({
    optionVersion: optionVersion + 1,
    deduplication: dup
  })
}
