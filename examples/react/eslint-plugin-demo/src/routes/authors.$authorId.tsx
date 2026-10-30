import { createFileRoute } from '@tanstack/react-router'
import { Author } from '../components/author'

// ❌ fails: the component lives in another file, and the route has no loader.
// The rule reports at the `component` option, since the query is in
// ../components/author.tsx.
export const Route = createFileRoute('/authors/$authorId')({
  // eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'authorOptions(authorId)' used by 'useSuspenseQuery' in '../components/author.tsx' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
  component: Author,
})
