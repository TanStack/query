import * as React from 'react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import '@testing-library/jest-dom'
import { useQuery } from '@tanstack/react-query'
import UserEvent from '@testing-library/user-event'
import { defaultPanelSize, sortFns } from '../utils'
import {
  createQueryClient,
  getByTextContent,
  renderWithClient,
  sleep,
} from './utils'
import type { QueryClient } from '@tanstack/react-query'

// TODO: This should be removed with the types for react-error-boundary get updated.
declare module 'react-error-boundary' {
  interface ErrorBoundaryPropsWithFallback {
    children: any
  }
}

class CustomError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CustomError'
  }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('ReactQueryDevtools', () => {
  beforeEach(() => {
    localStorage.removeItem('reactQueryDevtoolsOpen')
    localStorage.removeItem('reactQueryDevtoolsPanelPosition')
  })
  it('should be able to open and close devtools', async () => {
    const { queryClient } = createQueryClient()
    const onCloseClick = jest.fn()
    const onToggleClick = jest.fn()

    function Page() {
      const { data = 'default' } = useQuery(['check'], async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />, {
      initialIsOpen: false,
      closeButtonProps: { onClick: onCloseClick },
      toggleButtonProps: { onClick: onToggleClick },
    })

    const verifyDevtoolsIsOpen = () => {
      expect(
        screen.queryByRole('generic', { name: /react query devtools panel/i }),
      ).not.toBeNull()
      expect(
        screen.queryByRole('button', { name: /open react query devtools/i }),
      ).toBeNull()
    }
    const verifyDevtoolsIsClosed = () => {
      expect(
        screen.queryByRole('generic', { name: /react query devtools panel/i }),
      ).toBeNull()
      expect(
        screen.queryByRole('button', { name: /open react query devtools/i }),
      ).not.toBeNull()
    }

    const waitForDevtoolsToOpen = () =>
      screen.findByRole('button', { name: /close react query devtools/i })
    const waitForDevtoolsToClose = () =>
      screen.findByRole('button', { name: /open react query devtools/i })

    const getOpenLogoButton = () =>
      screen.getByRole('button', { name: /open react query devtools/i })
    const getCloseLogoButton = () =>
      screen.getByRole('button', { name: /close react query devtools/i })
    const getCloseButton = () =>
      screen.getByRole('button', { name: /^close$/i })

    verifyDevtoolsIsClosed()

    fireEvent.click(getOpenLogoButton())
    await waitForDevtoolsToOpen()

    verifyDevtoolsIsOpen()

    fireEvent.click(getCloseLogoButton())
    await waitForDevtoolsToClose()

    verifyDevtoolsIsClosed()

    fireEvent.click(getOpenLogoButton())
    await waitForDevtoolsToOpen()

    verifyDevtoolsIsOpen()

    fireEvent.click(getCloseButton())
    await waitForDevtoolsToClose()

    verifyDevtoolsIsClosed()
  })

  it('should be able to drag devtools without error', async () => {
    const { queryClient } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(['check'], async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const result = renderWithClient(queryClient, <Page />, {
      initialIsOpen: false,
    })

    const draggableElement = result.container
      .querySelector('#ReactQueryDevtoolsPanel')
      ?.querySelector('div')

    if (!draggableElement) {
      throw new Error('Could not find the draggable element')
    }

    await act(async () => {
      fireEvent.mouseDown(draggableElement)
    })
  })

  it('should display the correct query states', async () => {
    const { queryClient, queryCache } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(
        ['check'],
        async () => {
          await sleep(100)
          return 'test'
        },
        { staleTime: 300 },
      )

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    function PageParent() {
      const [isPageVisible, togglePageVisible] = React.useReducer(
        (visible) => !visible,
        true,
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
      screen.getByRole('button', { name: /open react query devtools/i }),
    )

    const currentQuery = queryCache.find(['check'])

    // When the query is fetching then expect number of
    // fetching queries to be 1
    expect(currentQuery?.state.fetchStatus).toEqual('fetching')
    await screen.findByText(
      getByTextContent(
        'fresh (0) fetching (1) paused (0) stale (0) inactive (0)',
      ),
    )

    // When we are done fetching the query doesn't go stale
    // until 300ms after, so expect the number of fresh
    // queries to be 1
    await waitFor(() => {
      expect(currentQuery?.state.fetchStatus).toEqual('idle')
    })
    await screen.findByText(
      getByTextContent(
        'fresh (1) fetching (0) paused (0) stale (0) inactive (0)',
      ),
    )

    // Then wait for the query to go stale and then
    // expect the number of stale queries to be 1
    await waitFor(() => {
      expect(currentQuery?.isStale()).toEqual(false)
    })
    await screen.findByText(
      getByTextContent(
        'fresh (0) fetching (0) paused (0) stale (1) inactive (0)',
      ),
    )

    // Unmount the page component thus making the query inactive
    // and expect number of inactive queries to be 1
    fireEvent.click(
      screen.getByRole('button', { name: /toggle page visibility/i }),
    )
    await screen.findByText(
      getByTextContent(
        'fresh (0) fetching (0) paused (0) stale (0) inactive (1)',
      ),
    )
  })

  it('should display the query hash and open the query details', async () => {
    const { queryClient, queryCache } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(['check'], async () => {
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
      screen.getByRole('button', { name: /open react query devtools/i }),
    )

    const currentQuery = queryCache.find(['check'])

    await screen.findByText(getByTextContent(`1${currentQuery?.queryHash}`))

    const queryButton = await screen.findByRole('button', {
      name: `Open query details for ${currentQuery?.queryHash}`,
    })

    fireEvent.click(queryButton)

    await screen.findByText(/query details/i)
  })

  it('should filter the queries via the query hash', async () => {
    const { queryClient, queryCache } = createQueryClient()

    function Page() {
      const fooResult = useQuery(['foo'], async () => {
        await sleep(10)
        return 'foo-result'
      })

      const barResult = useQuery(['bar'], async () => {
        await sleep(10)
        return 'bar-result'
      })

      const bazResult = useQuery(['baz'], async () => {
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
      screen.getByRole('button', { name: /open react query devtools/i }),
    )

    const fooQueryHash = queryCache.find(['foo'])?.queryHash ?? 'invalid hash'
    const barQueryHash = queryCache.find(['bar'])?.queryHash ?? 'invalid hash'
    const bazQueryHash = queryCache.find(['baz'])?.queryHash ?? 'invalid hash'

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
        ['key'],
        async () => {
          await sleep(10)
          return 'test'
        },
        {
          enabled,
        },
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

    fireEvent.click(screen.getByRole('button', { name: /enable query/i }))

    await waitFor(() => {
      expect(screen.queryByText(/disabled/i)).not.toBeInTheDocument()
    })
  })

  it('should not show a disabled label for inactive queries', async () => {
    const { queryClient } = createQueryClient()

    function Page() {
      const { data } = useQuery(['key'], () => Promise.resolve('test'), {
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

    fireEvent.click(screen.getByRole('button', { name: /hide query/i }))

    await waitFor(() => {
      expect(screen.queryByText(/disabled/i)).not.toBeInTheDocument()
    })
  })

  it('should simulate offline mode', async () => {
    const { queryClient } = createQueryClient()
    let count = 0

    function App() {
      const { data, fetchStatus } = useQuery(['key'], () => {
        count++
        return Promise.resolve('test')
      })

      return (
        <div>
          <h1>
            {data}, {fetchStatus}
          </h1>
        </div>
      )
    }

    renderWithClient(queryClient, <App />, {
      initialIsOpen: true,
    })

    await screen.findByRole('heading', { name: /test/i })

    fireEvent.click(
      screen.getByRole('button', { name: /mock offline behavior/i }),
    )

    const queryButton = await screen.findByRole('button', {
      name: 'Open query details for ["key"]',
    })
    fireEvent.click(queryButton)

    const refetchButton = await screen.findByRole('button', {
      name: /refetch/i,
    })
    fireEvent.click(refetchButton)

    await waitFor(() => {
      expect(screen.getByText('test, paused')).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole('button', { name: /restore offline mock/i }),
    )

    await waitFor(() => {
      expect(screen.getByText('test, idle')).toBeInTheDocument()
    })

    expect(count).toBe(2)
  })

  it('should sort the queries according to the sorting filter', async () => {
    const { queryClient, queryCache } = createQueryClient()

    function Page() {
      const query1Result = useQuery(['query-1'], async () => {
        await sleep(20)
        return 'query-1-result'
      })

      const query3Result = useQuery(
        ['query-3'],
        async () => {
          await sleep(10)
          return 'query-3-result'
        },
        { staleTime: Infinity, enabled: typeof query1Result.data === 'string' },
      )

      const query2Result = useQuery(
        ['query-2'],
        async () => {
          await sleep(10)
          return 'query-2-result'
        },
        {
          enabled: typeof query3Result.data === 'string',
        },
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
      screen.getByRole('button', { name: /open react query devtools/i }),
    )

    const query1Hash = queryCache.find(['query-1'])?.queryHash ?? 'invalid hash'
    const query2Hash = queryCache.find(['query-2'])?.queryHash ?? 'invalid hash'
    const query3Hash = queryCache.find(['query-3'])?.queryHash ?? 'invalid hash'

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
    await screen.findByText(/query-1-result query-2-result query-3-result/i)

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

  it('should initialize filtering and sorting values with defaults when they are not stored in localstorage', () => {
    localStorage.removeItem('reactQueryDevtoolsBaseSort')
    localStorage.removeItem('reactQueryDevtoolsSortFn')
    localStorage.removeItem('reactQueryDevtoolsFilter')

    const { queryClient } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(['check'], async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />, {
      initialIsOpen: true,
    })

    const filterInput: HTMLInputElement =
      screen.getByLabelText(/Filter by queryhash/i)
    expect(filterInput.value).toEqual('')

    const sortCombobox: HTMLSelectElement =
      screen.getByLabelText(/Sort queries/i)
    expect(sortCombobox.value).toEqual(Object.keys(sortFns)[0])

    expect(screen.getByRole('button', { name: /Asc/i })).toBeInTheDocument()

    const detailsPanel = screen.queryByText(/Query Details/i)
    expect(detailsPanel).not.toBeInTheDocument()
  })

  it('should initialize sorting values with ones stored in localstorage', async () => {
    localStorage.setItem('reactQueryDevtoolsBaseSort', 'true')
    localStorage.setItem(
      'reactQueryDevtoolsSortFn',
      JSON.stringify(Object.keys(sortFns)[1]),
    )

    const { queryClient } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(['check'], async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />, {
      initialIsOpen: true,
    })

    const sortCombobox: HTMLSelectElement =
      screen.getByLabelText(/Sort queries/i)
    expect(sortCombobox.value).toEqual(Object.keys(sortFns)[1])

    expect(screen.getByRole('button', { name: /Desc/i })).toBeInTheDocument()
  })

  it('should initialize filter value with one stored in localstorage', () => {
    localStorage.setItem('reactQueryDevtoolsFilter', JSON.stringify('posts'))

    const { queryClient } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(['check'], async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />, {
      initialIsOpen: true,
    })

    const filterInput: HTMLInputElement =
      screen.getByLabelText(/Filter by queryhash/i)
    expect(filterInput.value).toEqual('posts')
  })

  it('should not show queries after clear', async () => {
    const { queryClient, queryCache } = createQueryClient()

    function Page() {
      const query1Result = useQuery(['query-1'], async () => {
        return 'query-1-result'
      })
      const query2Result = useQuery(['query-2'], async () => {
        return 'query-2-result'
      })
      const query3Result = useQuery(['query-3'], async () => {
        return 'query-3-result'
      })

      return (
        <div>
          <h1>
            {query1Result.data} {query2Result.data} {query3Result.data}{' '}
          </h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />)

    fireEvent.click(
      screen.getByRole('button', { name: /open react query devtools/i }),
    )

    expect(queryCache.getAll()).toHaveLength(3)

    const clearButton = screen.getByLabelText(/clear/i)
    fireEvent.click(clearButton)

    expect(queryCache.getAll()).toHaveLength(0)
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

  describe('with custom context', () => {
    it('should render without error when the custom context aligns', async () => {
      const context = React.createContext<QueryClient | undefined>(undefined)
      const { queryClient } = createQueryClient()

      function Page() {
        const { data = 'default' } = useQuery(['check'], async () => 'test', {
          context,
        })

        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      renderWithClient(queryClient, <Page />, {
        initialIsOpen: false,
        context,
      })

      await screen.findByRole('button', { name: /open react query devtools/i })
    })

    it('should render with error when the custom context is not passed to useQuery', async () => {
      const consoleErrorMock = jest.spyOn(console, 'error')
      consoleErrorMock.mockImplementation(() => undefined)

      const context = React.createContext<QueryClient | undefined>(undefined)
      const { queryClient } = createQueryClient()

      function Page() {
        const { data = 'default' } = useQuery(['check'], async () => 'test', {
          useErrorBoundary: true,
        })

        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = renderWithClient(
        queryClient,
        <ErrorBoundary fallbackRender={() => <div>error boundary</div>}>
          <Page />
        </ErrorBoundary>,
        {
          initialIsOpen: false,
          context,
        },
      )

      await waitFor(() => rendered.getByText('error boundary'))

      consoleErrorMock.mockRestore()
    })

    it('should render with error when the custom context is not passed to ReactQueryDevtools', async () => {
      const consoleErrorMock = jest.spyOn(console, 'error')
      consoleErrorMock.mockImplementation(() => undefined)

      const context = React.createContext<QueryClient | undefined>(undefined)
      const { queryClient } = createQueryClient()

      function Page() {
        const { data = 'default' } = useQuery(['check'], async () => 'test', {
          useErrorBoundary: true,
          context,
        })

        return (
          <div>
            <h1>{data}</h1>
          </div>
        )
      }

      const rendered = renderWithClient(
        queryClient,
        <ErrorBoundary fallbackRender={() => <div>error boundary</div>}>
          <Page />
        </ErrorBoundary>,
        {
          initialIsOpen: false,
        },
      )

      await waitFor(() => rendered.getByText('error boundary'))

      consoleErrorMock.mockRestore()
    })
  })

  it('should render a menu to select panel position', async () => {
    const { queryClient } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(['check'], async () => 'test')

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />, {
      initialIsOpen: true,
    })

    const positionSelect = (await screen.findByLabelText(
      'Panel position',
    )) as HTMLSelectElement

    expect(positionSelect.value).toBe('bottom')
  })

  it(`should render the panel to the left if panelPosition is set to 'left'`, async () => {
    const { queryClient } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(['check'], async () => 'test')

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />, {
      initialIsOpen: true,
      panelPosition: 'left',
    })

    const positionSelect = (await screen.findByLabelText(
      'Panel position',
    )) as HTMLSelectElement

    expect(positionSelect.value).toBe('left')

    const panel = (await screen.getByLabelText(
      'React Query Devtools Panel',
    )) as HTMLDivElement

    expect(panel.style.left).toBe('0px')
    expect(panel.style.width).toBe('500px')
    expect(panel.style.height).toBe('100vh')
  })

  it('should change the panel position if user select different option from the menu', async () => {
    const { queryClient } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(['check'], async () => 'test')

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <Page />, {
      initialIsOpen: true,
    })

    const positionSelect = (await screen.findByLabelText(
      'Panel position',
    )) as HTMLSelectElement

    expect(positionSelect.value).toBe('bottom')

    const panel = (await screen.getByLabelText(
      'React Query Devtools Panel',
    )) as HTMLDivElement

    expect(panel.style.bottom).toBe('0px')
    expect(panel.style.height).toBe('500px')
    expect(panel.style.width).toBe('100%')

    await act(async () => {
      fireEvent.change(positionSelect, { target: { value: 'right' } })
    })

    expect(positionSelect.value).toBe('right')

    expect(panel.style.right).toBe('0px')
    expect(panel.style.width).toBe('500px')
    expect(panel.style.height).toBe('100vh')
  })

  it('should restore parent element padding after closing', async () => {
    const { queryClient } = createQueryClient()

    function Page() {
      const { data = 'default' } = useQuery(['check'], async () => 'test')

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const parentElementTestid = 'parentElement'
    const parentPaddings = {
      paddingTop: '428px',
      paddingBottom: '39px',
      paddingLeft: '-373px',
      paddingRight: '20%',
    }

    function Parent({ children }: { children: React.ReactElement }) {
      return (
        <div data-testid={parentElementTestid} style={parentPaddings}>
          {children}
        </div>
      )
    }

    renderWithClient(
      queryClient,
      <Page />,
      {
        initialIsOpen: true,
        panelPosition: 'bottom',
      },
      { wrapper: Parent },
    )

    const parentElement = screen.getByTestId(parentElementTestid)
    expect(parentElement).toHaveStyle({
      paddingTop: '0px',
      paddingLeft: '0px',
      paddingRight: '0px',
      paddingBottom: defaultPanelSize,
    })

    fireEvent.click(screen.getByRole('button', { name: /^close$/i }))
    expect(parentElement).toHaveStyle(parentPaddings)
  })

  it('should simulate loading state', async () => {
    const { queryClient } = createQueryClient()
    let count = 0
    function App() {
      const { data, fetchStatus } = useQuery(['key'], () => {
        count++
        return Promise.resolve('test')
      })

      return (
        <div>
          <h1>
            {data ?? 'No data'}, {fetchStatus}
          </h1>
        </div>
      )
    }

    renderWithClient(queryClient, <App />, {
      initialIsOpen: true,
    })

    await screen.findByRole('heading', { name: /test/i })

    const loadingButton = await screen.findByRole('button', {
      name: 'Trigger loading',
    })
    fireEvent.click(loadingButton)

    await waitFor(() => {
      expect(screen.getByText('Restore loading')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('No data, fetching')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /restore loading/i }))

    await waitFor(() => {
      expect(screen.getByText('test, idle')).toBeInTheDocument()
    })

    expect(count).toBe(2)
  })

  it('should simulate error state', async () => {
    const { queryClient } = createQueryClient()
    function App() {
      const { status, error } = useQuery(['key'], () => {
        return Promise.resolve('test')
      })

      return (
        <div>
          <h1>
            {!!error ? 'Some error' : 'No error'}, {status}
          </h1>
        </div>
      )
    }

    renderWithClient(queryClient, <App />, {
      initialIsOpen: true,
    })

    const errorButton = await screen.findByRole('button', {
      name: 'Trigger error',
    })
    fireEvent.click(errorButton)

    await waitFor(() => {
      expect(screen.getByText('Restore error')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Some error, error')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Restore error/i }))

    await waitFor(() => {
      expect(screen.getByText('No error, success')).toBeInTheDocument()
    })
  })

  it('should can simulate a specific error', async () => {
    const { queryClient } = createQueryClient()

    function App() {
      const { status, error } = useQuery(['key'], () => {
        return Promise.resolve('test')
      })

      return (
        <div data-testid="test">
          <h1>
            {error instanceof CustomError
              ? error.message.toString()
              : 'No error'}
            , {status}
          </h1>
        </div>
      )
    }

    renderWithClient(queryClient, <App />, {
      initialIsOpen: true,
      errorTypes: [
        {
          name: 'error1',
          initializer: () => new CustomError('error1'),
        },
      ],
    })

    const errorOption = await screen.findByLabelText('Trigger error:')

    UserEvent.selectOptions(errorOption, 'error1')

    await waitFor(() => {
      expect(screen.getByText('error1, error')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Restore error/i }))

    await waitFor(() => {
      expect(screen.getByText('No error, success')).toBeInTheDocument()
    })
  })

  it('should not refetch when already restoring a query', async () => {
    const { queryClient } = createQueryClient()

    let count = 0
    let resolvePromise: (value: unknown) => void = () => undefined

    function App() {
      const { data } = useQuery(['key'], () => {
        count++

        // Resolve the promise immediately when
        // the query is fetched for the first time
        if (count === 1) {
          return Promise.resolve('test')
        }

        return new Promise((resolve) => {
          // Do not resolve immediately and store the
          // resolve function to resolve the promise later
          resolvePromise = resolve
        })
      })

      return (
        <div>
          <h1>{typeof data === 'string' ? data : 'No data'}</h1>
        </div>
      )
    }

    renderWithClient(queryClient, <App />, {
      initialIsOpen: true,
    })

    const loadingButton = await screen.findByRole('button', {
      name: 'Trigger loading',
    })
    fireEvent.click(loadingButton)

    await waitFor(() => {
      expect(screen.getByText('Restore loading')).toBeInTheDocument()
    })

    // Click the restore loading button twice and only resolve query promise
    // after the second click.
    fireEvent.click(screen.getByRole('button', { name: /restore loading/i }))
    fireEvent.click(screen.getByRole('button', { name: /restore loading/i }))
    resolvePromise('test')

    expect(count).toBe(2)
  })
})
