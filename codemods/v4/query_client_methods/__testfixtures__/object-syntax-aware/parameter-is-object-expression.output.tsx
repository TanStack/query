import * as React from 'react'
import { useQueryClient } from 'react-query'

const options = {}

export const ExampleWithStringLiteral = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExampleWithStringLiteralIdentifier = () => {
  const queryKey1 = 'todos'
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: [queryKey1],
    exact: true
  }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({
    queryKey: [queryKey1],
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExampleWithArrayExpression = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExampleWithArrayExpressionIdentifier = () => {
  const queryKey2 = ['todos']
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: queryKey2,
    exact: true
  }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({
    queryKey: queryKey2,
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExampleWithUnknownIdentifier1 = () => {
  const createKey = (id) => ['todos', id]
  const createdKey1 = createKey(1)
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: createdKey1, exact: true }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({ queryKey: createdKey1, exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithUnknownIdentifier2 = () => {
  const createdKey2 = createKey()
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: createdKey2, exact: true }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({ queryKey: createdKey2, exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithUnknownIdentifier3 = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: unknownQueryKey, exact: true }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({ queryKey: unknownQueryKey, exact: true }, options)

  return <div>Example Component</div>
}
