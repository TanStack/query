import { waitFor } from '@testing-library/react'
import React from 'react'

import {
  expectType,
  expectTypeNotAny,
  queryKey,
  renderWithClient,
  setActTimeout,
  sleep,
} from './utils'
import {
  useQueries,
  QueryClient,
  UseQueryResult,
  QueryCache,
  QueryObserverResult,
} from '../..'

describe('useQueries', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: UseQueryResult[][] = []

    function Page() {
      const result = useQueries([
        {
          queryKey: key1,
          queryFn: async () => {
            await sleep(5)
            return 1
          },
        },
        {
          queryKey: key2,
          queryFn: async () => {
            await sleep(10)
            return 2
          },
        },
      ])
      results.push(result)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(30)

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  it('should keep previous data if amount of queries is the same', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const states: UseQueryResult[][] = []

    function Page() {
      const [count, setCount] = React.useState(1)
      const result = useQueries([
        {
          queryKey: [key1, count],
          keepPreviousData: true,
          queryFn: async () => {
            await sleep(5)
            return count * 2
          },
        },
        {
          queryKey: [key2, count],
          keepPreviousData: true,
          queryFn: async () => {
            await sleep(10)
            return count * 5
          },
        },
      ])
      states.push(result)

      React.useEffect(() => {
        setActTimeout(() => {
          setCount(prev => prev + 1)
        }, 20)
      }, [])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await waitFor(() => expect(states.length).toBe(7))

    expect(states[0]).toMatchObject([
      {
        status: 'loading',
        data: undefined,
        isPreviousData: false,
        isFetching: true,
      },
      {
        status: 'loading',
        data: undefined,
        isPreviousData: false,
        isFetching: true,
      },
    ])
    expect(states[1]).toMatchObject([
      { status: 'success', data: 2, isPreviousData: false, isFetching: false },
      {
        status: 'loading',
        data: undefined,
        isPreviousData: false,
        isFetching: true,
      },
    ])
    expect(states[2]).toMatchObject([
      { status: 'success', data: 2, isPreviousData: false, isFetching: false },
      { status: 'success', data: 5, isPreviousData: false, isFetching: false },
    ])
    expect(states[3]).toMatchObject([
      { status: 'success', data: 2, isPreviousData: true, isFetching: true },
      { status: 'success', data: 5, isPreviousData: true, isFetching: true },
    ])
    expect(states[4]).toMatchObject([
      { status: 'success', data: 2, isPreviousData: true, isFetching: true },
      { status: 'success', data: 5, isPreviousData: true, isFetching: true },
    ])
    expect(states[5]).toMatchObject([
      { status: 'success', data: 4, isPreviousData: false, isFetching: false },
      { status: 'success', data: 5, isPreviousData: true, isFetching: true },
    ])
    expect(states[6]).toMatchObject([
      { status: 'success', data: 4, isPreviousData: false, isFetching: false },
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
    ])
  })

  it('should keep previous data for variable amounts of useQueries', async () => {
    const key = queryKey()
    const states: UseQueryResult[][] = []

    function Page() {
      const [count, setCount] = React.useState(2)
      const result = useQueries(
        Array.from({ length: count }, (_, i) => ({
          queryKey: [key, count, i + 1],
          keepPreviousData: true,
          queryFn: async () => {
            await sleep(5 * (i + 1))
            return (i + 1) * count * 2
          },
        }))
      )

      states.push(result)

      React.useEffect(() => {
        setActTimeout(() => {
          setCount(prev => prev + 1)
        }, 20)
      }, [])

      return null
    }

    renderWithClient(queryClient, <Page />)

    await waitFor(() => expect(states.length).toBe(8))

    expect(states[0]).toMatchObject([
      {
        status: 'loading',
        data: undefined,
        isPreviousData: false,
        isFetching: true,
      },
      {
        status: 'loading',
        data: undefined,
        isPreviousData: false,
        isFetching: true,
      },
    ])
    expect(states[1]).toMatchObject([
      { status: 'success', data: 4, isPreviousData: false, isFetching: false },
      {
        status: 'loading',
        data: undefined,
        isPreviousData: false,
        isFetching: true,
      },
    ])
    expect(states[2]).toMatchObject([
      { status: 'success', data: 4, isPreviousData: false, isFetching: false },
      { status: 'success', data: 8, isPreviousData: false, isFetching: false },
    ])

    expect(states[3]).toMatchObject([
      { status: 'success', data: 4, isPreviousData: true, isFetching: true },
      { status: 'success', data: 8, isPreviousData: true, isFetching: true },
      {
        status: 'loading',
        data: undefined,
        isPreviousData: false,
        isFetching: true,
      },
    ])
    expect(states[4]).toMatchObject([
      { status: 'success', data: 4, isPreviousData: true, isFetching: true },
      { status: 'success', data: 8, isPreviousData: true, isFetching: true },
      {
        status: 'loading',
        data: undefined,
        isPreviousData: false,
        isFetching: true,
      },
    ])
    expect(states[5]).toMatchObject([
      { status: 'success', data: 6, isPreviousData: false, isFetching: false },
      { status: 'success', data: 8, isPreviousData: true, isFetching: true },
      {
        status: 'loading',
        data: undefined,
        isPreviousData: false,
        isFetching: true,
      },
    ])
    expect(states[6]).toMatchObject([
      { status: 'success', data: 6, isPreviousData: false, isFetching: false },
      { status: 'success', data: 12, isPreviousData: false, isFetching: false },
      {
        status: 'loading',
        data: undefined,
        isPreviousData: false,
        isFetching: true,
      },
    ])
    expect(states[7]).toMatchObject([
      { status: 'success', data: 6, isPreviousData: false, isFetching: false },
      { status: 'success', data: 12, isPreviousData: false, isFetching: false },
      { status: 'success', data: 18, isPreviousData: false, isFetching: false },
    ])
  })

  it('passing a type parameter should return the correct types - tuple of tuples', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-ignore
    // eslint-disable-next-line
    function Page() {
      const result1 = useQueries<[[number], [string], [string[]]]>([
        {
          queryKey: key1,
          queryFn: () => 1,
        },
        {
          queryKey: key2,
          queryFn: () => 'string',
        },
        {
          queryKey: key3,
          queryFn: () => ['string[]'],
        },
      ])
      expectType<QueryObserverResult<number, unknown>>(result1[0])
      expectType<QueryObserverResult<string, unknown>>(result1[1])
      expectType<QueryObserverResult<string[], unknown>>(result1[2])
      expectType<number | undefined>(result1[0].data)
      expectType<string | undefined>(result1[1].data)
      expectType<string[] | undefined>(result1[2].data)

      // TData (3rd element) takes precedence over TQueryFnData (1st element)
      const result2 = useQueries<
        [[string, unknown, string], [string, unknown, number]]
      >([
        {
          queryKey: key2,
          queryFn: () => 'string',
          select: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
            return a.toLowerCase()
          },
        },
        {
          queryKey: key3,
          queryFn: () => 'string',
          select: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
            return parseInt(a)
          },
        },
      ])
      expectType<QueryObserverResult<string, unknown>>(result2[0])
      expectType<QueryObserverResult<number, unknown>>(result2[1])
      expectType<string | undefined>(result2[0].data)
      expectType<number | undefined>(result2[1].data)

      // types should be enforced
      useQueries<[[string, unknown, string], [string, unknown, number]]>([
        {
          queryKey: key2,
          queryFn: () => 'string',
          select: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
            return a.toLowerCase()
          },
          onSuccess: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
          },
          placeholderData: 'string',
          // @ts-expect-error (initialData: string)
          initialData: 123,
        },
        {
          queryKey: key3,
          queryFn: () => 'string',
          select: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
            return parseInt(a)
          },
          onSuccess: a => {
            expectType<number>(a)
            expectTypeNotAny(a)
          },
          placeholderData: 'string',
          // @ts-expect-error (initialData: string)
          initialData: 123,
        },
      ])
    }
  })

  it('passing a type parameter should return the correct types - tuple of objects', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-ignore
    // eslint-disable-next-line
    function Page() {
      const result1 = useQueries<
        [
          { queryFnData: number },
          { queryFnData: string },
          { queryFnData: string[] }
        ]
      >([
        {
          queryKey: key1,
          queryFn: () => 1,
        },
        {
          queryKey: key2,
          queryFn: () => 'string',
        },
        {
          queryKey: key3,
          queryFn: () => ['string[]'],
        },
      ])
      expectType<QueryObserverResult<number, unknown>>(result1[0])
      expectType<QueryObserverResult<string, unknown>>(result1[1])
      expectType<QueryObserverResult<string[], unknown>>(result1[2])
      expectType<number | undefined>(result1[0].data)
      expectType<string | undefined>(result1[1].data)
      expectType<string[] | undefined>(result1[2].data)

      // TData (data prop) takes precedence over TQueryFnData (queryFnData prop)
      const result2 = useQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number }
        ]
      >([
        {
          queryKey: key2,
          queryFn: () => 'string',
          select: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
            return a.toLowerCase()
          },
        },
        {
          queryKey: key3,
          queryFn: () => 'string',
          select: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
            return parseInt(a)
          },
        },
      ])
      expectType<QueryObserverResult<string, unknown>>(result2[0])
      expectType<QueryObserverResult<number, unknown>>(result2[1])
      expectType<string | undefined>(result2[0].data)
      expectType<number | undefined>(result2[1].data)

      // can pass only TData (data prop) although TQueryFnData will be left unknown
      const result3 = useQueries<[{ data: string }, { data: number }]>([
        {
          queryKey: key2,
          queryFn: () => 'string',
          select: a => {
            expectType<unknown>(a)
            expectTypeNotAny(a)
            return a as string
          },
        },
        {
          queryKey: key3,
          queryFn: () => 'string',
          select: a => {
            expectType<unknown>(a)
            expectTypeNotAny(a)
            return a as number
          },
        },
      ])
      expectType<QueryObserverResult<string, unknown>>(result3[0])
      expectType<QueryObserverResult<number, unknown>>(result3[1])
      expectType<string | undefined>(result3[0].data)
      expectType<number | undefined>(result3[1].data)

      // types should be enforced
      useQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number }
        ]
      >([
        {
          queryKey: key2,
          queryFn: () => 'string',
          select: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
            return a.toLowerCase()
          },
          onSuccess: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
          },
          placeholderData: 'string',
          // @ts-expect-error (initialData: string)
          initialData: 123,
        },
        {
          queryKey: key3,
          queryFn: () => 'string',
          select: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
            return parseInt(a)
          },
          onSuccess: a => {
            expectType<number>(a)
            expectTypeNotAny(a)
          },
          placeholderData: 'string',
          // @ts-expect-error (initialData: string)
          initialData: 123,
        },
      ])
    }
  })

  it('passing no type parameter should return QueryObserverResult<unknown> types', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-ignore
    // eslint-disable-next-line
    function Page() {
      const result1 = useQueries([
        {
          queryKey: key1,
          queryFn: () => 1,
        },
        {
          queryKey: key2,
          queryFn: () => 'string',
        },
        {
          queryKey: key3,
          queryFn: () => ['string[]'],
        },
      ])
      expectType<QueryObserverResult<unknown, unknown>>(result1[0])
      expectType<QueryObserverResult<unknown, unknown>>(result1[1])
      expectType<QueryObserverResult<unknown, unknown>>(result1[2])
      expectType<unknown>(result1[0].data)
      expectType<unknown>(result1[1].data)
      expectType<unknown>(result1[2].data)

      // parameter sub-types are not enforced
      const result2 = useQueries([
        {
          queryKey: key2,
          queryFn: () => 'string',
          select: (a: unknown) => {
            expectType<unknown>(a)
          },
          onSuccess: (a: unknown) => {
            expectType<unknown>(a)
          },
          placeholderData: 'string',
          initialData: 123,
        },
        {
          queryKey: key3,
          queryFn: () => 'string',
          select: (a: unknown) => {
            expectType<unknown>(a)
          },
          onSuccess: (a: unknown) => {
            expectType<unknown>(a)
          },
          placeholderData: 'string',
          initialData: 123,
        },
      ])
      expectType<unknown>(result2[0].data)
      expectType<unknown>(result2[1].data)
    }
  })
})
