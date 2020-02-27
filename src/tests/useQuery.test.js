import { cleanup, render, act, waitForElement } from '@testing-library/react'
import * as React from 'react'

import { useQuery, queryCache, statusLoading, statusSuccess } from '../index'
import { sleep } from './utils'

describe('useQuery', () => {
  afterEach(() => {
    cleanup()
    queryCache.clear()
  })

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should allow to set default data value', async () => {
    function Page() {
      const { data = 'default' } = useQuery('test', async () => {
        await sleep(1000)
        return 'test'
      })

      return (
        <div>
          <h1 data-testid="title">{data}</h1>
        </div>
      )
    }

    const { getByTestId } = render(<Page />)

    await waitForElement(() => getByTestId('title'))
    expect(getByTestId('title').textContent).toBe('default')
  })

  // See https://github.com/tannerlinsley/react-query/issues/137
  it('should not override initial data in dependent queries', async () => {
    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState(false)

      const { data: first, isStale } = useQuery(
        shouldFetch && 'first',
        () => 'first data',
        {
          initialData: 'first init',
        }
      )

      const { data: second } = useQuery(
        shouldFetch && 'second',
        () => 'second data',
        {
          initialData: 'second init',
        }
      )

      return (
        <div>
          <h2>{first}</h2>
          <h2>{second}</h2>
          {isStale ? (
            <button onClick={() => setShouldFetch(true)}>fetch</button>
          ) : null}
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('first init')
    rendered.getByText('second init')
  })

  // See https://github.com/tannerlinsley/react-query/issues/144
  it('should be in "loading" state by default', async () => {
    function Page() {
      const { status } = useQuery('test', async () => {
        await sleep(1000)
        return 'test'
      })

      return (
        <div>
          <h1 data-testid="status">{status}</h1>
        </div>
      )
    }

    const { getByTestId } = render(<Page />)

    await waitForElement(() => getByTestId('status'))
    expect(getByTestId('status').textContent).toBe(statusLoading)
  })

  // See https://github.com/tannerlinsley/react-query/issues/144
  it('should be in "success" state by default in manual mode', async () => {
    function Page() {
      const { status } = useQuery(
        'test',
        async () => {
          await sleep(1000)
          return 'test'
        },
        {
          manual: true,
        }
      )

      return (
        <div>
          <h1 data-testid="status">{status}</h1>
        </div>
      )
    }

    const { getByTestId } = render(<Page />)

    await waitForElement(() => getByTestId('status'))
    expect(getByTestId('status').textContent).toBe(statusSuccess)
  })

  // See https://github.com/tannerlinsley/react-query/issues/147
  it('should not pass stringified variables to query function', async () => {
    const queryFn = jest.fn()
    const promise = Promise.resolve()
    queryFn.mockImplementation(() => promise)

    const variables = { number: 5, boolean: false, object: {}, array: [] }

    function Page() {
      useQuery(['test', variables], queryFn)

      return null
    }

    render(<Page />)

    // use "act" to wait for state update and prevent console warning
    await act(() => promise)

    expect(queryFn).toHaveBeenCalledWith('test', variables)
  })

  // See https://github.com/tannerlinsley/react-query/issues/161
  it('should not fetch query when `manual` is set to `true`', async () => {
    const queryFn = jest.fn()

    function Page() {
      const { data = 'default' } = useQuery('test', queryFn, { manual: true })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)
    await waitForElement(() => rendered.getByText('default'))
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should set status to error if queryFn throws', async () => {
    function Page() {
      const { status } = useQuery(
        'test',
        () => {
          return Promise.reject('Error test')
        },
        { retry: false },
      )

      return (
        <div>
          <h1>{status}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitForElement(() => rendered.getByText('error'))
  })
})
