import * as React from 'react'
import * as RQ from 'react-query'

export const Examples = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.cancelQueries('todos')
  queryClient.fetchInfiniteQuery('todos')
  queryClient.fetchQuery('todos')
  queryClient.invalidateQueries('todos')
  queryClient.prefetchInfiniteQuery('todos')
  queryClient.prefetchQuery('todos')
  queryClient.refetchQueries('todos')
  queryClient.removeQueries('todos')
  queryClient.resetQueries('todos')
  // Direct hook call.
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
