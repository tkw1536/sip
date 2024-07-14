import { type IReducer, type IState } from '..'
import { models } from '../../../../lib/drivers/collection'
import { defaultLayout } from '../../../../lib/drivers/impl'
import { type PathTree } from '../../../../lib/pathbuilder/pathtree'
import Deduplication from '../state/deduplication'

export function newModelDriver(tree: PathTree): string {
  return models.defaultDriver
}

export function setModelDriver(name: string): IReducer {
  return ({ tree }: IState): Partial<IState> => ({
    modelGraphDriver: name,
    modelGraphLayout: defaultLayout,
  })
}

export function setModelLayout(layout: string): IReducer {
  return ({ tree }: IState): Partial<IState> => ({
    modelGraphLayout: layout,
  })
}

export function newModelDeduplication(tree: PathTree): Deduplication {
  return Deduplication.Bundle
}

export function setModelDeduplication(dup: Deduplication): IReducer {
  return ({ optionVersion }: IState): Partial<IState> => ({
    optionVersion: optionVersion + 1,
    modelDeduplication: dup,
  })
}
