import { onScopeDispose, reactive, ref } from 'vue-demi'

import { useQueries } from '../useQueries'
import { useQueryClient } from '../useQueryClient'
import { QueryClient } from '../queryClient'
import {
  flushPromises,
  getSimpleFetcherWithReturnData,
  rejectFetcher,
  simpleFetcher,
} from './test-utils'

jest.mock('../useQueryClient')

describe('useQueries', () => {
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

    expect(queriesState).toMatchObject([
      {
        status: 'loading',
        isLoading: true,
        isFetching: true,
        isStale: true,
      },
      {
        status: 'loading',
        isLoading: true,
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

    expect(queriesState).toMatchObject([
      {
        status: 'success',
        isLoading: false,
        isFetching: false,
        isStale: true,
      },
      {
        status: 'success',
        isLoading: false,
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

    expect(queriesState).toMatchObject([
      {
        status: 'error',
        isLoading: false,
        isFetching: false,
        isStale: true,
      },
      {
        status: 'success',
        isLoading: false,
        isFetching: false,
        isStale: true,
      },
    ])
  })

  test('should return state for new queries', async () => {
    const queries = reactive([
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

    queries.splice(
      0,
      queries.length,
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

    expect(queriesState.length).toEqual(2)
    expect(queriesState).toMatchObject([
      {
        data: 'value31',
        status: 'success',
        isLoading: false,
        isFetching: false,
        isStale: true,
      },
      {
        data: 'value34',
        status: 'success',
        isLoading: false,
        isFetching: false,
        isStale: true,
      },
    ])
  })

  test('should stop listening to changes on onScopeDispose', async () => {
    const onScopeDisposeMock = onScopeDispose as jest.MockedFunction<
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

    expect(queriesState).toMatchObject([
      {
        status: 'loading',
        isLoading: true,
        isFetching: true,
        isStale: true,
      },
      {
        status: 'loading',
        isLoading: true,
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

    useQueries({ queries, queryClient })
    await flushPromises()

    expect(useQueryClient).toHaveBeenCalledTimes(0)
  })

  test('should use queryClient provided via query options', async () => {
    const queryClient = new QueryClient()
    const queries = [
      {
        queryKey: ['key41'],
        queryFn: simpleFetcher,
        queryClient,
      },
      {
        queryKey: ['key42'],
        queryFn: simpleFetcher,
      },
    ]

    useQueries({ queries })
    await flushPromises()

    expect(useQueryClient).toHaveBeenCalledTimes(0)
  })

  test('should be `enabled` to accept getter function', async () => {
    const fetchFn = jest.fn()

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
