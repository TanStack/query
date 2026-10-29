// ❌ fails: the `clientLoader` prefetches the `tag` search param, but the component searches with
// the `q` search param, so the prefetched query is a different one.
import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { queryClient, searchOptions } from '../queries'
import type { Route } from './+types/tag-search'

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const tag = new URL(request.url).searchParams.get('tag')
  await queryClient.ensureQueryData(searchOptions(tag))
}

export default function TagSearch() {
  const [searchParams] = useSearchParams()
  // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'searchOptions(searchParams.get('q'))' used by 'useQuery' isn't prefetched in this route's loader, so it only starts fetching after the component renders. Start it in this route's loader by passing the same query options to 'queryClient.query()'.
  const { data: results = [] } = useQuery(searchOptions(searchParams.get('q')))

  return (
    <ul>
      {results.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
