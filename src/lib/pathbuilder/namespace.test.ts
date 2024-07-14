import { describe, expect, test } from 'vitest'
import { NamespaceMap } from './namespace'

describe(NamespaceMap, () => {
  test.each([
    ['empty map', NamespaceMap.empty(), []],
    [
      'adding a new namespace',
      NamespaceMap.empty().add('example', 'https://example.com/'),
      [['example', 'https://example.com/']],
    ],
    [
      'adding multiple unrelated namespaces',
      NamespaceMap.empty()
        .add('example', 'https://example.com/')
        .add('other', 'https://other.example.com/'),
      [
        ['example', 'https://example.com/'],
        ['other', 'https://other.example.com/'],
      ],
    ],
    [
      'removing long',
      NamespaceMap.empty()
        .add('example', 'https://example.com/')
        .add('other', 'https://other.example.com/')
        .remove('example'),
      [['other', 'https://other.example.com/']],
    ],
    [
      'removing non-existing namespaces',
      NamespaceMap.empty()
        .add('example', 'https://example.com/')
        .add('other', 'https://other.example.com/')
        .remove('third'),
      [
        ['example', 'https://example.com/'],
        ['other', 'https://other.example.com/'],
      ],
    ],
    [
      'adding multiple overlapping namespace',
      NamespaceMap.empty()
        .add('example', 'https://example.com/')
        .add('abc', 'https://example.com/abc/'),
      [
        ['example', 'https://example.com/'],
        ['abc', 'https://example.com/abc/'],
      ],
    ],
    [
      'overwriting short',
      NamespaceMap.empty()
        .add('example', 'https://example.com/')
        .add('example', 'https://example.com/2/'),
      [['example', 'https://example.com/2/']],
    ],
    [
      'duplicate long',
      NamespaceMap.empty()
        .add('example', 'https://example.com/')
        .add('example2', 'https://example.com/'),
      [
        ['example', 'https://example.com/'],
        ['example2', 'https://example.com/'],
      ],
    ],
  ])('add / toMap(%1)', (_, ns, ary) => {
    const got = Array.from(ns)
    expect(got).toEqual(ary)
  })

  test.each([
    new Map([
      ['https://example.com/', 'example'],
      ['https://other.example.com/', 'other'],
    ]),
  ])('round-trip fromMap', data => {
    const mp = NamespaceMap.fromMap(data)
    const rtt = NamespaceMap.fromMap(mp)

    expect(rtt).toEqual(mp)
  })

  test('has', () => {
    const mp = NamespaceMap.empty()
      .add('example', 'https://example.com/')
      .add('other', 'https://other.example.com/')

    expect(mp.has('example')).toBe(true)
    expect(mp.has('other')).toBe(true)
    expect(mp.has('third')).toBe(false)
  })

  test.each([
    ['https://example.com/', 'example:'],
    ['https://example.com/123', 'example:123'],
    ['https://example.com/abc/', 'abc:'],
    ['https://example.com/abc/deep', 'abc:deep'],
    ['https://unrelated.example.com/', 'https://unrelated.example.com/'],
  ])(
    'prefix(%1) === %2 && apply(%1) === %3',
    (url: string, wantApply: string) => {
      const mp = NamespaceMap.empty()
        .add('example', 'https://example.com/')
        .add('abc', 'https://example.com/abc/')
        .add('other', 'https://other.example.com/')
        .add('also_other', 'https://other.example.com/')

      expect(mp.apply(url)).toEqual(wantApply)
    },
  )
})

// TODO: Test namespace map generation
