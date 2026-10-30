// ❌ fails: the layout prefetches the product list for its pages, but its own <CartBadge /> reads cartOptions, which isn't prefetched
import type * as React from 'react'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { productsOptions } from '../queries'
import { CartBadge } from './cart-badge'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(productsOptions)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <header>
        {/* eslint-disable-next-line @tanstack/query-prefetch/require-prefetch -- The query 'cartOptions' used by 'useSuspenseQuery' in './cart-badge.tsx' isn't prefetched in this layout, so it only starts fetching after the component renders. Start it in this layout by passing the same query options to 'queryClient.query()'. */}
        <CartBadge />
      </header>
      {children}
    </HydrationBoundary>
  )
}
