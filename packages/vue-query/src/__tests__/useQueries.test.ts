import { onScopeDispose, ref } from 'vue-demi'

import {
  flushPromises,
  rejectFetcher,
  simpleFetcher,
  getSimpleFetcherWithReturnData,
} from './test-utils'
import { useQueries } from '../useQueries'
import { useQueryClient } from '../useQueryClient'
import { QueryClient } from '../queryClient'

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

    useQueries({ queries, queryClient })
    await flushPromises()

    expect(useQueryClient).toHaveBeenCalledTimes(0)
  })
})
