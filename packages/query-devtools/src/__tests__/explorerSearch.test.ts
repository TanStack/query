import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import {
  hasExplorerMatch,
  searchEntries,
  searchExplorer,
} from '../explorerSearch'

describe('explorer search', () => {
  it.each([
    { expression: "new Map([['name', 'needle']])", label: 'name' },
    { expression: "new Set(['needle'])", label: '0' },
    {
      expression: "new (class extends Map {})([['name', 'needle']])",
      label: 'name',
    },
  ])(
    'searches cross-realm collections: $expression',
    ({ expression, label }) => {
      const value: unknown = runInNewContext(expression)
      expect(searchExplorer(value, 'needle').hasMatch).toBe(true)
      expect(searchEntries(value)?.[0]?.label).toBe(label)
    },
  )

  it('does not read collection tag accessors', () => {
    const read = vi.fn<() => never>(() => {
      throw new Error('Do not read')
    })
    const value = { name: 'needle' }
    Object.defineProperty(value, Symbol.toStringTag, { get: read })
    expect(searchExplorer(value, 'needle').hasMatch).toBe(true)
    expect(read).not.toHaveBeenCalled()
  })

  it('searches ordinary data when a collection tag has no native brand', () => {
    const value = { name: 'needle', [Symbol.toStringTag]: 'Map' }
    expect(searchExplorer(value, 'needle').hasMatch).toBe(true)
  })

  it('finds the native brand behind an overridden collection tag', () => {
    const value: unknown = runInNewContext(
      "Object.defineProperty(new Map([['name', 'needle']]), Symbol.toStringTag, {value: 'Set'})",
    )
    expect(searchExplorer(value, 'needle').hasMatch).toBe(true)
    expect(searchEntries(value)?.[0]?.label).toBe('name')
  })

  it('treats proxy collections and throwing introspection as opaque', () => {
    for (const collection of [
      new Map([['name', 'needle']]),
      new Set(['needle']),
    ]) {
      expect(searchEntries(new Proxy(collection, {}))).toBeUndefined()
    }
    const value = new Proxy(
      { name: 'needle' },
      {
        ownKeys() {
          throw new Error('Cannot inspect')
        },
      },
    )
    expect(searchExplorer(value, 'needle').hasMatch).toBe(false)
  })

  it('searches own class data fields without invoking custom code', () => {
    const read = vi.fn<() => never>(() => {
      throw new Error('Do not read')
    })
    class Profile {
      *[Symbol.iterator]() {
        yield read()
      }
      name = 'needle'
      toJSON = read
    }
    const value = new Profile()
    Object.defineProperty(value, 'secret', { enumerable: true, get: read })
    const match = searchExplorer(value, 'needle')
    expect(match.hasMatch).toBe(true)
    expect(match.children.get('name')?.value).toBe(true)
    expect(match.children.get('secret')?.kind).toBe('accessor')
    expect(read).not.toHaveBeenCalled()
  })

  it.each([
    { kind: 'Map', value: new Map([['entry', 'needle']]), key: 'entry' },
    { kind: 'Set', value: new Set(['needle']), key: '0' },
  ])('searches a $kind with a null prototype', ({ value, key }) => {
    Object.setPrototypeOf(value, null)
    expect(searchEntries(value)).toStrictEqual([
      { key, label: key, value: 'needle' },
    ])
    expect(searchExplorer(value, 'needle').children.get(key)?.value).toBe(true)
  })

  it('keeps typed arrays and boxed strings opaque', () => {
    expect(searchEntries(new Uint8Array(100_000))).toBeUndefined()
    expect(searchEntries(Object('needle'))).toBeUndefined()
    const value: unknown = runInNewContext("new String('needle')")
    const read = vi.fn<() => never>(() => {
      throw new Error('Do not read')
    })
    Object.defineProperty(Object.getPrototypeOf(value), 'constructor', {
      get: read,
    })
    expect(searchEntries(value)).toBeUndefined()
    expect(read).not.toHaveBeenCalled()
    Object.setPrototypeOf(value, null)
    expect(searchEntries(value)).toBeUndefined()
  })

  it('bounds deeply nested searches and keeps nearby matches', () => {
    let value: unknown = 'needle'
    for (let depth = 0; depth < 10_000; depth++) value = { next: value }
    expect(
      searchExplorer({ nearby: 'needle', deep: value }, 'needle').hasMatch,
    ).toBe(true)
    expect(searchExplorer(value, 'needle').hasMatch).toBe(false)
  })

  describe('hasExplorerMatch', () => {
    it.each([
      { value: { name: 'needle' }, term: 'needle' },
      { value: { needle: 1 }, term: 'needle' },
      { value: [1, 2, { deep: [42] }], term: '42' },
      { value: new Map([['a', 'needle']]), term: 'needle' },
      { value: new Set(['needle']), term: 'needle' },
      { value: { flag: true }, term: 'true' },
      { value: { empty: null }, term: 'null' },
      { value: { name: 'other' }, term: 'needle' },
      { value: 'needle', term: 'eed' },
      { value: new Uint8Array([1]), term: '1' },
    ])('agrees with searchExplorer for $term', ({ value, term }) => {
      expect(hasExplorerMatch(value, term)).toBe(
        searchExplorer(value, term).hasMatch,
      )
    })

    it('handles circular data', () => {
      const value: Record<string, unknown> = { name: 'other' }
      value.self = value
      expect(hasExplorerMatch(value, 'needle')).toBe(false)
      value.found = 'needle'
      expect(hasExplorerMatch(value, 'needle')).toBe(true)
    })

    it('matches accessor labels without evaluating getters', () => {
      const read = vi.fn<() => string>(() => 'needle')
      const value = {}
      Object.defineProperty(value, 'getter', { get: read, enumerable: true })
      expect(hasExplorerMatch(value, 'needle')).toBe(false)
      expect(hasExplorerMatch(value, 'getter')).toBe(true)
      expect(read).not.toHaveBeenCalled()
    })

    it('bounds deeply nested searches', () => {
      let value: unknown = 'needle'
      for (let depth = 0; depth < 10_000; depth++) value = { next: value }
      expect(hasExplorerMatch(value, 'needle')).toBe(false)
      expect(
        hasExplorerMatch({ nearby: 'needle', deep: value }, 'needle'),
      ).toBe(true)
    })
  })
})
