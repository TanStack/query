import React from 'react'
import { render } from '@testing-library/react'

import { ReactQueryCacheProvider, QueryCache, useQuery } from '../..'
import { dehydrate, useHydrate, Hydrate } from '../'
import { waitForMs } from '../../react/tests/utils'

describe('React hydration', () => {
  const fetchData: (value: string) => Promise<string> = value =>
    new Promise(res => setTimeout(() => res(value), 10))
  const dataQuery: (key: string) => Promise<string> = key => fetchData(key)
  let stringifiedState: string

  beforeAll(async () => {
    const serverQueryCache = new QueryCache()
    await serverQueryCache.prefetchQuery('string', dataQuery)
    const dehydrated = dehydrate(serverQueryCache)
    stringifiedState = JSON.stringify(dehydrated)
    serverQueryCache.clear({ notify: false })
  })

  describe('useHydrate', () => {
    test('should handle global cache case', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      function Page() {
        useHydrate(dehydratedState)
        const { data } = useQuery('string', dataQuery)

        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(<Page />)

      await waitForMs(10)
      rendered.getByText('string')
    })

    test('should hydrate queries to the cache on context', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const clientQueryCache = new QueryCache()

      function Page() {
        useHydrate(dehydratedState)
        const { data } = useQuery('string', dataQuery)
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <ReactQueryCacheProvider queryCache={clientQueryCache}>
          <Page />
        </ReactQueryCacheProvider>
      )

      await waitForMs(10)
      rendered.getByText('string')
      clientQueryCache.clear({ notify: false })
    })
  })

  describe('ReactQueryCacheProvider with hydration support', () => {
    test('should hydrate new queries if queries change', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const clientQueryCache = new QueryCache()

      function Page({ queryKey }: { queryKey: string }) {
        const { data } = useQuery(queryKey, dataQuery)
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <ReactQueryCacheProvider queryCache={clientQueryCache}>
          <Hydrate state={dehydratedState}>
            <Page queryKey={'string'} />
          </Hydrate>
        </ReactQueryCacheProvider>
      )

      await waitForMs(10)
      rendered.getByText('string')

      const intermediateCache = new QueryCache()
      await intermediateCache.prefetchQuery('string', () =>
        dataQuery('should change')
      )
      await intermediateCache.prefetchQuery('added string', dataQuery)
      const dehydrated = dehydrate(intermediateCache)
      intermediateCache.clear({ notify: false })

      rendered.rerender(
        <ReactQueryCacheProvider queryCache={clientQueryCache}>
          <Hydrate state={dehydrated}>
            <Page queryKey={'string'} />
            <Page queryKey={'added string'} />
          </Hydrate>
        </ReactQueryCacheProvider>
      )

      // Existing query data should be overwritten if older,
      // so this should have changed
      await waitForMs(10)
      rendered.getByText('should change')
      // New query data should be available immediately
      rendered.getByText('added string')

      clientQueryCache.clear({ notify: false })
    })

    test('should hydrate queries to new cache if cache changes', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const clientQueryCache = new QueryCache()

      function Page() {
        const { data } = useQuery('string', dataQuery)
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <ReactQueryCacheProvider queryCache={clientQueryCache}>
          <Hydrate state={dehydratedState}>
            <Page />
          </Hydrate>
        </ReactQueryCacheProvider>
      )

      await waitForMs(10)
      rendered.getByText('string')

      const newClientQueryCache = new QueryCache()

      rendered.rerender(
        <ReactQueryCacheProvider queryCache={newClientQueryCache}>
          <Hydrate state={dehydratedState}>
            <Page />
          </Hydrate>
        </ReactQueryCacheProvider>
      )

      await waitForMs(10)
      rendered.getByText('string')

      clientQueryCache.clear({ notify: false })
      newClientQueryCache.clear({ notify: false })
    })
  })
})
