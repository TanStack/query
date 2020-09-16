import { render, fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'

import { sleep, queryKey, mockConsoleError } from './utils'
import { useQuery, useIsFetching } from '../..'

describe('useIsFetching', () => {
  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should update as queries start and stop fetching', async () => {
    const key = queryKey()

    function Page() {
      const [ready, setReady] = React.useState(false)

      const isFetching = useIsFetching()

      useQuery(
        key,
        async () => {
          await sleep(1000)
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

    const rendered = render(<Page />)

    await waitFor(() => rendered.getByText('isFetching: 0'))
    fireEvent.click(rendered.getByText('setReady'))
    await waitFor(() => rendered.getByText('isFetching: 1'))
    await waitFor(() => rendered.getByText('isFetching: 0'))
  })

  it('should not update state while rendering', async () => {
    const consoleMock = mockConsoleError()

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
        setTimeout(() => {
          setRenderSecond(true)
        }, 10)
      }, [])

      return (
        <>
          <FirstQuery />
          {renderSecond && <SecondQuery />}
          <IsFetching />
        </>
      )
    }

    render(<Page />)
    await waitFor(() => expect(isFetchings).toEqual([1, 1, 2, 1, 0]))
    expect(consoleMock).not.toHaveBeenCalled()
    expect(consoleMock.mock.calls[0]?.[0] ?? '').not.toMatch('setState')

    consoleMock.mockRestore()
  })
})
