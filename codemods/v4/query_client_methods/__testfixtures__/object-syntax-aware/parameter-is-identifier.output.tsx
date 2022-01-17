import * as React from 'react'
import { useQueryClient } from 'react-query'

export const Examples = () => {
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
