import { render, waitFor, fireEvent, act } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import * as React from 'react'

import { useQuery, queryCache, queryCaches } from '../index'
import { sleep } from './utils'

describe("useQuery's in Suspense mode", () => {
  afterEach(() => {
    queryCaches.forEach(cache => cache.clear({ notify: false }))
  })

  it('should not call the queryFn twice when used in Suspense mode', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    function Page() {
      useQuery(['test'], queryFn, { suspense: true })

      return 'rendered'
    }

    const rendered = render(
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    await waitFor(() => rendered.getByText('rendered'))

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const QUERY_KEY = 'test'

    function Page() {
      useQuery([QUERY_KEY], () => sleep(10), { suspense: true })

      return 'rendered'
    }

    function App() {
      const [show, setShow] = React.useState(false)

      return (
        <>
          <React.Suspense fallback="loading">{show && <Page />}</React.Suspense>
          <button aria-label="toggle" onClick={() => setShow(prev => !prev)} />
        </>
      )
    }

    const rendered = render(<App />)

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.getQuery(QUERY_KEY)).toBeFalsy()

    fireEvent.click(rendered.getByLabelText('toggle'))
    await waitFor(() => rendered.getByText('rendered'))

    expect(queryCache.getQuery(QUERY_KEY).instances.length).toBe(1)

    fireEvent.click(rendered.getByLabelText('toggle'))

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.getQuery(QUERY_KEY).instances.length).toBe(0)
  })

  it('should call onSuccess on the first successful call', async () => {
    const successFn = jest.fn()

    function Page() {
      useQuery(['test'], () => sleep(10), {
        suspense: true,
        onSuccess: successFn,
      })

      return 'rendered'
    }

    const rendered = render(
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    await waitFor(() => rendered.getByText('rendered'))

    expect(successFn).toHaveBeenCalledTimes(1)
  })

  // https://github.com/tannerlinsley/react-query/issues/468
  it('should reset error state if new component instances are mounted', async () => {
    let succeed = false
    jest.spyOn(console, 'error')
    console.error.mockImplementation(() => {})

    function Page() {
      useQuery(
        'test',
        async () => {
          await sleep(10)

          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        {
          retryDelay: 10,
          suspense: true,
        }
      )

      return <div>rendered</div>
    }

    const rendered = render(
      <ErrorBoundary
        onReset={queryCache.resetErrorBoundaries}
        fallbackRender={({ resetErrorBoundary }) => (
          <div>
            <div>error boundary</div>
            <button
              onClick={() => {
                succeed = true
                resetErrorBoundary()
              }}
            >
              retry
            </button>
          </div>
        )}
      >
        <React.Suspense fallback={'Loading...'}>
          <Page />
        </React.Suspense>
      </ErrorBoundary>
    )

    await waitFor(() => rendered.getByText('Loading...'))

    await waitFor(() => rendered.getByText('error boundary'))

    await waitFor(() => rendered.getByText('retry'))

    fireEvent.click(rendered.getByText('retry'))

    await waitFor(() => rendered.getByText('rendered'))

    console.error.mockRestore()
  })

  it('should not call the queryFn when not enabled', async () => {
    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    function Page() {
      const [enabled, setEnabled] = React.useState(false)
      useQuery(['test'], queryFn, { suspense: true, enabled })

      return <button aria-label="fire" onClick={() => setEnabled(true)} />
    }

    const rendered = render(
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    expect(queryFn).toHaveBeenCalledTimes(0)

    fireEvent.click(rendered.getByLabelText('fire'))

    expect(queryFn).toHaveBeenCalledTimes(1)
    await waitFor(() => rendered.getByLabelText('fire'))
  })
})
