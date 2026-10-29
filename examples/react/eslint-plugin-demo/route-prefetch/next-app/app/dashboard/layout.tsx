// ✅ passes: the layout prefetches the current user and renders {children} inside <HydrationBoundary>
import type * as React from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { currentUserOptions } from '../queries'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(currentUserOptions)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="dashboard">{children}</div>
    </HydrationBoundary>
  )
}
