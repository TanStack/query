'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { searchOptions } from '../queries'

export function SearchResults() {
  const searchParams = useSearchParams()
  const { data = [] } = useQuery(searchOptions(searchParams.get('q')))

  return (
    <ul>
      {data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
