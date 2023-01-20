import {
  computed,
  reactive,
  ref,
  onScopeDispose,
  getCurrentInstance,
} from 'vue-demi'
import { QueryObserver } from '@tanstack/query-core'

import {
  flushPromises,
  rejectFetcher,
  simpleFetcher,
  getSimpleFetcherWithReturnData,
} from './test-utils'
import { useQuery } from '../useQuery'
import { unrefQueryArgs, useBaseQuery } from '../useBaseQuery'

jest.mock('../useQueryClient')
jest.mock('../useBaseQuery')

describe('useQuery', () => {
  test('should properly execute query', () => {
    useQuery({ queryKey: ['key0'], queryFn: simpleFetcher, staleTime: 1000 })

    expect(useBaseQuery).toBeCalledWith(
      QueryObserver,
      {
        queryKey: ['key0'],
        queryFn: simpleFetcher,
        staleTime: 1000,
      },
      undefined,
    )
  })

  test('should return loading status initially', () => {
    const query = useQuery({ queryKey: ['key1'], queryFn: simpleFetcher })

    expect(query).toMatchObject({
      status: { value: 'loading' },
      isLoading: { value: true },
      isFetching: { value: true },
      isStale: { value: true },
    })
  })

  test('should resolve to success and update reactive state: useQuery(key, dataFn)', async () => {
    const query = useQuery({
      queryKey: ['key2'],
      queryFn: getSimpleFetcherWithReturnData('result2'),
    })

    await flushPromises()

    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'result2' },
      isLoading: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isSuccess: { value: true },
    })
  })

  test('should resolve to success and update reactive state: useQuery(optionsObj)', async () => {
    const query = useQuery({
      queryKey: ['key31'],
      queryFn: getSimpleFetcherWithReturnData('result31'),
      enabled: true,
    })

    await flushPromises()

    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'result31' },
      isLoading: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isSuccess: { value: true },
    })
  })

  test('should resolve to success and update reactive state: useQuery(key, optionsObj)', async () => {
    const query = useQuery({
      queryKey: ['key32'],
      queryFn: getSimpleFetcherWithReturnData('result32'),
      enabled: true,
    })

    await flushPromises()

    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'result32' },
      isLoading: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isSuccess: { value: true },
    })
  })

  test('should reject and update reactive state', async () => {
    const query = useQuery({
      queryKey: ['key3'],
      queryFn: rejectFetcher,
    })

    await flushPromises()

    expect(query).toMatchObject({
      status: { value: 'error' },
      data: { value: undefined },
      error: { value: { message: 'Some error' } },
      isLoading: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isError: { value: true },
      failureCount: { value: 1 },
      failureReason: { value: { message: 'Some error' } },
    })
  })

  test('should update query on reactive options object change', async () => {
    const spy = jest.fn()
    const onSuccess = ref(() => {
      // Noop
    })
    useQuery(
      reactive({
        queryKey: ['key6'],
        queryFn: simpleFetcher,
        onSuccess,
        staleTime: 1000,
      }),
    )

    onSuccess.value = spy

    await flushPromises()

    expect(spy).toBeCalledTimes(1)
  })

  test('should update query on reactive (Ref) key change', async () => {
    const secondKeyRef = ref('key7')
    const query = useQuery({
      queryKey: ['key6', secondKeyRef],
      queryFn: simpleFetcher,
    })

    await flushPromises()

    expect(query).toMatchObject({
      status: { value: 'success' },
    })

    secondKeyRef.value = 'key8'
    await flushPromises()

    expect(query).toMatchObject({
      status: { value: 'loading' },
      data: { value: undefined },
    })

    await flushPromises()

    expect(query).toMatchObject({
      status: { value: 'success' },
    })
  })

  test("should update query when an option is passed as Ref and it's changed", async () => {
    const enabled = ref(false)
    const query = useQuery({
      queryKey: ['key9'],
      queryFn: simpleFetcher,
      enabled,
    })

    await flushPromises()

    expect(query).toMatchObject({
      fetchStatus: { value: 'idle' },
      data: { value: undefined },
    })

    enabled.value = true

    await flushPromises()

    expect(query).toMatchObject({
      fetchStatus: { value: 'fetching' },
      data: { value: undefined },
    })

    await flushPromises()

    expect(query).toMatchObject({
      status: { value: 'success' },
    })
  })

  test('should properly execute dependant queries', async () => {
    const { data } = useQuery({
      queryKey: ['dependant1'],
      queryFn: simpleFetcher,
    })

    const enabled = computed(() => !!data.value)

    const { fetchStatus, status } = useQuery(
      reactive({
        queryKey: ['dependant2'],
        queryFn: simpleFetcher,
        enabled,
      }),
    )

    expect(data.value).toStrictEqual(undefined)
    expect(fetchStatus.value).toStrictEqual('idle')

    await flushPromises()

    expect(data.value).toStrictEqual('Some data')
    expect(fetchStatus.value).toStrictEqual('fetching')

    await flushPromises()

    expect(fetchStatus.value).toStrictEqual('idle')
    expect(status.value).toStrictEqual('success')
  })

  test('should stop listening to changes on onScopeDispose', async () => {
    const onScopeDisposeMock = onScopeDispose as jest.MockedFunction<
      typeof onScopeDispose
    >
    onScopeDisposeMock.mockImplementationOnce((fn) => fn())

    const { status } = useQuery({
      queryKey: ['onScopeDispose'],
      queryFn: simpleFetcher,
    })

    expect(status.value).toStrictEqual('loading')

    await flushPromises()

    expect(status.value).toStrictEqual('loading')

    await flushPromises()

    expect(status.value).toStrictEqual('loading')
  })

  describe('parseQueryArgs', () => {
    test('should unwrap refs in options', () => {
      const key = ref(['key'])
      const fn = ref(simpleFetcher)
      const options = ref({ queryKey: key, queryFn: fn, enabled: ref(true) })

      const result = unrefQueryArgs(options)
      const expected = {
        queryKey: ['key'],
        queryFn: simpleFetcher,
        enabled: true,
      }

      expect(result).toEqual(expected)
    })
  })

  describe('suspense', () => {
    test('should return a Promise', () => {
      const getCurrentInstanceSpy = getCurrentInstance as jest.Mock
      getCurrentInstanceSpy.mockImplementation(() => ({ suspense: {} }))

      const query = useQuery({ queryKey: ['suspense'], queryFn: simpleFetcher })
      const result = query.suspense()

      expect(result).toBeInstanceOf(Promise)
    })

    test('should resolve after being enabled', () => {
      const getCurrentInstanceSpy = getCurrentInstance as jest.Mock
      getCurrentInstanceSpy.mockImplementation(() => ({ suspense: {} }))

      let afterTimeout = false
      const isEnabeld = ref(false)
      const query = useQuery({
        queryKey: ['suspense'],
        queryFn: simpleFetcher,
        enabled: isEnabeld,
      })

      setTimeout(() => {
        afterTimeout = true
        isEnabeld.value = true
      }, 200)

      return query.suspense().then(() => {
        expect(afterTimeout).toBe(true)
      })
    })

    test('should resolve immidiately when stale without refetching', () => {
      const getCurrentInstanceSpy = getCurrentInstance as jest.Mock
      getCurrentInstanceSpy.mockImplementation(() => ({ suspense: {} }))

      const fetcherSpy = jest.fn(() => simpleFetcher())

      // let afterTimeout = false;
      const query = useQuery({
        queryKey: ['suspense'],
        queryFn: simpleFetcher,
        staleTime: 10000,
        initialData: 'foo',
      })

      return query.suspense().then(() => {
        expect(fetcherSpy).toHaveBeenCalledTimes(0)
      })
    })
  })
})
