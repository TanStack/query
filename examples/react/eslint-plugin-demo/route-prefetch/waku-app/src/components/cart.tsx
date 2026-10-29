// The cart's query options live in this 'use client' module, so on the server `cartOptions` is a
// client reference and can't be called.
'use client'

import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

export const cartOptions = queryOptions({
  queryKey: ['cart'],
  queryFn: async (): Promise<{ count: number }> => {
    const response = await fetch('https://api.example.com/cart')
    return response.json()
  },
})

export function Cart() {
  const { data: cart } = useSuspenseQuery(cartOptions)
  return <p>{cart.count} items in your cart</p>
}
