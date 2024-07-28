import { type IReducer, type IState } from '.'
import { models } from '../../../../lib/drivers/collection'
import { defaultLayout } from '../../../../lib/drivers/impl'
import { type ModelDisplay } from '../../../../lib/graph/builders/model/labels'
import Deduplication from '../state/deduplication'

export function newModelDriver(): string {
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

export function newModelDeduplication(): Deduplication {
  return Deduplication.Bundle
}

export function setModelDeduplication(dup: Deduplication): IReducer {
  return (): Partial<IState> => ({
    modelDeduplication: dup,
  })
}

export function setModelDisplay(display: ModelDisplay): IReducer {
  return (): Partial<IState> => ({
    modelDisplay: display,
  })
}

export function setModelSeed(seed: number | null): IReducer {
  return (): Partial<IState> => ({
    modelGraphSeed: seed,
  })
}
