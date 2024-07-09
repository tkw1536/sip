import { describe, expect, test } from 'vitest'
import { NamespaceMap } from './namespace'

describe(NamespaceMap, () => {
  test.each([
    ['empty map', NamespaceMap.empty(), new Map()],
    [
      'adding a new namespace',
      NamespaceMap.empty().add('https://example.com/', 'example'),
      new Map([['https://example.com/', 'example']]),
    ],
    [
      'adding multiple unrelated namespaces',
      NamespaceMap.empty()
        .add('https://example.com', 'example')
        .add('https://other.example.com', 'other'),
      new Map([
        ['https://example.com/', 'example'],
        ['https://other.example.com/', 'other'],
      ]),
    ],
    [
      'removing long',
      NamespaceMap.empty()
        .add('https://example.com/', 'example')
        .add('https://other.example.com/', 'other')
        .remove('https://example.com/'),
      new Map([['https://other.example.com/', 'other']]),
    ],
    [
      'removing non-existing namespaces',
      NamespaceMap.empty()
        .add('https://example.com/', 'example')
        .add('https://other.example.com/', 'other')
        .remove('https://third.example.com/'),
      new Map([
        ['https://example.com/', 'example'],
        ['https://other.example.com/', 'other'],
      ]),
    ],
    [
      'adding multiple overlapping namespace',
      NamespaceMap.empty()
        .add('https://example.com/', 'example')
        .add('https://example.com/abc/', 'abc'),
      new Map([
        ['https://example.com/', 'example'],
        ['https://example.com/abc/', 'abc'],
      ]),
    ],
    [
      'overwriting short',
      NamespaceMap.empty()
        .add('https://example.com/', 'example')
        .add('https://example.com/2/', 'example'),
      new Map([['https://example.com/2/', 'example']]),
    ],
    [
      'overwriting long',
      NamespaceMap.empty()
        .add('https://example.com/', 'example')
        .add('https://example.com/', 'example_new'),
      new Map([['https://example.com/', 'example_new']]),
    ],
  ])('add / toMap($1)', (_, ns, want) => {
    expect(ns.toMap()).toEqual(want)
  })

  test('hasLong / hasShort', () => {
    const mp = NamespaceMap.empty()
      .add('https://example.com/', 'example')
      .add('https://other.example.com/', 'other')

    expect(mp.hasShort('example')).toBe(true)
    expect(mp.hasShort('other')).toBe(true)
    expect(mp.hasShort('third')).toBe(false)

    expect(mp.hasLong('https://example.com/')).toBe(true)
    expect(mp.hasLong('https://other.example.com/')).toBe(true)
    expect(mp.hasLong('https://third.example.com/')).toBe(false)
    expect(mp.hasLong('https://other.example.com/deep/')).toBe(false)
  })

  test.each([
    ['https://example.com/', 'https://example.com/', 'example:'],
    ['https://example.com/123', 'https://example.com/', 'example:123'],
    ['https://example.com/abc/', 'https://example.com/abc/', 'abc:'],
    ['https://example.com/abc/deep', 'https://example.com/abc/', 'abc:deep'],
    ['https://unrelated.example.com/', '', 'https://unrelated.example.com/'],
  ])(
    'prefix($1) === $2 && apply($1) === $3',
    (url: string, wantPrefix: string, wantApply: string) => {
      const mp = NamespaceMap.empty()
        .add('https://example.com/', 'example')
        .add('https://example.com/abc/', 'abc')
        .add('https://other.example.com/', 'other')

      expect(mp.prefix(url)).toBe(wantPrefix)
      expect(mp.apply(url)).toBe(wantApply)
    },
  )
})

// TODO: Test namespace map generation
