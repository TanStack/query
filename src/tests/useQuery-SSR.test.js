import { cleanup } from '@testing-library/react'
import React from 'react'
import { renderToString } from 'react-dom/server'

describe('useQuery SSR', () => {
  beforeEach(() => {
    const windowSpy = jest.spyOn(global, 'window', 'get')
    windowSpy.mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
  })

  // See https://github.com/tannerlinsley/react-query/issues/70
  it('should not cache queries on server', async () => {
    // import react-query after mocking window
    const { usePaginatedQuery, queryCache } = require('../index')

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

    renderToString(<Page />)

    expect(queryCache.queries).toEqual({})
  })
})
