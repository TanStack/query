import React from 'react'

import { expectType, queryKey, renderWithClient, sleep } from './utils'
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
        { queryKey: key1, queryFn: () => 1 },
        { queryKey: key2, queryFn: () => 2 },
      ])
      results.push(result)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  it('should return same data types correctly (a type test; validated by successful compilation; not runtime results)', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: number[] = []

    function Page() {
      const result = useQueries([
        { queryKey: key1, queryFn: () => 1 },
        { queryKey: key2, queryFn: () => 2 },
      ])
      if (result[0].data) {
        results.push(result[0].data)
      }
      if (result[1].data) {
        results.push(result[1].data)
      }
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)
  })

  it('should return different data types correctly (a type test; validated by successful compilation; not runtime results)', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const result = useQueries([
        { queryKey: key1, queryFn: () => 1 },
        { queryKey: key2, queryFn: () => 'two' },
      ])
      if (result[0].data) {
        expectType<number>(result[0].data)
      }
      if (result[1].data) {
        expectType<string>(result[1].data)
      }
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)
  })

  it('if select is provided then the return type should be unknown (a type test; validated by successful compilation; not runtime results)', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const result = useQueries([
        {
          queryKey: key1,
          queryFn: () => ({ prop: 'value' }),
          // here x is unknown; we use x.prop without testing - triggering `Object is of type 'unknown'.ts(2571)`
          // @ts-expect-error
          select: x => x.prop,
        },
        { queryKey: key2, queryFn: () => 1 },
      ])

      if (result[0].data) {
        expectType<unknown>(result[0].data)
      }
      if (result[1].data) {
        expectType<number>(result[1].data)
      }
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)
  })
})
