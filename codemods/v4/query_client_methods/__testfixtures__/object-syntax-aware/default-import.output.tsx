import * as React from 'react'
import { useQueryClient } from 'react-query'

export const Examples = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries(['todos'])
  queryClient.invalidateQueries(['todos'])
  queryClient.refetchQueries(['todos'])
  queryClient.removeQueries(['todos'])
  queryClient.resetQueries(['todos'])
  // Direct hook call.
  useQueryClient().cancelQueries(['todos'])
  useQueryClient().invalidateQueries(['todos'])
  useQueryClient().refetchQueries(['todos'])
  useQueryClient().removeQueries(['todos'])
  useQueryClient().resetQueries(['todos'])

  return <div>Example Component</div>
}
