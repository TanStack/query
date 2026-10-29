// ❌ fails: `cartOptions` comes from a 'use client' module, so on the server it's a client
// reference and calling `prefetchQuery` with it doesn't work.
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../get-query-client'
import { Cart, cartOptions } from '../components/cart'

export default async function CartPage() {
  const queryClient = getQueryClient()
  // eslint-disable-next-line @tanstack/query/require-route-prefetch -- 'cartOptions' is imported from '../components/cart.tsx', which has a 'use client' directive, so on the server it is a client reference and can't be called. Move the query options to a module without 'use client'.
  await queryClient.prefetchQuery(cartOptions)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Cart />
    </HydrationBoundary>
  )
}

export const getConfig = async () => ({ render: 'dynamic' }) as const
