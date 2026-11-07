import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act } from '@testing-library/react'
import {
  clearOnDispose,
  createKey,
  fakeTimers,
  sleep,
  unmountOnDispose,
} from '@tanstack/query-test-utils'
import {
  HydrationBoundary,
  QueryClient,
  defaultShouldDehydrateQuery,
  dehydrate,
  experimental_fromHandle,
  experimental_queryHandle,
  queryOptions,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'
import type { experimental_QueryHandle } from '..'

describe('query handles', () => {
  it('should stream a pending query from experimental_queryHandle to a reader without fetching it again', async () => {
    using _timers = fakeTimers()
    const key = createKey()
    const queryFn = vi.fn<(id: string) => Promise<string>>((id) =>
      sleep(10).then(() => `post ${id}`),
    )
    const postQuery = (input: { id: string }) =>
      queryOptions({
        queryKey: [...key, input.id],
        queryFn: () => queryFn(input.id),
        staleTime: 60 * 1000,
      })

    using serverClient = clearOnDispose(new QueryClient())
    const handle = experimental_queryHandle(serverClient, postQuery, {
      id: '1',
    })
    const dehydrated = dehydrate(serverClient, {
      shouldDehydrateQuery: (query) =>
        defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
    })
    expect(dehydrated.queries).toHaveLength(1)
    expect(dehydrated.queries[0]?.state.status).toBe('pending')

    function Post(props: { post: experimental_QueryHandle<typeof postQuery> }) {
      const { data } = useSuspenseQuery(
        experimental_fromHandle(postQuery, props.post),
      )
      return <div>data: {data}</div>
    }

    using queryClient = clearOnDispose(new QueryClient())
    using rendered = unmountOnDispose(
      renderWithClient(
        queryClient,
        <HydrationBoundary state={dehydrated}>
          <React.Suspense fallback="Loading...">
            <Post post={JSON.parse(JSON.stringify(handle))} />
          </React.Suspense>
        </HydrationBoundary>,
      ),
    )

    expect(rendered.getByText('Loading...')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: post 1')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
