import { waitFor } from '@testing-library/react'
import React from 'react'

import {
  expectType,
  expectTypeNotAny,
  queryKey,
  renderWithClient,
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
            await sleep(35)
            return 2
          },
        },
      ])
      results.push(result)

      return (
        <div>
          <div>
            data1: {result[0]?.data ?? 'null'}, data2:{' '}
            {result[1]?.data ?? 'null'}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data1: 1, data2: 2'))

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
            await sleep(10)
            return count * 2
          },
        },
        {
          queryKey: [key2, count],
          keepPreviousData: true,
          queryFn: async () => {
            await sleep(35)
            return count * 5
          },
        },
      ])
      states.push(result)

      const isFetching = result.some(r => r.isFetching)

      return (
        <div>
          <div>
            data1: {result[0]?.data ?? 'null'}, data2:{' '}
            {result[1]?.data ?? 'null'}
          </div>
          <div>isFetching: {String(isFetching)}</div>
          <button onClick={() => setCount(prev => prev + 1)}>inc</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data1: 2, data2: 5'))
    rendered.getByRole('button', { name: /inc/i }).click()

    await waitFor(() => rendered.getByText('data1: 4, data2: 10'))
    await waitFor(() => rendered.getByText('isFetching: false'))
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
      { status: 'success', data: 2, isPreviousData: false, isFetching: false },
      { status: 'success', data: 5, isPreviousData: false, isFetching: false },
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
            await sleep(35 * (i + 1))
            return (i + 1) * count * 2
          },
        }))
      )

      states.push(result)

      const isFetching = result.some(r => r.isFetching)

      return (
        <div>
          <div>data: {result.map(it => it.data).join(',')}</div>
          <div>isFetching: {String(isFetching)}</div>
          <button onClick={() => setCount(prev => prev + 1)}>inc</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data: 4,8'))
    rendered.getByRole('button', { name: /inc/i }).click()

    await waitFor(() => rendered.getByText('data: 6,12,18'))
    await waitFor(() => rendered.getByText('isFetching: false'))
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
      { status: 'success', data: 4, isPreviousData: false, isFetching: false },
      { status: 'success', data: 8, isPreviousData: false, isFetching: false },
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

  it('should keep previous data when switching between queries', async () => {
    const key = queryKey()
    const states: UseQueryResult[][] = []

    function Page() {
      const [series1, setSeries1] = React.useState(1)
      const [series2, setSeries2] = React.useState(2)
      const ids = [series1, series2]

      const result = useQueries(
        ids.map(id => {
          return {
            queryKey: [key, id],
            queryFn: async () => {
              await sleep(5)
              return id * 5
            },
            keepPreviousData: true,
          }
        })
      )

      states.push(result)

      const isFetching = result.some(r => r.isFetching)

      return (
        <div>
          <div>
            data1: {result[0]?.data ?? 'null'}, data2:{' '}
            {result[1]?.data ?? 'null'}
          </div>
          <div>isFetching: {String(isFetching)}</div>
          <button onClick={() => setSeries2(3)}>setSeries2</button>
          <button onClick={() => setSeries1(2)}>setSeries1</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data1: 5, data2: 10'))
    rendered.getByRole('button', { name: /setSeries2/i }).click()

    await waitFor(() => rendered.getByText('data1: 5, data2: 15'))
    rendered.getByRole('button', { name: /setSeries1/i }).click()

    await waitFor(() => rendered.getByText('data1: 10, data2: 15'))
    await waitFor(() => rendered.getByText('isFetching: false'))
    await waitFor(() => expect(states.length).toBe(9))

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
      { status: 'success', data: 5, isPreviousData: false, isFetching: false },
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
    ])
    expect(states[2]).toMatchObject([
      { status: 'success', data: 5, isPreviousData: false, isFetching: false },
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
    ])
    expect(states[3]).toMatchObject([
      { status: 'success', data: 5, isPreviousData: false, isFetching: false },
      { status: 'success', data: 10, isPreviousData: true, isFetching: true },
    ])
    expect(states[4]).toMatchObject([
      { status: 'success', data: 5, isPreviousData: false, isFetching: false },
      { status: 'success', data: 15, isPreviousData: false, isFetching: false },
    ])
    expect(states[5]).toMatchObject([
      { status: 'success', data: 15, isPreviousData: false, isFetching: false },
      { status: 'success', data: 5, isPreviousData: false, isFetching: false },
    ])
    expect(states[6]).toMatchObject([
      { status: 'success', data: 10, isPreviousData: false, isFetching: true },
      { status: 'success', data: 15, isPreviousData: false, isFetching: false },
    ])
    expect(states[7]).toMatchObject([
      { status: 'success', data: 10, isPreviousData: false, isFetching: true },
      { status: 'success', data: 15, isPreviousData: false, isFetching: false },
    ])
    expect(states[8]).toMatchObject([
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
      { status: 'success', data: 15, isPreviousData: false, isFetching: false },
    ])
  })

  it('should not go to infinite render loop with previous data when toggling queries', async () => {
    const key = queryKey()
    const states: UseQueryResult[][] = []

    function Page() {
      const [enableId1, setEnableId1] = React.useState(true)
      const ids = enableId1 ? [1, 2] : [2]

      const result = useQueries(
        ids.map(id => {
          return {
            queryKey: [key, id],
            queryFn: async () => {
              await sleep(5)
              return id * 5
            },
            keepPreviousData: true,
          }
        })
      )

      states.push(result)

      const isFetching = result.some(r => r.isFetching)

      return (
        <div>
          <div>
            data1: {result[0]?.data ?? 'null'}, data2:{' '}
            {result[1]?.data ?? 'null'}
          </div>
          <div>isFetching: {String(isFetching)}</div>
          <button onClick={() => setEnableId1(false)}>set1Disabled</button>
          <button onClick={() => setEnableId1(true)}>set2Enabled</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('data1: 5, data2: 10'))
    rendered.getByRole('button', { name: /set1Disabled/i }).click()

    await waitFor(() => rendered.getByText('data1: 10, data2: null'))
    await waitFor(() => rendered.getByText('isFetching: false'))
    rendered.getByRole('button', { name: /set2Enabled/i }).click()

    await waitFor(() => rendered.getByText('data1: 5, data2: 10'))
    await waitFor(() => rendered.getByText('isFetching: false'))

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
      { status: 'success', data: 5, isPreviousData: false, isFetching: false },
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
    ])
    expect(states[2]).toMatchObject([
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
    ])
    expect(states[3]).toMatchObject([
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
      { status: 'success', data: 5, isPreviousData: false, isFetching: true },
    ])
    expect(states[4]).toMatchObject([
      { status: 'success', data: 5, isPreviousData: false, isFetching: true },
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
    ])
    expect(states[5]).toMatchObject([
      { status: 'success', data: 5, isPreviousData: false, isFetching: true },
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
    ])
    expect(states[6]).toMatchObject([
      { status: 'success', data: 5, isPreviousData: false, isFetching: false },
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
    ])
  })

  it('handles type parameter - tuple of tuples', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-expect-error (Page component is not rendered)
    // eslint-disable-next-line
    function Page() {
      const result1 = useQueries<[[number], [string], [string[], boolean]]>([
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
      expectType<QueryObserverResult<string[], boolean>>(result1[2])
      expectType<number | undefined>(result1[0].data)
      expectType<string | undefined>(result1[1].data)
      expectType<string[] | undefined>(result1[2].data)
      expectType<boolean | null>(result1[2].error)

      // TData (3rd element) takes precedence over TQueryFnData (1st element)
      const result2 = useQueries<
        [[string, unknown, string], [string, unknown, number]]
      >([
        {
          queryKey: key1,
          queryFn: () => 'string',
          select: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
            return a.toLowerCase()
          },
        },
        {
          queryKey: key2,
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
      useQueries<[[string, unknown, string], [string, boolean, number]]>([
        {
          queryKey: key1,
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
          queryKey: key2,
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
          onError: e => {
            expectType<boolean>(e)
            expectTypeNotAny(e)
          },
          placeholderData: 'string',
          // @ts-expect-error (initialData: string)
          initialData: 123,
        },
      ])

      // field names should be enforced
      useQueries<[[string]]>([
        {
          queryKey: key1,
          queryFn: () => 'string',
          // @ts-expect-error (invalidField)
          someInvalidField: [],
        },
      ])
    }
  })

  it('handles type parameter - tuple of objects', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-expect-error (Page component is not rendered)
    // eslint-disable-next-line
    function Page() {
      const result1 = useQueries<
        [
          { queryFnData: number },
          { queryFnData: string },
          { queryFnData: string[]; error: boolean }
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
      expectType<QueryObserverResult<string[], boolean>>(result1[2])
      expectType<number | undefined>(result1[0].data)
      expectType<string | undefined>(result1[1].data)
      expectType<string[] | undefined>(result1[2].data)
      expectType<boolean | null>(result1[2].error)

      // TData (data prop) takes precedence over TQueryFnData (queryFnData prop)
      const result2 = useQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number }
        ]
      >([
        {
          queryKey: key1,
          queryFn: () => 'string',
          select: a => {
            expectType<string>(a)
            expectTypeNotAny(a)
            return a.toLowerCase()
          },
        },
        {
          queryKey: key2,
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
          queryKey: key1,
          queryFn: () => 'string',
          select: a => {
            expectType<unknown>(a)
            expectTypeNotAny(a)
            return a as string
          },
        },
        {
          queryKey: key2,
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
          { queryFnData: string; data: number; error: boolean }
        ]
      >([
        {
          queryKey: key1,
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
          queryKey: key2,
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
          onError: e => {
            expectType<boolean>(e)
            expectTypeNotAny(e)
          },
          placeholderData: 'string',
          // @ts-expect-error (initialData: string)
          initialData: 123,
        },
      ])

      // field names should be enforced
      useQueries<[{ queryFnData: string }]>([
        {
          queryKey: key1,
          queryFn: () => 'string',
          // @ts-expect-error (invalidField)
          someInvalidField: [],
        },
      ])
    }
  })

  it('handles array literal without type parameter to infer result type', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const key4 = queryKey()

    // @ts-expect-error (Page component is not rendered)
    // eslint-disable-next-line
    function Page() {
      // Array.map preserves TQueryFnData
      const result1 = useQueries(
        Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
        }))
      )
      expectType<QueryObserverResult<number, unknown>[]>(result1)
      expectType<number | undefined>(result1[0]?.data)

      // Array.map preserves TData
      const result2 = useQueries(
        Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
        }))
      )
      expectType<QueryObserverResult<string, unknown>[]>(result2)

      const result3 = useQueries([
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
          select: () => 123,
        },
      ])
      expectType<QueryObserverResult<number, unknown>>(result3[0])
      expectType<QueryObserverResult<string, unknown>>(result3[1])
      expectType<QueryObserverResult<number, unknown>>(result3[2])
      expectType<number | undefined>(result3[0].data)
      expectType<string | undefined>(result3[1].data)
      // select takes precedence over queryFn
      expectType<number | undefined>(result3[2].data)

      // initialData/placeholderData are enforced
      useQueries([
        {
          queryKey: key1,
          queryFn: () => 'string',
          placeholderData: 'string',
          // @ts-expect-error (initialData: string)
          initialData: 123,
        },
        {
          queryKey: key2,
          queryFn: () => 123,
          // @ts-expect-error (placeholderData: number)
          placeholderData: 'string',
          initialData: 123,
        },
      ])

      // select / onSuccess / onSettled params are "indirectly" enforced
      useQueries([
        // unfortunately TS will not suggest the type for you
        {
          queryKey: key1,
          queryFn: () => 'string',
          // @ts-expect-error (noImplicitAny)
          onSuccess: a => null,
          // @ts-expect-error (noImplicitAny)
          onSettled: a => null,
        },
        // however you can add a type to the callback
        {
          queryKey: key2,
          queryFn: () => 'string',
          onSuccess: (a: string) => {
            expectType<string>(a)
            expectTypeNotAny(a)
          },
          onSettled: (a: string | undefined) => {
            expectType<string | undefined>(a)
            expectTypeNotAny(a)
          },
        },
        // the type you do pass is enforced
        {
          queryKey: key3,
          queryFn: () => 'string',
          // @ts-expect-error (only accepts string)
          onSuccess: (a: number) => null,
        },
        {
          queryKey: key4,
          queryFn: () => 'string',
          select: (a: string) => parseInt(a),
          // @ts-expect-error (select is defined => only accepts number)
          onSuccess: (a: string) => null,
          onSettled: (a: number | undefined) => {
            expectType<number | undefined>(a)
            expectTypeNotAny(a)
          },
        },
      ])

      // callbacks are also indirectly enforced with Array.map
      useQueries(
        // @ts-expect-error (onSuccess only accepts string)
        Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
          onSuccess: (_data: number) => null,
        }))
      )
      useQueries(
        Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
          onSuccess: (_data: string) => null,
        }))
      )

      // results inference works when all the handlers are defined
      const result4 = useQueries([
        {
          queryKey: key1,
          queryFn: () => 'string',
          // @ts-expect-error (noImplicitAny)
          onSuccess: a => null,
          // @ts-expect-error (noImplicitAny)
          onSettled: a => null,
        },
        {
          queryKey: key2,
          queryFn: () => 'string',
          onSuccess: (a: string) => {
            expectType<string>(a)
            expectTypeNotAny(a)
          },
          onSettled: (a: string | undefined) => {
            expectType<string | undefined>(a)
            expectTypeNotAny(a)
          },
        },
        {
          queryKey: key4,
          queryFn: () => 'string',
          select: (a: string) => parseInt(a),
          onSuccess: (_a: number) => null,
          onSettled: (a: number | undefined) => {
            expectType<number | undefined>(a)
            expectTypeNotAny(a)
          },
        },
      ])
      expectType<QueryObserverResult<string, unknown>>(result4[0])
      expectType<QueryObserverResult<string, unknown>>(result4[1])
      expectType<QueryObserverResult<number, unknown>>(result4[2])

      // Array as const does not throw error
      const result5 = useQueries([
        {
          queryKey: ['key1'],
          queryFn: () => 'string',
        },
        {
          queryKey: ['key1'],
          queryFn: () => 123,
        },
      ] as const)
      expectType<QueryObserverResult<string, unknown>>(result5[0])
      expectType<QueryObserverResult<number, unknown>>(result5[1])

      // field names should be enforced - array literal
      useQueries([
        {
          queryKey: key1,
          queryFn: () => 'string',
          // @ts-expect-error (invalidField)
          someInvalidField: [],
        },
      ])

      // field names should be enforced - Array.map() result
      useQueries(
        // @ts-expect-error (invalidField)
        Array(10).map(() => ({
          someInvalidField: '',
        }))
      )
    }
  })
})
