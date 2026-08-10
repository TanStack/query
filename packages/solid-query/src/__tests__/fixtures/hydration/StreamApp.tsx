/**
 * Streaming fixture for the SSR → hydration window tests.
 *
 * Two Loading boundaries: `header` resolves fast (its boundary content
 * streams almost immediately), `feed` holds the stream open for ~250ms.
 * This lets tests hydrate the fast section while the stream is still
 * in flight and probe the window between cache priming and subscriber
 * attach.
 */
import { Loading } from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import type { QueryClient } from '@tanstack/solid-query'

export interface StreamCounts {
  header: number
  feed: number
}

export interface StreamAppProps {
  client: QueryClient
  source: 'server' | 'client'
  counts: StreamCounts
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function HeaderQuery(props: StreamAppProps) {
  const query = useQuery(() => ({
    queryKey: ['header'],
    queryFn: async () => {
      props.counts.header++
      await sleep(5)
      return `header-${props.source}`
    },
    staleTime: 60_000,
  }))
  return <span id="header">{query.data}</span>
}

function FeedQuery(props: StreamAppProps) {
  const query = useQuery(() => ({
    queryKey: ['feed'],
    queryFn: async () => {
      props.counts.feed++
      await sleep(250)
      return `feed-${props.source}`
    },
    staleTime: 60_000,
  }))
  return <span id="feed">{query.data}</span>
}

export function StreamApp(props: StreamAppProps) {
  return (
    <QueryClientProvider client={props.client}>
      <div>
        <Loading fallback={<div>loading-header</div>}>
          <HeaderQuery {...props} />
        </Loading>
        <Loading fallback={<div>loading-feed</div>}>
          <FeedQuery {...props} />
        </Loading>
      </div>
    </QueryClientProvider>
  )
}
