import * as React from 'react'
import { useMutation, useQuery } from 'react-query'

export const ExampleWithStringLiteralKey = () => {
  const stringLiteralKey = 'todos'
  useQuery([stringLiteralKey])
  useMutation([stringLiteralKey])

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

  return <div>Example Component</div>
}

export const ExampleWithUnknownKey = () => {
  useQuery(unknownQueryKey)
  useMutation(unknownQueryKey)

  return <div>Example Component</div>
}
