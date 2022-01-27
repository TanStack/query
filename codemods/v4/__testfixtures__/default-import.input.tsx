import * as React from 'react'
import {
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from 'react-query'

export const Examples = () => {
  useQuery('todos')
  useInfiniteQuery('todos')
  useMutation('todos')
  useIsFetching('todos')
  useIsMutating('todos')
  useQueries([query1, query2])
  // QueryClient methods
  // --- Instantiated hook call.
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
  queryClient.cancelQueries('todos')
  queryClient.fetchInfiniteQuery('todos')
  queryClient.fetchQuery('todos')
  queryClient.invalidateQueries('todos')
  queryClient.prefetchInfiniteQuery('todos')
  queryClient.prefetchQuery('todos')
  queryClient.refetchQueries('todos')
  queryClient.removeQueries('todos')
  queryClient.resetQueries('todos')
  // --- Direct hook call.
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
  useQueryClient().cancelQueries('todos')
  useQueryClient().fetchInfiniteQuery('todos')
  useQueryClient().fetchQuery('todos')
  useQueryClient().invalidateQueries('todos')
  useQueryClient().prefetchInfiniteQuery('todos')
  useQueryClient().prefetchQuery('todos')
  useQueryClient().refetchQueries('todos')
  useQueryClient().removeQueries('todos')
  useQueryClient().resetQueries('todos')

  return <div>Example Component</div>
}
