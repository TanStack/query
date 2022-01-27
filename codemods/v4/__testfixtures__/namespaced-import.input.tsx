import * as React from 'react'
import * as RQ from 'react-query'

export const Examples = () => {
  RQ.useQuery('todos')
  RQ.useInfiniteQuery('todos')
  RQ.useMutation('todos')
  RQ.useIsFetching('todos')
  RQ.useIsMutating('todos')
  RQ.useQueries([query1, query2])
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = RQ.useQueryClient()
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
  RQ.useQueryClient().getMutationDefaults('todos')
  RQ.useQueryClient().getQueriesData('todos')
  RQ.useQueryClient().getQueryData('todos')
  RQ.useQueryClient().getQueryDefaults('todos')
  RQ.useQueryClient().getQueryState('todos')
  RQ.useQueryClient().isFetching('todos')
  RQ.useQueryClient().setMutationDefaults('todos', {
    mutationFn: async () => null,
  })
  RQ.useQueryClient().setQueriesData('todos', () => null)
  RQ.useQueryClient().setQueryData('todos', () => null)
  RQ.useQueryClient().setQueryDefaults('todos', {
    queryFn: async () => null,
  })
  RQ.useQueryClient().cancelQueries('todos')
  RQ.useQueryClient().fetchInfiniteQuery('todos')
  RQ.useQueryClient().fetchQuery('todos')
  RQ.useQueryClient().invalidateQueries('todos')
  RQ.useQueryClient().prefetchInfiniteQuery('todos')
  RQ.useQueryClient().prefetchQuery('todos')
  RQ.useQueryClient().refetchQueries('todos')
  RQ.useQueryClient().removeQueries('todos')
  RQ.useQueryClient().resetQueries('todos')

  return <div>Example Component</div>
}
