import * as React from 'react'
import {
  useInfiniteQuery as useRenamedInfiniteQuery,
  useIsFetching as useRenamedIsFetching,
  useIsMutating as useRenamedIsMutating,
  useMutation as useRenamedMutation,
  useQueries as useRenamedQueries,
  useQuery as useRenamedQuery,
  useQueryClient as useRenamedQueryClient,
} from 'react-query'

export const Examples = () => {
  useRenamedQuery('todos')
  useRenamedInfiniteQuery('todos')
  useRenamedMutation('todos')
  useRenamedIsFetching('todos')
  useRenamedIsMutating('todos')
  useRenamedQueries([query1, query2])
  // QueryClient methods
  // --- Instantiated hook call.
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
  useRenamedQueryClient().cancelQueries('todos')
  useRenamedQueryClient().fetchInfiniteQuery('todos')
  useRenamedQueryClient().fetchQuery('todos')
  useRenamedQueryClient().invalidateQueries('todos')
  useRenamedQueryClient().prefetchInfiniteQuery('todos')
  useRenamedQueryClient().prefetchQuery('todos')
  useRenamedQueryClient().refetchQueries('todos')
  useRenamedQueryClient().removeQueries('todos')
  useRenamedQueryClient().resetQueries('todos')

  return <div>Example Component</div>
}
