import {
  render,
  waitForElement,
  fireEvent,
  cleanup,
} from '@testing-library/react'
import * as React from 'react'

import {
  useInfiniteQuery,
  ReactQueryCacheProvider,
  useQueryCache,
} from '../index'
import { sleep } from './utils'

const pageSize = 10

const initialItems = page => {
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

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

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

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

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

  it('should build fresh cursors on refetch', async () => {
    const genItems = size => [...new Array(size)].fill(null).map((_, d) => d)
    const items = genItems(15)
    const limit = 3

    const fetchItems = async (cursor = 0, ts) => {
      await sleep(10)
      return {
        nextId: cursor + limit,
        items: items.slice(cursor, cursor + limit),
        ts,
      }
    }

    function Page() {
      const queryCache = useQueryCache()
      const fetchCountRef = React.useRef(0)
      const {
        status,
        data,
        error,
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
                <button
                  onClick={() => {
                    // Imagine that this mutation happens somewhere else
                    // makes an actual network request
                    // and calls refetchQueries in an onSuccess
                    items.splice(4, 1)
                    queryCache.refetchQueries('items')
                  }}
                >
                  Remove item
                </button>
              </div>
              <div>{!isFetchingMore ? 'Background Updating...' : null}</div>
            </>
          )}
        </div>
      )
    }

    const rendered = render(
      <ReactQueryCacheProvider>
        <Page />
      </ReactQueryCacheProvider>
    )

    rendered.getByText('Loading...')

    await rendered.findByText('Item: 2')
    await rendered.findByText('Page 0: 0')

    fireEvent.click(rendered.getByText('Load More'))

    await rendered.findByText('Loading more...')
    await rendered.findByText('Item: 5')
    await rendered.findByText('Page 0: 0')
    await rendered.findByText('Page 1: 1')

    fireEvent.click(rendered.getByText('Load More'))

    await rendered.findByText('Loading more...')
    await rendered.findByText('Item: 8')
    await rendered.findByText('Page 0: 0')
    await rendered.findByText('Page 1: 1')
    await rendered.findByText('Page 2: 2')

    fireEvent.click(rendered.getByText('Refetch'))

    await rendered.findByText('Background Updating...')
    await rendered.findByText('Item: 8')
    await rendered.findByText('Page 0: 3')
    await rendered.findByText('Page 1: 4')
    await rendered.findByText('Page 2: 5')

    // ensure that Item: 4 is rendered before removing it
    expect(rendered.queryAllByText('Item: 4')).toHaveLength(1)

    // remove Item: 4
    fireEvent.click(rendered.getByText('Remove item'))

    await rendered.findByText('Background Updating...')
    // ensure that an additional item is rendered (it means that cursors were properly rebuilt)
    await rendered.findByText('Item: 9')
    await rendered.findByText('Page 0: 6')
    await rendered.findByText('Page 1: 7')
    await rendered.findByText('Page 2: 8')

    // ensure that Item: 4 is no longer rendered
    expect(rendered.queryAllByText('Item: 4')).toHaveLength(0)
  })
})
