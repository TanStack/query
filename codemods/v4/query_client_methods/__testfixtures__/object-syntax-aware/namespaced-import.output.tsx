import * as React from 'react'
import * as RQ from 'react-query'

export const Examples = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.cancelQueries(['todos'])
  queryClient.invalidateQueries(['todos'])
  queryClient.refetchQueries(['todos'])
  queryClient.removeQueries(['todos'])
  queryClient.resetQueries(['todos'])
  // Direct hook call.
  RQ.useQueryClient().cancelQueries(['todos'])
  RQ.useQueryClient().invalidateQueries(['todos'])
  RQ.useQueryClient().refetchQueries(['todos'])
  RQ.useQueryClient().removeQueries(['todos'])
  RQ.useQueryClient().resetQueries(['todos'])

  return <div>Example Component</div>
}
