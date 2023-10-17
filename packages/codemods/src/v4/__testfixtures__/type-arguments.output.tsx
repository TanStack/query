import * as React from 'react'
import { useQueries, useQuery, useQueryClient } from 'react-query'

type Todos = {
  items: ReadonlyArray<{
    id: string
    text: string
  }>
  ts: number
}

export const Examples = () => {
  useQuery<Todos>(['todos'])
  useQueries<Array<Todos>>({
    queries: [query1, query2]
  })
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.getQueriesData<Todos>(['todos'])
  queryClient.getQueriesData<Todos>({
    queryKey: ['todos']
  })
  // --- Direct hook call.
  useQueryClient().getQueriesData<Todos>(['todos'])
  useQueryClient().getQueriesData<Todos>({
    queryKey: ['todos']
  })

  return <div>Example Component</div>
}
