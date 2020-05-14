/**
 * @jest-environment node
 */

import React from 'react'
import { renderToString } from 'react-dom/server'
import {
  usePaginatedQuery,
  ReactQueryCacheProvider,
  makeQueryCache,
} from '../index'

describe('useQuery SSR', () => {
  // See https://github.com/tannerlinsley/react-query/issues/70
  it('should not cache queries on server', async () => {
    const queryCache = makeQueryCache()
    function Page() {
      const [page, setPage] = React.useState(1)
      const { resolvedData } = usePaginatedQuery(
        ['data', page],
        async (queryName, page) => {
          return page
        },
        { initialData: '1' }
      )

      return (
        <div>
          <h1 data-testid="title">{resolvedData}</h1>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    renderToString(
      <ReactQueryCacheProvider queryCache={queryCache}>
        <Page />
      </ReactQueryCacheProvider>
    )

    expect(queryCache.queries).toEqual({})
  })
})
