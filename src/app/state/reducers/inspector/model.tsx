import { type Reducer, type State } from '../..'
import { defaultLayout } from '../../../../lib/drivers'
import { models } from '../../../../lib/drivers/collection'
import { type PathTree } from '../../../../lib/pathtree'
import Deduplication from '../../state/deduplication'

export function newModelDriver (tree: PathTree): string {
  return models.defaultDriver
}

export function setModelDriver (name: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    modelGraphDriver: name,
    modelGraphLayout: defaultLayout
  })
}

export function setModelLayout (layout: string): Reducer {
  return ({ tree }: State): Partial<State> => ({
    modelGraphLayout: layout
  })
}

export function newModelDeduplication (tree: PathTree): Deduplication {
  return Deduplication.Bundle
}

export function setModelDeduplication (dup: Deduplication): Reducer {
  return ({ optionVersion }: State): Partial<State> => ({
    optionVersion: optionVersion + 1,
    modelDeduplication: dup
  })
}
