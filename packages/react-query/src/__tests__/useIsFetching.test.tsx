import { fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { QueryCache, useIsFetching, useQuery } from '..'
import {
  createQueryClient,
  queryKey,
  renderWithClient,
  setActTimeout,
  sleep,
} from './utils'
import type { QueryClient } from '..'

describe('useIsFetching', () => {
  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should update as queries start and stop fetching', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })
    const key = queryKey()

    function IsFetching() {
      const isFetching = useIsFetching()
      return <div>isFetching: {isFetching}</div>
    }

    function Query() {
      const [ready, setReady] = React.useState(false)

      useQuery(
        key,
        async () => {
          await sleep(50)
          return 'test'
        },
        {
          enabled: ready,
        },
      )

      return <button onClick={() => setReady(true)}>setReady</button>
    }

    function Page() {
      return (
        <div>
          <IsFetching />
          <Query />
        </div>
      )
    }

    const { findByText, getByRole } = renderWithClient(queryClient, <Page />)

    await findByText('isFetching: 0')
    fireEvent.click(getByRole('button', { name: /setReady/i }))
    await findByText('isFetching: 1')
    await findByText('isFetching: 0')
  })

  it('should not update state while rendering', async () => {
    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    const key1 = queryKey()
    const key2 = queryKey()

    const isFetchings: number[] = []

    function IsFetching() {
      const isFetching = useIsFetching()
      isFetchings.push(isFetching)
      return null
    }

    function FirstQuery() {
      useQuery(key1, async () => {
        await sleep(100)
        return 'data'
      })
      return null
    }

    function SecondQuery() {
      useQuery(key2, async () => {
        await sleep(100)
        return 'data'
      })
      return null
    }

    function Page() {
      const [renderSecond, setRenderSecond] = React.useState(false)

      React.useEffect(() => {
        setActTimeout(() => {
          setRenderSecond(true)
        }, 50)
      }, [])

      return (
        <>
          <IsFetching />
          <FirstQuery />
          {renderSecond && <SecondQuery />}
        </>
      )
    }

    renderWithClient(queryClient, <Page />)
    await waitFor(() => expect(isFetchings).toEqual([0, 1, 1, 2, 1, 0]))
  })

  it('should be able to filter', async () => {
    const queryClient = createQueryClient()
    const key1 = queryKey()
    const key2 = queryKey()

    const isFetchings: number[] = []

    function One() {
      useQuery(key1, async () => {
        await sleep(10)
        return 'test'
      })
      return null
    }

    function Two() {
      useQuery(key2, async () => {
        await sleep(20)
        return 'test'
      })
      return null
    }

    function Page() {
      const [started, setStarted] = React.useState(false)
      const isFetching = useIsFetching(key1)

      isFetchings.push(isFetching)

      return (
        <div>
          <button onClick={() => setStarted(true)}>setStarted</button>
          <div>isFetching: {isFetching}</div>
          {started ? (
            <>
              <One />
              <Two />
            </>
          ) : null}
        </div>
      )
    }

    const { findByText, getByRole } = renderWithClient(queryClient, <Page />)

    await findByText('isFetching: 0')
    fireEvent.click(getByRole('button', { name: /setStarted/i }))
    await findByText('isFetching: 1')
    await findByText('isFetching: 0')
    // at no point should we have isFetching: 2
    expect(isFetchings).toEqual(expect.not.arrayContaining([2]))
  })

  describe('with custom context', () => {
    it('should update as queries start and stop fetching', async () => {
      const context = React.createContext<QueryClient | undefined>(undefined)

      const queryCache = new QueryCache()
      const queryClient = createQueryClient({ queryCache })
      const key = queryKey()

      function Page() {
        const [ready, setReady] = React.useState(false)

        const isFetching = useIsFetching(undefined, { context: context })

        useQuery(
          key,
          async () => {
            await sleep(50)
            return 'test'
          },
          {
            enabled: ready,
            context,
          },
        )

        return (
          <div>
            <div>isFetching: {isFetching}</div>
            <button onClick={() => setReady(true)}>setReady</button>
          </div>
        )
      }

      const { findByText, getByRole } = renderWithClient(
        queryClient,
        <Page />,
        {
          context,
        },
      )

      await findByText('isFetching: 0')
      fireEvent.click(getByRole('button', { name: /setReady/i }))
      await findByText('isFetching: 1')
      await findByText('isFetching: 0')
    })

    it('should throw if the context is not passed to useIsFetching', async () => {
      const context = React.createContext<QueryClient | undefined>(undefined)

      const queryCache = new QueryCache()
      const queryClient = createQueryClient({ queryCache })
      const key = queryKey()

      function Page() {
        const isFetching = useIsFetching()

        useQuery(key, async () => 'test', {
          enabled: true,
          context,
          useErrorBoundary: true,
        })

        return (
          <div>
            <div>isFetching: {isFetching}</div>
          </div>
        )
      }

      const rendered = renderWithClient(
        queryClient,
        <ErrorBoundary fallbackRender={() => <div>error boundary</div>}>
          <Page />
        </ErrorBoundary>,
        {
          context,
        },
      )

      await waitFor(() => rendered.getByText('error boundary'))
    })
  })

  it('should show the correct fetching state when mounted after a query', async () => {
    const queryClient = createQueryClient()
    const key = queryKey()

    function Page() {
      useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      const isFetching = useIsFetching()

      return (
        <div>
          <div>isFetching: {isFetching}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await rendered.findByText('isFetching: 1')
    await rendered.findByText('isFetching: 0')
  })
})
