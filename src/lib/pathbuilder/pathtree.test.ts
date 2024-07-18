import { describe, expect, test } from 'vitest'
import { Pathbuilder } from './pathbuilder'
import { readFixture } from '../utils/test/fixture'
import { PathTree, type PathTreeNode } from './pathtree'

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

  test('walk iterates over all children in order', () => {
    const descendants = Array.from(sampleTree.walk())
    const indexes = descendants.map(d => d.index)

    expect(descendants.length).toEqual(12)
    expect(indexes).toEqual([-1, 0, 8, 2, 7, 9, 10, 1, 3, 4, 5, 6])
  })

  test('paths iterates over the paths in order', () => {
    expect(Array.from(sampleTree.paths())).toEqual(
      [0, 8, 2, 7, 9, 10, 1, 3, 4, 5, 6].map(i => samplePB.paths[i]),
    )
  })

  test('walkIDs iterates over all children in the right order', () => {
    expect(Array.from(sampleTree.walkIDs())).toEqual([
      'publication',
      'creation',
      'date_of_writing',
      'author',
      'scientific_publication',
      'figure_image',
      'title',
      'scientific_figure',
      'image',
      'person',
      'name',
    ])
  })

  test('equals actually checks equality', async () => {
    const descendants = Array.from(sampleTree.walk())
    descendants.forEach((outer, i) => {
      descendants.forEach((inner, j) => {
        expect(outer.equals(inner)).toEqual(i === j)
        expect(inner.equals(outer)).toEqual(i === j)
      })
    })
  })

  test.each([
    ['i_do_not_exist', null],
    ['publication', 'publication'],
    ['creation', 'creation'],
    ['date_of_writing', 'date_of_writing'],
    ['author', 'author'],
    ['scientific_publication', 'scientific_publication'],
    ['figure_image', 'figure_image'],
    ['title', 'title'],
    ['scientific_figure', 'scientific_figure'],
    ['image', 'image'],
    ['person', 'person'],
    ['name', 'name'],
  ])('find(%1) === %2', (query, wantID) => {
    const got = sampleTree.find(query)?.path ?? null
    const want = samplePB.paths.find(p => p.id === wantID) ?? null
    expect(got).toBe(want)
  })

  test('uris', async () => {
    const got = sampleTree.uris
    const want = new Set([
      'http://erlangen-crm.org/240307/E31_Document',
      'http://erlangen-crm.org/240307/P94i_was_created_by',
      'http://erlangen-crm.org/240307/E65_Creation',
      'http://erlangen-crm.org/240307/P4_has_time-span',
      'http://erlangen-crm.org/240307/E52_Time-Span',
      'http://erlangen-crm.org/240307/P82_at_some_time_within',
      'http://erlangen-crm.org/240307/P14_carried_out_by',
      'http://erlangen-crm.org/240307/E21_Person',
      'http://erlangen-crm.org/240307/P165_incorporates',
      'http://erlangen-crm.org/240307/E90_Symbolic_Object',
      'http://erlangen-crm.org/240307/P138i_has_representation',
      'http://erlangen-crm.org/240307/E36_Visual_Item',
      'http://erlangen-crm.org/240307/P48_has_preferred_identifier',
      'http://erlangen-crm.org/240307/E42_Identifier',
      'http://erlangen-crm.org/240307/P3_has_note',
      'http://erlangen-crm.org/240307/P102_has_title',
      'http://erlangen-crm.org/240307/E35_Title',
      'http://erlangen-crm.org/240307/P1_is_identified_by',
    ])
    expect(Array.from(got)).toEqual(Array.from(want))
  })

  test('tree navigation works', () => {
    const checkParentRelation = (
      node: PathTreeNode,
      wantParent: PathTreeNode | null,
      wantParentIndex: number,
    ): void => {
      if (wantParentIndex < 0 || wantParent === null) {
        expect(node.parent).toBe(null)
        return
      }

      // check that we have the right parent
      const { parent } = node
      expect(parent).toBe(wantParent)

      // and the right index
      const gotParentIndex = Array.from(parent?.children() ?? []).findIndex(
        c => c === node,
      )
      expect(gotParentIndex).toBe(wantParentIndex)
    }

    const checkNode = (node: PathTreeNode): void => {
      const children = Array.from(node.children())
      expect(node.childCount).toBe(children.length)

      children.forEach((child, index) => {
        checkParentRelation(child, node, index)
        checkNode(child)
      })
    }

    checkParentRelation(sampleTree, null, -1)
    checkNode(sampleTree)
  })
})
