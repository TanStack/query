// ✅ passes: the `clientLoader` reads `q` from `new URL(request.url).searchParams`, which holds the
// same values as `useSearchParams()` in the component.
import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { queryClient, searchOptions } from '../queries'
import type { Route } from './+types/search'

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url)
  await queryClient.ensureQueryData(searchOptions(url.searchParams.get('q')))
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const { data: results = [] } = useQuery(searchOptions(searchParams.get('q')))

  return (
    <ul>
      {results.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
