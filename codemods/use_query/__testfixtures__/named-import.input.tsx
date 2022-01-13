import * as React from 'react'
import {
  useQuery as useRenamedQuery,
  useInfiniteQuery as useRenamedInfiniteQuery,
} from 'react-query'

export const ExamplesWithUseQuery = () => {
  // The query key should be transformed into an array.
  useRenamedQuery('todos')
  // The query key should be transformed into an array.
  useRenamedQuery('todos', fetchTodos)
  // The query key should stay as it is.
  useRenamedQuery(['todos'], fetchTodos, { staleTime: 1000 })
  // The query key should stay as it is.
  useRenamedQuery(['todos'], { queryFn: fetchTodos, staleTime: 1000 })
  // The query key should be transformed into an array, the 'queryKey' property remains in the object.
  useRenamedQuery('todos', {
    queryKey: ['notTodos'],
    queryFn: fetchTodos,
    staleTime: 1000,
  })
  // The 'stringKey' in the hook call should be in array in both cases.
  const stringKey = 'todos'
  useRenamedQuery(stringKey, { queryFn: fetchTodos, staleTime: 1000 })
  useRenamedQuery({ queryKey: stringKey, queryFn: fetchTodos, staleTime: 1000 })
  // The 'arrayKey' in the hook call should stay as it is.
  const arrayKey = ['todos']
  useRenamedQuery(arrayKey, { queryFn: fetchTodos, staleTime: 1000 })
  // It should trigger a warning on the console.
  const notExistingKey = createKey()
  useRenamedQuery(notExistingKey, { queryFn: fetchTodos, staleTime: 1000 })
  // The query key should be an array element in case of 'useRenamedQuery' function call.
  const useQuery = () => useRenamedQuery('todos', {})

  return <div>Example Component</div>
}

export const ExamplesWithUseInfiniteQuery = () => {
  // The query key should be transformed into an array.
  useRenamedInfiniteQuery('todos')
  // The query key should be transformed into an array.
  useRenamedInfiniteQuery('todos', fetchTodos)
  // The query key should stay as it is.
  useRenamedInfiniteQuery(['todos'], fetchTodos, { staleTime: 1000 })
  // The query key should stay as it is.
  useRenamedInfiniteQuery(['todos'], { queryFn: fetchTodos, staleTime: 1000 })
  // The query key should be transformed into an array, the 'queryKey' property remains in the object.
  useRenamedInfiniteQuery('todos', {
    queryKey: ['notTodos'],
    queryFn: fetchTodos,
    staleTime: 1000,
  })
  // The 'stringKey' in the hook call should be in array in both cases.
  const stringKey = 'todos'
  useRenamedInfiniteQuery(stringKey, { queryFn: fetchTodos, staleTime: 1000 })
  useRenamedInfiniteQuery({
    queryKey: stringKey,
    queryFn: fetchTodos,
    staleTime: 1000,
  })
  // The 'arrayKey' in the hook call should stay as it is.
  const arrayKey = ['todos']
  useRenamedInfiniteQuery(arrayKey, { queryFn: fetchTodos, staleTime: 1000 })
  // It should trigger a warning on the console.
  const notExistingKey = createKey()
  useRenamedInfiniteQuery(notExistingKey, {
    queryFn: fetchTodos,
    staleTime: 1000,
  })

  return <div>Example Component</div>
}
