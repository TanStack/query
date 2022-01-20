import * as React from 'react'
import { QueryCache, QueryClient, useQueryClient } from 'react-query'

export const Examples = () => {
  // NewExpression
  const queryCache1 = new QueryCache({
    onError: (error) => console.log(error),
    onSuccess: (success) => console.log(success)
  })
  queryCache1.find('todos')
  queryCache1.findAll('todos')
  // Instantiated
  const queryClient1 = useQueryClient()
  queryClient1.getQueryCache().find('todos')
  queryClient1.getQueryCache().findAll('todos')
  // ---
  const queryClient2 = new QueryClient({})
  queryClient2.getQueryCache().find('todos')
  queryClient2.getQueryCache().findAll('todos')
  // ---
  const queryCache2 = queryClient1.getQueryCache()
  queryCache2.find('todos')
  queryCache2.findAll('todos')
  // Direct
  useQueryClient().getQueryCache().find('todos')
  useQueryClient().getQueryCache().findAll('todos')
  // ---
  const queryCache3 = useQueryClient().getQueryCache()
  queryCache3.find('todos')
  queryCache3.findAll('todos')
}
