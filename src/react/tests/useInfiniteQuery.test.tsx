import { render, waitFor, fireEvent } from '@testing-library/react'
import * as React from 'react'

import { useInfiniteQuery, useQueryCache, queryCaches } from '../index'
import { sleep } from './utils'
import { InfiniteQueryResult } from '../../core/types'

interface Result {
  items: number[]
  nextId: number
  ts: number
}

const pageSize = 10

const initialItems = (page: number): Result => {
  return {
    items: [...new Array(10)].fill(null).map((_, d) => page * pageSize + d),
    nextId: page + 1,
    ts: page,
  }
}

const fetchItems = async (page: number, ts: number): Promise<Result> => {
  await sleep(10)
  return {
    items: [...new Array(10)].fill(null).map((_, d) => page * pageSize + d),
    nextId: page + 1,
    ts,
  }
}

describe('useInfiniteQuery', () => {
  afterEach(() => {
    queryCaches.forEach(cache => cache.clear({ notify: false }))
  })

  it('should return the correct states for a successful query', async () => {
    let count = 0
    const states: InfiniteQueryResult<Result>[] = []

    function Page() {
      const state = useInfiniteQuery(
        'items',
        (_key: string, nextId = 0) => fetchItems(nextId, count++),
        {
          getFetchMore: (lastGroup, _allGroups) => Boolean(lastGroup.nextId),
        }
      )

      states.push(state)

      return (
        <div>
          <h1>Status: {state.status}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('Status: success'))

    expect(states[0]).toEqual({
      clear: expect.any(Function),
      data: undefined,
      error: null,
      failureCount: 0,
      fetchMore: expect.any(Function),
      isError: false,
      isFetching: true,
      isFetchingMore: undefined,
      isIdle: false,
      isLoading: true,
      isStale: true,
      isSuccess: false,
      query: expect.any(Object),
      refetch: expect.any(Function),
      status: 'loading',
      updatedAt: expect.any(Number),
    })

    expect(states[1]).toEqual({
      clear: expect.any(Function),
      canFetchMore: true,
      data: [
        {
          items: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          nextId: 1,
          ts: 0,
        },
      ],
      error: null,
      failureCount: 0,
      fetchMore: expect.any(Function),
      isFetchingMore: undefined,
      isError: false,
      isFetching: false,
      isIdle: false,
      isLoading: false,
      isStale: true,
      isSuccess: true,
      query: expect.any(Object),
      refetch: expect.any(Function),
      status: 'success',
      updatedAt: expect.any(Number),
    })
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
      } = useInfiniteQuery<Result, Error, string>(
        'items',
        (_key, nextId = 0) => fetchItems(nextId, fetchCountRef.current++),
        {
          getFetchMore: (lastGroup, _allGroups) => lastGroup.nextId,
        }
      )

      return (
        <div>
          <h1>Pagination</h1>
          {status === 'loading' ? (
            'Loading...'
          ) : status === 'error' ? (
            <span>Error: {error?.message}</span>
          ) : (
            <>
              <div>Data:</div>
              {data?.map((page, i) => (
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
                  disabled={!canFetchMore || Boolean(isFetchingMore)}
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

    await waitFor(() => {
      rendered.getByText('Item: 9')
      rendered.getByText('Page 0: 0')
    })

    await fireEvent.click(rendered.getByText('Load More'))

    await waitFor(() => rendered.getByText('Loading more...'))

    await waitFor(() => {
      rendered.getByText('Item: 19')
      rendered.getByText('Page 0: 0')
      rendered.getByText('Page 1: 1')
    })

    fireEvent.click(rendered.getByText('Refetch'))

    await waitFor(() => rendered.getByText('Background Updating...'))
    await waitFor(() => {
      rendered.getByText('Item: 19')
      rendered.getByText('Page 0: 2')
      rendered.getByText('Page 1: 3')
    })
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
      } = useInfiniteQuery<Result, Error, string>(
        'items',
        (_key, nextId = 0) => fetchItems(nextId, fetchCountRef.current++),
        {
          initialData: [initialItems(0)],
          getFetchMore: (lastGroup, _allGroups) => lastGroup.nextId,
        }
      )

      return (
        <div>
          <h1>Pagination</h1>
          {status === 'loading' ? (
            'Loading...'
          ) : status === 'error' ? (
            <span>Error: {error?.message}</span>
          ) : (
            <>
              <div>Data:</div>
              {data?.map((page, i) => (
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
                  disabled={!canFetchMore || Boolean(isFetchingMore)}
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

    await waitFor(() => rendered.getByText('Loading more...'))

    await waitFor(() => {
      rendered.getByText('Item: 19')
      rendered.getByText('Page 1: 0')
    })

    fireEvent.click(rendered.getByText('Refetch'))

    await waitFor(() => rendered.getByText('Background Updating...'))
    await waitFor(() => {
      rendered.getByText('Item: 19')
      rendered.getByText('Page 0: 1')
      rendered.getByText('Page 1: 2')
    })
  })

  it('should build fresh cursors on refetch', async () => {
    const genItems = (size: number) =>
      [...new Array(size)].fill(null).map((_, d) => d)
    const items = genItems(15)
    const limit = 3

    const fetchItems = async (cursor = 0, ts: number) => {
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
      } = useInfiniteQuery<Result, Error, string>(
        'items',
        (_key, nextId = 0) => fetchItems(nextId, fetchCountRef.current++),
        {
          getFetchMore: (lastGroup, _allGroups) => lastGroup.nextId,
        }
      )

      return (
        <div>
          <h1>Pagination</h1>
          {status === 'loading' ? (
            'Loading...'
          ) : status === 'error' ? (
            <span>Error: {error?.message}</span>
          ) : (
            <>
              <div>Data:</div>
              {data?.map((page, i) => (
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
                  disabled={!canFetchMore || Boolean(isFetchingMore)}
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
                    // and calls invalidateQueries in an onSuccess
                    items.splice(4, 1)
                    queryCache.invalidateQueries('items')
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

    const rendered = render(<Page />)

    rendered.getByText('Loading...')

    await waitFor(() => rendered.getByText('Item: 2'))
    await waitFor(() => rendered.getByText('Page 0: 0'))

    fireEvent.click(rendered.getByText('Load More'))

    await waitFor(() => rendered.getByText('Loading more...'))
    await waitFor(() => rendered.getByText('Item: 5'))
    await waitFor(() => rendered.getByText('Page 0: 0'))
    await waitFor(() => rendered.getByText('Page 1: 1'))

    fireEvent.click(rendered.getByText('Load More'))

    await waitFor(() => rendered.getByText('Loading more...'))
    await waitFor(() => rendered.getByText('Item: 8'))
    await waitFor(() => rendered.getByText('Page 0: 0'))
    await waitFor(() => rendered.getByText('Page 1: 1'))
    await waitFor(() => rendered.getByText('Page 2: 2'))

    fireEvent.click(rendered.getByText('Refetch'))

    await waitFor(() => rendered.getByText('Background Updating...'))
    await waitFor(() => rendered.getByText('Item: 8'))
    await waitFor(() => rendered.getByText('Page 0: 3'))
    await waitFor(() => rendered.getByText('Page 1: 4'))
    await waitFor(() => rendered.getByText('Page 2: 5'))

    // ensure that Item: 4 is rendered before removing it
    expect(rendered.queryAllByText('Item: 4')).toHaveLength(1)

    // remove Item: 4
    fireEvent.click(rendered.getByText('Remove item'))

    await waitFor(() => rendered.getByText('Background Updating...'))
    // ensure that an additional item is rendered (it means that cursors were properly rebuilt)
    await waitFor(() => rendered.getByText('Item: 9'))
    await waitFor(() => rendered.getByText('Page 0: 6'))
    await waitFor(() => rendered.getByText('Page 1: 7'))
    await waitFor(() => rendered.getByText('Page 2: 8'))

    // ensure that Item: 4 is no longer rendered
    expect(rendered.queryAllByText('Item: 4')).toHaveLength(0)
  })
})
