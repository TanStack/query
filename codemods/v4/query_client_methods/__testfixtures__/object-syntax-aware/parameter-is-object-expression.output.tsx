import * as React from 'react'
import { useQueryClient } from 'react-query'

const options = {}

export const Examples = () => {
  // Instantiated hook call.
  const queryClient = useQueryClient()
  queryClient.cancelQueries({
    queryKey: ['todos']
  })
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  queryClient.cancelQueries({
    queryKey: ['todos']
  })
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  })
  queryClient.cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  // Direct hook call.
  useQueryClient().cancelQueries({
    queryKey: ['todos']
  })
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)
  useQueryClient().cancelQueries({
    queryKey: ['todos']
  })
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  })
  useQueryClient().cancelQueries({
    queryKey: ['todos'],
    exact: true
  }, options)

  return <div>Example Component</div>
}
