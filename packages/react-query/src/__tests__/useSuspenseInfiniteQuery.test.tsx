import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryCache, skipToken, useSuspenseInfiniteQuery } from '..'
import { createQueryClient, renderWithClient } from './utils'

describe('useSuspenseInfiniteQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

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
})
