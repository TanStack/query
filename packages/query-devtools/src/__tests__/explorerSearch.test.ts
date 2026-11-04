import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { searchEntries, searchExplorer } from '../explorerSearch'

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

  it('keeps typed arrays and boxed strings opaque', () => {
    expect(searchEntries(new Uint8Array(100_000))).toBeUndefined()
    expect(searchEntries(Object('needle'))).toBeUndefined()
  })

  it('bounds deeply nested searches and keeps nearby matches', () => {
    let value: unknown = 'needle'
    for (let depth = 0; depth < 10_000; depth++) value = { next: value }
    expect(
      searchExplorer({ nearby: 'needle', deep: value }, 'needle').hasMatch,
    ).toBe(true)
    expect(searchExplorer(value, 'needle').hasMatch).toBe(false)
  })
})
