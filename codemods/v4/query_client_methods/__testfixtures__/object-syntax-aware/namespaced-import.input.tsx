import * as React from 'react'
import * as RQ from 'react-query'

const options = {}

export const ExamplesWithCancelQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.cancelQueries('todos')
  queryClient.cancelQueries('todos', { exact: true })
  queryClient.cancelQueries('todos', { exact: true }, options)
  queryClient.cancelQueries(['todos'])
  queryClient.cancelQueries(['todos'], { exact: true })
  queryClient.cancelQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  RQ.useQueryClient().cancelQueries('todos')
  RQ.useQueryClient().cancelQueries('todos', { exact: true })
  RQ.useQueryClient().cancelQueries('todos', { exact: true }, options)
  RQ.useQueryClient().cancelQueries(['todos'])
  RQ.useQueryClient().cancelQueries(['todos'], { exact: true })
  RQ.useQueryClient().cancelQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}

export const ExamplesWithInvalidateQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.invalidateQueries('todos')
  queryClient.invalidateQueries('todos', { exact: true })
  queryClient.invalidateQueries('todos', { exact: true }, options)
  queryClient.invalidateQueries(['todos'])
  queryClient.invalidateQueries(['todos'], { exact: true })
  queryClient.invalidateQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  RQ.useQueryClient().invalidateQueries('todos')
  RQ.useQueryClient().invalidateQueries('todos', { exact: true })
  RQ.useQueryClient().invalidateQueries('todos', { exact: true }, options)
  RQ.useQueryClient().invalidateQueries(['todos'])
  RQ.useQueryClient().invalidateQueries(['todos'], { exact: true })
  RQ.useQueryClient().invalidateQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}

export const ExamplesWithRefetchQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.refetchQueries('todos')
  queryClient.refetchQueries('todos', { exact: true })
  queryClient.refetchQueries('todos', { exact: true }, options)
  queryClient.refetchQueries(['todos'])
  queryClient.refetchQueries(['todos'], { exact: true })
  queryClient.refetchQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  RQ.useQueryClient().refetchQueries('todos')
  RQ.useQueryClient().refetchQueries('todos', { exact: true })
  RQ.useQueryClient().refetchQueries('todos', { exact: true }, options)
  RQ.useQueryClient().refetchQueries(['todos'])
  RQ.useQueryClient().refetchQueries(['todos'], { exact: true })
  RQ.useQueryClient().refetchQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}

export const ExamplesWithRemoveQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.removeQueries('todos')
  queryClient.removeQueries('todos', { exact: true })
  queryClient.removeQueries(['todos'])
  queryClient.removeQueries(['todos'], { exact: true })
  // Direct hook call.
  RQ.useQueryClient().removeQueries('todos')
  RQ.useQueryClient().removeQueries('todos', { exact: true })
  RQ.useQueryClient().removeQueries(['todos'])
  RQ.useQueryClient().removeQueries(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithResetQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = RQ.useQueryClient()
  queryClient.resetQueries('todos')
  queryClient.resetQueries('todos', { exact: true })
  queryClient.resetQueries('todos', { exact: true }, options)
  queryClient.resetQueries(['todos'])
  queryClient.resetQueries(['todos'], { exact: true })
  queryClient.resetQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  RQ.useQueryClient().resetQueries('todos')
  RQ.useQueryClient().resetQueries('todos', { exact: true })
  RQ.useQueryClient().resetQueries('todos', { exact: true }, options)
  RQ.useQueryClient().resetQueries(['todos'])
  RQ.useQueryClient().resetQueries(['todos'], { exact: true })
  RQ.useQueryClient().resetQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}
