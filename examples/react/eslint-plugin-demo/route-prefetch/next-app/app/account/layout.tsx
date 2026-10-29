// ✅ passes: the layout's own <AccountHeader /> is inside the <HydrationBoundary> (see ./page.tsx for
// the page below it, which is rendered outside the boundary)
import type * as React from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { currentUserOptions } from '../queries'
import { AccountHeader } from './account-header'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(currentUserOptions)

  return (
    <>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AccountHeader />
      </HydrationBoundary>
      {children}
    </>
  )
}
