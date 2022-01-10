import * as React from 'react'
import { useQueryClient } from 'react-query'

export const ExamplesWithCancelQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  // The 'queryKey1' should be an element of an array.
  const queryKey1 = 'todos-1'
  queryClient.cancelQueries([queryKey1])
  // Regarding the 'queryKey2' is an array expression by default, the parameter should be untouched.
  const queryKey2 = ['todos-2']
  queryClient.cancelQueries(queryKey2)
  // The declaration of 'unknownQueryKey' is not in this file, so the parameter should be untouched, but the codemod
  // should log a warning to the console.
  queryClient.cancelQueries(unknownQueryKey)
  // Direct hook call.
  useQueryClient().cancelQueries([queryKey1])
  useQueryClient().cancelQueries(queryKey2)
  useQueryClient().cancelQueries(unknownQueryKey)

  return <div>Example Component</div>
}

export const ExamplesWithInvalidateQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  // The 'queryKey1' should be an element of an array.
  const queryKey1 = 'todos-1'
  queryClient.invalidateQueries([queryKey1])
  // Regarding the 'queryKey2' is an array expression by default, the parameter should be untouched.
  const queryKey2 = ['todos-2']
  queryClient.invalidateQueries(queryKey2)
  // The declaration of 'unknownQueryKey' is not in this file, so the parameter should be untouched, but the codemod
  // should log a warning to the console.
  queryClient.invalidateQueries(unknownQueryKey)
  // Direct hook call.
  useQueryClient().invalidateQueries([queryKey1])
  useQueryClient().invalidateQueries(queryKey2)
  useQueryClient().invalidateQueries(unknownQueryKey)

  return <div>Example Component</div>
}

export const ExamplesWithRefetchQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  // The 'queryKey1' should be an element of an array.
  const queryKey1 = 'todos-1'
  queryClient.refetchQueries([queryKey1])
  // Regarding the 'queryKey2' is an array expression by default, the parameter should be untouched.
  const queryKey2 = ['todos-2']
  queryClient.refetchQueries(queryKey2)
  // The declaration of 'unknownQueryKey' is not in this file, so the parameter should be untouched, but the codemod
  // should log a warning to the console.
  queryClient.refetchQueries(unknownQueryKey)
  // Direct hook call.
  useQueryClient().refetchQueries([queryKey1])
  useQueryClient().refetchQueries(queryKey2)
  useQueryClient().refetchQueries(unknownQueryKey)

  return <div>Example Component</div>
}

export const ExamplesWithRemoveQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  // The 'queryKey1' should be an element of an array.
  const queryKey1 = 'todos-1'
  queryClient.removeQueries([queryKey1])
  // Regarding the 'queryKey2' is an array expression by default, the parameter should be untouched.
  const queryKey2 = ['todos-2']
  queryClient.removeQueries(queryKey2)
  // The declaration of 'unknownQueryKey' is not in this file, so the parameter should be untouched, but the codemod
  // should log a warning to the console.
  queryClient.removeQueries(unknownQueryKey)
  // Direct hook call.
  useQueryClient().removeQueries([queryKey1])
  useQueryClient().removeQueries(queryKey2)
  useQueryClient().removeQueries(unknownQueryKey)

  return <div>Example Component</div>
}

export const ExamplesWithResetQueriesMethodCall = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  // The 'queryKey1' should be an element of an array.
  const queryKey1 = 'todos-1'
  queryClient.resetQueries([queryKey1])
  // Regarding the 'queryKey2' is an array expression by default, the parameter should be untouched.
  const queryKey2 = ['todos-2']
  queryClient.resetQueries(queryKey2)
  // The declaration of 'unknownQueryKey' is not in this file, so the parameter should be untouched, but the codemod
  // should log a warning to the console.
  queryClient.resetQueries(unknownQueryKey)
  // Direct hook call.
  useQueryClient().resetQueries([queryKey1])
  useQueryClient().resetQueries(queryKey2)
  useQueryClient().resetQueries(unknownQueryKey)

  return <div>Example Component</div>
}
