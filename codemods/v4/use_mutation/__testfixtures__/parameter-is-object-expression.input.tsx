import * as React from 'react'
import { useMutation } from 'react-query'

const options = {}

export const ExampleWithStringLiteral = () => {
  useMutation({ mutationKey: 'todos', exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithStringLiteralIdentifier = () => {
  const queryKey1 = 'todos'
  useMutation({ mutationKey: queryKey1, exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithArrayExpression = () => {
  useMutation({ mutationKey: ['todos'], exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithArrayExpressionIdentifier = () => {
  const queryKey2 = ['todos']
  useMutation({ mutationKey: queryKey2, exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithUnknownIdentifier1 = () => {
  const createKey = (id) => ['todos', id]
  const createdKey1 = createKey(1)
  useMutation({ mutationKey: createdKey1, exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithUnknownIdentifier2 = () => {
  const createdKey2 = createKey()
  useMutation({ mutationKey: createdKey2, exact: true }, options)

  return <div>Example Component</div>
}

export const ExampleWithUnknownIdentifier3 = () => {
  useMutation({ mutationKey: unknownQueryKey, exact: true }, options)

  return <div>Example Component</div>
}

