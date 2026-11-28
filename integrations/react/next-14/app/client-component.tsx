'use client'

import {
  isError,
  isPending,
  useQuery,
  queryOptions,
} from '@tanstack/react-query'
import React from 'react'

export function ClientComponent() {
  const query = useQuery(
    queryOptions({
      queryKey: ['test'],
      queryFn: async () => {
        await new Promise((r) => setTimeout(r, 1000))
        return 'Success'
      },
    }),
  )

  if (isPending(query)) {
    return <div>Loading...</div>
  }

  if (isError(query)) {
    return <div>An error has occurred!</div>
  }

  return <div>{query.data}</div>
}
