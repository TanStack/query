// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  QueryClientProvider,
  infiniteQuery,
  query,
  suspenseQuery,
  useQuery,
} from '..'
import { setQueryData } from '../runtime/queryClient'

describe('query render modes', () => {
  it('uses the same cached result when a reader starts suspending', () => {
    const client = new QueryClient()
    const queryFn = vi.fn<() => string>(() => 'fetched post')
    const options = query({ queryKey: ['post'], queryFn, staleTime: Infinity })
    setQueryData(client, options.queryKey, 'cached post')

    function Post({ suspend }: { suspend: boolean }) {
      const result = useQuery(suspend ? suspenseQuery(options) : options)
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

  it('can switch the mounted hook to a paginated reader and back', async () => {
    const client = new QueryClient()
    const post = query({ queryKey: ['post'], queryFn: () => 'single post' })
    const pages = infiniteQuery({
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
