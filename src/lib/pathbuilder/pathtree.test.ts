import { describe, expect, test } from 'vitest'
import { Pathbuilder } from './pathbuilder'
import { readFixture } from '../utils/test/fixture'
import { PathTree } from './pathtree'

const samplePB = Pathbuilder.parse(
  await readFixture('pathbuilder', 'sample.xml'),
)

const sampleTree = new PathTree([
  {
    path: samplePB.paths[0],
    index: 0,
    bundles: [
      {
        path: samplePB.paths[8],
        index: 8,
        bundles: [],
        fields: [
          {
            id: 'f656b0be125190ac4f0ace586b097653',
            index: 2,
            path: samplePB.paths[2],
          },
          {
            id: 'fd0587b2561c7f2ee4d68e91da9641c9',
            index: 7,
            path: samplePB.paths[7],
          },
        ],
      },
      {
        path: samplePB.paths[9],
        index: 9,
        bundles: [],
        fields: [
          {
            id: 'ea6cd7a9428f121a9a042fe66de406eb',
            index: 10,
            path: samplePB.paths[10],
          },
        ],
      },
    ],
    fields: [
      {
        id: 'f5125ed9c39b9e25742c6496b8fceead',
        index: 1,
        path: samplePB.paths[1],
      },
    ],
  },
  {
    path: samplePB.paths[3],
    index: 3,
    bundles: [],
    fields: [
      {
        id: 'f25b780a7baa987e05a48b2050a48937',
        index: 4,
        path: samplePB.paths[4],
      },
    ],
  },
  {
    path: samplePB.paths[5],
    index: 5,
    bundles: [],
    fields: [
      {
        id: 'fb04c30bbbcd629a0ddea44d4a6b3408',
        index: 6,
        path: samplePB.paths[6],
      },
    ],
  },
])

describe(PathTree, async () => {
  test('parses the sample pathbuilder correctly', async () => {
    const tree = PathTree.fromPathbuilder(samplePB)
    expect(tree.equals(sampleTree)).toBe(true)
  })
})
