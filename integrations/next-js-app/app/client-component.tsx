'use client'

import { useQuery } from '@tanstack/react-query'

export function ClientComponent() {
  const query = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return 'Success'
    },
  })

  if (query.isPending) {
    return <div>Loading...</div>
  }

  if (query.isError) {
    return <div>An error has occurred!</div>
  }

  return <div>{query.data}</div>
}
