import { render, waitFor, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import * as React from 'react'

import { sleep, queryKey, mockConsoleError } from './utils'
import {
  useQuery,
  queryCache,
  ReactQueryErrorResetBoundary,
  useErrorResetBoundary,
} from '../..'

describe("useQuery's in Suspense mode", () => {
  it('should not call the queryFn twice when used in Suspense mode', async () => {
    const key = queryKey()

    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    function Page() {
      useQuery([key], queryFn, { suspense: true })

      return <>rendered</>
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
    const key = queryKey()

    function Page() {
      useQuery([key], () => sleep(10), { suspense: true })

      return <>rendered</>
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
    expect(queryCache.getQuery(key)).toBeFalsy()

    fireEvent.click(rendered.getByLabelText('toggle'))
    await waitFor(() => rendered.getByText('rendered'))

    expect(queryCache.getQuery(key)?.observers.length).toBe(1)

    fireEvent.click(rendered.getByLabelText('toggle'))

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.getQuery(key)?.observers.length).toBe(0)
  })

  it('should call onSuccess on the first successful call', async () => {
    const key = queryKey()

    const successFn = jest.fn()

    function Page() {
      useQuery([key], () => sleep(10), {
        suspense: true,
        onSuccess: successFn,
      })

      return <>rendered</>
    }

    const rendered = render(
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    await waitFor(() => rendered.getByText('rendered'))

    expect(successFn).toHaveBeenCalledTimes(1)
  })

  it('should call every onSuccess handler within a suspense boundary', async () => {
    const key = queryKey()

    const successFn1 = jest.fn()
    const successFn2 = jest.fn()

    function FirstComponent() {
      useQuery(key, () => sleep(10), {
        suspense: true,
        onSuccess: successFn1,
      })

      return <span>first</span>
    }

    function SecondComponent() {
      useQuery(key, () => sleep(20), {
        suspense: true,
        onSuccess: successFn2,
      })

      return <span>second</span>
    }

    const rendered = render(
      <React.Suspense fallback="loading">
        <FirstComponent />
        <SecondComponent />
      </React.Suspense>
    )

    await waitFor(() => rendered.getByText('second'))

    expect(successFn1).toHaveBeenCalledTimes(1)
    expect(successFn2).toHaveBeenCalledTimes(1)
  })

  // https://github.com/tannerlinsley/react-query/issues/468
  it('should reset error state if new component instances are mounted', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      useQuery(
        key,
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
        onReset={() => queryCache.resetErrorBoundaries()}
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

    consoleMock.mockRestore()
  })

  it('should retry fetch if the reset error boundary has been reset', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          suspense: true,
        }
      )
      return <div>rendered</div>
    }

    const rendered = render(
      <ReactQueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={({ resetErrorBoundary }) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetErrorBoundary()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <React.Suspense fallback="Loading...">
              <Page />
            </React.Suspense>
          </ErrorBoundary>
        )}
      </ReactQueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('rendered'))

    consoleMock.mockRestore()
  })

  it('should retry fetch if the reset error boundary has been reset with global hook', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          suspense: true,
        }
      )
      return <div>rendered</div>
    }

    function App() {
      const { reset } = useErrorResetBoundary()
      return (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div>
              <div>error boundary</div>
              <button
                onClick={() => {
                  resetErrorBoundary()
                }}
              >
                retry
              </button>
            </div>
          )}
        >
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = render(<App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('rendered'))

    consoleMock.mockRestore()
  })

  it('should not call the queryFn when not enabled', async () => {
    const key = queryKey()

    const queryFn = jest.fn()
    queryFn.mockImplementation(() => sleep(10))

    function Page() {
      const [enabled, setEnabled] = React.useState(false)
      useQuery([key], queryFn, { suspense: true, enabled })

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
