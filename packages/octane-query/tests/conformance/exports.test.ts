import { describe, expect, it } from 'vitest'
import * as query from '@tanstack/octane-query'
import * as reactQuery from '@tanstack/react-query'

describe('@tanstack/octane-query export surface', () => {
  it('provides EVERY runtime export of real @tanstack/react-query', () => {
    // The gold-standard parity lock: diff the whole runtime surface against
    // the actual react-query module. Anything upstream ships that the port
    // lacks fails here by name.
    const upstream = Object.keys(reactQuery).sort()
    const port = new Set(Object.keys(query))
    const missing = upstream.filter((name) => !port.has(name))
    expect(missing).toEqual([])
  })

  it('exports nothing upstream keeps private (no accidental superset)', () => {
    const upstream = new Set(Object.keys(reactQuery))
    const extras = Object.keys(query)
      .filter((name) => !upstream.has(name))
      .sort()
    // The port intentionally has NO binding-level extras. (query-core
    // re-exports that react-query happens not to forward would show up here —
    // keep that list empty too, so the surfaces stay byte-comparable.)
    expect(extras).toEqual([])
  })

  it('option helper exports are identity helpers like @tanstack/react-query', () => {
    const q = { queryKey: ['x'], queryFn: async () => 'x' }
    const inf = {
      queryKey: ['i'],
      queryFn: async () => ['i'],
      initialPageParam: 0,
    }
    const mut = { mutationFn: async (value: string) => value }
    expect(query.queryOptions(q as any)).toBe(q)
    expect(query.infiniteQueryOptions(inf as any)).toBe(inf)
    expect(query.mutationOptions(mut as any)).toBe(mut)
  })
})
