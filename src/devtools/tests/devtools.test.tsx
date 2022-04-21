import React from 'react'
import {
  fireEvent,
  screen,
  waitFor,
  act,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import '@testing-library/jest-dom'
import { useQuery } from '../..'
import {
  getByTextContent,
  renderWithClient,
  sleep,
  createQueryClient,
} from './utils'

describe('ReactQueryDevtools', () => {
  it('should be able to open and close devtools', async () => {
    const { queryClient } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery('check', async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />, { initialIsOpen: false })

    const closeButton = screen.queryByRole('button', {
      name: /close react query devtools/i,
    })
    expect(closeButton).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: /open react query devtools/i })
    )

    await waitForElementToBeRemoved(() =>
      screen.queryByRole('button', { name: /open react query devtools/i })
    )
    fireEvent.click(
      screen.getByRole('button', { name: /close react query devtools/i })
    )

    await screen.findByRole('button', { name: /open react query devtools/i })
  })

  it('should display the correct query states', async () => {
    const { queryClient, queryCache } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(
        'check',
        async () => {
          await sleep(100)
          return 'test'
        },
        { staleTime: 300 }
      )

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    function PageParent() {
      const [isPageVisible, togglePageVisible] = React.useReducer(
        visible => !visible,
        true
      )

      return (
        <div>
          <button
            type="button"
            aria-label="Toggle page visibility"
            onClick={togglePageVisible}
          >
            Toggle Page
          </button>
          {isPageVisible && <Page />}
        </div>
      )
    }

    renderWithClient(queryClient, <PageParent />)

    fireEvent.click(
      screen.getByRole('button', { name: /open react query devtools/i })
    )

    const currentQuery = queryCache.find('check')

    // When the query is fetching then expect number of
    // fetching queries to be 1
    expect(currentQuery?.isFetching()).toEqual(true)
    await screen.findByText(
      getByTextContent('fresh (0) fetching (1) stale (0) inactive (0)')
    )

    // When we are done fetching the query doesn't go stale
    // until 300ms after, so expect the number of fresh
    // queries to be 1
    await waitFor(() => {
      expect(currentQuery?.isFetching()).toEqual(false)
    })
    await screen.findByText(
      getByTextContent('fresh (1) fetching (0) stale (0) inactive (0)')
    )

    // Then wait for the query to go stale and then
    // expect the number of stale queries to be 1
    await waitFor(() => {
      expect(currentQuery?.isStale()).toEqual(false)
    })
    await screen.findByText(
      getByTextContent('fresh (0) fetching (0) stale (1) inactive (0)')
    )

    // Unmount the page component thus making the query inactive
    // and expect number of inactive queries to be 1
    fireEvent.click(
      screen.getByRole('button', { name: /toggle page visibility/i })
    )
    await screen.findByText(
      getByTextContent('fresh (0) fetching (0) stale (0) inactive (1)')
    )
  })

  it('should display the query hash and open the query details', async () => {
    const { queryClient, queryCache } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery('check', async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />)

    fireEvent.click(
      screen.getByRole('button', { name: /open react query devtools/i })
    )

    const currentQuery = queryCache.find('check')

    await screen.findByText(getByTextContent(`1${currentQuery?.queryHash}`))

    fireEvent.click(
      screen.getByRole('button', {
        name: `Open query details for ${currentQuery?.queryHash}`,
      })
    )

    await screen.findByText(/query details/i)
  })

  it('should filter the queries via the query hash', async () => {
    const { queryClient, queryCache } = createQueryClient()

    function Page() {
      const fooResult = useQuery('foo', async () => {
        await sleep(10)
        return 'foo-result'
      })

      const barResult = useQuery('bar', async () => {
        await sleep(10)
        return 'bar-result'
      })

      const bazResult = useQuery('baz', async () => {
        await sleep(10)
        return 'baz-result'
      })

      return (
        <div>
          <h1>
            {barResult.data} {fooResult.data} {bazResult.data}
          </h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />)

    fireEvent.click(
      screen.getByRole('button', { name: /open react query devtools/i })
    )

    const fooQueryHash = queryCache.find('foo')?.queryHash ?? 'invalid hash'
    const barQueryHash = queryCache.find('bar')?.queryHash ?? 'invalid hash'
    const bazQueryHash = queryCache.find('baz')?.queryHash ?? 'invalid hash'

    await screen.findByText(fooQueryHash)
    screen.getByText(barQueryHash)
    screen.getByText(bazQueryHash)

    const filterInput = screen.getByLabelText(/filter by queryhash/i)
    fireEvent.change(filterInput, { target: { value: 'fo' } })

    await screen.findByText(fooQueryHash)
    const barItem = screen.queryByText(barQueryHash)
    const bazItem = screen.queryByText(bazQueryHash)
    expect(barItem).toBeNull()
    expect(bazItem).toBeNull()

    fireEvent.change(filterInput, { target: { value: '' } })
  })

  it('should show a disabled label if all observers are disabled', async () => {
    const { queryClient } = createQueryClient()

    function Page() {
      const [enabled, setEnabled] = React.useState(false)
      const { data } = useQuery(
        'key',
        async () => {
          await sleep(10)
          return 'test'
        },
        {
          enabled,
        }
      )

      return (
        <div>
          <h1>{data}</h1>
          <button onClick={() => setEnabled(true)}>Enable Query</button>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />, { initialIsOpen: true })

    await screen.findByText(/disabled/i)

    await act(async () => {
      fireEvent.click(await screen.findByText(/enable query/i))
    })

    expect(screen.queryByText(/disabled/i)).not.toBeInTheDocument()
  })

  it('should not show a disabled label for inactive queries', async () => {
    const { queryClient } = createQueryClient()

    function Page() {
      const { data } = useQuery('key', () => Promise.resolve('test'), {
        enabled: false,
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    function App() {
      const [visible, setVisible] = React.useState(true)

      return (
        <div>
          {visible ? <Page /> : null}
          <button onClick={() => setVisible(false)}>Hide Query</button>
        </div>
      )
    }

    renderWithClient(queryClient, <App />, { initialIsOpen: true })

    await screen.findByText(/disabled/i)

    await act(async () => {
      fireEvent.click(await screen.findByText(/hide query/i))
    })

    expect(screen.queryByText(/disabled/i)).not.toBeInTheDocument()
  })

  it('should sort the queries according to the sorting filter', async () => {
    const { queryClient, queryCache } = createQueryClient()

    function Page() {
      const query1Result = useQuery('query-1', async () => {
        await sleep(20)
        return 'query-1-result'
      })

      const query2Result = useQuery('query-2', async () => {
        await sleep(60)
        return 'query-2-result'
      })

      const query3Result = useQuery(
        'query-3',
        async () => {
          await sleep(40)
          return 'query-3-result'
        },
        { staleTime: Infinity }
      )

      return (
        <div>
          <h1>
            {query1Result.data} {query2Result.data} {query3Result.data}
          </h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />)

    fireEvent.click(
      screen.getByRole('button', { name: /open react query devtools/i })
    )

    const query1Hash = queryCache.find('query-1')?.queryHash ?? 'invalid hash'
    const query2Hash = queryCache.find('query-2')?.queryHash ?? 'invalid hash'
    const query3Hash = queryCache.find('query-3')?.queryHash ?? 'invalid hash'

    const sortSelect = screen.getByLabelText(/sort queries/i)
    let queries = []

    // When sorted by query hash the queries get sorted according
    // to just the number, with the order being -> query-1, query-2, query-3
    fireEvent.change(sortSelect, { target: { value: 'Query Hash' } })

    /** To check the order of the queries we can use regex to find
     * all the row items in an array and then compare the items
     * one by one in the order we expect it
     * @reference https://github.com/testing-library/react-testing-library/issues/313#issuecomment-625294327
     */
    queries = await screen.findAllByText(/\["query-[1-3]"\]/)
    expect(queries[0]?.textContent).toEqual(query1Hash)
    expect(queries[1]?.textContent).toEqual(query2Hash)
    expect(queries[2]?.textContent).toEqual(query3Hash)

    // Wait for the queries to be resolved
    await sleep(70)

    // When sorted by the last updated date the queries are sorted by the time
    // they were updated and since the query-2 takes longest time to complete
    // and query-1 the shortest, so the order is -> query-2, query-3, query-1
    fireEvent.change(sortSelect, { target: { value: 'Last Updated' } })

    queries = await screen.findAllByText(/\["query-[1-3]"\]/)
    expect(queries[0]?.textContent).toEqual(query2Hash)
    expect(queries[1]?.textContent).toEqual(query3Hash)
    expect(queries[2]?.textContent).toEqual(query1Hash)

    // When sorted by the status and then last updated date the queries
    // query-3 takes precedence because its stale time being infinity, it
    // always remains fresh, the rest of the queries are sorted by their last
    // updated time, so the resulting order is -> query-3, query-2, query-1
    fireEvent.change(sortSelect, {
      target: { value: 'Status > Last Updated' },
    })

    queries = await screen.findAllByText(/\["query-[1-3]"\]/)
    expect(queries[0]?.textContent).toEqual(query3Hash)
    expect(queries[1]?.textContent).toEqual(query2Hash)
    expect(queries[2]?.textContent).toEqual(query1Hash)

    // Switch the order form ascending to descending and expect the
    // query order to be reversed from previous state
    fireEvent.click(screen.getByRole('button', { name: /⬆ asc/i }))

    queries = await screen.findAllByText(/\["query-[1-3]"\]/)
    expect(queries[0]?.textContent).toEqual(query1Hash)
    expect(queries[1]?.textContent).toEqual(query2Hash)
    expect(queries[2]?.textContent).toEqual(query3Hash)
  })

  it('style should have a nonce', async () => {
    const { queryClient } = createQueryClient()

    function Page() {
      return <div></div>
    }

    const { container } = renderWithClient(queryClient, <Page />, {
      styleNonce: 'test-nonce',
      initialIsOpen: false,
    })
    const styleTag = container.querySelector('style')
    expect(styleTag).toHaveAttribute('nonce', 'test-nonce')

    await screen.findByRole('button', { name: /react query devtools/i })
  })
})
