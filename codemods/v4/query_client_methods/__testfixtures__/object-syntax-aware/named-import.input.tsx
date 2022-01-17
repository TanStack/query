import * as React from 'react'
import { useQueryClient as useRenamedQueryClient } from 'react-query'

export const Examples = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.cancelQueries('todos')
  queryClient.invalidateQueries('todos')
  queryClient.refetchQueries('todos')
  queryClient.removeQueries('todos')
  queryClient.resetQueries('todos')
  // Direct hook call.
  useRenamedQueryClient().cancelQueries('todos')
  useRenamedQueryClient().invalidateQueries('todos')
  useRenamedQueryClient().refetchQueries('todos')
  useRenamedQueryClient().removeQueries('todos')
  useRenamedQueryClient().resetQueries('todos')

  return <div>Example Component</div>
}
