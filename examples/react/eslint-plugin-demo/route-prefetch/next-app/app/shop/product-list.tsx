'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { productsOptions } from '../queries'

export function ProductList() {
  const { data } = useSuspenseQuery(productsOptions)

  return (
    <ul>
      {data.map((product) => (
        <li key={product.slug}>{product.name}</li>
      ))}
    </ul>
  )
}
