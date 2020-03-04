import {
  render,
  act,
  waitForElement,
  fireEvent,
  cleanup,
} from '@testing-library/react'
import * as React from 'react'

import { useQuery, queryCache } from '../index'
import { sleep } from './utils'

describe('useQuery', () => {
  afterEach(() => {
    queryCache.clear()
    cleanup()
  })

  // See https://github.com/tannerlinsley/react-query/issues/105
  it('should allow to set default data value', async () => {
    function Page() {
      const { data = 'default' } = useQuery('test', async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('default')

    // await waitForElement(() => rendered.getByText('test'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/137
  it('should not override initial data in dependent queries', async () => {
    function Page() {
      const [shouldFetch, setShouldFetch] = React.useState(false)

      const first = useQuery(shouldFetch && 'first', () => 'data', {
        initialData: 'init',
      })

      const second = useQuery(shouldFetch && 'second', () => 'data', {
        initialData: 'init',
      })

      return (
        <div>
          <h2>First Data: {first.data}</h2>
          <h2>Second Data: {second.data}</h2>
          {first.isStale ? (
            <button onClick={() => setShouldFetch(true)}>fetch</button>
          ) : null}
          <div>First Status: {first.status}</div>
          <div>Second Status: {second.status}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('First Data: init')
    rendered.getByText('Second Data: init')
    rendered.getByText('First Status: success')
    rendered.getByText('Second Status: success')
  })

  // See https://github.com/tannerlinsley/react-query/issues/170
  it('should start with status success if falsey query key is supplied', async () => {
    function Page() {
      const first = useQuery(false && 'first', () => 'data')
      const second = useQuery('second', () => 'data')

      return (
        <div>
          <div>First Status: {first.status}</div>
          <div>Second Status: {second.status}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    // use "act" to wait for state update and prevent console warning

    rendered.getByText('First Status: success')
    await waitForElement(() => rendered.getByText('Second Status: loading'))
    await waitForElement(() => rendered.getByText('Second Status: success'))
  })

  // See https://github.com/tannerlinsley/react-query/issues/144
  it('should be in "loading" state by default', async () => {
    function Page() {
      const { status } = useQuery('test', async () => {
        await sleep(10)
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
    expect(getByTestId('status').textContent).toBe('loading')
  })

  // See https://github.com/tannerlinsley/react-query/issues/144
  it('should be in "success" state by default in manual mode', async () => {
    function Page() {
      const { status } = useQuery(
        'test',
        async () => {
          await sleep(10)
          return 'test'
        },
        {
          manual: true,
        }
      )

      return (
        <div>
          <h1>{status}</h1>
        </div>
      )
    }

    const rendered = render(<Page />)

    rendered.getByText('success')
  })

  // See https://github.com/tannerlinsley/react-query/issues/147
  it('should not pass stringified variables to query function', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    const variables = { number: 5, boolean: false, object: {}, array: [] }

    function Page() {
      useQuery(['test', variables], queryFn)

      return null
    }

    render(<Page />)

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
        { retry: false }
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

  it('should retry specified number of times', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => {
      return Promise.reject('Error test')
    })

    function Page() {
      const { status, failureCount } = useQuery('test', queryFn, {
        retry: 1,
        retryDelay: 1,
      })

      return (
        <div>
          <h1>{status}</h1>
          <h2>Failed {failureCount} times</h2>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitForElement(() => rendered.getByText('loading'))
    await waitForElement(() => rendered.getByText('error'))

    // query should fail `retry + 1` times, since first time isn't a "retry"
    await waitForElement(() => rendered.getByText('Failed 2 times'))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should garbage collect queries without data immediately', async () => {
    function Page() {
      const [filter, setFilter] = React.useState('')
      const { data } = useQuery(
        ['todos', { filter }],
        async (key, { filter } = {}) => {
          await sleep(10)
          return `todo ${filter}`
        }
      )

      return (
        <div>
          <div>{data}</div>
          <button onClick={() => setFilter(filter + 'a')}>update</button>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitForElement(() => rendered.getByText('update'))

    fireEvent.click(rendered.getByText('update'))
    fireEvent.click(rendered.getByText('update'))
    fireEvent.click(rendered.getByText('update'))
    fireEvent.click(rendered.getByText('update'))

    expect(Object.keys(queryCache.queries).length).toEqual(5)

    await waitForElement(() => rendered.getByText('todo aaaa'))

    expect(Object.keys(queryCache.queries).length).toEqual(1)
  })

  // See https://github.com/tannerlinsley/react-query/issues/160
  it('should continue retry after focus regain', async () => {
    const originalVisibilityState = document.visibilityState

    function mockVisibilityState(value) {
      Object.defineProperty(document, 'visibilityState', {
        value,
        configurable: true,
      })
    }

    // make page unfocused
    mockVisibilityState('hidden')

    function Page() {
      const query = useQuery('test', () => Promise.reject('fetching error'), {
        retry: 3,
        retryDelay: 1,
      })

      return (
        <div>
          <div>status {query.status}</div>
          <div>failureCount {query.failureCount}</div>
        </div>
      )
    }

    const rendered = render(<Page />)

    await waitForElement(() => rendered.getByText('failureCount 1'))
    await waitForElement(() => rendered.getByText('status loading'))

    act(() => {
      // reset visibilityState to original value
      mockVisibilityState(originalVisibilityState)
      window.dispatchEvent(new Event('focus'))
    })

    await waitForElement(() => rendered.getByText('failureCount 4'))
    await waitForElement(() => rendered.getByText('status error'))
  })
})
