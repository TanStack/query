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
import {
  QueryClientProvider,
  useQueries,
  useQuery,
} from '@tanstack/solid-query'
import type { QueryClient } from '@tanstack/solid-query'

export interface StreamCounts {
  header: number
  feed: number
  tags: number
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

// Lives in the shell, so it hydrates with the first flush — but it settles
// after the feed, so its entry only reaches the client with the last one.
function TagsQueries(props: StreamAppProps) {
  const queries = useQueries(() => ({
    queries: [
      {
        queryKey: ['tags'],
        queryFn: async () => {
          props.counts.tags++
          await sleep(300)
          return `tags-${props.source}`
        },
        staleTime: 60_000,
      },
    ],
  }))
  return <span id="tags">{queries[0].data}</span>
}

export function StreamApp(props: StreamAppProps) {
  return (
    <QueryClientProvider client={props.client}>
      <div>
        <TagsQueries {...props} />
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
