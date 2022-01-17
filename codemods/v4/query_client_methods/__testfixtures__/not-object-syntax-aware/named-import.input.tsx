import * as React from 'react'
import { useQueryClient as useRenamedQueryClient } from 'react-query'

export const Examples = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.getMutationDefaults('todos')
  queryClient.getQueriesData('todos')
  queryClient.getQueryData('todos')
  queryClient.getQueryDefaults('todos')
  queryClient.getQueryState('todos')
  queryClient.isFetching('todos')
  queryClient.setMutationDefaults('todos', { mutationFn: async () => null })
  queryClient.setQueriesData('todos', () => null)
  queryClient.setQueryData('todos', () => null)
  queryClient.setQueryDefaults('todos', { queryFn: async () => null })
  // Direct hook call.
  useRenamedQueryClient().getMutationDefaults('todos')
  useRenamedQueryClient().getQueriesData('todos')
  useRenamedQueryClient().getQueryData('todos')
  useRenamedQueryClient().getQueryDefaults('todos')
  useRenamedQueryClient().getQueryState('todos')
  useRenamedQueryClient().isFetching('todos')
  useRenamedQueryClient().setMutationDefaults('todos', {
    mutationFn: async () => null,
  })
  useRenamedQueryClient().setQueriesData('todos', () => null)
  useRenamedQueryClient().setQueryData('todos', () => null)
  useRenamedQueryClient().setQueryDefaults('todos', {
    queryFn: async () => null,
  })

  return <div>Example Component</div>
}
