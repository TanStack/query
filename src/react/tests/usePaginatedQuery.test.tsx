import { render, fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'

import { sleep, queryKey } from './utils'
import { usePaginatedQuery, PaginatedQueryResult } from '../..'

describe('usePaginatedQuery', () => {
  it('should return the correct states for a successful query', async () => {
    const key = queryKey()
    const states: PaginatedQueryResult<number>[] = []

    function Page() {
      const state = usePaginatedQuery([key, 1], async (_, page: number) => {
        await sleep(10)
        return page
      })

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
      latestData: undefined,
      resolvedData: undefined,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      updatedAt: expect.any(Number),
    })

    expect(states[1]).toEqual({
      canFetchMore: undefined,
      clear: expect.any(Function),
      data: 1,
      error: null,
      failureCount: 0,
      fetchMore: expect.any(Function),
      isError: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isFetchingMore: false,
      isIdle: false,
      isInitialData: false,
      isLoading: false,
      isPreviousData: false,
      isPlaceholderData: false,
      isStale: true,
      isSuccess: true,
      latestData: 1,
      resolvedData: 1,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'success',
      updatedAt: expect.any(Number),
    })
  })

  it('should use previous page data while fetching the next page', async () => {
    const key = queryKey()

    function Page() {
      const [page, setPage] = React.useState(1)
      const { resolvedData = 'undefined' } = usePaginatedQuery(
        [key, page],
        async (_: string, pageArg: number) => {
          await sleep(10)
          return pageArg
        }
      )

      return (
        <div>
          <h1 data-testid="title">Data {resolvedData}</h1>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('Data undefined')
    await waitFor(() => rendered.getByText('Data 1'))

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data 1')
    await waitFor(() => rendered.getByText('Data 2'))

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data 2')
    await waitFor(() => rendered.getByText('Data 3'))
  })

  it('should use initialData only on the first page, then use previous page data while fetching the next page', async () => {
    const key = queryKey()

    function Page() {
      const [page, setPage] = React.useState(1)
      const params = { page }

      const { resolvedData } = usePaginatedQuery(
        [key, params],
        async (_: string, paramsArg: typeof params) => {
          await sleep(10)
          return paramsArg.page
        },
        { initialData: 0 }
      )

      return (
        <div>
          <h1 data-testid="title">Data {resolvedData}</h1>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('Data 0')

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data 0')
    await waitFor(() => rendered.getByText('Data 2'))

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data 2')
    await waitFor(() => rendered.getByText('Data 3'))

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data 3')
    await waitFor(() => rendered.getByText('Data 4'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/169
  it('should not trigger unnecessary loading state', async () => {
    const key = queryKey()

    function Page() {
      const [page, setPage] = React.useState(1)
      const params = { page }

      const { resolvedData, status } = usePaginatedQuery(
        [key, params],
        async (_: string, paramsArg: typeof params) => {
          await sleep(10)
          return paramsArg.page
        },
        { initialData: 0 }
      )

      return (
        <div>
          <h1 data-testid="title">Data {resolvedData}</h1>
          <h1 data-testid="status">{status}</h1>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('Data 0')

    fireEvent.click(rendered.getByText('next'))
    fireEvent.click(rendered.getByText('next'))
    fireEvent.click(rendered.getByText('next'))

    await waitFor(() => rendered.getByTestId('status'))

    rendered.getByText('success')
  })

  it('should clear resolvedData data when query is falsy', async () => {
    const key = queryKey()

    function Page() {
      const [searchTerm, setSearchTerm] = React.useState('')
      const [page, setPage] = React.useState(1)
      const { resolvedData = 'undefined' } = usePaginatedQuery(
        [key, searchTerm, page],
        async (_: string, searchTermArg: string, pageArg: number) => {
          await sleep(10)
          return `${searchTermArg} ${pageArg}`
        },
        {
          enabled: searchTerm,
          keepPreviousData: page !== 1,
        }
      )

      return (
        <div>
          <h1 data-testid="title">Data {resolvedData}</h1>
          <input
            name="searchTerm"
            placeholder="Enter a search term"
            value={searchTerm}
            onChange={e => setSearchTerm(e.currentTarget.value)}
          />
          <button
            onClick={() => {
              setSearchTerm('')
              setPage(1)
            }}
          >
            clear
          </button>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    fireEvent.change(rendered.getByPlaceholderText('Enter a search term'), {
      target: { value: 'first-search' },
    })
    rendered.getByText('Data undefined')
    await waitFor(() => rendered.getByText('Data first-search 1'))

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data first-search 1')
    await waitFor(() => rendered.getByText('Data first-search 2'))

    fireEvent.click(rendered.getByText('clear'))
    rendered.getByText('Data undefined')

    fireEvent.change(rendered.getByPlaceholderText('Enter a search term'), {
      target: { value: 'second-search' },
    })
    rendered.getByText('Data undefined')
    await waitFor(() => rendered.getByText('Data second-search 1'))

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data second-search 1')
    await waitFor(() => rendered.getByText('Data second-search 2'))
  })

  it('should not suspend while fetching the next page', async () => {
    const key = queryKey()

    function Page() {
      const [page, setPage] = React.useState(1)
      const params = { page }

      const { resolvedData } = usePaginatedQuery(
        [key, params],
        async (_: string, paramsArg: typeof params) => {
          await sleep(10)
          return paramsArg.page
        },
        {
          initialData: 0,
          suspense: true,
        }
      )

      return (
        <div>
          <h1 data-testid="title">Data {resolvedData}</h1>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    // render will throw if Page is suspended
    const rendered = render(<Page />)

    fireEvent.click(rendered.getByText('next'))
    await waitFor(() => rendered.getByText('Data 2'))
  })
})
