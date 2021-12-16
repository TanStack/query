import { fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

import { queryKey, renderWithClient, setActTimeout, sleep } from './utils'
import { useQuery, useIsFetching, QueryClient, QueryCache } from '../..'

describe('useIsFetching', () => {
  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should update as queries start and stop fetching', async () => {
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
    const key = queryKey()

    function Page() {
      const [ready, setReady] = React.useState(false)

      const isFetching = useIsFetching()

      useQuery(
        key,
        async () => {
          await sleep(50)
          return 'test'
        },
        {
          enabled: ready,
        }
      )

      return (
        <div>
          <div>isFetching: {isFetching}</div>
          <button onClick={() => setReady(true)}>setReady</button>
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
    const queryClient = new QueryClient({ queryCache })

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
    const queryCache = new QueryCache()
    const queryClient = new QueryClient({ queryCache })
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

      React.useEffect(() => {
        setActTimeout(() => {
          setStarted(true)
        }, 5)
      }, [])

      if (!started) {
        return null
      }

      return (
        <div>
          <One />
          <Two />
        </div>
      )
    }

    renderWithClient(queryClient, <Page />)

    await sleep(100)
    expect(isFetchings).toEqual([0, 0, 1, 0])
  })
})
