'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { productOptions } from '@/lib/queries'

export function ProductDetails({ slug }: { slug: string }) {
  const { data } = useSuspenseQuery(productOptions(slug))

  return (
    <div>
      <h1>{data.name}</h1>
      <p>${data.price}</p>
    </div>
  )
}
