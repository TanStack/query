import * as React from 'react'
import { useQuery, useInfiniteQuery } from 'react-query'

export const ExamplesWithUseQuery = () => {
  // The query key should be transformed into an array.
  useQuery(['todos'])
  // The query key should be transformed into an array.
  useQuery(['todos'], fetchTodos)
  // The query key should stay as it is.
  useQuery(['todos'], fetchTodos, { staleTime: 1000 })
  // The query key should stay as it is.
  useQuery(['todos'], { queryFn: fetchTodos, staleTime: 1000 })
  // The query key should be transformed into an array, the 'queryKey' property remains in the object.
  useQuery(['todos'], {
    queryKey: ['notTodos'],
    queryFn: fetchTodos,
    staleTime: 1000,
  })
  // The 'stringKey' in the hook call should be in array in both cases.
  const stringKey = 'todos'
  useQuery([stringKey], { queryFn: fetchTodos, staleTime: 1000 })
  useQuery({
    queryKey: [stringKey],
    queryFn: fetchTodos,
    staleTime: 1000
  })
  // The 'arrayKey' in the hook call should stay as it is.
  const arrayKey = ['todos']
  useQuery(arrayKey, { queryFn: fetchTodos, staleTime: 1000 })
  // It should trigger a warning on the console.
  const notExistingKey = createKey()
  useQuery(notExistingKey, { queryFn: fetchTodos, staleTime: 1000 })

  return <div>Example Component</div>
}

export const ExamplesWithUseInfiniteQuery = () => {
  // The query key should be transformed into an array.
  useInfiniteQuery(['todos'])
  // The query key should be transformed into an array.
  useInfiniteQuery(['todos'], fetchTodos)
  // The query key should stay as it is.
  useInfiniteQuery(['todos'], fetchTodos, { staleTime: 1000 })
  // The query key should stay as it is.
  useInfiniteQuery(['todos'], { queryFn: fetchTodos, staleTime: 1000 })
  // The query key should be transformed into an array, the 'queryKey' property remains in the object.
  useInfiniteQuery(['todos'], {
    queryKey: ['notTodos'],
    queryFn: fetchTodos,
    staleTime: 1000,
  })
  // The 'stringKey' in the hook call should be in array in both cases.
  const stringKey = 'todos'
  useInfiniteQuery([stringKey], { queryFn: fetchTodos, staleTime: 1000 })
  useInfiniteQuery({
    queryKey: [stringKey],
    queryFn: fetchTodos,
    staleTime: 1000
  })
  // The 'arrayKey' in the hook call should stay as it is.
  const arrayKey = ['todos']
  useInfiniteQuery(arrayKey, { queryFn: fetchTodos, staleTime: 1000 })
  // It should trigger a warning on the console.
  const notExistingKey = createKey()
  useInfiniteQuery(notExistingKey, { queryFn: fetchTodos, staleTime: 1000 })

  return <div>Example Component</div>
}
