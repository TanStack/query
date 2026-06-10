import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onScopeDispose, ref } from 'vue-demi'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useQueries } from '../useQueries'
import { useQueryClient } from '../useQueryClient'
import { QueryClient } from '../queryClient'
import type { MockedFunction } from 'vitest'

vi.mock('../useQueryClient')

describe('useQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return result for each query', () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queries = [
      {
        queryKey: key1,
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
      {
        queryKey: key2,
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
    ]
    const queriesState = useQueries({ queries })

    expect(queriesState.value).toMatchObject([
      {
        status: 'pending',
        isPending: true,
        isFetching: true,
        isStale: true,
      },
      {
        status: 'pending',
        isPending: true,
        isFetching: true,
        isStale: true,
      },
    ])
  })

  it('should resolve to success and update reactive state', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queries = [
      {
        queryKey: key1,
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
      {
        queryKey: key2,
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
    ]
    const queriesState = useQueries({ queries })

    await vi.advanceTimersByTimeAsync(0)

    expect(queriesState.value).toMatchObject([
      {
        status: 'success',
        isPending: false,
        isFetching: false,
        isStale: true,
      },
      {
        status: 'success',
        isPending: false,
        isFetching: false,
        isStale: true,
      },
    ])
  })

  it('should reject one of the queries and update reactive state', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queries = [
      {
        queryKey: key1,
        queryFn: () =>
          sleep(0).then(() => Promise.reject(new Error('Some error'))),
      },
      {
        queryKey: key2,
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
    ]
    const queriesState = useQueries({ queries })

    await vi.advanceTimersByTimeAsync(0)

    expect(queriesState.value).toMatchObject([
      {
        status: 'error',
        isPending: false,
        isFetching: false,
        isStale: true,
      },
      {
        status: 'success',
        isPending: false,
        isFetching: false,
        isStale: true,
      },
    ])
  })

  it('should return state for new queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const key4 = queryKey()
    const queries = ref([
      {
        queryKey: key1,
        queryFn: () => sleep(0).then(() => 'value31'),
      },
      {
        queryKey: key2,
        queryFn: () => sleep(0).then(() => 'value32'),
      },
      {
        queryKey: key3,
        queryFn: () => sleep(0).then(() => 'value33'),
      },
    ])
    const queriesState = useQueries({ queries })

    await vi.advanceTimersByTimeAsync(0)

    queries.value.splice(
      0,
      queries.value.length,
      {
        queryKey: key1,
        queryFn: () => sleep(0).then(() => 'value31'),
      },
      {
        queryKey: key4,
        queryFn: () => sleep(0).then(() => 'value34'),
      },
    )

    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(0)

    expect(queriesState.value.length).toEqual(2)
    expect(queriesState.value).toMatchObject([
      {
        data: 'value31',
        status: 'success',
        isPending: false,
        isFetching: false,
        isStale: true,
      },
      {
        data: 'value34',
        status: 'success',
        isPending: false,
        isFetching: false,
        isStale: true,
      },
    ])
  })

  it('should stop listening to changes on onScopeDispose', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const onScopeDisposeMock = onScopeDispose as MockedFunction<
      typeof onScopeDispose
    >
    onScopeDisposeMock.mockImplementationOnce((fn) => fn())

    const queries = [
      {
        queryKey: key1,
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
      {
        queryKey: key2,
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
    ]
    const queriesState = useQueries({ queries })
    await vi.advanceTimersByTimeAsync(0)

    expect(queriesState.value).toMatchObject([
      {
        status: 'pending',
        isPending: true,
        isFetching: true,
        isStale: true,
      },
      {
        status: 'pending',
        isPending: true,
        isFetching: true,
        isStale: true,
      },
    ])
  })

  it('should use queryClient provided via options', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryClient = new QueryClient()
    const queries = [
      {
        queryKey: key1,
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
      {
        queryKey: key2,
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
    ]

    useQueries({ queries }, queryClient)
    await vi.advanceTimersByTimeAsync(0)

    expect(useQueryClient).toHaveBeenCalledTimes(0)
  })

  it('should combine queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const firstResult = 'first result'
    const secondResult = 'second result'

    const queryClient = new QueryClient()
    const queries = [
      {
        queryKey: key1,
        queryFn: () => sleep(0).then(() => firstResult),
      },
      {
        queryKey: key2,
        queryFn: () => sleep(0).then(() => secondResult),
      },
    ]

    const queriesResult = useQueries(
      {
        queries,
        combine: (results) => {
          return {
            combined: true,
            res: results.map((res) => res.data),
          }
        },
      },
      queryClient,
    )
    await vi.advanceTimersByTimeAsync(0)

    expect(queriesResult.value).toMatchObject({
      combined: true,
      res: [firstResult, secondResult],
    })
  })

  it('should be `enabled` to accept getter function', async () => {
    const key = queryKey()
    const fetchFn = vi.fn(() => 'foo')
    const checked = ref(false)

    useQueries({
      queries: [
        {
          queryKey: key,
          queryFn: fetchFn,
          enabled: () => checked.value,
        },
      ],
    })

    expect(fetchFn).not.toHaveBeenCalled()

    checked.value = true

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalled()
  })

  it('should allow getters for query keys', async () => {
    const key = queryKey()
    const fetchFn = vi.fn(() => 'foo')
    const key1 = ref('key1')
    const key2 = ref('key2')

    useQueries({
      queries: [
        {
          queryKey: [...key, () => key1.value, () => key2.value],
          queryFn: fetchFn,
        },
      ],
    })

    expect(fetchFn).toHaveBeenCalledTimes(1)

    key1.value = 'key3'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(2)

    key2.value = 'key4'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(3)
  })

  it('should allow arbitrarily nested getters for query keys', async () => {
    const key = queryKey()
    const fetchFn = vi.fn(() => 'foo')
    const key1 = ref('key1')
    const key2 = ref('key2')
    const key3 = ref('key3')
    const key4 = ref('key4')
    const key5 = ref('key5')

    useQueries({
      queries: [
        {
          queryKey: [
            ...key,
            key1,
            () => key2.value,
            { key: () => key3.value },
            [{ foo: { bar: () => key4.value } }],
            () => ({
              foo: {
                bar: {
                  baz: () => key5.value,
                },
              },
            }),
          ],
          queryFn: fetchFn,
        },
      ],
    })

    expect(fetchFn).toHaveBeenCalledTimes(1)

    key1.value = 'key1-updated'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(2)

    key2.value = 'key2-updated'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(3)

    key3.value = 'key3-updated'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(4)

    key4.value = 'key4-updated'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(5)

    key5.value = 'key5-updated'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(6)
  })

  it('should refetch only the specific query without affecting others', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    let userCount = 0
    let postCount = 0

    const queriesState = useQueries({
      queries: [
        {
          queryKey: key1,
          queryFn: () => sleep(10).then(() => `users-${++userCount}`),
        },
        {
          queryKey: key2,
          queryFn: () => sleep(20).then(() => `posts-${++postCount}`),
        },
      ],
    })

    await vi.advanceTimersByTimeAsync(20)

    expect(queriesState.value[0].data).toBe('users-1')
    expect(queriesState.value[1].data).toBe('posts-1')

    queriesState.value[0].refetch()
    await vi.advanceTimersByTimeAsync(10)

    expect(queriesState.value[0].data).toBe('users-2')
    expect(queriesState.value[1].data).toBe('posts-1')
  })

  it('should warn when used outside of setup function in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      useQueries({
        queries: [
          {
            queryKey: queryKey(),
            queryFn: () => sleep(0).then(() => 'data'),
          },
        ],
      })

      expect(warnSpy).toHaveBeenCalledWith(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    } finally {
      warnSpy.mockRestore()
      vi.unstubAllEnvs()
    }
  })

  it('should work with options getter and be reactive', async () => {
    const key = queryKey()
    const fetchFn = vi.fn(() => 'foo')
    const key1 = ref('key1')
    const key2 = ref('key2')
    const key3 = ref('key3')
    const key4 = ref('key4')
    const key5 = ref('key5')

    useQueries({
      queries: () => [
        {
          queryKey: [
            ...key,
            key1,
            key2.value,
            { key: key3.value },
            [{ foo: { bar: key4.value } }],
            () => ({
              foo: {
                bar: {
                  baz: key5.value,
                },
              },
            }),
          ],
          queryFn: fetchFn,
        },
      ],
    })

    expect(fetchFn).toHaveBeenCalledTimes(1)

    key1.value = 'key1-updated'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(2)

    key2.value = 'key2-updated'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(3)

    key3.value = 'key3-updated'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(4)

    key4.value = 'key4-updated'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(5)

    key5.value = 'key5-updated'

    await vi.advanceTimersByTimeAsync(0)

    expect(fetchFn).toHaveBeenCalledTimes(6)
  })
})
