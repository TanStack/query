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
  // QueryCache
  // --- NewExpression
  const queryCache1 = new RQ.QueryCache({
    onError: (error) => console.log(error),
    onSuccess: (success) => console.log(success)
  })
  queryCache1.find('todos')
  queryCache1.findAll('todos')
  // --- Instantiated hook call.
  const queryClient1 = RQ.useQueryClient()
  queryClient1.getQueryCache().find('todos')
  queryClient1.getQueryCache().findAll('todos')
  //
  const queryClient2 = new RQ.QueryClient({})
  queryClient2.getQueryCache().find('todos')
  queryClient2.getQueryCache().findAll('todos')
  //
  const queryCache2 = queryClient1.getQueryCache()
  queryCache2.find('todos')
  queryCache2.findAll('todos')
  // --- Direct hook call.
  RQ.useQueryClient().getQueryCache().find('todos')
  RQ.useQueryClient().getQueryCache().findAll('todos')
  //
  const queryCache3 = RQ.useQueryClient().getQueryCache()
  queryCache3.find('todos')
  queryCache3.findAll('todos')

  return <div>Example Component</div>
}
