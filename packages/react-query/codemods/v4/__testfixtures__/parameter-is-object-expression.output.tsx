import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'

const options = {}

export const ExampleWithStringLiteral = () => {
  useQuery({
    queryKey: ['todos'],
    exact: true
  }, options)
  useMutation({
    mutationKey: ['todos'],
    exact: true
  }, options)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  // --- Direct hook call.
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExampleWithStringLiteralIdentifier = () => {
  const stringLiteralKey = 'todos'
  useQuery({
    queryKey: [stringLiteralKey],
    exact: true
  }, options)
  useMutation({
    mutationKey: [stringLiteralKey],
    exact: true
  }, options)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: [stringLiteralKey],
    exact: true
  }, options)
  // --- Direct hook call.
  useQueryClient().cancelQueries({
    queryKey: [stringLiteralKey],
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExampleWithTemplateLiteral = () => {
  useQuery({
    queryKey: [`todos`],
    exact: true
  }, options)
  useMutation({
    mutationKey: [`todos`],
    exact: true
  }, options)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: [`todos`],
    exact: true
  }, options)
  // --- Direct hook call.
  useQueryClient().cancelQueries({
    queryKey: [`todos`],
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExampleWithTemplateLiteralIdentifier = () => {
  const templateLiteralKey = `todos`
  useQuery({
    queryKey: [templateLiteralKey],
    exact: true
  }, options)
  useMutation({
    mutationKey: [templateLiteralKey],
    exact: true
  }, options)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: [templateLiteralKey],
    exact: true
  }, options)
  // --- Direct hook call.
  useQueryClient().cancelQueries({
    queryKey: [templateLiteralKey],
    exact: true
  }, options)

  return <div>Example Component</div>
}

export const ExampleWithArrayExpression = () => {
  useQuery({ queryKey: ['todos'], exact: true }, options)
  useMutation({ mutationKey: ['todos'], exact: true }, options)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: ['todos'], exact: true }, options)
  // --- Direct hook call.
  useQueryClient().cancelQueries({ queryKey: ['todos'], exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithArrayExpressionIdentifier = () => {
  const arrayExpressionKey = ['todos']
  useQuery({ queryKey: arrayExpressionKey, exact: true }, options)
  useMutation({ mutationKey: arrayExpressionKey, exact: true }, options)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: arrayExpressionKey, exact: true }, options)
  // --- Direct hook call.
  useQueryClient().cancelQueries({ queryKey: arrayExpressionKey, exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithUnknownIdentifier1 = () => {
  const createKey = (id) => ['todos', id]
  const createdKey1 = createKey(1)
  useQuery({ queryKey: createdKey1, exact: true }, options)
  useMutation({ mutationKey: createdKey1, exact: true }, options)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: createdKey1, exact: true }, options)
  // --- Direct hook call.
  useQueryClient().cancelQueries({ queryKey: createdKey1, exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithUnknownIdentifier2 = () => {
  const createdKey2 = createKey()
  useQuery({ queryKey: createdKey2, exact: true }, options)
  useMutation({ mutationKey: createdKey2, exact: true }, options)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: createdKey2, exact: true }, options)
  // --- Direct hook call.
  useQueryClient().cancelQueries({ queryKey: createdKey2, exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithUnknownIdentifier3 = () => {
  useQuery({ queryKey: unknownQueryKey, exact: true }, options)
  useMutation({ mutationKey: unknownQueryKey, exact: true }, options)
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({ queryKey: unknownQueryKey, exact: true }, options)
  // --- Direct hook call.
  useQueryClient().cancelQueries({ queryKey: unknownQueryKey, exact: true }, options)

  return <div>Example Component</div>
}
