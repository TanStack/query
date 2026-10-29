'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { cartOptions } from '../queries'

export function CartBadge() {
  const { data } = useSuspenseQuery(cartOptions)

  return <span>Cart ({data.count})</span>
}
