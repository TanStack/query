import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/svelte'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, createQueries } from '../../src/index.js'
import { promiseWithResolvers, withEffectRoot } from '../utils.svelte.js'
import IsRestoring from './IsRestoring.svelte'
import type { CreateQueryResult } from '../../src/index.js'

describe('createQueries', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    vi.useRealTimers()
    queryClient.clear()
  })

  it(
    'should return the correct states',
    withEffectRoot(async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const results: Array<Array<CreateQueryResult>> = []
      const { promise: promise1, resolve: resolve1 } = promiseWithResolvers()
      const { promise: promise2, resolve: resolve2 } = promiseWithResolvers()

      const result = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => promise1,
            },
            {
              queryKey: key2,
              queryFn: () => promise2,
            },
          ],
        }),
        () => queryClient,
      )

      $effect(() => {
        results.push([{ ...result[0] }, { ...result[1] }])
      })

      resolve1(1)
      await vi.advanceTimersByTimeAsync(0)
      expect(result[0].data).toBe(1)

      resolve2(2)
      await vi.advanceTimersByTimeAsync(0)
      expect(result[1].data).toBe(2)

      expect(results.length).toBe(3)
      expect(results[0]).toMatchObject([
        { data: undefined },
        { data: undefined },
      ])
      expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
      expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
    }),
  )

  it(
    'should track results',
    withEffectRoot(async () => {
      const key1 = queryKey()
      const results: Array<Array<CreateQueryResult>> = []
      let count = 0

      const result = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => Promise.resolve(++count),
            },
          ],
        }),
        () => queryClient,
      )

      $effect(() => {
        results.push([result[0]])
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(result[0].data).toBe(1)

      expect(results.length).toBe(2)
      expect(results[0]).toMatchObject([{ data: undefined }])
      expect(results[1]).toMatchObject([{ data: 1 }])

      // Trigger refetch
      result[0].refetch()

      await vi.advanceTimersByTimeAsync(0)
      expect(result[0].data).toBe(2)

      // Only one render for data update, no render for isFetching transition
      expect(results.length).toBe(3)
      expect(results[2]).toMatchObject([{ data: 2 }])
    }),
  )

  it(
    'should combine queries',
    withEffectRoot(async () => {
      const key1 = queryKey()
      const key2 = queryKey()

      const { promise: promise1, resolve: resolve1 } =
        promiseWithResolvers<string>()
      const { promise: promise2, resolve: resolve2 } =
        promiseWithResolvers<string>()

      const queries = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => promise1,
            },
            {
              queryKey: key2,
              queryFn: () => promise2,
            },
          ],
          combine: (results) => {
            return {
              combined: true,
              res: results
                .flatMap((res) => (res.data ? [res.data] : []))
                .join(','),
            }
          },
        }),
        () => queryClient,
      )

      // Initially both queries are loading
      expect(queries).toEqual({
        combined: true,
        res: '',
      })

      // Resolve the first query
      resolve1('first result')
      await vi.advanceTimersByTimeAsync(0)
      expect(queries.res).toBe('first result')

      // Resolve the second query
      resolve2('second result')
      await vi.advanceTimersByTimeAsync(0)
      expect(queries.res).toBe('first result,second result')

      expect(queries).toEqual({
        combined: true,
        res: 'first result,second result',
      })
    }),
  )

  it(
    'should track property access through combine function',
    withEffectRoot(async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      let count = 0
      const results: Array<unknown> = []

      const { promise: promise1, resolve: resolve1 } =
        promiseWithResolvers<string>()
      const { promise: promise2, resolve: resolve2 } =
        promiseWithResolvers<string>()
      const { promise: promise3, resolve: resolve3 } =
        promiseWithResolvers<string>()
      const { promise: promise4, resolve: resolve4 } =
        promiseWithResolvers<string>()

      const queries = createQueries(
        () => ({
          queries: [
            {
              queryKey: key1,
              queryFn: () => (count === 0 ? promise1 : promise3),
            },
            {
              queryKey: key2,
              queryFn: () => (count === 0 ? promise2 : promise4),
            },
          ],
          combine: (queryResults) => {
            return {
              combined: true,
              refetch: () =>
                Promise.all(queryResults.map((res) => res.refetch())),
              res: queryResults
                .flatMap((res) => (res.data ? [res.data] : []))
                .join(','),
            }
          },
        }),
        () => queryClient,
      )

      $effect(() => {
        results.push({ ...queries })
      })

      // Initially both queries are loading
      await vi.advanceTimersByTimeAsync(0)
      expect(results[0]).toStrictEqual({
        combined: true,
        refetch: expect.any(Function),
        res: '',
      })

      // Resolve the first query
      resolve1('first result ' + count)
      await vi.advanceTimersByTimeAsync(0)
      expect(queries.res).toBe('first result 0')

      expect(results[1]).toStrictEqual({
        combined: true,
        refetch: expect.any(Function),
        res: 'first result 0',
      })

      // Resolve the second query
      resolve2('second result ' + count)
      await vi.advanceTimersByTimeAsync(0)
      expect(queries.res).toBe('first result 0,second result 0')

      expect(results[2]).toStrictEqual({
        combined: true,
        refetch: expect.any(Function),
        res: 'first result 0,second result 0',
      })

      // Increment count and refetch
      count++
      queries.refetch()

      // Resolve the refetched queries
      resolve3('first result ' + count)
      resolve4('second result ' + count)

      await vi.advanceTimersByTimeAsync(0)
      expect(queries.res).toBe('first result 1,second result 1')

      const length = results.length
      expect(results.at(-1)).toStrictEqual({
        combined: true,
        refetch: expect.any(Function),
        res: 'first result 1,second result 1',
      })

      // Refetch again but with the same data
      await queries.refetch()

      // No further re-render because data didn't change
      expect(results.length).toBe(length)
    }),
  )

  it('should not fetch for the duration of the restoring period when isRestoring is true', async () => {
    const queryFn1 = vi.fn(() => sleep(10).then(() => 'data1'))
    const queryFn2 = vi.fn(() => sleep(10).then(() => 'data2'))

    const rendered = render(IsRestoring, {
      props: { queryClient, queryFn1, queryFn2 },
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data1')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('data2')).toHaveTextContent('undefined')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data1')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('data2')).toHaveTextContent('undefined')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)
  })

  it('should not fetch queries with different durations for the duration of the restoring period when isRestoring is true', async () => {
    const queryFn1 = vi.fn(() => sleep(10).then(() => 'data1'))
    const queryFn2 = vi.fn(() => sleep(20).then(() => 'data2'))

    const rendered = render(IsRestoring, {
      props: { queryClient, queryFn1, queryFn2 },
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data1')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('data2')).toHaveTextContent('undefined')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data1')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('data2')).toHaveTextContent('undefined')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data1')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('data2')).toHaveTextContent('undefined')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)
  })
})
