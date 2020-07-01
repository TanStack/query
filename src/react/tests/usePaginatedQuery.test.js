import { render, fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'
import { sleep } from './utils'

import { usePaginatedQuery, queryCaches } from '../index'

describe('usePaginatedQuery', () => {
  afterEach(() => {
    queryCaches.forEach(cache => cache.clear({ notify: false }))
  })

  it('should use previous page data while fetching the next page', async () => {
    function Page() {
      const [page, setPage] = React.useState(1)
      const { resolvedData = 'undefined' } = usePaginatedQuery(
        ['data', page],
        async (queryName, page) => {
          await sleep(10)
          return page
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
    function Page() {
      const [page, setPage] = React.useState(1)

      const { resolvedData } = usePaginatedQuery(
        ['data', { page }],
        async (queryName, { page }) => {
          await sleep(10)
          return page
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
    function Page() {
      const [page, setPage] = React.useState(1)

      const { resolvedData, status } = usePaginatedQuery(
        ['data', { page }],
        async (queryName, { page }) => {
          await sleep(10)
          return page
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
    function Page() {
      const [searchTerm, setSearchTerm] = React.useState('')
      const [page, setPage] = React.useState(1)
      const { resolvedData = 'undefined' } = usePaginatedQuery(
        ['data', searchTerm, page],
        async (queryName, searchTerm, page) => {
          await sleep(10)
          return `${searchTerm} ${page}`
        },
        {
          enabled: searchTerm,
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
    function Page() {
      const [page, setPage] = React.useState(1)

      const { resolvedData } = usePaginatedQuery(
        ['data', { page }],
        async (queryName, { page }) => {
          await sleep(10)
          return page
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
