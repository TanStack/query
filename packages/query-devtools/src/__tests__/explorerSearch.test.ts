import { describe, expect, it, vi } from 'vitest'
import { searchEntries, searchExplorer } from '../explorerSearch'

describe('explorer search', () => {
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
