// ❌ fails: the client component's userOptions(id) query is never prefetched, so it only starts after hydration
import { AuthorCard } from './author-card'

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'userOptions(id)' used by 'useSuspenseQuery' in './author-card.tsx' isn't prefetched in this page, so it only starts fetching after the component renders. Start it in this page by passing the same query options to 'queryClient.query()'.
  return <AuthorCard id={id} />
}
