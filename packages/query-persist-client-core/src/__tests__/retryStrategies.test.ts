import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { QueryClient, dehydrate } from '@tanstack/query-core'
import { removeOldestQuery } from '../retryStrategies'
import type { PersistedClient } from '../persist'

type PersistedQuery = PersistedClient['clientState']['queries'][number]

describe('removeOldestQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
  })

  function createQuery(
    queryHash: string,
    dataUpdatedAt: number,
  ): PersistedQuery {
    queryClient.setQueryData([queryHash], 'data')
    const query = dehydrate(queryClient).queries.find(
      (dehydratedQuery) => dehydratedQuery.queryHash === `["${queryHash}"]`,
    )!
    return { ...query, state: { ...query.state, dataUpdatedAt } }
  }

  function createPersistedClient(
    queries: Array<PersistedQuery>,
    mutations: PersistedClient['clientState']['mutations'] = [],
  ): PersistedClient {
    return {
      timestamp: 0,
      buster: '',
      clientState: { queries, mutations },
    }
  }

  it('should remove the query with the oldest dataUpdatedAt', () => {
    const persistedClient = createPersistedClient([
      createQuery('a', 30),
      createQuery('b', 10),
      createQuery('c', 20),
    ])

    const result = removeOldestQuery({
      persistedClient,
      error: new Error('full'),
      errorCount: 1,
    })

    expect(result?.clientState.queries.map((query) => query.queryKey)).toEqual([
      ['a'],
      ['c'],
    ])
  })

  it('should remove only a single query when multiple share the oldest dataUpdatedAt', () => {
    const persistedClient = createPersistedClient([
      createQuery('a', 10),
      createQuery('b', 10),
    ])

    const result = removeOldestQuery({
      persistedClient,
      error: new Error('full'),
      errorCount: 1,
    })

    expect(result?.clientState.queries.map((query) => query.queryKey)).toEqual([
      ['b'],
    ])
  })

  it('should return undefined when there are no queries to remove', () => {
    const persistedClient = createPersistedClient([])

    const result = removeOldestQuery({
      persistedClient,
      error: new Error('full'),
      errorCount: 1,
    })

    expect(result).toBeUndefined()
  })

  it('should preserve mutations when removing the oldest query', () => {
    queryClient.getMutationCache().build(queryClient, {
      mutationFn: () => Promise.resolve('data'),
    })
    const { mutations } = dehydrate(queryClient, {
      shouldDehydrateMutation: () => true,
    })

    const persistedClient = createPersistedClient(
      [createQuery('a', 10)],
      mutations,
    )

    const result = removeOldestQuery({
      persistedClient,
      error: new Error('full'),
      errorCount: 1,
    })

    expect(result?.clientState.queries).toEqual([])
    expect(result?.clientState.mutations).toEqual(mutations)
  })
})
