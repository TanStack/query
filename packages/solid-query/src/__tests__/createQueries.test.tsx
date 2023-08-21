import { fireEvent, render, screen, waitFor } from 'solid-testing-library'

import {
  ErrorBoundary,
  createContext,
  createMemo,
  createRenderEffect,
  createSignal,
} from 'solid-js'
import * as QueriesObserverModule from '../../../query-core/src/queriesObserver'

import {
  QueriesObserver,
  QueryCache,
  QueryClientProvider,
  createQueries,
} from '..'
import {
  createQueryClient,
  expectType,
  expectTypeNotAny,
  queryKey,
  sleep,
} from './utils'
import type { QueryFunctionContext } from '@tanstack/query-core'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  QueryClient,
  QueryFunction,
  QueryObserverResult,
  SolidQueryKey,
} from '..'

describe('useQueries', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: CreateQueryResult[][] = []

    function Page() {
      const result = createQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await sleep(10)
              return 1
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              await sleep(100)
              return 2
            },
          },
        ],
      })

      createRenderEffect(() => {
        results.push([...result])
      })

      return (
        <div>
          <div>
            data1: {String(result[0].data ?? 'null')}, data2:{' '}
            {String(result[1].data ?? 'null')}
          </div>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data1: 1, data2: 2'))

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  it('should keep previous data if amount of queries is the same', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const states: CreateQueryResult[][] = []

    function Page() {
      const [count, setCount] = createSignal(1)
      const result = createQueries({
        queries: [
          {
            queryKey: () => [key1(), count()],
            keepPreviousData: true,
            queryFn: async () => {
              await sleep(10)
              return count() * 2
            },
          },
          {
            queryKey: () => [key2(), count()],
            keepPreviousData: true,
            queryFn: async () => {
              await sleep(35)
              return count() * 5
            },
          },
        ],
      })

      createRenderEffect(() => {
        states.push([...result])
      })

      const isFetching = createMemo(() => result.some((r) => r.isFetching))

      return (
        <div>
          <div>
            data1: {String(result[0].data ?? 'null')}, data2:{' '}
            {String(result[1].data ?? 'null')}
          </div>
          <div>isFetching: {String(isFetching())}</div>
          <button onClick={() => setCount((prev) => prev + 1)}>inc</button>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data1: 2, data2: 5'))
    fireEvent.click(screen.getByRole('button', { name: /inc/i }))

    await waitFor(() => screen.getByText('data1: 4, data2: 10'))
    await waitFor(() => screen.getByText('isFetching: false'))

    expect(states[states.length - 1]).toMatchObject([
      { status: 'success', data: 4, isPreviousData: false, isFetching: false },
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
    ])
  })

  it('should keep previous data for variable amounts of useQueries', async () => {
    const key = queryKey()
    const states: CreateQueryResult[][] = []

    function Page() {
      const [count, setCount] = createSignal(2)
      const result = createQueries({
        // TODO(lukemurray): reactive queries doesn't appear to work
        get queries() {
          return Array.from({ length: count() }, (_, i) => ({
            queryKey: () => [key(), count(), i + 1],
            keepPreviousData: true,
            queryFn: async () => {
              await sleep(35 * (i + 1))
              return (i + 1) * count() * 2
            },
          }))
        },
      })

      createRenderEffect(() => {
        states.push([...result])
      })

      const isFetching = createMemo(() => result.some((r) => r.isFetching))

      return (
        <div>
          <div>data: {result.map((it) => it.data).join(',')}</div>
          <div>isFetching: {String(isFetching())}</div>
          <button onClick={() => setCount((prev) => prev + 1)}>inc</button>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 4,8'))
    fireEvent.click(screen.getByRole('button', { name: /inc/i }))

    await waitFor(() => screen.getByText('data: 6,12,18'))
    await waitFor(() => screen.getByText('isFetching: false'))

    expect(states[states.length - 1]).toMatchObject([
      { status: 'success', data: 6, isPreviousData: false, isFetching: false },
      { status: 'success', data: 12, isPreviousData: false, isFetching: false },
      { status: 'success', data: 18, isPreviousData: false, isFetching: false },
    ])
  })

  it('should keep previous data when switching between queries', async () => {
    const key = queryKey()
    const states: CreateQueryResult[][] = []

    function Page() {
      const [series1, setSeries1] = createSignal(1)
      const [series2, setSeries2] = createSignal(2)
      const ids = [series1, series2]

      const result = createQueries({
        queries: ids.map((id) => {
          return {
            queryKey: () => [key(), id()],
            queryFn: async () => {
              await sleep(5)
              return id() * 5
            },
            keepPreviousData: true,
          }
        }),
      })

      createRenderEffect(() => {
        states.push([...result])
      })

      const isFetching = createMemo(() => result.some((r) => r.isFetching))

      return (
        <div>
          <div>
            data1: {String(result[0]?.data ?? 'null')}, data2:{' '}
            {String(result[1]?.data ?? 'null')}
          </div>
          <div>isFetching: {String(isFetching())}</div>
          <button onClick={() => setSeries2(3)}>setSeries2</button>
          <button onClick={() => setSeries1(2)}>setSeries1</button>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data1: 5, data2: 10'))
    fireEvent.click(screen.getByRole('button', { name: /setSeries2/i }))

    await waitFor(() => screen.getByText('data1: 5, data2: 15'))
    fireEvent.click(screen.getByRole('button', { name: /setSeries1/i }))

    await waitFor(() => screen.getByText('data1: 10, data2: 15'))
    await waitFor(() => screen.getByText('isFetching: false'))

    expect(states[states.length - 1]).toMatchObject([
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
      { status: 'success', data: 15, isPreviousData: false, isFetching: false },
    ])
  })

  it('should not go to infinite render loop with previous data when toggling queries', async () => {
    const key = queryKey()
    const states: CreateQueryResult[][] = []

    function Page() {
      const [enableId1, setEnableId1] = createSignal(true)
      const ids = createMemo(() => (enableId1() ? [1, 2] : [2]))

      const result = createQueries({
        // TODO(lukemurray): same issue queries should be reactive
        get queries() {
          return ids().map((id) => {
            return {
              queryKey: () => [key(), id],
              queryFn: async () => {
                await sleep(5)
                return id * 5
              },
              keepPreviousData: true,
            }
          })
        },
      })

      createRenderEffect(() => {
        states.push([...result])
      })

      const text = createMemo(() => {
        return result
          .map((r, idx) => `data${idx + 1}: ${r.data ?? 'null'}`)
          .join(' ')
      })

      const isFetching = createMemo(() => result.some((r) => r.isFetching))

      return (
        <div>
          <div>{text()}</div>
          <div>isFetching: {String(isFetching())}</div>
          <button onClick={() => setEnableId1(false)}>set1Disabled</button>
          <button onClick={() => setEnableId1(true)}>set2Enabled</button>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data1: 5 data2: 10'))
    fireEvent.click(screen.getByRole('button', { name: /set1Disabled/i }))

    await waitFor(() => screen.getByText('data1: 10'))
    await waitFor(() => screen.getByText('isFetching: false'))
    fireEvent.click(screen.getByRole('button', { name: /set2Enabled/i }))

    await waitFor(() => screen.getByText('data1: 5 data2: 10'))
    await waitFor(() => screen.getByText('isFetching: false'))

    await waitFor(() => expect(states.length).toBe(5))

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
      { status: 'success', data: 5, isPreviousData: false, isFetching: true },
      { status: 'success', data: 10, isPreviousData: false, isFetching: false },
    ])
    expect(states[4]).toMatchObject([
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
      const result1 = createQueries<[[number], [string], [string[], boolean]]>({
        queries: [
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
        ],
      })
      expectType<QueryObserverResult<number, unknown>>(result1[0])
      expectType<QueryObserverResult<string, unknown>>(result1[1])
      expectType<QueryObserverResult<string[], boolean>>(result1[2])
      expectType<number | undefined>(result1[0].data)
      expectType<string | undefined>(result1[1].data)
      expectType<string[] | undefined>(result1[2].data)
      expectType<boolean | null>(result1[2].error)

      // TData (3rd element) takes precedence over TQueryFnData (1st element)
      const result2 = createQueries<
        [[string, unknown, string], [string, unknown, number]]
      >({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return a.toLowerCase()
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return parseInt(a)
            },
          },
        ],
      })
      expectType<QueryObserverResult<string, unknown>>(result2[0])
      expectType<QueryObserverResult<number, unknown>>(result2[1])
      expectType<string | undefined>(result2[0].data)
      expectType<number | undefined>(result2[1].data)

      // types should be enforced
      createQueries<[[string, unknown, string], [string, boolean, number]]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return a.toLowerCase()
            },
            onSuccess: (a) => {
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
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return parseInt(a)
            },
            onSuccess: (a) => {
              expectType<number>(a)
              expectTypeNotAny(a)
            },
            onError: (e) => {
              expectType<boolean>(e)
              expectTypeNotAny(e)
            },
            placeholderData: 'string',
            // @ts-expect-error (initialData: string)
            initialData: 123,
          },
        ],
      })

      // field names should be enforced
      createQueries<[[string]]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            // @ts-expect-error (invalidField)
            someInvalidField: [],
          },
        ],
      })
    }
  })

  it('handles type parameter - tuple of objects', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // @ts-expect-error (Page component is not rendered)
    // eslint-disable-next-line
    function Page() {
      const result1 = createQueries<
        [
          { queryFnData: number },
          { queryFnData: string },
          { queryFnData: string[]; error: boolean },
        ]
      >({
        queries: [
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
        ],
      })
      expectType<QueryObserverResult<number, unknown>>(result1[0])
      expectType<QueryObserverResult<string, unknown>>(result1[1])
      expectType<QueryObserverResult<string[], boolean>>(result1[2])
      expectType<number | undefined>(result1[0].data)
      expectType<string | undefined>(result1[1].data)
      expectType<string[] | undefined>(result1[2].data)
      expectType<boolean | null>(result1[2].error)

      // TData (data prop) takes precedence over TQueryFnData (queryFnData prop)
      const result2 = createQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number },
        ]
      >({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return a.toLowerCase()
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return parseInt(a)
            },
          },
        ],
      })
      expectType<QueryObserverResult<string, unknown>>(result2[0])
      expectType<QueryObserverResult<number, unknown>>(result2[1])
      expectType<string | undefined>(result2[0].data)
      expectType<number | undefined>(result2[1].data)

      // can pass only TData (data prop) although TQueryFnData will be left unknown
      const result3 = createQueries<[{ data: string }, { data: number }]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectType<unknown>(a)
              expectTypeNotAny(a)
              return a as string
            },
          },
          {
            queryKey: key2,
            queryFn: () => 'string',
            select: (a) => {
              expectType<unknown>(a)
              expectTypeNotAny(a)
              return a as number
            },
          },
        ],
      })
      expectType<QueryObserverResult<string, unknown>>(result3[0])
      expectType<QueryObserverResult<number, unknown>>(result3[1])
      expectType<string | undefined>(result3[0].data)
      expectType<number | undefined>(result3[1].data)

      // types should be enforced
      createQueries<
        [
          { queryFnData: string; data: string },
          { queryFnData: string; data: number; error: boolean },
        ]
      >({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return a.toLowerCase()
            },
            onSuccess: (a) => {
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
            select: (a) => {
              expectType<string>(a)
              expectTypeNotAny(a)
              return parseInt(a)
            },
            onSuccess: (a) => {
              expectType<number>(a)
              expectTypeNotAny(a)
            },
            onError: (e) => {
              expectType<boolean>(e)
              expectTypeNotAny(e)
            },
            placeholderData: 'string',
            // @ts-expect-error (initialData: string)
            initialData: 123,
          },
        ],
      })

      // field names should be enforced
      createQueries<[{ queryFnData: string }]>({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            // @ts-expect-error (invalidField)
            someInvalidField: [],
          },
        ],
      })
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
      const result1 = createQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: () => ['key', i] as const,
          queryFn: () => i + 10,
        })),
      })
      expectType<QueryObserverResult<number, unknown>[]>(result1)
      expectType<number | undefined>(result1[0]?.data)

      // Array.map preserves TData
      const result2 = createQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: () => ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
        })),
      })
      expectType<QueryObserverResult<string, unknown>[]>(result2)

      const result3 = createQueries({
        queries: [
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
        ],
      })
      expectType<QueryObserverResult<number, unknown>>(result3[0])
      expectType<QueryObserverResult<string, unknown>>(result3[1])
      expectType<QueryObserverResult<number, unknown>>(result3[2])
      expectType<number | undefined>(result3[0].data)
      expectType<string | undefined>(result3[1].data)
      // select takes precedence over queryFn
      expectType<number | undefined>(result3[2].data)

      // initialData/placeholderData are enforced
      createQueries({
        queries: [
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
        ],
      })

      // select / onSuccess / onSettled params are "indirectly" enforced
      createQueries({
        queries: [
          // unfortunately TS will not suggest the type for you
          {
            queryKey: key1,
            queryFn: () => 'string',
            // @ts-expect-error (noImplicitAny)
            onSuccess: (a) => null,
            // @ts-expect-error (noImplicitAny)
            onSettled: (a) => null,
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
        ],
      })

      // callbacks are also indirectly enforced with Array.map
      createQueries({
        // @ts-expect-error (onSuccess only accepts string)
        queries: Array(50).map((_, i) => ({
          queryKey: ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
          onSuccess: (_data: number) => null,
        })),
      })
      createQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: () => ['key', i] as const,
          queryFn: () => i + 10,
          select: (data: number) => data.toString(),
          onSuccess: (_data: string) => null,
        })),
      })

      // results inference works when all the handlers are defined
      const result4 = createQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            // @ts-expect-error (noImplicitAny)
            onSuccess: (a) => null,
            // @ts-expect-error (noImplicitAny)
            onSettled: (a) => null,
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
        ],
      })
      expectType<QueryObserverResult<string, unknown>>(result4[0])
      expectType<QueryObserverResult<string, unknown>>(result4[1])
      expectType<QueryObserverResult<number, unknown>>(result4[2])

      // handles when queryFn returns a Promise
      const result5 = createQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => Promise.resolve('string'),
            onSuccess: (a: string) => {
              expectType<string>(a)
              expectTypeNotAny(a)
            },
            // @ts-expect-error (refuses to accept a Promise)
            onSettled: (a: Promise<string>) => null,
          },
        ],
      })
      expectType<QueryObserverResult<string, unknown>>(result5[0])

      // Array as const does not throw error
      const result6 = createQueries({
        queries: [
          {
            queryKey: () => ['key1'],
            queryFn: () => 'string',
          },
          {
            queryKey: () => ['key1'],
            queryFn: () => 123,
          },
        ],
      } as const)
      expectType<QueryObserverResult<string, unknown>>(result6[0])
      expectType<QueryObserverResult<number, unknown>>(result6[1])

      // field names should be enforced - array literal
      createQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            // @ts-expect-error (invalidField)
            someInvalidField: [],
          },
        ],
      })

      // field names should be enforced - Array.map() result
      createQueries({
        // @ts-expect-error (invalidField)
        queries: Array(10).map(() => ({
          someInvalidField: '',
        })),
      })

      // field names should be enforced - array literal
      createQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => 'string',
            // @ts-expect-error (invalidField)
            someInvalidField: [],
          },
        ],
      })

      // supports queryFn using fetch() to return Promise<any> - Array.map() result
      createQueries({
        queries: Array(50).map((_, i) => ({
          queryKey: () => ['key', i] as const,
          queryFn: () =>
            fetch('return Promise<any>').then((resp) => resp.json()),
        })),
      })

      // supports queryFn using fetch() to return Promise<any> - array literal
      createQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () =>
              fetch('return Promise<any>').then((resp) => resp.json()),
          },
        ],
      })
    }
  })

  it('handles strongly typed queryFn factories and useQueries wrappers', () => {
    // QueryKey + queryFn factory
    type QueryKeyA = ['queryA']
    const getQueryKeyA = (): QueryKeyA => ['queryA']
    type GetQueryFunctionA = () => QueryFunction<number, QueryKeyA>
    const getQueryFunctionA: GetQueryFunctionA = () => async () => {
      return 1
    }
    type SelectorA = (data: number) => [number, string]
    const getSelectorA = (): SelectorA => (data) => [data, data.toString()]

    type QueryKeyB = ['queryB', string]
    const getQueryKeyB = (id: string): QueryKeyB => ['queryB', id]
    type GetQueryFunctionB = () => QueryFunction<string, QueryKeyB>
    const getQueryFunctionB: GetQueryFunctionB = () => async () => {
      return '1'
    }
    type SelectorB = (data: string) => [string, number]
    const getSelectorB = (): SelectorB => (data) => [data, +data]

    // Wrapper with strongly typed array-parameter
    function useWrappedQueries<
      TQueryFnData,
      TError,
      TData,
      TQueryKey extends SolidQueryKey,
    >(queries: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>[]) {
      return createQueries({
        queries: queries.map(
          // no need to type the mapped query
          (query) => {
            const { queryFn: fn, queryKey: key, onError: err } = query
            expectType<
              QueryFunction<TQueryFnData, ReturnType<TQueryKey>> | undefined
            >(fn)
            return {
              queryKey: key,
              onError: err,
              queryFn: fn
                ? (ctx: QueryFunctionContext<ReturnType<TQueryKey>>) => {
                    expectType<ReturnType<TQueryKey>>(ctx.queryKey)
                    return fn.call({}, ctx)
                  }
                : undefined,
            }
          },
        ),
      })
    }

    // @ts-expect-error (Page component is not rendered)
    // eslint-disable-next-line
    function Page() {
      const result = createQueries({
        queries: [
          {
            queryKey: () => getQueryKeyA(),
            queryFn: getQueryFunctionA(),
          },
          {
            queryKey: () => getQueryKeyB('id'),
            queryFn: getQueryFunctionB(),
          },
        ],
      })
      expectType<QueryObserverResult<number, unknown>>(result[0])
      expectType<QueryObserverResult<string, unknown>>(result[1])

      const withSelector = createQueries({
        queries: [
          {
            queryKey: () => getQueryKeyA(),
            queryFn: getQueryFunctionA(),
            select: getSelectorA(),
          },
          {
            queryKey: () => getQueryKeyB('id'),
            queryFn: getQueryFunctionB(),
            select: getSelectorB(),
          },
        ],
      })
      expectType<QueryObserverResult<[number, string], unknown>>(
        withSelector[0],
      )
      expectType<QueryObserverResult<[string, number], unknown>>(
        withSelector[1],
      )

      const withWrappedQueries = useWrappedQueries(
        Array(10).map(() => ({
          queryKey: () => getQueryKeyA(),
          queryFn: getQueryFunctionA(),
          select: getSelectorA(),
        })),
      )

      expectType<QueryObserverResult<number | undefined, unknown>[]>(
        withWrappedQueries,
      )
    }
  })

  it('should not change state if unmounted', async () => {
    const key1 = queryKey()

    // We have to mock the QueriesObserver to not unsubscribe
    // the listener when the component is unmounted
    class QueriesObserverMock extends QueriesObserver {
      subscribe(listener: any) {
        super.subscribe(listener)
        return () => void 0
      }
    }

    const QueriesObserverSpy = jest
      .spyOn(QueriesObserverModule, 'QueriesObserver')
      .mockImplementation((fn) => {
        return new QueriesObserverMock(fn)
      })

    function Queries() {
      createQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              await sleep(10)
              return 1
            },
          },
        ],
      })

      return (
        <div>
          <span>queries</span>
        </div>
      )
    }

    function Page() {
      const [mounted, setMounted] = createSignal(true)

      return (
        <div>
          <button onClick={() => setMounted(false)}>unmount</button>
          {mounted() && <Queries />}
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))
    fireEvent.click(screen.getByText('unmount'))

    // Should not display the console error
    // "Warning: Can't perform a React state update on an unmounted component"

    await sleep(20)
    QueriesObserverSpy.mockRestore()
  })

  describe('with custom context', () => {
    it('should return the correct states', async () => {
      const context = createContext<QueryClient | undefined>(undefined)

      const key1 = queryKey()
      const key2 = queryKey()
      const results: CreateQueryResult[][] = []

      function Page() {
        const result = createQueries({
          context,
          queries: [
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
          ],
        })
        createRenderEffect(() => {
          results.push([...result])
        })
        return null
      }

      render(() => (
        <QueryClientProvider client={queryClient} context={context}>
          <Page />
        </QueryClientProvider>
      ))

      await sleep(30)

      expect(results[0]).toMatchObject([
        { data: undefined },
        { data: undefined },
      ])
      expect(results[results.length - 1]).toMatchObject([
        { data: 1 },
        { data: 2 },
      ])
    })

    it('should throw if the context is necessary and is not passed to useQueries', async () => {
      const context = createContext<QueryClient | undefined>(undefined)

      const key1 = queryKey()
      const key2 = queryKey()
      const results: CreateQueryResult[][] = []

      function Page() {
        const result = createQueries({
          queries: [
            {
              queryKey: key1,
              queryFn: async () => 1,
            },
            {
              queryKey: key2,
              queryFn: async () => 2,
            },
          ],
        })
        results.push(result)
        return null
      }

      render(() => (
        <QueryClientProvider client={queryClient} context={context}>
          <ErrorBoundary fallback={() => <div>error boundary</div>}>
            <Page />
          </ErrorBoundary>
        </QueryClientProvider>
      ))

      await waitFor(() => screen.getByText('error boundary'))
    })
  })
})
