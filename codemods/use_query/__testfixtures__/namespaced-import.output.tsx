import * as React from 'react'
import * as RQ from 'react-query'

export const ExamplesWithUseQuery = () => {
  // The query key should be transformed into an array.
  RQ.useQuery(['todos'])
  // The query key should be transformed into an array.
  RQ.useQuery(['todos'], fetchTodos)
  // The query key should stay as it is.
  RQ.useQuery(['todos'], fetchTodos, { staleTime: 1000 })
  // The query key should stay as it is.
  RQ.useQuery(['todos'], { queryFn: fetchTodos, staleTime: 1000 })
  // The query key should be transformed into an array, the 'queryKey' property remains in the object.
  RQ.useQuery(['todos'], {
    queryKey: ['notTodos'],
    queryFn: fetchTodos,
    staleTime: 1000,
  })
  // The 'stringKey' in the hook call should be in array in both cases.
  const stringKey = 'todos'
  RQ.useQuery([stringKey], { queryFn: fetchTodos, staleTime: 1000 })
  RQ.useQuery({
    queryKey: [stringKey],
    queryFn: fetchTodos,
    staleTime: 1000
  })
  // The 'arrayKey' in the hook call should stay as it is.
  const arrayKey = ['todos']
  RQ.useQuery(arrayKey, { queryFn: fetchTodos, staleTime: 1000 })
  // It should trigger a warning on the console.
  const notExistingKey = createKey()
  RQ.useQuery(notExistingKey, { queryFn: fetchTodos, staleTime: 1000 })
  // The query key should be an array element in case of 'RQ.useQuery' function call.
  const useQuery = () => RQ.useQuery(['todos'], {})

  return <div>Example Component</div>
}

export const ExamplesWithUseInfiniteQuery = () => {
  // The query key should be transformed into an array.
  RQ.useInfiniteQuery(['todos'])
  // The query key should be transformed into an array.
  RQ.useInfiniteQuery(['todos'], fetchTodos)
  // The query key should stay as it is.
  RQ.useInfiniteQuery(['todos'], fetchTodos, { staleTime: 1000 })
  // The query key should stay as it is.
  RQ.useInfiniteQuery(['todos'], { queryFn: fetchTodos, staleTime: 1000 })
  // The query key should be transformed into an array, the 'queryKey' property remains in the object.
  RQ.useInfiniteQuery(['todos'], {
    queryKey: ['notTodos'],
    queryFn: fetchTodos,
    staleTime: 1000,
  })
  // The 'stringKey' in the hook call should be in array in both cases.
  const stringKey = 'todos'
  RQ.useInfiniteQuery([stringKey], { queryFn: fetchTodos, staleTime: 1000 })
  RQ.useInfiniteQuery({
    queryKey: [stringKey],
    queryFn: fetchTodos,
    staleTime: 1000
  })
  // The 'arrayKey' in the hook call should stay as it is.
  const arrayKey = ['todos']
  RQ.useInfiniteQuery(arrayKey, { queryFn: fetchTodos, staleTime: 1000 })
  // It should trigger a warning on the console.
  const notExistingKey = createKey()
  RQ.useInfiniteQuery(notExistingKey, {
    queryFn: fetchTodos,
    staleTime: 1000,
  })

  return <div>Example Component</div>
}
