// ❌ fails: ../layout.tsx prefetches currentUserOptions, but renders {children} outside its
// <HydrationBoundary>, so the prefetched data never reaches this page's client component
import { AccountHeader } from '../account-header'

export default function AccountProfilePage() {
  // eslint-disable-next-line @tanstack/query/require-route-prefetch -- The query 'currentUserOptions' used by 'useSuspenseQuery' in '../account-header.tsx' is prefetched in '../layout.tsx', but the component isn't rendered inside a '<HydrationBoundary state={dehydrate(queryClient)}>', so the prefetched data doesn't reach the client.
  return <AccountHeader />
}
