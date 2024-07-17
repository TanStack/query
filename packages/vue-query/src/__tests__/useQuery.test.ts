import { describe, expect, test, vi } from 'vitest'
import {
  computed,
  getCurrentInstance,
  onScopeDispose,
  reactive,
  ref,
} from 'vue-demi'
import { QueryObserver } from '@tanstack/query-core'
import { useQuery } from '../useQuery'
import { useBaseQuery } from '../useBaseQuery'
import {
  flushPromises,
  getSimpleFetcherWithReturnData,
  rejectFetcher,
  simpleFetcher,
} from './test-utils'
import type { Mock, MockedFunction } from 'vitest'

vi.mock('../useQueryClient')
vi.mock('../useBaseQuery')

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

  test('should return pending status initially', () => {
    const query = useQuery({ queryKey: ['key1'], queryFn: simpleFetcher })

    expect(query).toMatchObject({
      status: { value: 'pending' },
      isPending: { value: true },
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
      isPending: { value: false },
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
      isPending: { value: false },
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
      isPending: { value: false },
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
      isPending: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isError: { value: true },
      failureCount: { value: 1 },
      failureReason: { value: { message: 'Some error' } },
    })
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
      status: { value: 'pending' },
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

    const dependentQueryFn = vi.fn().mockImplementation(simpleFetcher)
    const { fetchStatus, status } = useQuery(
      reactive({
        queryKey: ['dependant2'],
        queryFn: dependentQueryFn,
        enabled,
      }),
    )

    expect(data.value).toStrictEqual(undefined)
    expect(fetchStatus.value).toStrictEqual('idle')
    expect(dependentQueryFn).not.toHaveBeenCalled()

    await flushPromises()

    expect(data.value).toStrictEqual('Some data')
    expect(fetchStatus.value).toStrictEqual('fetching')

    await flushPromises()

    expect(fetchStatus.value).toStrictEqual('idle')
    expect(status.value).toStrictEqual('success')
    expect(dependentQueryFn).toHaveBeenCalledTimes(1)
    expect(dependentQueryFn).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['dependant2'] }),
    )
  })

  test('should stop listening to changes on onScopeDispose', async () => {
    const onScopeDisposeMock = onScopeDispose as MockedFunction<
      typeof onScopeDispose
    >
    onScopeDisposeMock.mockImplementationOnce((fn) => fn())

    const { status } = useQuery({
      queryKey: ['onScopeDispose'],
      queryFn: simpleFetcher,
    })

    expect(status.value).toStrictEqual('pending')

    await flushPromises()

    expect(status.value).toStrictEqual('pending')

    await flushPromises()

    expect(status.value).toStrictEqual('pending')
  })

  test('should use the current value for the queryKey when refetch is called', async () => {
    const fetchFn = vi.fn()
    const keyRef = ref('key11')
    const query = useQuery({
      queryKey: ['key10', keyRef],
      queryFn: fetchFn,
      enabled: false,
    })

    expect(fetchFn).not.toHaveBeenCalled()
    await query.refetch()
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(fetchFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['key10', 'key11'],
      }),
    )

    keyRef.value = 'key12'
    await query.refetch()
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(fetchFn).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['key10', 'key12'],
      }),
    )
  })

  test('should be `enabled` to accept getter function', async () => {
    const fetchFn = vi.fn()
    const checked = ref(false)

    useQuery({
      queryKey: ['enabled'],
      queryFn: fetchFn,
      enabled: () => checked.value,
    })

    expect(fetchFn).not.toHaveBeenCalled()

    checked.value = true

    await flushPromises()

    expect(fetchFn).toHaveBeenCalled()
  })

  test('should allow getters for query keys', async () => {
    const fetchFn = vi.fn()
    const key1 = ref('key1')
    const key2 = ref('key2')

    useQuery({
      queryKey: ['key', () => key1.value, () => key2.value],
      queryFn: fetchFn,
    })

    expect(fetchFn).toHaveBeenCalledTimes(1)

    key1.value = 'key3'

    await flushPromises()

    expect(fetchFn).toHaveBeenCalledTimes(2)

    key2.value = 'key4'

    await flushPromises()

    expect(fetchFn).toHaveBeenCalledTimes(3)
  })

  test('should allow arbitrarily nested getters for query keys', async () => {
    const fetchFn = vi.fn()
    const key1 = ref('key1')
    const key2 = ref('key2')
    const key3 = ref('key3')
    const key4 = ref('key4')
    const key5 = ref('key5')

    useQuery({
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
    })

    expect(fetchFn).toHaveBeenCalledTimes(1)

    key1.value = 'key1-updated'

    await flushPromises()

    expect(fetchFn).toHaveBeenCalledTimes(2)

    key2.value = 'key2-updated'

    await flushPromises()

    expect(fetchFn).toHaveBeenCalledTimes(3)

    key3.value = 'key3-updated'

    await flushPromises()

    expect(fetchFn).toHaveBeenCalledTimes(4)

    key4.value = 'key4-updated'

    await flushPromises()

    expect(fetchFn).toHaveBeenCalledTimes(5)

    key5.value = 'key5-updated'

    await flushPromises()

    expect(fetchFn).toHaveBeenCalledTimes(6)
  })

  describe('throwOnError', () => {
    test('should evaluate throwOnError when query is expected to throw', async () => {
      const boundaryFn = vi.fn()
      useQuery({
        queryKey: ['key0'],
        queryFn: rejectFetcher,
        retry: false,
        throwOnError: boundaryFn,
      })

      await flushPromises()

      expect(boundaryFn).toHaveBeenCalledTimes(1)
      expect(boundaryFn).toHaveBeenCalledWith(
        Error('Some error'),
        expect.objectContaining({
          state: expect.objectContaining({ status: 'error' }),
        }),
      )
    })
  })

  describe('suspense', () => {
    test('should return a Promise', () => {
      const getCurrentInstanceSpy = getCurrentInstance as Mock
      getCurrentInstanceSpy.mockImplementation(() => ({ suspense: {} }))

      const query = useQuery({ queryKey: ['suspense'], queryFn: simpleFetcher })
      const result = query.suspense()

      expect(result).toBeInstanceOf(Promise)
    })

    test('should resolve after being enabled', () => {
      const getCurrentInstanceSpy = getCurrentInstance as Mock
      getCurrentInstanceSpy.mockImplementation(() => ({ suspense: {} }))

      let afterTimeout = false
      const isEnabled = ref(false)
      const query = useQuery({
        queryKey: ['suspense2'],
        queryFn: simpleFetcher,
        enabled: isEnabled,
      })

      setTimeout(() => {
        afterTimeout = true
        isEnabled.value = true
      }, 200)

      return query.suspense().then(() => {
        expect(afterTimeout).toBe(true)
      })
    })

    test('should resolve immediately when stale without refetching', () => {
      const getCurrentInstanceSpy = getCurrentInstance as Mock
      getCurrentInstanceSpy.mockImplementation(() => ({ suspense: {} }))

      const fetcherSpy = vi.fn(() => simpleFetcher())

      // let afterTimeout = false;
      const query = useQuery({
        queryKey: ['suspense3'],
        queryFn: simpleFetcher,
        staleTime: 10000,
        initialData: 'foo',
      })

      return query.suspense().then(() => {
        expect(fetcherSpy).toHaveBeenCalledTimes(0)
      })
    })

    test('should not throw from suspense by default', async () => {
      const getCurrentInstanceSpy = getCurrentInstance as Mock
      getCurrentInstanceSpy.mockImplementation(() => ({ suspense: {} }))

      const query = useQuery({
        queryKey: ['suspense4'],
        queryFn: rejectFetcher,
        staleTime: 10000,
      })

      await flushPromises()

      expect(query).toMatchObject({
        status: { value: 'error' },
        isError: { value: true },
      })
    })

    test('should throw from suspense when throwOnError is true', async () => {
      const getCurrentInstanceSpy = getCurrentInstance as Mock
      getCurrentInstanceSpy.mockImplementation(() => ({ suspense: {} }))

      const boundaryFn = vi.fn()
      const query = useQuery({
        queryKey: ['suspense5'],
        queryFn: rejectFetcher,
        staleTime: 10000,
        throwOnError: boundaryFn,
      })

      await query.suspense()

      expect(boundaryFn).toHaveBeenCalledTimes(2)
      expect(boundaryFn).toHaveBeenNthCalledWith(
        1,
        Error('Some error'),
        expect.objectContaining({
          state: expect.objectContaining({ status: 'error' }),
        }),
      )
      expect(boundaryFn).toHaveBeenNthCalledWith(
        2,
        Error('Some error'),
        expect.objectContaining({
          state: expect.objectContaining({ status: 'error' }),
        }),
      )
    })
  })
})
