import * as React from 'react'
import { useQueryClient as useRenamedQueryClient } from 'react-query'

export const Examples = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.cancelQueries(['todos'])
  queryClient.fetchInfiniteQuery(['todos'])
  queryClient.fetchQuery(['todos'])
  queryClient.invalidateQueries(['todos'])
  queryClient.prefetchInfiniteQuery(['todos'])
  queryClient.prefetchQuery(['todos'])
  queryClient.refetchQueries(['todos'])
  queryClient.removeQueries(['todos'])
  queryClient.resetQueries(['todos'])
  // Direct hook call.
  useRenamedQueryClient().cancelQueries(['todos'])
  useRenamedQueryClient().fetchInfiniteQuery(['todos'])
  useRenamedQueryClient().fetchQuery(['todos'])
  useRenamedQueryClient().invalidateQueries(['todos'])
  useRenamedQueryClient().prefetchInfiniteQuery(['todos'])
  useRenamedQueryClient().prefetchQuery(['todos'])
  useRenamedQueryClient().refetchQueries(['todos'])
  useRenamedQueryClient().removeQueries(['todos'])
  useRenamedQueryClient().resetQueries(['todos'])

  return <div>Example Component</div>
}
