// @vitest-environment jsdom

import { setQueryData } from '@tanstack/query-core'
import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary,
  QueryObserver,
  infiniteQueryOptions,
  queryOptions,
  setQueryDefaults,
  suspenseQueryOptions,
  throwOnError,
  useQuery,
} from '..'

type PostErrorPolicy = readonly [typeof throwOnError, (error: Error) => boolean]
const defaults = [
  {
    scope: 'client',
    createClient: (policy: PostErrorPolicy) =>
      new QueryClient({
        defaultOptions: { queries: { throwOnError: policy } },
      }),
  },
  {
    scope: 'key',
    createClient: (policy: PostErrorPolicy) => {
      const client = new QueryClient()
      setQueryDefaults(client, ['post'], { throwOnError: policy })
      return client
    },
  },
]

describe('query render modes', () => {
  it.each(defaults)(
    'switches a mounted reader from inline errors to its $scope boundary default',
    async ({ createClient }) => {
      const failure = new Error('Unable to load post')
      const shouldThrow = vi.fn<(error: Error) => boolean>(
        (error) => error === failure,
      )
      const client = createClient([throwOnError, shouldThrow])

      const post = queryOptions({
        queryKey: ['post', 1],
        retry: false,
        queryFn: () => Promise.reject(failure),
      })
      function Post({ inline }: { inline: boolean }) {
        const result = useQuery(
          inline ? { ...post, throwOnError: false as const } : post,
          client,
        )
        return <p>{result.error?.message}</p>
      }

      const view = render(<Post inline />)
      await view.findByText('Unable to load post')
      expect(shouldThrow).not.toHaveBeenCalled()
      expect(() => view.rerender(<Post inline={false} />)).toThrow(failure)
      expect(shouldThrow).toHaveBeenCalledWith(
        failure,
        expect.objectContaining({ queryKey: post.queryKey }),
      )
      view.unmount()
    },
  )

  it('leaves a pending boundary reset available when a sibling handles its error inline', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const checkReset = vi.fn<(wasReset: boolean) => void>()
    const post = queryOptions({
      queryKey: ['post'],
      queryFn: () => Promise.reject(new Error('Post unavailable')),
    })

    function Post() {
      return <p>{useQuery(post, client).error?.message}</p>
    }

    function App() {
      const [showPost, setShowPost] = React.useState(false)
      return (
        <QueryErrorResetBoundary>
          {({ reset, isReset }) => (
            <>
              <button
                onClick={() => {
                  reset()
                  setShowPost(true)
                }}
              >
                Retry
              </button>
              {showPost && <Post />}
              <button onClick={() => checkReset(isReset())}>Check reset</button>
            </>
          )}
        </QueryErrorResetBoundary>
      )
    }

    const view = render(<App />)
    fireEvent.click(view.getByRole('button', { name: 'Retry' }))
    await view.findByText('Post unavailable')
    fireEvent.click(view.getByRole('button', { name: 'Check reset' }))
    expect(checkReset).toHaveBeenCalledWith(true)
    view.unmount()
  })

  it.each([
    undefined,
    null,
    { queryKey: ['post'], queryFn: (): string => 'Dune' },
    {
      queryKey: ['post'],
      queryFn: (): string => 'Dune',
      Observer: QueryObserver,
    },
  ])('explains the required factory for an unchecked input', (options) => {
    function Page() {
      // @ts-expect-error Exercise an unchecked JavaScript caller.
      useQuery(options)
      return null
    }
    expect(() => render(<Page />)).toThrow(
      'Pass a descriptor from queryOptions, suspenseQueryOptions, infiniteQueryOptions, or suspenseInfiniteQueryOptions',
    )
  })

  it('uses the same cached result when a reader starts suspending', () => {
    const client = new QueryClient()
    const queryFn = vi.fn<() => string>(() => 'fetched post')
    const options = {
      queryKey: ['post'],
      queryFn,
      staleTime: Infinity,
    }
    setQueryData(client, options.queryKey, 'cached post')

    function Post({ suspend }: { suspend: boolean }) {
      const result = useQuery(
        suspend ? suspenseQueryOptions(options) : queryOptions(options),
      )
      return <p>{result.data}</p>
    }

    function App({ suspend }: { suspend: boolean }) {
      return (
        <QueryClientProvider client={client}>
          <React.Suspense fallback={<p>Loading post</p>}>
            <Post suspend={suspend} />
          </React.Suspense>
        </QueryClientProvider>
      )
    }

    const view = render(<App suspend={false} />)
    screen.getByText('cached post')
    view.rerender(<App suspend />)
    screen.getByText('cached post')
    expect(queryFn).not.toHaveBeenCalled()
    view.unmount()
  })

  it('switches observers when a mounted reader receives a different client', () => {
    const first = new QueryClient()
    const second = new QueryClient()
    const queryFn = vi.fn<() => string>(() => 'fetched')
    const descriptor = queryOptions({
      queryKey: ['book'],
      queryFn,
      staleTime: Infinity,
    })
    setQueryData(first, descriptor.queryKey, 'Dune')
    setQueryData(second, descriptor.queryKey, 'Silo')

    function Reader({ client }: { client: QueryClient }) {
      return <p>{useQuery(descriptor, client).data}</p>
    }

    const view = render(<Reader client={first} />)
    screen.getByText('Dune')
    view.rerender(<Reader client={second} />)
    screen.getByText('Silo')
    expect(queryFn).not.toHaveBeenCalled()
    view.unmount()
  })

  it('can switch the mounted hook to a paginated reader and back', async () => {
    const client = new QueryClient()
    const post = queryOptions({
      queryKey: ['post'],
      queryFn: () => 'single post',
    })
    const pages = infiniteQueryOptions({
      queryKey: ['pages'],
      initialPageParam: 1,
      queryFn: ({ pageParam }) => 'page ' + pageParam,
      getNextPageParam: (_last, allPages) => allPages.length + 1,
    })

    function Reader({ paged }: { paged: boolean }) {
      const result = useQuery(paged ? pages : post)
      if ('fetchNextPage' in result) {
        return (
          <>
            <p>{result.data?.pages.join(', ')}</p>
            <button onClick={() => void result.fetchNextPage()}>
              Next page
            </button>
          </>
        )
      }
      return <p>{result.data}</p>
    }

    function App({ paged }: { paged: boolean }) {
      return (
        <QueryClientProvider client={client}>
          <Reader paged={paged} />
        </QueryClientProvider>
      )
    }

    const view = render(<App paged={false} />)
    await screen.findByText('single post')
    view.rerender(<App paged />)
    await screen.findByText('page 1')
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    await screen.findByText('page 1, page 2')
    view.rerender(<App paged={false} />)
    await screen.findByText('single post')
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    view.unmount()
  })
})
