import * as React from 'react'
import { useQueryClient } from 'react-query'

export const ExamplesWithCancelQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries()
  // Direct hook call.
  useQueryClient().cancelQueries()

  return <div>Example Component</div>
}

export const ExamplesWithInvalidateQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.invalidateQueries()
  // Direct hook call.
  useQueryClient().invalidateQueries()

  return <div>Example Component</div>
}

export const ExamplesWithRefetchQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.refetchQueries()
  // Direct hook call.
  useQueryClient().refetchQueries()

  return <div>Example Component</div>
}

export const ExamplesWithRemoveQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.removeQueries()
  // Direct hook call.
  useQueryClient().removeQueries()

  return <div>Example Component</div>
}

export const ExamplesWithResetQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.resetQueries()
  // Direct hook call.
  useQueryClient().resetQueries()

  return <div>Example Component</div>
}
