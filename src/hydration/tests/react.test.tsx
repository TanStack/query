import React from 'react'
import { render } from '@testing-library/react'

import {
  Environment,
  EnvironmentProvider,
  prefetchQuery,
  QueryCache,
  useQuery,
} from '../..'
import { dehydrate, useHydrate, Hydrate } from '../'
import { sleep } from '../../react/tests/utils'

describe('React hydration', () => {
  const fetchData: (value: string) => Promise<string> = value =>
    new Promise(res => setTimeout(() => res(value), 10))
  const dataQuery: (key: string) => Promise<string> = key => fetchData(key)
  let stringifiedState: string

  beforeAll(async () => {
    const environment = new Environment({ queryCache: new QueryCache() })
    await prefetchQuery(environment, { queryKey: 'string', queryFn: dataQuery })
    const dehydrated = dehydrate(environment)
    stringifiedState = JSON.stringify(dehydrated)
    environment.clear()
  })

  describe('useHydrate', () => {
    test('should hydrate queries to the cache on context', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const environment = new Environment({ queryCache: new QueryCache() })

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
        <EnvironmentProvider environment={environment}>
          <Page />
        </EnvironmentProvider>
      )

      await sleep(10)
      rendered.getByText('string')
      environment.clear()
    })
  })

  describe('ReactQueryCacheProvider with hydration support', () => {
    test('should hydrate new queries if queries change', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const environment = new Environment({ queryCache: new QueryCache() })

      function Page({ queryKey }: { queryKey: string }) {
        const { data } = useQuery(queryKey, dataQuery)
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <EnvironmentProvider environment={environment}>
          <Hydrate state={dehydratedState}>
            <Page queryKey={'string'} />
          </Hydrate>
        </EnvironmentProvider>
      )

      await sleep(10)
      rendered.getByText('string')

      const intermediateEnvironment = new Environment({
        queryCache: new QueryCache(),
      })
      await prefetchQuery(intermediateEnvironment, {
        queryKey: 'string',
        queryFn: () => dataQuery('should change'),
      })
      await prefetchQuery(intermediateEnvironment, {
        queryKey: 'added string',
        queryFn: dataQuery,
      })
      const dehydrated = dehydrate(intermediateEnvironment)
      intermediateEnvironment.clear()

      rendered.rerender(
        <EnvironmentProvider environment={environment}>
          <Hydrate state={dehydrated}>
            <Page queryKey={'string'} />
            <Page queryKey={'added string'} />
          </Hydrate>
        </EnvironmentProvider>
      )

      // Existing query data should be overwritten if older,
      // so this should have changed
      await sleep(10)
      rendered.getByText('should change')
      // New query data should be available immediately
      rendered.getByText('added string')

      environment.clear()
    })

    test('should hydrate queries to new cache if cache changes', async () => {
      const dehydratedState = JSON.parse(stringifiedState)
      const environment = new Environment({ queryCache: new QueryCache() })

      function Page() {
        const { data } = useQuery('string', dataQuery)
        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = render(
        <EnvironmentProvider environment={environment}>
          <Hydrate state={dehydratedState}>
            <Page />
          </Hydrate>
        </EnvironmentProvider>
      )

      await sleep(10)
      rendered.getByText('string')

      const newClientEnvironment = new Environment({
        queryCache: new QueryCache(),
      })

      rendered.rerender(
        <EnvironmentProvider environment={newClientEnvironment}>
          <Hydrate state={dehydratedState}>
            <Page />
          </Hydrate>
        </EnvironmentProvider>
      )

      await sleep(10)
      rendered.getByText('string')

      environment.clear()
      newClientEnvironment.clear()
    })
  })
})
