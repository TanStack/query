import { describe, expect, it } from 'vitest'
import {
  QueryClient,
  getQueriesData,
  invalidateQueries,
  removeQueries,
  setQueriesData,
} from '..'

describe('cache operations', () => {
  it('applies imported cache operations to the supplied client', async () => {
    const client = new QueryClient()
    const otherClient = new QueryClient()
    const filters = { queryKey: ['posts'] }
    client.setQueryData(['posts', 1], 2)
    client.setQueryData(['posts', 2], 3)
    otherClient.setQueryData(['posts', 1], 10)

    setQueriesData<number>(client, filters, (count = 0) => count * 2)
    expect(getQueriesData(client, filters)).toStrictEqual([
      [['posts', 1], 4],
      [['posts', 2], 6],
    ])
    await invalidateQueries(client, { ...filters, refetchType: 'none' })
    expect(client.getQueryState(['posts', 1])?.isInvalidated).toBe(true)
    removeQueries(client, filters)
    expect(getQueriesData(client, filters)).toStrictEqual([])
    expect(otherClient.getQueryData(['posts', 1])).toBe(10)
  })
})
