import * as React from 'react'
import { useQueryClient } from 'react-query'

const options = {}

export const ExampleWithStringLiteral = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: 'todos', exact: true }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({ queryKey: 'todos', exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithStringLiteralIdentifier = () => {
  const queryKey1 = 'todos'
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: queryKey1, exact: true }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({ queryKey: queryKey1, exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithArrayExpression = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: ['todos'], exact: true }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({ queryKey: ['todos'], exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithArrayExpressionIdentifier = () => {
  const queryKey2 = ['todos']
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: queryKey2, exact: true }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({ queryKey: queryKey2, exact: true }, options)

  return <div>Example Component</div>
}
