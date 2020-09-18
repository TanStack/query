import { render, waitFor, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import * as React from 'react'

import { sleep, queryKey, mockConsoleError } from './utils'
import { useQuery, ReactQueryErrorResetBoundary } from '../..'

describe('ReactQueryResetErrorBoundary', () => {
  it('should retry fetch if the reset error boundary has been reset', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          useErrorBoundary: true,
        }
      )
      return <div>{data}</div>
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
            <Page />
          </ErrorBoundary>
        )}
      </ReactQueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('data'))

    consoleMock.mockRestore()
  })

  it('should throw again on error after the reset error boundary has been reset', async () => {
    const key = queryKey()
    const consoleMock = mockConsoleError()
    let fetchCount = 0

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          fetchCount++
          await sleep(10)
          throw new Error('Error')
        },
        {
          retry: false,
          useErrorBoundary: true,
        }
      )
      return <div>{data}</div>
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
            <Page />
          </ErrorBoundary>
        )}
      </ReactQueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    expect(fetchCount).toBe(3)

    consoleMock.mockRestore()
  })
})
