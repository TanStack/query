import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computed,
  isReactive,
  isReadonly,
  isVue3,
  onScopeDispose,
  reactive,
  ref,
} from 'vue-demi'
import {
  QueryObserver,
  experimental_streamedQuery,
  noop,
  skipToken,
} from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { keepPreviousData } from '..'
import { useQuery } from '../useQuery'
import { useBaseQuery } from '../useBaseQuery'
import { useQueryClient } from '../useQueryClient'

vi.mock('../useQueryClient')
vi.mock('../useBaseQuery')

describe('useQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should properly execute query', () => {
    const key = queryKey()
    const queryFn = () => sleep(0).then(() => 'Some data')

    useQuery({
      queryKey: key,
      queryFn,
      staleTime: 1000,
    })

    expect(useBaseQuery).toHaveBeenCalledWith(
      QueryObserver,
      {
        queryKey: key,
        queryFn,
        staleTime: 1000,
      },
      undefined,
    )
  })

  it('should work with options getter', async () => {
    const key = queryKey()
    const query = useQuery(() => ({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'result01'),
    }))

    await vi.advanceTimersByTimeAsync(0)
    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'result01' },
      isPending: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isSuccess: { value: true },
    })
  })

  it('should work with options getter and be reactive', async () => {
    const key = queryKey()
    const keyRef = ref('key011')
    const resultRef = ref('result02')
    const query = useQuery(() => ({
      queryKey: [...key, keyRef.value],
      queryFn: () => sleep(0).then(() => resultRef.value),
    }))

    await vi.advanceTimersByTimeAsync(0)
    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'result02' },
      isPending: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isSuccess: { value: true },
    })

    resultRef.value = 'result021'
    keyRef.value = 'key012'
    await vi.advanceTimersByTimeAsync(0)
    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'result021' },
      isPending: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isSuccess: { value: true },
    })
  })

  it('should return pending status initially', () => {
    const key = queryKey()
    const query = useQuery({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'Some data'),
    })

    expect(query).toMatchObject({
      status: { value: 'pending' },
      isPending: { value: true },
      isFetching: { value: true },
      isStale: { value: true },
    })
  })

  it('should resolve to success and update reactive state: useQuery(key, dataFn)', async () => {
    const key = queryKey()
    const query = useQuery({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'result2'),
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'result2' },
      isPending: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isSuccess: { value: true },
    })
  })

  it('should resolve to success and update reactive state: useQuery(optionsObj)', async () => {
    const key = queryKey()
    const query = useQuery({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'result31'),
      enabled: true,
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'result31' },
      isPending: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isSuccess: { value: true },
    })
  })

  it('should resolve to success and update reactive state: useQuery(key, optionsObj)', async () => {
    const key = queryKey()
    const query = useQuery({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'result32'),
      enabled: true,
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'result32' },
      isPending: { value: false },
      isFetching: { value: false },
      isFetched: { value: true },
      isSuccess: { value: true },
    })
  })

  it('should reject and update reactive state', async () => {
    const key = queryKey()
    const query = useQuery({
      queryKey: key,
      queryFn: () =>
        sleep(0).then(() => Promise.reject(new Error('Some error'))),
    })

    await vi.advanceTimersByTimeAsync(0)
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

  it('should update query on reactive (Ref) key change', async () => {
    const key = queryKey()
    const secondKeyRef = ref('key7')
    const query = useQuery({
      queryKey: [...key, secondKeyRef],
      queryFn: () => sleep(10).then(() => 'Some data'),
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(query).toMatchObject({
      status: { value: 'success' },
    })

    secondKeyRef.value = 'key8'
    await vi.advanceTimersByTimeAsync(0)
    expect(query).toMatchObject({
      status: { value: 'pending' },
      data: { value: undefined },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(query).toMatchObject({
      status: { value: 'success' },
    })
  })

  it("should update query when an option is passed as Ref and it's changed", async () => {
    const key = queryKey()
    const enabled = ref(false)
    const query = useQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'Some data'),
      enabled,
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(query).toMatchObject({
      fetchStatus: { value: 'idle' },
      data: { value: undefined },
    })

    enabled.value = true
    await vi.advanceTimersByTimeAsync(0)
    expect(query).toMatchObject({
      fetchStatus: { value: 'fetching' },
      data: { value: undefined },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(query).toMatchObject({
      status: { value: 'success' },
    })
  })

  it('should properly execute dependent queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const { data } = useQuery({
      queryKey: key1,
      queryFn: () => sleep(0).then(() => 'Some data'),
    })

    const enabled = computed(() => !!data.value)

    const dependentQueryFn = vi
      .fn()
      .mockImplementation(() => sleep(10).then(() => 'Some data'))
    const { fetchStatus, status } = useQuery(
      reactive({
        queryKey: key2,
        queryFn: dependentQueryFn,
        enabled,
      }),
    )

    expect(data.value).toStrictEqual(undefined)
    expect(fetchStatus.value).toStrictEqual('idle')
    expect(dependentQueryFn).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(0)
    expect(data.value).toStrictEqual('Some data')
    expect(fetchStatus.value).toStrictEqual('fetching')
    await vi.advanceTimersByTimeAsync(10)
    expect(fetchStatus.value).toStrictEqual('idle')
    expect(status.value).toStrictEqual('success')
    expect(dependentQueryFn).toHaveBeenCalledTimes(1)
    expect(dependentQueryFn).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: key2 }),
    )
  })

  it('should stop listening to changes on onScopeDispose', async () => {
    const key = queryKey()
    const queryClient = useQueryClient()
    const onScopeDisposeMock = vi.mocked(onScopeDispose)
    onScopeDisposeMock.mockImplementationOnce((fn) => fn())

    const { status } = useQuery({
      queryKey: key,
      queryFn: () => sleep(0).then(() => 'Some data'),
    })

    expect(status.value).toStrictEqual('pending')
    await vi.advanceTimersByTimeAsync(0)
    expect(queryClient.getQueryData(key)).toBe('Some data')
    expect(status.value).toStrictEqual('pending')
    await vi.advanceTimersByTimeAsync(0)
    expect(status.value).toStrictEqual('pending')
  })

  it('should use the current value for the queryKey when refetch is called', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => 'foo')
    const keyRef = ref('key11')
    const query = useQuery({
      queryKey: [...key, keyRef],
      queryFn,
      enabled: false,
    })

    expect(queryFn).not.toHaveBeenCalled()

    await query.refetch()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(queryFn).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        queryKey: [...key, 'key11'],
      }),
    )

    keyRef.value = 'key12'
    await query.refetch()
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(queryFn).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        queryKey: [...key, 'key12'],
      }),
    )
  })

  it.runIf(isVue3)(
    'should return deeply reactive and readonly data by default',
    async () => {
      const key = queryKey()
      const { data } = useQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ nested: { count: 0 } })),
      })

      await vi.advanceTimersByTimeAsync(10)
      expect(data.value).toEqual({ nested: { count: 0 } })
      expect(isReactive(data.value?.nested)).toBe(true)
      expect(isReadonly(data.value?.nested)).toBe(true)
    },
  )

  it('should return data in a shallow ref when shallow is true', async () => {
    const key = queryKey()
    const { data } = useQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => ({ nested: { count: 0 } })),
      shallow: true,
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(data.value).toEqual({ nested: { count: 0 } })
    expect(isReactive(data.value?.nested)).toBe(false)
    expect(isReadonly(data.value?.nested)).toBe(false)
  })

  it('should be `enabled` to accept getter function', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => 'foo')
    const checked = ref(false)

    useQuery({
      queryKey: key,
      queryFn,
      enabled: () => checked.value,
    })

    expect(queryFn).not.toHaveBeenCalled()

    checked.value = true
    await vi.advanceTimersByTimeAsync(0)
    expect(queryFn).toHaveBeenCalled()
  })

  it('should allow getters for query keys', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => 'foo')
    const key1 = ref('key1')
    const key2 = ref('key2')

    useQuery({
      queryKey: [...key, () => key1.value, () => key2.value],
      queryFn,
    })

    expect(queryFn).toHaveBeenCalledTimes(1)

    key1.value = 'key3'
    await vi.advanceTimersByTimeAsync(0)
    expect(queryFn).toHaveBeenCalledTimes(2)

    key2.value = 'key4'
    await vi.advanceTimersByTimeAsync(0)
    expect(queryFn).toHaveBeenCalledTimes(3)
  })

  it('should allow arbitrarily nested getters for query keys', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => 'foo')
    const key1 = ref('key1')
    const key2 = ref('key2')
    const key3 = ref('key3')
    const key4 = ref('key4')
    const key5 = ref('key5')

    useQuery({
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
      queryFn,
    })

    expect(queryFn).toHaveBeenCalledTimes(1)

    key1.value = 'key1-updated'
    await vi.advanceTimersByTimeAsync(0)
    expect(queryFn).toHaveBeenCalledTimes(2)

    key2.value = 'key2-updated'
    await vi.advanceTimersByTimeAsync(0)
    expect(queryFn).toHaveBeenCalledTimes(3)

    key3.value = 'key3-updated'
    await vi.advanceTimersByTimeAsync(0)
    expect(queryFn).toHaveBeenCalledTimes(4)

    key4.value = 'key4-updated'
    await vi.advanceTimersByTimeAsync(0)
    expect(queryFn).toHaveBeenCalledTimes(5)

    key5.value = 'key5-updated'
    await vi.advanceTimersByTimeAsync(0)
    expect(queryFn).toHaveBeenCalledTimes(6)
  })

  it('should allow a getter for the whole query key', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 'foo'))
    const key1 = ref('key1')

    useQuery({
      queryKey: () => [...key, key1.value],
      queryFn,
    })

    expect(queryFn).toHaveBeenCalledTimes(1)

    key1.value = 'key3'
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should derive data via select without changing what is cached', async () => {
    const key = queryKey()
    const query = useQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => ['a', 'b', 'c']),
      select: (posts) => posts.length,
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 3 },
    })

    const queryClient = useQueryClient()

    expect(queryClient.getQueryData(key)).toEqual(['a', 'b', 'c'])
  })

  it('should stay disabled until the dependent value is set', async () => {
    const key = queryKey()
    const postId = ref<number>()
    const queryFn = vi.fn(() => sleep(10).then(() => 'Some data'))

    const query = useQuery({
      queryKey: [...key, postId],
      queryFn,
      enabled: () => postId.value != null,
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).not.toHaveBeenCalled()
    expect(query).toMatchObject({ status: { value: 'pending' } })

    postId.value = 1
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'Some data' },
    })
  })

  it('should skip the query while a computed queryFn resolves to skipToken, and run it once defined', async () => {
    const key = queryKey()
    const postId = ref<number>()
    const queryFn = vi.fn(() => sleep(10).then(() => 'Some data'))

    const query = useQuery({
      queryKey: [...key, postId],
      queryFn: computed(() => (postId.value != null ? queryFn : skipToken)),
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).not.toHaveBeenCalled()
    expect(query).toMatchObject({ status: { value: 'pending' } })

    postId.value = 1
    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'Some data' },
    })
  })

  it('should seed from initialData and skip the loading state', () => {
    const key = queryKey()
    const query = useQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data'),
      initialData: 'initial',
    })

    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'initial' },
    })
  })

  it('should still fetch in the background and replace initialData with the fetched value', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    const query = useQuery({
      queryKey: key,
      queryFn,
      initialData: 'initial',
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'data' },
    })
  })

  it('should keep initialData visible alongside the error when a refetch fails', async () => {
    const key = queryKey()

    const query = useQuery({
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() => Promise.reject(new Error('Some error'))),
      initialData: 'initial',
      retry: false,
    })

    expect(query).toMatchObject({
      status: { value: 'success' },
      data: { value: 'initial' },
      isError: { value: false },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(query).toMatchObject({
      status: { value: 'error' },
      data: { value: 'initial' },
      isError: { value: true },
    })
  })

  it('should keep the previous page visible while the next page loads with keepPreviousData', async () => {
    const key = queryKey()
    const page = ref(0)
    const queryFn = vi.fn((pageParam: number) =>
      sleep(10).then(() => `page-${pageParam}`),
    )

    const query = useQuery({
      queryKey: [...key, page],
      queryFn: () => queryFn(page.value),
      placeholderData: keepPreviousData,
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(query).toMatchObject({
      data: { value: 'page-0' },
      isPlaceholderData: { value: false },
    })

    page.value = 1
    await vi.advanceTimersByTimeAsync(0)
    expect(query).toMatchObject({
      data: { value: 'page-0' },
      isPlaceholderData: { value: true },
    })
    await vi.advanceTimersByTimeAsync(10)
    expect(query).toMatchObject({
      data: { value: 'page-1' },
      isPlaceholderData: { value: false },
    })
  })

  describe('throwOnError', () => {
    it('should evaluate throwOnError when query is expected to throw', async () => {
      const key = queryKey()
      const throwOnError = vi.fn()
      useQuery({
        queryKey: key,
        queryFn: () =>
          sleep(0).then(() => Promise.reject(new Error('Some error'))),
        retry: false,
        throwOnError,
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(throwOnError).toHaveBeenCalledTimes(1)
      expect(throwOnError).toHaveBeenCalledWith(
        Error('Some error'),
        expect.objectContaining({
          state: expect.objectContaining({ status: 'error' }),
        }),
      )
    })
  })

  describe('outside scope warning', () => {
    it('should warn when used outside of setup function in development mode', () => {
      vi.stubEnv('NODE_ENV', 'development')
      const consoleWarnMock = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {})

      try {
        useQuery({
          queryKey: queryKey(),
          queryFn: () => sleep(0).then(() => 'data'),
        })

        expect(consoleWarnMock).toHaveBeenCalledWith(
          'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
        )
      } finally {
        consoleWarnMock.mockRestore()
        vi.unstubAllEnvs()
      }
    })
  })

  describe('suspense', () => {
    it('should return a Promise', () => {
      const key = queryKey()
      const query = useQuery({
        queryKey: key,
        queryFn: () => sleep(0).then(() => 'Some data'),
      })
      const result = query.suspense()

      expect(result).toBeInstanceOf(Promise)
    })

    it('should resolve after being enabled', async () => {
      const key = queryKey()
      const queryFn = vi.fn(() => sleep(10).then(() => 'Some data'))
      const onResolve = vi.fn()
      const isEnabled = ref(false)
      const query = useQuery({
        queryKey: key,
        queryFn,
        enabled: isEnabled,
      })

      query.suspense().then(onResolve)
      await vi.advanceTimersByTimeAsync(10)
      expect(queryFn).not.toHaveBeenCalled()
      expect(onResolve).not.toHaveBeenCalled()

      isEnabled.value = true
      await vi.advanceTimersByTimeAsync(10)
      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(onResolve).toHaveBeenCalledTimes(1)
      expect(onResolve).toHaveBeenCalledWith(
        expect.objectContaining({ data: 'Some data' }),
      )
    })

    it('should resolve immediately without refetching when the data is fresh', () => {
      const key = queryKey()
      const queryFn = vi.fn(() => sleep(10).then(() => 'Some data'))

      const query = useQuery({
        queryKey: key,
        queryFn,
        staleTime: 10000,
        initialData: 'foo',
      })

      return query.suspense().then(() => {
        expect(queryFn).toHaveBeenCalledTimes(0)
      })
    })

    it('should not throw from suspense by default', async () => {
      const key = queryKey()
      const query = useQuery({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        staleTime: 10000,
      })

      const suspensePromise = query.suspense()
      await vi.advanceTimersByTimeAsync(10)
      await expect(suspensePromise).resolves.toMatchObject({
        status: 'error',
        isError: true,
      })
    })

    it('should throw from suspense when throwOnError is true', async ({
      onTestFinished,
    }) => {
      const key = queryKey()
      const throwOnError = vi.fn().mockReturnValue(true)
      const query = useQuery({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        staleTime: 10000,
        throwOnError,
      })

      // The error watcher also throws, which Vue 3 surfaces as an unhandled rejection
      process.on('unhandledRejection', noop)
      onTestFinished(() => {
        process.off('unhandledRejection', noop)
      })

      await Promise.all([
        expect(query.suspense()).rejects.toThrow('Some error'),
        vi.advanceTimersByTimeAsync(10),
      ])
      expect(throwOnError).toHaveBeenCalledTimes(2)
      expect(throwOnError).toHaveBeenNthCalledWith(
        1,
        Error('Some error'),
        expect.objectContaining({
          state: expect.objectContaining({ status: 'error' }),
        }),
      )
      expect(throwOnError).toHaveBeenNthCalledWith(
        2,
        Error('Some error'),
        expect.objectContaining({
          state: expect.objectContaining({ status: 'error' }),
        }),
      )
    })

    it('should release suspense when setQueryData is called while fetch is in-flight', async () => {
      const key = queryKey()

      const query = useQuery({
        queryKey: key,
        queryFn: () => sleep(10000).then(() => 'fetched'),
      })

      const suspensePromise = query.suspense()

      const queryClient = useQueryClient()
      queryClient.setQueryData(key, 'manual data')

      await vi.advanceTimersByTimeAsync(0)

      const result = await suspensePromise
      expect(result.data).toBe('manual data')
    })

    it('should release suspense when streamedQuery receives first chunk', async () => {
      const key = queryKey()

      async function* numberGenerator() {
        await sleep(10)
        yield 'chunk1'
        await sleep(10)
        yield 'chunk2'
      }

      const query = useQuery({
        queryKey: key,
        queryFn: experimental_streamedQuery({
          streamFn: () => numberGenerator(),
        }),
      })

      const suspensePromise = query.suspense()

      await vi.advanceTimersByTimeAsync(10)

      const result = await suspensePromise
      expect(result.data).toStrictEqual(['chunk1'])
    })
  })
})
