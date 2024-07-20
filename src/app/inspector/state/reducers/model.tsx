import { type IReducer, type IState } from '..'
import { models } from '../../../../lib/drivers/collection'
import { defaultLayout } from '../../../../lib/drivers/impl'
import { type ModelDisplay } from '../../../../lib/graph/builders/model/types'
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
  return ({ modelGraphOptionVersion }: IState): Partial<IState> => ({
    modelGraphOptionVersion: modelGraphOptionVersion + 1,
    modelDeduplication: dup,
  })
}

export function newModelDisplay(): ModelDisplay {
  return {
    Components: {
      PropertyLabels: true,
      DatatypePropertyLabels: true,
    },
  }
}

export function setModelDisplay(display: ModelDisplay): IReducer {
  return ({ modelGraphOptionVersion }: IState): Partial<IState> => ({
    modelGraphOptionVersion: modelGraphOptionVersion + 1,
    modelDisplay: display,
  })
}
