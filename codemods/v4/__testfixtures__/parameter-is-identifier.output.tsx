import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'

export const ExampleWithStringLiteralKey = () => {
  const stringLiteralKey = 'todos'
  useQuery([stringLiteralKey])
  useMutation([stringLiteralKey])
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries([stringLiteralKey])
  // --- Direct hook call.
  useQueryClient().cancelQueries([stringLiteralKey])

  return <div>Example Component</div>
}

export const ExampleWithTemplateLiteral = () => {
  const templateLiteralKey = `todos`
  useQuery([templateLiteralKey])
  useMutation([templateLiteralKey])
}

export const ExampleWithArrayExpressionKey = () => {
  const arrayExpressionKey = ['todos']
  useQuery(arrayExpressionKey)
  useMutation(arrayExpressionKey)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries(queryKey2)
  // --- Direct hook call.
  useQueryClient().cancelQueries(queryKey2)

  return <div>Example Component</div>
}

export const ExampleWithUnknownKey = () => {
  useQuery(unknownQueryKey)
  useMutation(unknownQueryKey)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries(unknownQueryKey)
  // --- Direct hook call.
  useQueryClient().cancelQueries(unknownQueryKey)

  return <div>Example Component</div>
}
