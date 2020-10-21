import { render, waitFor, fireEvent } from '@testing-library/react'
import * as React from 'react'

import { sleep, queryKey, waitForMs, mockConsoleError } from './utils'
import { useInfiniteQuery, useQueryCache, InfiniteQueryResult } from '../..'

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

const fetchItems = async (
  page: number,
  ts: number,
  nextId?: any
): Promise<Result> => {
  await sleep(10)
  return {
    items: [...new Array(10)].fill(null).map((_, d) => page * pageSize + d),
    nextId: nextId ?? page + 1,
    ts,
  }
}

describe('useInfiniteQuery', () => {
  it('should return the correct states for a successful query', async () => {
    const key = queryKey()

    let count = 0
    const states: InfiniteQueryResult<Result>[] = []

    function Page() {
      const state = useInfiniteQuery(
        key,
        (_key: string, nextId: number = 0) => fetchItems(nextId, count++),
        {
          getFetchMore: (lastGroup, _allGroups) => lastGroup.nextId,
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
      canFetchMore: undefined,
      clear: expect.any(Function),
      data: undefined,
      error: null,
      failureCount: 0,
      fetchMore: expect.any(Function),
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isFetchingMore: false,
      isIdle: false,
      isInitialData: true,
      isLoading: true,
      isPreviousData: false,
      isPlaceholderData: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
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
      isFetchingMore: false,
      isError: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isIdle: false,
      isInitialData: false,
      isLoading: false,
      isPreviousData: false,
      isPlaceholderData: false,
      isStale: true,
      isSuccess: true,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'success',
      updatedAt: expect.any(Number),
    })
  })

  it('should not throw when fetchMore returns an error', async () => {
    const consoleMock = mockConsoleError()
    const key = queryKey()
    let noThrow: boolean

    function Page() {
      const start = 1
      const state = useInfiniteQuery(
        key,
        async (_key, page: number = start) => {
          if (page === 2) {
            throw new Error('error')
          }
          return page
        },
        {
          retry: 1,
          retryDelay: 10,
          getFetchMore: (lastPage, _pages) => lastPage + 1,
        }
      )

      const { fetchMore } = state

      React.useEffect(() => {
        setTimeout(async () => {
          try {
            await fetchMore()
            noThrow = true
          } catch (error) {}
        }, 20)
      }, [fetchMore])

      return null
    }

    render(<Page />)

    await waitFor(() => expect(noThrow).toBe(true))
    consoleMock.mockRestore()
  })

  it('should keep the previous data when keepPreviousData is set', async () => {
    const key = queryKey()
    const states: InfiniteQueryResult<string>[] = []

    function Page() {
      const [order, setOrder] = React.useState('desc')

      const state = useInfiniteQuery(
        [key, order],
        async (_key, orderArg, pageArg = 0) => {
          await sleep(10)
          return `${pageArg}-${orderArg}`
        },
        {
          getFetchMore: (_lastGroup, _allGroups) => 1,
          keepPreviousData: true,
        }
      )

      states.push(state)

      const { fetchMore } = state

      React.useEffect(() => {
        setTimeout(() => {
          fetchMore()
        }, 50)
        setTimeout(() => {
          setOrder('asc')
        }, 100)
      }, [fetchMore])

      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(6))

    expect(states[0]).toMatchObject({
      data: undefined,
      isFetching: true,
      isFetchingMore: false,
      isSuccess: false,
      isPreviousData: false,
    })
    expect(states[1]).toMatchObject({
      data: ['0-desc'],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
      isPreviousData: false,
    })
    expect(states[2]).toMatchObject({
      data: ['0-desc'],
      isFetching: true,
      isFetchingMore: 'next',
      isSuccess: true,
      isPreviousData: false,
    })
    expect(states[3]).toMatchObject({
      data: ['0-desc', '1-desc'],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
      isPreviousData: false,
    })
    expect(states[4]).toMatchObject({
      data: ['0-desc', '1-desc'],
      isFetching: true,
      isFetchingMore: false,
      isSuccess: true,
      isPreviousData: true,
    })
    expect(states[5]).toMatchObject({
      data: ['0-asc'],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
      isPreviousData: false,
    })
  })

  it('should prepend pages when the previous option is set to true', async () => {
    const key = queryKey()
    const states: InfiniteQueryResult<number>[] = []

    function Page() {
      const start = 10
      const state = useInfiniteQuery(
        key,
        async (_key, page: number = start) => {
          await sleep(10)
          return page
        },
        {
          getFetchMore: (lastPage, _pages) => lastPage - 1,
        }
      )

      states.push(state)

      const { fetchMore } = state

      React.useEffect(() => {
        setTimeout(() => {
          fetchMore(undefined, { previous: true })
        }, 20)
      }, [fetchMore])

      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(4))

    expect(states[0]).toMatchObject({
      canFetchMore: undefined,
      data: undefined,
      isFetching: true,
      isFetchingMore: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      canFetchMore: true,
      data: [10],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
    expect(states[2]).toMatchObject({
      canFetchMore: true,
      data: [10],
      isFetching: true,
      isFetchingMore: 'previous',
      isSuccess: true,
    })
    expect(states[3]).toMatchObject({
      canFetchMore: true,
      data: [9, 10],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
  })

  it('should silently cancel any ongoing fetch when fetching more', async () => {
    const key = queryKey()
    const states: InfiniteQueryResult<number>[] = []

    function Page() {
      const start = 10
      const state = useInfiniteQuery(
        key,
        async (_key, page: number = start) => {
          await sleep(50)
          return page
        },
        {
          getFetchMore: (lastPage, _pages) => lastPage + 1,
        }
      )

      states.push(state)

      const { refetch, fetchMore } = state

      React.useEffect(() => {
        setTimeout(() => {
          refetch()
        }, 100)
        setTimeout(() => {
          fetchMore()
        }, 110)
      }, [fetchMore, refetch])

      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(5))

    expect(states[0]).toMatchObject({
      canFetchMore: undefined,
      data: undefined,
      isFetching: true,
      isFetchingMore: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      canFetchMore: true,
      data: [10],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
    expect(states[2]).toMatchObject({
      canFetchMore: true,
      data: [10],
      isFetching: true,
      isFetchingMore: false,
      isSuccess: true,
    })
    expect(states[3]).toMatchObject({
      canFetchMore: true,
      data: [10],
      isFetching: true,
      isFetchingMore: 'next',
      isSuccess: true,
    })
    expect(states[4]).toMatchObject({
      canFetchMore: true,
      data: [10, 11],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
  })

  it('should keep fetching first page when not loaded yet and triggering fetch more', async () => {
    const key = queryKey()
    const states: InfiniteQueryResult<number>[] = []

    function Page() {
      const start = 10
      const state = useInfiniteQuery(
        key,
        async (_key, page: number = start) => {
          await sleep(50)
          return page
        },
        {
          getFetchMore: (lastPage, _pages) => lastPage + 1,
        }
      )

      states.push(state)

      const { refetch, fetchMore } = state

      React.useEffect(() => {
        setTimeout(() => {
          fetchMore()
        }, 10)
      }, [fetchMore, refetch])

      return null
    }

    render(<Page />)

    await waitForMs(100)

    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({
      canFetchMore: undefined,
      data: undefined,
      isFetching: true,
      isFetchingMore: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      canFetchMore: true,
      data: [10],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
  })

  it('should be able to override the cursor in the fetchMore callback', async () => {
    const key = queryKey()
    const states: InfiniteQueryResult<number>[] = []

    function Page() {
      const state = useInfiniteQuery(
        key,
        async (_key, page: number = 0) => {
          await sleep(10)
          return page
        },
        {
          getFetchMore: (lastPage, _pages) => lastPage + 1,
        }
      )

      states.push(state)

      const { fetchMore } = state

      React.useEffect(() => {
        setTimeout(() => {
          fetchMore(5)
        }, 20)
      }, [fetchMore])

      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(4))

    expect(states[0]).toMatchObject({
      canFetchMore: undefined,
      data: undefined,
      isFetching: true,
      isFetchingMore: false,
      isSuccess: false,
    })
    expect(states[1]).toMatchObject({
      canFetchMore: true,
      data: [0],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
    expect(states[2]).toMatchObject({
      canFetchMore: true,
      data: [0],
      isFetching: true,
      isFetchingMore: 'next',
      isSuccess: true,
    })
    expect(states[3]).toMatchObject({
      canFetchMore: true,
      data: [0, 5],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
  })

  it('should be able to set new pages with the query cache', async () => {
    const key = queryKey()
    const states: InfiniteQueryResult<number>[] = []

    function Page() {
      const cache = useQueryCache()
      const [firstPage, setFirstPage] = React.useState(0)

      const state = useInfiniteQuery(
        key,
        async (_key, page: number = firstPage) => {
          await sleep(10)
          return page
        },
        {
          getFetchMore: (lastPage, _pages) => lastPage + 1,
        }
      )

      states.push(state)

      const { refetch } = state

      React.useEffect(() => {
        setTimeout(() => {
          cache.setQueryData(key, [7, 8])
          setFirstPage(7)
        }, 20)

        setTimeout(() => {
          refetch()
        }, 50)
      }, [cache, refetch])

      return null
    }

    render(<Page />)

    await waitFor(() => expect(states.length).toBe(6))

    expect(states[0]).toMatchObject({
      canFetchMore: undefined,
      data: undefined,
      isFetching: true,
      isFetchingMore: false,
      isSuccess: false,
    })
    // After first fetch
    expect(states[1]).toMatchObject({
      canFetchMore: true,
      data: [0],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
    // Update cache
    expect(states[2]).toMatchObject({
      canFetchMore: true,
      data: [7, 8],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
    // Set state
    expect(states[3]).toMatchObject({
      canFetchMore: true,
      data: [7, 8],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
    // Refetch
    expect(states[4]).toMatchObject({
      canFetchMore: true,
      data: [7, 8],
      isFetching: true,
      isFetchingMore: false,
      isSuccess: true,
    })
    // Refetch done
    expect(states[5]).toMatchObject({
      canFetchMore: true,
      data: [7, 8],
      isFetching: false,
      isFetchingMore: false,
      isSuccess: true,
    })
  })

  it('should allow you to fetch more pages', async () => {
    const key = queryKey()

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
      } = useInfiniteQuery<Result, Error, [string, number]>(
        key,
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

    fireEvent.click(rendered.getByText('Load More'))

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

  it('should compute canFetchMore correctly for falsy getFetchMore return value', async () => {
    const key = queryKey()

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
      } = useInfiniteQuery<Result, Error, [string, number]>(
        key,
        (_key, nextId = 0) => fetchItems(nextId, fetchCountRef.current++),
        {
          getFetchMore: (_lastGroup, _allGroups) => undefined,
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

    rendered.getByText('Nothing more to load')
  })

  it('should compute canFetchMore correctly using initialData', async () => {
    const key = queryKey()

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
      } = useInfiniteQuery<Result, Error, [string, number]>(
        key,
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

  it('should compute canFetchMore correctly for falsy getFetchMore return value using initialData', async () => {
    const key = queryKey()

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
      } = useInfiniteQuery<Result, Error, [string, number]>(
        key,
        (_key, nextId = 0) => fetchItems(nextId, fetchCountRef.current++),
        {
          initialData: [initialItems(0)],
          getFetchMore: (_lastGroup, _allGroups) => undefined,
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

    rendered.getByText('Nothing more to load')
  })

  it('should build fresh cursors on refetch', async () => {
    const key = queryKey()

    const genItems = (size: number) =>
      [...new Array(size)].fill(null).map((_, d) => d)
    const items = genItems(15)
    const limit = 3

    const fetchItemsWithLimit = async (cursor = 0, ts: number) => {
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
      } = useInfiniteQuery<Result, Error, [string, number]>(
        key,
        (_key, nextId = 0) =>
          fetchItemsWithLimit(nextId, fetchCountRef.current++),
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
                    queryCache.invalidateQueries(key)
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

  it('should compute canFetchMore correctly for falsy getFetchMore return value on refetching', async () => {
    const key = queryKey()
    const MAX = 2

    function Page() {
      const fetchCountRef = React.useRef(0)
      const [isRemovedLastPage, setIsRemovedLastPage] = React.useState<boolean>(
        false
      )
      const {
        status,
        data,
        error,
        isFetching,
        isFetchingMore,
        fetchMore,
        canFetchMore,
        refetch,
      } = useInfiniteQuery<Result, Error, [string, number]>(
        key,
        (_key, nextId = 0) =>
          fetchItems(
            nextId,
            fetchCountRef.current++,
            nextId === MAX || (nextId === MAX - 1 && isRemovedLastPage)
              ? false
              : undefined
          ),
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
                <button onClick={() => setIsRemovedLastPage(true)}>
                  Remove Last Page
                </button>
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

    fireEvent.click(rendered.getByText('Load More'))

    await waitFor(() => rendered.getByText('Loading more...'))

    await waitFor(() => {
      rendered.getByText('Item: 19')
      rendered.getByText('Page 0: 0')
      rendered.getByText('Page 1: 1')
    })

    fireEvent.click(rendered.getByText('Load More'))

    await waitFor(() => rendered.getByText('Loading more...'))

    await waitFor(() => {
      rendered.getByText('Item: 29')
      rendered.getByText('Page 0: 0')
      rendered.getByText('Page 1: 1')
      rendered.getByText('Page 2: 2')
    })

    rendered.getByText('Nothing more to load')

    fireEvent.click(rendered.getByText('Remove Last Page'))

    await waitForMs(10)

    fireEvent.click(rendered.getByText('Refetch'))

    await waitFor(() => rendered.getByText('Background Updating...'))

    await waitFor(() => {
      rendered.getByText('Page 0: 3')
      rendered.getByText('Page 1: 4')
    })

    expect(rendered.queryByText('Item: 29')).toBeNull()
    expect(rendered.queryByText('Page 2: 5')).toBeNull()

    rendered.getByText('Nothing more to load')
  })
})
