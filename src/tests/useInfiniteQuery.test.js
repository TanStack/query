import {
  render,
  waitForElement,
  fireEvent,
  cleanup,
} from '@testing-library/react'
import * as React from 'react'

import { useInfiniteQuery, queryCache } from '../index'
import { sleep } from './utils'

const pageSize = 10

const initialItems = (page) => {
  return {
    items: [...new Array(10)].fill(null).map((_, d) => page * pageSize + d),
    nextId: page + 1,
    ts: page,
  }
}

const fetchItems = async (page, ts) => {
  await sleep(10)
  return {
    items: [...new Array(10)].fill(null).map((_, d) => page * pageSize + d),
    nextId: page + 1,
    ts,
  }
}

describe('useInfiniteQuery', () => {
  afterEach(() => {
    queryCache.clear()
    cleanup()
  })

  it('should allow you to fetch more pages', async () => {
    function Page() {
      const fetchCountRef = React.useRef(0)
      const {
        status,
        data,
        error,
        isFetching,
        isFetchingMore,
        fetchMore,
        canFetchMore,
        refetch,
      } = useInfiniteQuery(
        'items',
        (key, nextId = 0) => fetchItems(nextId, fetchCountRef.current++),
        {
          getFetchMore: (lastGroup, allGroups) => lastGroup.nextId,
        }
      )

      return (
        <div>
          <h1>Pagination</h1>
          {status === 'loading' ? (
            'Loading...'
          ) : status === 'error' ? (
            <span>Error: {error.message}</span>
          ) : (
            <>
              <div>Data:</div>
              {data.map((page, i) => (
                <div key={i}>
                  <div>
                    Page {i}: {page.ts}
                  </div>
                  <div key={i}>
                    {page.items.map(item => (
                      <p key={item}>Item: {item}</p>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <button
                  onClick={() => fetchMore()}
                  disabled={!canFetchMore || isFetchingMore}
                >
                  {isFetchingMore
                    ? 'Loading more...'
                    : canFetchMore
                    ? 'Load More'
                    : 'Nothing more to load'}
                </button>
                <button onClick={() => refetch()}>Refetch</button>
              </div>
              <div>
                {isFetching && !isFetchingMore
                  ? 'Background Updating...'
                  : null}
              </div>
            </>
          )}
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('Loading...')

    await waitForElement(() => [
      rendered.getByText('Item: 9'),
      rendered.getByText('Page 0: 0'),
    ])

    fireEvent.click(rendered.getByText('Load More'))

    await waitForElement(() => rendered.getByText('Loading more...'))

    await waitForElement(() => [
      rendered.getByText('Item: 19'),
      rendered.getByText('Page 0: 0'),
      rendered.getByText('Page 1: 1'),
    ])

    fireEvent.click(rendered.getByText('Refetch'))

    await waitForElement(() => rendered.getByText('Background Updating...'))
    await waitForElement(() => [
      rendered.getByText('Item: 19'),
      rendered.getByText('Page 0: 2'),
      rendered.getByText('Page 1: 3'),
    ])
  })

  it('should compute canFetchMore correctly using initialData', async () => {
    function Page() {
      const fetchCountRef = React.useRef(0)
      const {
        status,
        data,
        error,
        isFetching,
        isFetchingMore,
        fetchMore,
        canFetchMore,
        refetch,
      } = useInfiniteQuery(
        'items',
        (key, nextId = 0) => fetchItems(nextId, fetchCountRef.current++),
        {
          initialData: [initialItems(0)],
          getFetchMore: (lastGroup, allGroups) => lastGroup.nextId,
        }
      )

      return (
        <div>
          <h1>Pagination</h1>
          {status === 'loading' ? (
            'Loading...'
          ) : status === 'error' ? (
            <span>Error: {error.message}</span>
          ) : (
            <>
              <div>Data:</div>
              {data.map((page, i) => (
                <div key={i}>
                  <div>
                    Page {i}: {page.ts}
                  </div>
                  <div key={i}>
                    {page.items.map(item => (
                      <p key={item}>Item: {item}</p>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <button
                  onClick={() => fetchMore()}
                  disabled={!canFetchMore || isFetchingMore}
                >
                  {isFetchingMore
                    ? 'Loading more...'
                    : canFetchMore
                    ? 'Load More'
                    : 'Nothing more to load'}
                </button>
                <button onClick={() => refetch()}>Refetch</button>
              </div>
              <div>
                {isFetching && !isFetchingMore
                  ? 'Background Updating...'
                  : null}
              </div>
            </>
          )}
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('Item: 9')
    rendered.getByText('Page 0: 0')

    fireEvent.click(rendered.getByText('Load More'))

    await waitForElement(() => rendered.getByText('Loading more...'))

    await waitForElement(() => [
      rendered.getByText('Item: 19'),
      rendered.getByText('Page 1: 0'),
    ])

    fireEvent.click(rendered.getByText('Refetch'))

    await waitForElement(() => rendered.getByText('Background Updating...'))
    await waitForElement(() => [
      rendered.getByText('Item: 19'),
      rendered.getByText('Page 0: 1'),
      rendered.getByText('Page 1: 2'),
    ])
  })
})
