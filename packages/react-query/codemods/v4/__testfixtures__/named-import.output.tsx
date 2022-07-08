import * as React from 'react'
import {
  QueryCache as RenamedQueryCache,
  QueryClient as RenamedQueryClient,
  useInfiniteQuery as useRenamedInfiniteQuery,
  useIsFetching as useRenamedIsFetching,
  useIsMutating as useRenamedIsMutating,
  useMutation as useRenamedMutation,
  useQueries as useRenamedQueries,
  useQuery as useRenamedQuery,
  useQueryClient as useRenamedQueryClient,
} from 'react-query'

export const Examples = () => {
  useRenamedQuery(['todos'])
  useRenamedInfiniteQuery(['todos'])
  useRenamedMutation(['todos'])
  useRenamedIsFetching(['todos'])
  useRenamedIsMutating(['todos'])
  useRenamedQueries({
    queries: [query1, query2]
  })
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.getMutationDefaults(['todos'])
  queryClient.getQueriesData(['todos'])
  queryClient.getQueryData(['todos'])
  queryClient.getQueryDefaults(['todos'])
  queryClient.getQueryState(['todos'])
  queryClient.isFetching(['todos'])
  queryClient.setMutationDefaults(['todos'], { mutationFn: async () => null })
  queryClient.setQueriesData(['todos'], () => null)
  queryClient.setQueryData(['todos'], () => null)
  queryClient.setQueryDefaults(['todos'], { queryFn: async () => null })
  queryClient.cancelQueries(['todos'])
  queryClient.fetchInfiniteQuery(['todos'])
  queryClient.fetchQuery(['todos'])
  queryClient.invalidateQueries(['todos'])
  queryClient.prefetchInfiniteQuery(['todos'])
  queryClient.prefetchQuery(['todos'])
  queryClient.refetchQueries(['todos'])
  queryClient.removeQueries(['todos'])
  queryClient.resetQueries(['todos'])
  // --- Direct hook call.
  useRenamedQueryClient().getMutationDefaults(['todos'])
  useRenamedQueryClient().getQueriesData(['todos'])
  useRenamedQueryClient().getQueryData(['todos'])
  useRenamedQueryClient().getQueryDefaults(['todos'])
  useRenamedQueryClient().getQueryState(['todos'])
  useRenamedQueryClient().isFetching(['todos'])
  useRenamedQueryClient().setMutationDefaults(['todos'], {
    mutationFn: async () => null,
  })
  useRenamedQueryClient().setQueriesData(['todos'], () => null)
  useRenamedQueryClient().setQueryData(['todos'], () => null)
  useRenamedQueryClient().setQueryDefaults(['todos'], {
    queryFn: async () => null,
  })
  useRenamedQueryClient().cancelQueries(['todos'])
  useRenamedQueryClient().fetchInfiniteQuery(['todos'])
  useRenamedQueryClient().fetchQuery(['todos'])
  useRenamedQueryClient().invalidateQueries(['todos'])
  useRenamedQueryClient().prefetchInfiniteQuery(['todos'])
  useRenamedQueryClient().prefetchQuery(['todos'])
  useRenamedQueryClient().refetchQueries(['todos'])
  useRenamedQueryClient().removeQueries(['todos'])
  useRenamedQueryClient().resetQueries(['todos'])
  // QueryCache
  // --- NewExpression
  const queryCache1 = new RenamedQueryCache({
    onError: (error) => console.log(error),
    onSuccess: (success) => console.log(success)
  })
  queryCache1.find(['todos'])
  queryCache1.findAll(['todos'])
  // --- Instantiated hook call.
  const queryClient1 = useRenamedQueryClient()
  queryClient1.getQueryCache().find(['todos'])
  queryClient1.getQueryCache().findAll(['todos'])
  //
  const queryClient2 = new RenamedQueryClient({})
  queryClient2.getQueryCache().find(['todos'])
  queryClient2.getQueryCache().findAll(['todos'])
  //
  const queryCache2 = queryClient1.getQueryCache()
  queryCache2.find(['todos'])
  queryCache2.findAll(['todos'])
  // --- Direct hook call.
  useRenamedQueryClient().getQueryCache().find(['todos'])
  useRenamedQueryClient().getQueryCache().findAll(['todos'])
  //
  const queryCache3 = useRenamedQueryClient().getQueryCache()
  queryCache3.find(['todos'])
  queryCache3.findAll(['todos'])

  return <div>Example Component</div>
}
