import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from '@tanstack/marko-query'
import {
  createTodo,
  fetchBroken,
  fetchSlowTodoPage,
  fetchTodoPage,
  listTodos,
  toggleTodo,
} from './api.ts'
import {
  brokenQueryKey,
  todoCountQueryKey,
  todoFeedQueryKey,
  todoPageQueryKey,
  todoSlowQueryKey,
  todoSubscribedQueryKey,
  todoUncachedQueryKey,
  todosQueryKey,
} from './query-keys.ts'

export const PAGE_SIZE = 5

// The `queryOptions` wrapper is only needed here, outside a tag: it gives the
// object a contextual type so `queryFn`'s return type flows into `data`. Inside
// an `options() { ... }` accessor the tag already supplies that type, so a plain
// object literal is enough there.
export const todosQueryOptions = queryOptions({
  queryKey: todosQueryKey,
  queryFn: listTodos,
})

export const todoPageQueryOptions = (page: number) =>
  queryOptions({
    queryKey: todoPageQueryKey(page),
    queryFn: () => fetchTodoPage({ page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })

export const todoFeedQueryOptions = infiniteQueryOptions({
  queryKey: todoFeedQueryKey,
  queryFn: ({ pageParam }) =>
    fetchTodoPage({ limit: PAGE_SIZE, cursor: pageParam }),
  initialPageParam: '',
  getNextPageParam: (last) => last.nextCursor ?? undefined,
})

export const todoSlowQueryOptions = queryOptions({
  queryKey: todoSlowQueryKey,
  queryFn: fetchSlowTodoPage,
})

export const todoCountQueryOptions = (filter: 'all' | 'completed' | 'active') =>
  queryOptions({
    queryKey: todoCountQueryKey(filter),
    queryFn: async () => {
      const todos = await listTodos()
      if (filter === 'all') return todos.length
      return todos.filter((todo) => todo.completed === (filter === 'completed'))
        .length
    },
  })

export const brokenQueryOptions = queryOptions({
  queryKey: brokenQueryKey,
  queryFn: fetchBroken,
  retry: false,
})

export const devtoolsQueryOptions = queryOptions({
  queryKey: [...todosQueryKey, 'devtools'] as const,
  queryFn: listTodos,
})

export const selectQueryOptions = queryOptions({
  queryKey: [...todosQueryKey, 'select'] as const,
  queryFn: listTodos,
  select: (todos) => todos.map((todo) => todo.title),
})

// The same failing query, but the tag throws instead of returning `isError`.
// `retryOnMount: false` keeps the observer from refetching on mount, so the
// error is not masked by a fetch in flight.
export const brokenThrowQueryOptions = queryOptions({
  queryKey: [...brokenQueryKey, 'throw'] as const,
  queryFn: fetchBroken,
  retry: false,
  retryOnMount: false,
  throwOnError: true,
})

export const createTodoMutationOptions = {
  mutationFn: createTodo,
}

export const toggleTodoMutationOptions = {
  mutationFn: toggleTodo,
}

// Two tags read this key. The prefetched copies are what the frozen tag shows.
export const subscribedQueryOptions = queryOptions({
  queryKey: todoSubscribedQueryKey,
  queryFn: listTodos,
})

// Deliberately never prefetched, so the page can show that an opted-out tag
// starts no fetch and reports `fetchStatus: 'idle'` instead of `fetching`.
export const uncachedQueryOptions = queryOptions({
  queryKey: todoUncachedQueryKey,
  queryFn: listTodos,
})
