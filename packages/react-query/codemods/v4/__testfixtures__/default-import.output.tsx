import * as React from 'react'
import {
  QueryCache,
  QueryClient,
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from 'react-query'

export const Examples = () => {
  useQuery(['todos'])
  useInfiniteQuery(['todos'])
  useMutation(['todos'])
  useIsFetching(['todos'])
  useIsMutating(['todos'])
  useQueries({
    queries: [query1, query2]
  })
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
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
  useQueryClient().getMutationDefaults(['todos'])
  useQueryClient().getQueriesData(['todos'])
  useQueryClient().getQueryData(['todos'])
  useQueryClient().getQueryDefaults(['todos'])
  useQueryClient().getQueryState(['todos'])
  useQueryClient().isFetching(['todos'])
  useQueryClient().setMutationDefaults(['todos'], {
    mutationFn: async () => null,
  })
  useQueryClient().setQueriesData(['todos'], () => null)
  useQueryClient().setQueryData(['todos'], () => null)
  useQueryClient().setQueryDefaults(['todos'], { queryFn: async () => null })
  useQueryClient().cancelQueries(['todos'])
  useQueryClient().fetchInfiniteQuery(['todos'])
  useQueryClient().fetchQuery(['todos'])
  useQueryClient().invalidateQueries(['todos'])
  useQueryClient().prefetchInfiniteQuery(['todos'])
  useQueryClient().prefetchQuery(['todos'])
  useQueryClient().refetchQueries(['todos'])
  useQueryClient().removeQueries(['todos'])
  useQueryClient().resetQueries(['todos'])
  // QueryCache
  // --- NewExpression
  const queryCache1 = new QueryCache({
    onError: (error) => console.log(error),
    onSuccess: (success) => console.log(success)
  })
  queryCache1.find(['todos'])
  queryCache1.findAll(['todos'])
  // --- Instantiated hook call.
  const queryClient1 = useQueryClient()
  queryClient1.getQueryCache().find(['todos'])
  queryClient1.getQueryCache().findAll(['todos'])
  //
  const queryClient2 = new QueryClient({})
  queryClient2.getQueryCache().find(['todos'])
  queryClient2.getQueryCache().findAll(['todos'])
  //
  const queryCache2 = queryClient1.getQueryCache()
  queryCache2.find(['todos'])
  queryCache2.findAll(['todos'])
  // --- Direct hook call.
  useQueryClient().getQueryCache().find(['todos'])
  useQueryClient().getQueryCache().findAll(['todos'])
  //
  const queryCache3 = useQueryClient().getQueryCache()
  queryCache3.find(['todos'])
  queryCache3.findAll(['todos'])

  return <div>Example Component</div>
}
