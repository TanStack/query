// ✅ passes: the layout prefetches the current user and dehydrates it around both its own
// <UserMenu /> and {children}, so every page below it gets `currentUserOptions` for free.
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { currentUserOptions } from '../queries'
import { UserMenu } from '../components/user-menu'
import type { LayoutProps } from 'waku/router'

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(currentUserOptions)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <header>
        <UserMenu />
      </header>
      <main>{children}</main>
    </HydrationBoundary>
  )
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
