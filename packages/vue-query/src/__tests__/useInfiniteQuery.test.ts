import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { getCurrentInstance } from 'vue-demi'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import type { Mock } from 'vitest'

vi.mock('../useQueryClient')
vi.mock('../useBaseQuery')

describe('useInfiniteQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should properly execute infinite query', async () => {
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
  test('should properly execute infinite query using infiniteQueryOptions', async () => {
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

  describe('throwOnError', () => {
    test('should throw from error watcher when throwOnError is true and suspense is not used', async () => {
      const throwOnErrorFn = vi.fn().mockReturnValue(true)
      useInfiniteQuery({
        queryKey: ['infiniteThrowOnErrorWithoutSuspense'],
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        initialPageParam: 0,
        getNextPageParam: () => 12,
        retry: false,
        throwOnError: throwOnErrorFn,
      })

      // Suppress the Unhandled Rejection caused by watcher throw in Vue 3
      const rejectionHandler = () => {}
      process.on('unhandledRejection', rejectionHandler)

      await vi.advanceTimersByTimeAsync(10)

      process.off('unhandledRejection', rejectionHandler)

      // throwOnError is evaluated and throw is attempted (not suppressed by suspense)
      expect(throwOnErrorFn).toHaveBeenCalledTimes(1)
      expect(throwOnErrorFn).toHaveBeenCalledWith(
        Error('Some error'),
        expect.objectContaining({
          state: expect.objectContaining({ status: 'error' }),
        }),
      )
    })
  })

  describe('suspense', () => {
    test('should not throw from error watcher when suspense is handling the error with throwOnError: true', async () => {
      const getCurrentInstanceSpy = getCurrentInstance as Mock
      getCurrentInstanceSpy.mockImplementation(() => ({ suspense: {} }))

      const throwOnErrorFn = vi.fn().mockReturnValue(true)
      const query = useInfiniteQuery({
        queryKey: ['infiniteSuspenseThrowOnError'],
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
        initialPageParam: 0,
        getNextPageParam: () => 12,
        retry: false,
        throwOnError: throwOnErrorFn,
      })

      let rejectedError: unknown
      const promise = query.suspense().catch((error) => {
        rejectedError = error
      })

      await vi.advanceTimersByTimeAsync(10)

      await promise

      expect(rejectedError).toBeInstanceOf(Error)
      expect((rejectedError as Error).message).toBe('Some error')
      // throwOnError is evaluated in both suspense() and the error watcher
      expect(throwOnErrorFn).toHaveBeenCalledTimes(2)
      // but the error watcher should not throw when suspense is active
      expect(query).toMatchObject({
        status: { value: 'error' },
        isError: { value: true },
      })
    })
  })
})
