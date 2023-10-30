import { beforeEach, describe, expect, test, vi } from 'vitest'
import { onScopeDispose, ref } from 'vue-demi'
import { useQueries } from '../useQueries'
import { useQueryClient } from '../useQueryClient'
import { QueryClient } from '../queryClient'
import {
  flushPromises,
  getSimpleFetcherWithReturnData,
  rejectFetcher,
  simpleFetcher,
} from './test-utils'
import type { MockedFunction } from 'vitest'

vi.mock('../useQueryClient')

describe('useQueries', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('should return result for each query', () => {
    const queries = [
      {
        queryKey: ['key1'],
        queryFn: simpleFetcher,
      },
      {
        queryKey: ['key2'],
        queryFn: simpleFetcher,
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
        queryFn: simpleFetcher,
      },
      {
        queryKey: ['key12'],
        queryFn: simpleFetcher,
      },
    ]
    const queriesState = useQueries({ queries })

    await flushPromises()

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
        queryFn: rejectFetcher,
      },
      {
        queryKey: ['key22'],
        queryFn: simpleFetcher,
      },
    ]
    const queriesState = useQueries({ queries })

    await flushPromises()

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
        queryFn: getSimpleFetcherWithReturnData('value31'),
      },
      {
        queryKey: ['key32'],
        queryFn: getSimpleFetcherWithReturnData('value32'),
      },
      {
        queryKey: ['key33'],
        queryFn: getSimpleFetcherWithReturnData('value33'),
      },
    ])
    const queriesState = useQueries({ queries })

    await flushPromises()

    queries.value.splice(
      0,
      queries.value.length,
      {
        queryKey: ['key31'],
        queryFn: getSimpleFetcherWithReturnData('value31'),
      },
      {
        queryKey: ['key34'],
        queryFn: getSimpleFetcherWithReturnData('value34'),
      },
    )

    await flushPromises()
    await flushPromises()

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
        queryFn: simpleFetcher,
      },
      {
        queryKey: ['key42'],
        queryFn: simpleFetcher,
      },
    ]
    const queriesState = useQueries({ queries })
    await flushPromises()

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
        queryFn: simpleFetcher,
      },
      {
        queryKey: ['key42'],
        queryFn: simpleFetcher,
      },
    ]

    useQueries({ queries }, queryClient)
    await flushPromises()

    expect(useQueryClient).toHaveBeenCalledTimes(0)
  })

  test('should combine queries', async () => {
    const firstResult = 'first result'
    const secondResult = 'second result'

    const queryClient = new QueryClient()
    const queries = [
      {
        queryKey: ['key41'],
        queryFn: getSimpleFetcherWithReturnData(firstResult),
      },
      {
        queryKey: ['key42'],
        queryFn: getSimpleFetcherWithReturnData(secondResult),
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
    await flushPromises()

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

    await flushPromises()

    expect(fetchFn).toHaveBeenCalled()
  })
})
