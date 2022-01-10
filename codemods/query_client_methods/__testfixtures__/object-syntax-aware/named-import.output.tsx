import * as React from 'react'
import { useQueryClient as useRenamedQueryClient } from 'react-query'

const options = {}

export const ExamplesWithCancelQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.cancelQueries(['todos'])
  queryClient.cancelQueries(['todos'], { exact: true })
  queryClient.cancelQueries(['todos'], { exact: true }, options)
  queryClient.cancelQueries(['todos'])
  queryClient.cancelQueries(['todos'], { exact: true })
  queryClient.cancelQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  useRenamedQueryClient().cancelQueries(['todos'])
  useRenamedQueryClient().cancelQueries(['todos'], { exact: true })
  useRenamedQueryClient().cancelQueries(['todos'], { exact: true }, options)
  useRenamedQueryClient().cancelQueries(['todos'])
  useRenamedQueryClient().cancelQueries(['todos'], { exact: true })
  useRenamedQueryClient().cancelQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}

export const ExamplesWithInvalidateQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.invalidateQueries(['todos'])
  queryClient.invalidateQueries(['todos'], { exact: true })
  queryClient.invalidateQueries(['todos'], { exact: true }, options)
  queryClient.invalidateQueries(['todos'])
  queryClient.invalidateQueries(['todos'], { exact: true })
  queryClient.invalidateQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  useRenamedQueryClient().invalidateQueries(['todos'])
  useRenamedQueryClient().invalidateQueries(['todos'], { exact: true })
  useRenamedQueryClient().invalidateQueries(['todos'], { exact: true }, options)
  useRenamedQueryClient().invalidateQueries(['todos'])
  useRenamedQueryClient().invalidateQueries(['todos'], { exact: true })
  useRenamedQueryClient().invalidateQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}

export const ExamplesWithRefetchQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.refetchQueries(['todos'])
  queryClient.refetchQueries(['todos'], { exact: true })
  queryClient.refetchQueries(['todos'], { exact: true }, options)
  queryClient.refetchQueries(['todos'])
  queryClient.refetchQueries(['todos'], { exact: true })
  queryClient.refetchQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  useRenamedQueryClient().refetchQueries(['todos'])
  useRenamedQueryClient().refetchQueries(['todos'], { exact: true })
  useRenamedQueryClient().refetchQueries(['todos'], { exact: true }, options)
  useRenamedQueryClient().refetchQueries(['todos'])
  useRenamedQueryClient().refetchQueries(['todos'], { exact: true })
  useRenamedQueryClient().refetchQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}

export const ExamplesWithRemoveQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.removeQueries(['todos'])
  queryClient.removeQueries(['todos'], { exact: true })
  queryClient.removeQueries(['todos'])
  queryClient.removeQueries(['todos'], { exact: true })
  // Direct hook call.
  useRenamedQueryClient().removeQueries(['todos'])
  useRenamedQueryClient().removeQueries(['todos'], { exact: true })
  useRenamedQueryClient().removeQueries(['todos'])
  useRenamedQueryClient().removeQueries(['todos'], { exact: true })

  return <div>Example Component</div>
}

export const ExamplesWithResetQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useRenamedQueryClient()
  queryClient.resetQueries(['todos'])
  queryClient.resetQueries(['todos'], { exact: true })
  queryClient.resetQueries(['todos'], { exact: true }, options)
  queryClient.resetQueries(['todos'])
  queryClient.resetQueries(['todos'], { exact: true })
  queryClient.resetQueries(['todos'], { exact: true }, options)
  // Direct hook call.
  useRenamedQueryClient().resetQueries(['todos'])
  useRenamedQueryClient().resetQueries(['todos'], { exact: true })
  useRenamedQueryClient().resetQueries(['todos'], { exact: true }, options)
  useRenamedQueryClient().resetQueries(['todos'])
  useRenamedQueryClient().resetQueries(['todos'], { exact: true })
  useRenamedQueryClient().resetQueries(['todos'], { exact: true }, options)

  return <div>Example Component</div>
}
