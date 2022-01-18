import * as React from 'react'
import { useQueryClient } from 'react-query'

// The 'queryKey1' should be an element of an array.
export const ExampleWithStringLiteralKey = () => {
  const queryKey1 = 'todos'
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries([queryKey1])
  // Direct hook call.
  useQueryClient().cancelQueries([queryKey1])

  return <div>Example Component</div>
}

// Regarding the 'queryKey2' is an array expression by default, the parameter should be untouched.
export const ExampleWithArrayExpressionKey = () => {
  const queryKey2 = ['todos']
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries(queryKey2)
  // Direct hook call.
  useQueryClient().cancelQueries(queryKey2)

  return <div>Example Component</div>
}

// The declaration of 'unknownQueryKey' is not in this file, so the parameter should be untouched, but the codemod
// should log a warning to the console.
export const ExampleWithUnknownKey = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries(unknownQueryKey)
  // Direct hook call.
  useQueryClient().cancelQueries(unknownQueryKey)

  return <div>Example Component</div>
}
