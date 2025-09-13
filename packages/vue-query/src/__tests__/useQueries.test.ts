import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { onScopeDispose, ref } from 'vue-demi'
import { sleep } from '@tanstack/query-test-utils'
import { useQueries } from '../useQueries'
import { useQueryClient } from '../useQueryClient'
import { QueryClient } from '../queryClient'
import type { MockedFunction } from 'vitest'

vi.mock('../useQueryClient')

describe('useQueries', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should return result for each query', () => {
    const queries = [
      {
        queryKey: ['key1'],
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
      {
        queryKey: ['key2'],
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

  test('should resolve to success and update reactive state', async () => {
    const queries = [
      {
        queryKey: ['key11'],
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
      {
        queryKey: ['key12'],
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

  test('should reject one of the queries and update reactive state', async () => {
    const queries = [
      {
        queryKey: ['key21'],
        queryFn: () =>
          sleep(0).then(() => Promise.reject(new Error('Some error'))),
      },
      {
        queryKey: ['key22'],
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

  test('should return state for new queries', async () => {
    const queries = ref([
      {
        queryKey: ['key31'],
        queryFn: () => sleep(0).then(() => 'value31'),
      },
      {
        queryKey: ['key32'],
        queryFn: () => sleep(0).then(() => 'value32'),
      },
      {
        queryKey: ['key33'],
        queryFn: () => sleep(0).then(() => 'value33'),
      },
    ])
    const queriesState = useQueries({ queries })

    await vi.advanceTimersByTimeAsync(0)

    queries.value.splice(
      0,
      queries.value.length,
      {
        queryKey: ['key31'],
        queryFn: () => sleep(0).then(() => 'value31'),
      },
      {
        queryKey: ['key34'],
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

  test('should stop listening to changes on onScopeDispose', async () => {
    const onScopeDisposeMock = onScopeDispose as MockedFunction<
      typeof onScopeDispose
    >
    onScopeDisposeMock.mockImplementationOnce((fn) => fn())

    const queries = [
      {
        queryKey: ['key41'],
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
      {
        queryKey: ['key42'],
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

  test('should use queryClient provided via options', async () => {
    const queryClient = new QueryClient()
    const queries = [
      {
        queryKey: ['key41'],
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
      {
        queryKey: ['key42'],
        queryFn: () => sleep(0).then(() => 'Some data'),
      },
    ]

    useQueries({ queries }, queryClient)
    await vi.advanceTimersByTimeAsync(0)

    expect(useQueryClient).toHaveBeenCalledTimes(0)
  })

  test('should combine queries', async () => {
    const firstResult = 'first result'
    const secondResult = 'second result'

    const queryClient = new QueryClient()
    const queries = [
      {
        queryKey: ['key41'],
        queryFn: () => sleep(0).then(() => firstResult),
      },
      {
        queryKey: ['key42'],
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

  test('should be `enabled` to accept getter function', async () => {
    const fetchFn = vi.fn()
    const checked = ref(false)

    useQueries({
      queries: [
        {
          queryKey: ['enabled'],
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

  test('should allow getters for query keys', async () => {
    const fetchFn = vi.fn()
    const key1 = ref('key1')
    const key2 = ref('key2')

    useQueries({
      queries: [
        {
          queryKey: ['key', () => key1.value, () => key2.value],
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

  test('should allow arbitrarily nested getters for query keys', async () => {
    const fetchFn = vi.fn()
    const key1 = ref('key1')
    const key2 = ref('key2')
    const key3 = ref('key3')
    const key4 = ref('key4')
    const key5 = ref('key5')

    useQueries({
      queries: [
        {
          queryKey: [
            'key',
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
})
