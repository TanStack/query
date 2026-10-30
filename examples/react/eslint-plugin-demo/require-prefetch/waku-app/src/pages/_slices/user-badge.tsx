// ❌ fails: slices aren't rendered inside layouts, so the root _layout.tsx's prefetch of
// `currentUserOptions` doesn't cover <UserMenu /> here.
import { UserMenu } from '../../components/user-menu'

export default async function UserBadgeSlice() {
  // eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'currentUserOptions' used by 'useSuspenseQuery' in '../../components/user-menu.tsx' isn't prefetched in this slice, so it only starts fetching after the component renders. Start it in this slice by passing the same query options to 'queryClient.query()'.
  return <UserMenu />
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
