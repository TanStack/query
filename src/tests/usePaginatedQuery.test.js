import {
  cleanup,
  render,
  fireEvent,
  waitForElement,
} from '@testing-library/react'
import * as React from 'react'
import { sleep } from './utils'

import { usePaginatedQuery, queryCache } from '../index'

describe('usePaginatedQuery', () => {
  afterEach(() => {
    cleanup()
    queryCache.clear()
  })

  it('should use previous page data while fetching the next page', async () => {
    function Page() {
      const [page, setPage] = React.useState(1)
      const { resolvedData = 'undefined' } = usePaginatedQuery(
        ['data', page],
        async (queryName, page) => {
          await sleep(1)
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
    await waitForElement(() => rendered.getByText('Data 1'))

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data 1')
    await waitForElement(() => rendered.getByText('Data 2'))

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data 2')
    await waitForElement(() => rendered.getByText('Data 3'))
  })

  it('should use initialData only on the first page, then use previous page data while fetching the next page', async () => {
    function Page() {
      const [page, setPage] = React.useState(1)

      const { resolvedData } = usePaginatedQuery(
        ['data', { page }],
        async (queryName, { page }) => {
          await sleep(1)
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
    await waitForElement(() => rendered.getByText('Data 2'))

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data 2')
    await waitForElement(() => rendered.getByText('Data 3'))

    fireEvent.click(rendered.getByText('next'))
    rendered.getByText('Data 3')
    await waitForElement(() => rendered.getByText('Data 4'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/169
  it('should not trigger unnecessary loading state', async () => {
    function Page() {
      const [page, setPage] = React.useState(1)

      const { resolvedData, status } = usePaginatedQuery(
        ['data', { page }],
        async (queryName, { page }) => {
          await sleep(1)
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

    await waitForElement(() => rendered.getByTestId('status'))
    expect(rendered.getByTestId('status').textContent).toBe('success')
    expect(rendered.getByTestId('status').textContent).not.toBe('loading')
  })
})
