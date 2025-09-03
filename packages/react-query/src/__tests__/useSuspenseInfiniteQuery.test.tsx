import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { queryKey } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  skipToken,
  useSuspenseInfiniteQuery,
} from '..'
import { renderWithClient } from './utils'

describe('useSuspenseInfiniteQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  it('should log an error when skipToken is passed as queryFn', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const key = queryKey()

    function Page() {
      useSuspenseInfiniteQuery({
        queryKey: key,
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error
        queryFn: Math.random() >= 0 ? skipToken : () => Promise.resolve(5),
      })

      return null
    }

    function App() {
      return (
        <React.Suspense fallback="Loading...">
          <Page />
        </React.Suspense>
      )
    }

    renderWithClient(queryClient, <App />)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseInfiniteQuery',
    )
    consoleErrorSpy.mockRestore()
  })

  it('should log an error when skipToken is used in development environment', () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    function Page() {
      useSuspenseInfiniteQuery({
        queryKey: key,
        queryFn: skipToken as any,
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      return null
    }

    renderWithClient(
      queryClient,
      <React.Suspense fallback="Loading...">
        <Page />
      </React.Suspense>,
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseInfiniteQuery',
    )

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = envCopy
  })

  it('should not log an error when skipToken is used in production environment', () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    function Page() {
      useSuspenseInfiniteQuery({
        queryKey: key,
        queryFn: skipToken as any,
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

      return null
    }

    renderWithClient(
      queryClient,
      <React.Suspense fallback="Loading...">
        <Page />
      </React.Suspense>,
    )

    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = envCopy
  })
})
