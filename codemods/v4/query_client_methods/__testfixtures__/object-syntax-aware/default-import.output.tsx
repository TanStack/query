import * as React from 'react'
import { useQueryClient } from 'react-query'

export const Examples = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
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
  useQueryClient().cancelQueries(['todos'])
  useQueryClient().fetchInfiniteQuery(['todos'])
  useQueryClient().fetchQuery(['todos'])
  useQueryClient().invalidateQueries(['todos'])
  useQueryClient().prefetchInfiniteQuery(['todos'])
  useQueryClient().prefetchQuery(['todos'])
  useQueryClient().refetchQueries(['todos'])
  useQueryClient().removeQueries(['todos'])
  useQueryClient().resetQueries(['todos'])

  return <div>Example Component</div>
}
