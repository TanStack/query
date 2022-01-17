import * as React from 'react'
import { useQueryClient } from 'react-query'

export const Examples = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
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
  useQueryClient().getMutationDefaults('todos')
  useQueryClient().getQueriesData('todos')
  useQueryClient().getQueryData('todos')
  useQueryClient().getQueryDefaults('todos')
  useQueryClient().getQueryState('todos')
  useQueryClient().isFetching('todos')
  useQueryClient().setMutationDefaults('todos', {
    mutationFn: async () => null,
  })
  useQueryClient().setQueriesData('todos', () => null)
  useQueryClient().setQueryData('todos', () => null)
  useQueryClient().setQueryDefaults('todos', { queryFn: async () => null })

  return <div>Example Component</div>
}
