import { waitFor } from '@testing-library/react'
import React from 'react'

import {
  expectType,
  queryKey,
  renderWithClient,
  setActTimeout,
  sleep,
} from './utils'
import { useQueries, QueryClient, UseQueryResult, QueryCache } from '../..'

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

  it('should return the correct types', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-ignore
    // eslint-disable-next-line
    function Page() {
      // unspecified query functions should default to unknown
      const noQueryFn = useQueries([
        {
          queryKey: key1,
        },
        {
          queryKey: key2,
        },
      ])
      expectType<unknown>(noQueryFn[0].data)
      expectType<unknown>(noQueryFn[0].error)
      expectType<unknown>(noQueryFn[1].error)
      expectType<unknown>(noQueryFn[1].error)

      // it should infer the result type from the query function
      const fromQueryFn = useQueries([
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
      expectType<number | undefined>(fromQueryFn[0].data)
      expectType<string | undefined>(fromQueryFn[1].data)
      expectType<string[] | undefined>(fromQueryFn[2].data)

      // it should enforce the initialData's type
      useQueries([
        {
          queryKey: key1,
          queryFn: () => 1,
          initialData: 2,
        },
        {
          queryKey: key2,
          queryFn: () => 'string',
          initialData: 'another string',
        },
        {
          queryKey: key3,
          queryFn: () => 'string',
          // @ts-expect-error
          initialData: 2,
        },
      ])

      // it should enforce the placeholderData's type
      useQueries([
        {
          queryKey: key1,
          queryFn: () => 1,
          placeholderData: 2,
        },
        {
          queryKey: key2,
          queryFn: () => 'string',
          placeholderData: 'another string',
        },
        {
          queryKey: key3,
          queryFn: () => 'string',
          // @ts-expect-error
          placeholderData: 2,
        },
      ])

      // it should enforce the select function's parameter type
      useQueries([
        {
          queryKey: key1,
          queryFn: () => 1,
          select: (_number: number) => null,
        },
        {
          queryKey: key2,
          queryFn: () => 'string',
          select: (_string: string) => null,
        },
        {
          queryKey: key3,
          queryFn: () => 1,
          // @ts-expect-error
          select: (_number: string) => null,
        },
      ])

      // it should enforce the onSettled function's parameter type
      useQueries([
        {
          queryKey: key1,
          queryFn: () => 1,
          onSuccess: (_number: number) => null,
        },
        {
          queryKey: key2,
          queryFn: () => 'string',
          onSuccess: (_string: string) => null,
        },
        {
          queryKey: key3,
          queryFn: () => 1,
          // @ts-expect-error
          onSuccess: (_number: string) => null,
        },
      ])

      // it should enforce the onSettled function's parameter type
      useQueries([
        {
          queryKey: key1,
          queryFn: () => 1,
          onSettled: (_number: number | undefined) => null,
        },
        {
          queryKey: key2,
          queryFn: () => 'string',
          onSettled: (_string: string | undefined) => null,
        },
        {
          queryKey: key3,
          queryFn: () => 1,
          // @ts-expect-error
          onSettled: (_number: string | undefined) => null,
        },
      ])
    }
  })
})
