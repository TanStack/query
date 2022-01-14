import * as React from 'react'
import { useQueryClient } from 'react-query'

const options = {}

export const ExamplesWithCancelQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries('todos')
  queryClient.cancelQueries('todos', { exact: true })
  queryClient.cancelQueries('todos', { exact: true }, options)
  queryClient.cancelQueries(['todos'])
  queryClient.cancelQueries(['todos'], { exact: true })
  queryClient.cancelQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  useQueryClient().cancelQueries('todos')
  useQueryClient().cancelQueries('todos', { exact: true })
  useQueryClient().cancelQueries('todos', { exact: true }, options)
  useQueryClient().cancelQueries(['todos'])
  useQueryClient().cancelQueries(['todos'], { exact: true })
  useQueryClient().cancelQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}

export const ExamplesWithInvalidateQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.invalidateQueries('todos')
  queryClient.invalidateQueries('todos', { exact: true })
  queryClient.invalidateQueries('todos', { exact: true }, options)
  queryClient.invalidateQueries(['todos'])
  queryClient.invalidateQueries(['todos'], { exact: true })
  queryClient.invalidateQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  useQueryClient().invalidateQueries('todos')
  useQueryClient().invalidateQueries('todos', { exact: true })
  useQueryClient().invalidateQueries('todos', { exact: true }, options)
  useQueryClient().invalidateQueries(['todos'])
  useQueryClient().invalidateQueries(['todos'], { exact: true })
  useQueryClient().invalidateQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}

export const ExamplesWithRefetchQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.refetchQueries('todos')
  queryClient.refetchQueries('todos', { exact: true })
  queryClient.refetchQueries('todos', { exact: true }, options)
  queryClient.refetchQueries(['todos'])
  queryClient.refetchQueries(['todos'], { exact: true })
  queryClient.refetchQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  useQueryClient().refetchQueries('todos')
  useQueryClient().refetchQueries('todos', { exact: true })
  useQueryClient().refetchQueries('todos', { exact: true }, options)
  useQueryClient().refetchQueries(['todos'])
  useQueryClient().refetchQueries(['todos'], { exact: true })
  useQueryClient().refetchQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}

export const ExamplesWithRemoveQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.removeQueries('todos')
  queryClient.removeQueries('todos', { exact: true })
  queryClient.removeQueries(['todos'])
  queryClient.removeQueries(['todos'], { exact: true })
  // Direct hook call.
  useQueryClient().removeQueries('todos')
  useQueryClient().removeQueries('todos', { exact: true })
  useQueryClient().removeQueries(['todos'])
  useQueryClient().removeQueries(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithResetQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.resetQueries('todos')
  queryClient.resetQueries('todos', { exact: true })
  queryClient.resetQueries('todos', { exact: true }, options)
  queryClient.resetQueries(['todos'])
  queryClient.resetQueries(['todos'], { exact: true })
  queryClient.resetQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  useQueryClient().resetQueries('todos')
  useQueryClient().resetQueries('todos', { exact: true })
  useQueryClient().resetQueries('todos', { exact: true }, options)
  useQueryClient().resetQueries(['todos'])
  useQueryClient().resetQueries(['todos'], { exact: true })
  useQueryClient().resetQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}
