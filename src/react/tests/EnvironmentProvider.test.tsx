import React from 'react'
import { render, waitFor } from '@testing-library/react'

import { sleep, queryKey } from './utils'
import {
  Environment,
  EnvironmentProvider,
  QueryCache,
  findQuery,
  useQuery,
} from '../..'

describe('EnvironmentProvider', () => {
  test('sets a specific cache for all queries to use', async () => {
    const key = queryKey()

    const queryCache = new QueryCache()
    const environment = new Environment({ queryCache })

    function Page() {
      const { data } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <EnvironmentProvider environment={environment}>
        <Page />
      </EnvironmentProvider>
    )

    await waitFor(() => rendered.getByText('test'))

    expect(findQuery(environment, key)).toBeDefined()
  })

  test('allows multiple caches to be partitioned', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const queryCache1 = new QueryCache()
    const queryCache2 = new QueryCache()

    const environment1 = new Environment({ queryCache: queryCache1 })
    const environment2 = new Environment({ queryCache: queryCache2 })

    function Page1() {
      const { data } = useQuery(key1, async () => {
        await sleep(10)
        return 'test1'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }
    function Page2() {
      const { data } = useQuery(key2, async () => {
        await sleep(10)
        return 'test2'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <>
        <EnvironmentProvider environment={environment1}>
          <Page1 />
        </EnvironmentProvider>
        <EnvironmentProvider environment={environment2}>
          <Page2 />
        </EnvironmentProvider>
      </>
    )

    await waitFor(() => rendered.getByText('test1'))
    await waitFor(() => rendered.getByText('test2'))

    expect(findQuery(environment1, key1)).toBeDefined()
    expect(findQuery(environment1, key2)).not.toBeDefined()
    expect(findQuery(environment2, key1)).not.toBeDefined()
    expect(findQuery(environment2, key2)).toBeDefined()
  })

  test("uses defaultOptions for queries when they don't provide their own config", async () => {
    const key = queryKey()

    const queryCache = new QueryCache()
    const environment = new Environment({
      queryCache,
      defaultOptions: {
        queries: {
          cacheTime: Infinity,
        },
      },
    })

    function Page() {
      const { data } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(
      <EnvironmentProvider environment={environment}>
        <Page />
      </EnvironmentProvider>
    )

    await waitFor(() => rendered.getByText('test'))

    expect(findQuery(environment, key)).toBeDefined()
    expect(findQuery(environment, key)?.options.cacheTime).toBe(Infinity)
  })
})
