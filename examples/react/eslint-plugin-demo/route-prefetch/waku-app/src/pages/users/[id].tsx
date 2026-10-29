// ❌ fails: <UserProfile /> reads the `id` slug with useParams_UNSTABLE() and calls
// useSuspenseQuery(userOptions(id)), but the page never prefetches it.
import { UserProfile } from '../../components/user-profile'

export default async function UserPage() {
  // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'userOptions(id)' used by 'useSuspenseQuery' in '../../components/user-profile.tsx' isn't prefetched in this page, so it only starts fetching after the component renders. Start it in this page by passing the same query options to 'queryClient.query()'.
  return <UserProfile />
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
