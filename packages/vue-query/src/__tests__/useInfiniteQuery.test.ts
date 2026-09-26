import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, isVue2, isVue3, ref } from 'vue-demi'
import { skipToken } from '@tanstack/query-core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { infiniteQueryOptions } from '../infiniteQueryOptions'

vi.mock('../useQueryClient')

describe('useInfiniteQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should properly execute infinite query', async () => {
    const key = queryKey()
    const { data, fetchNextPage, status } = useInfiniteQuery({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(0).then(() => 'data on page ' + pageParam),
      initialPageParam: 0,
      getNextPageParam: () => 12,
    })

    expect(data.value).toStrictEqual(undefined)
    expect(status.value).toStrictEqual('pending')

    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toStrictEqual({
      pageParams: [0],
      pages: ['data on page 0'],
    })
    expect(status.value).toStrictEqual('success')

    fetchNextPage()

    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toStrictEqual({
      pageParams: [0, 12],
      pages: ['data on page 0', 'data on page 12'],
    })
    expect(status.value).toStrictEqual('success')
  })
  it('should properly execute infinite query using infiniteQueryOptions', async () => {
    const key = queryKey()
    const options = infiniteQueryOptions({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(0).then(() => 'data on page ' + pageParam),
      initialPageParam: 0,
      getNextPageParam: () => 12,
    })

    const { data, fetchNextPage, status } = useInfiniteQuery(options)

    expect(data.value).toStrictEqual(undefined)
    expect(status.value).toStrictEqual('pending')

    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toStrictEqual({
      pageParams: [0],
      pages: ['data on page 0'],
    })
    expect(status.value).toStrictEqual('success')

    fetchNextPage()

    await vi.advanceTimersByTimeAsync(0)

    expect(data.value).toStrictEqual({
      pageParams: [0, 12],
      pages: ['data on page 0', 'data on page 12'],
    })
    expect(status.value).toStrictEqual('success')
  })

  it('should react to maxPages changing via a whole-options getter', async () => {
    const key = queryKey()
    const maxPages = ref(1)
    const { data, fetchNextPage } = useInfiniteQuery(() => ({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => 'data on page ' + pageParam),
      initialPageParam: 0,
      getNextPageParam: (_lastPage, _allPages, lastPageParam) =>
        lastPageParam + 1,
      maxPages: maxPages.value,
    }))

    await vi.advanceTimersByTimeAsync(10)
    fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)

    expect(data.value?.pages).toStrictEqual(['data on page 1'])

    maxPages.value = 2
    await vi.advanceTimersByTimeAsync(0)
    fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)

    expect(data.value?.pages).toStrictEqual([
      'data on page 1',
      'data on page 2',
    ])
  })

  it('should reflect hasNextPage becoming false once the last page is reached', async () => {
    const key = queryKey()
    const { hasNextPage, fetchNextPage, isFetching } = useInfiniteQuery({
      queryKey: key,
      queryFn: ({ pageParam }) =>
        sleep(10).then(() => 'data on page ' + pageParam),
      initialPageParam: 0,
      getNextPageParam: (_lastPage, _allPages, lastPageParam) =>
        lastPageParam < 12 ? lastPageParam + 12 : undefined,
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(hasNextPage.value).toBe(true)

    fetchNextPage()
    await vi.advanceTimersByTimeAsync(10)
    expect(hasNextPage.value).toBe(false)
    expect(isFetching.value).toBe(false)
  })

  it('should skip the query while a computed queryFn resolves to skipToken, and run it once defined', async () => {
    const key = queryKey()
    const postId = ref<number>()
    const queryFn = vi.fn(({ pageParam }: { pageParam: number }) =>
      sleep(10).then(() => 'data on page ' + pageParam),
    )

    const { data, status } = useInfiniteQuery({
      queryKey: [...key, postId],
      queryFn: computed(() => (postId.value != null ? queryFn : skipToken)),
      initialPageParam: 0,
      getNextPageParam: () => 12,
    })

    await vi.advanceTimersByTimeAsync(10)

    expect(queryFn).not.toHaveBeenCalled()
    expect(status.value).toBe('pending')

    postId.value = 1

    await vi.advanceTimersByTimeAsync(10)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(status.value).toBe('success')
    expect(data.value?.pages).toStrictEqual(['data on page 0'])
  })

  describe('throwOnError', () => {
    it.runIf(isVue2)(
      'should throw from error watcher when throwOnError returns true, which Vue 2 logs via console.error',
      async () => {
        const consoleErrorMock = vi
          .spyOn(console, 'error')
          .mockImplementation(() => undefined)
        const key = queryKey()
        const throwOnError = vi.fn().mockReturnValue(true)
        useInfiniteQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => Promise.reject(new Error('Some error'))),
          initialPageParam: 0,
          getNextPageParam: () => 12,
          retry: false,
          throwOnError,
        })

        await vi.advanceTimersByTimeAsync(10)
        expect(throwOnError).toHaveBeenCalledTimes(1)
        expect(throwOnError).toHaveBeenCalledWith(
          Error('Some error'),
          expect.objectContaining({
            state: expect.objectContaining({ status: 'error' }),
          }),
        )
        expect(consoleErrorMock).toHaveBeenCalledWith(Error('Some error'))
        consoleErrorMock.mockRestore()
      },
    )

    it.runIf(isVue3)(
      'should throw from error watcher when throwOnError returns true, which Vue 3 surfaces as an unhandled rejection',
      async ({ onTestFinished }) => {
        const key = queryKey()
        const throwOnError = vi.fn().mockReturnValue(true)
        useInfiniteQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => Promise.reject(new Error('Some error'))),
          initialPageParam: 0,
          getNextPageParam: () => 12,
          retry: false,
          throwOnError,
        })

        const unhandledRejectionFn = vi.fn()
        process.on('unhandledRejection', unhandledRejectionFn)
        onTestFinished(() => {
          process.off('unhandledRejection', unhandledRejectionFn)
        })

        await vi.advanceTimersByTimeAsync(10)
        expect(throwOnError).toHaveBeenCalledTimes(1)
        expect(throwOnError).toHaveBeenCalledWith(
          Error('Some error'),
          expect.objectContaining({
            state: expect.objectContaining({ status: 'error' }),
          }),
        )
        expect(unhandledRejectionFn).toHaveBeenCalledTimes(1)
        expect(unhandledRejectionFn).toHaveBeenCalledWith(
          Error('Some error'),
          expect.any(Promise),
        )
      },
    )
  })

  describe('suspense', () => {
    it('should throw from suspense without rethrowing from the error watcher when throwOnError is true', async ({
      onTestFinished,
    }) => {
      const key = queryKey()
      const throwOnError = vi.fn().mockReturnValue(true)
      const query = useInfiniteQuery({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        initialPageParam: 0,
        getNextPageParam: () => 12,
        retry: false,
        throwOnError,
      })

      // A rethrow from the error watcher would be logged via console.error on
      // Vue 2 and surface as an unhandled rejection on Vue 3
      const consoleErrorMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const unhandledRejectionFn = vi.fn()
      process.on('unhandledRejection', unhandledRejectionFn)
      onTestFinished(() => {
        consoleErrorMock.mockRestore()
        process.off('unhandledRejection', unhandledRejectionFn)
      })

      await Promise.all([
        expect(query.suspense()).rejects.toThrow('Some error'),
        vi.advanceTimersByTimeAsync(10),
      ])
      expect(throwOnError).toHaveBeenCalledTimes(2)
      expect(query.status.value).toBe('error')
      expect(consoleErrorMock).not.toHaveBeenCalled()
      expect(unhandledRejectionFn).not.toHaveBeenCalled()
    })
  })
})
