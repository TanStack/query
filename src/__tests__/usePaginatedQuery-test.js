import {
  cleanup,
  render,
  fireEvent,
  waitForElement,
} from '@testing-library/react'
import * as React from 'react'

import { usePaginatedQuery, queryCache } from '../index'
import { sleep } from './utils'

describe('usePaginatedQuery', () => {
  afterEach(() => {
    cleanup();
    queryCache.clear();
  })

  it('should use previous page data before next page is fetched', async () => {
    function Page() {
      const [page, setPage] = React.useState(1);
      const { resolvedData } = usePaginatedQuery(
        ['data', page],
        async (queryName, page) => {
          sleep(1000);
          return page;
        },
      )

      return (
        <div>
          <h1 data-testid="title">{resolvedData}</h1>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    const { getByTestId, getByText } = render(<Page />)

    await waitForElement(() => getByTestId('title'))
    expect(getByTestId('title').textContent).toBe('1')

    fireEvent.click(getByText('next'))
    await waitForElement(() => getByTestId('title'))
    expect(getByTestId('title').textContent).toBe('2')


    fireEvent.click(getByText('next'))
    await waitForElement(() => getByTestId('title'))
    expect(getByTestId('title').textContent).toBe('3')
  })

  it('should use previous page data before next page is fetched when initialData provided', async () => {
    function Page() {
      const [page, setPage] = React.useState(1);

      const { resolvedData } = usePaginatedQuery(
        ['data', { page }],
        async (queryName, { page }) => {
          sleep(1000);
          return page;
        },
        { initialData: 1 }
      )

      return (
        <div>
          <h1 data-testid="title">{resolvedData}</h1>
          <button onClick={() => setPage(page + 1)}>next</button>
        </div>
      )
    }

    const { getByTestId, getByText } = render(<Page />)

    await waitForElement(() => getByTestId('title'))
    expect(getByTestId('title').textContent).toBe('1')

    fireEvent.click(getByText('next'))
    await waitForElement(() => getByTestId('title'))
    expect(getByTestId('title').textContent).toBe('2')

    fireEvent.click(getByText('next'))
    await waitForElement(() => getByTestId('title'))
    expect(getByTestId('title').textContent).toBe('3')
  })
})
