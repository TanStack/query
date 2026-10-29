'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'waku'
import { searchOptions } from '../queries'

export function SearchResults() {
  const { query } = useRouter()
  const { data: posts = [] } = useQuery(searchOptions(query))
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
