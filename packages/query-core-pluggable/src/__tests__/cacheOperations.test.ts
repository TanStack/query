import { describe, expect, it } from 'vitest'
import {
  QueryClient,
  getQueriesData,
  invalidateQueries,
  removeQueries,
  setQueriesData,
} from '..'
import { getQueryData, getQueryState, setQueryData } from '../queryClient'

describe('cache operations', () => {
  it('applies imported cache operations to the supplied client', async () => {
    const client = new QueryClient()
    const otherClient = new QueryClient()
    const filters = { queryKey: ['posts'] }
    setQueryData(client, ['posts', 1], 2)
    setQueryData(client, ['posts', 2], 3)
    setQueryData(otherClient, ['posts', 1], 10)

    setQueriesData<number>(client, filters, (count = 0) => count * 2)
    expect(getQueriesData(client, filters)).toStrictEqual([
      [['posts', 1], 4],
      [['posts', 2], 6],
    ])
    await invalidateQueries(client, { ...filters, refetchType: 'none' })
    expect(getQueryState(client, ['posts', 1])?.isInvalidated).toBe(true)
    removeQueries(client, filters)
    expect(getQueriesData(client, filters)).toStrictEqual([])
    expect(getQueryData(otherClient, ['posts', 1])).toBe(10)
  })
})
