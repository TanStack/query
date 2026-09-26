import { useQuery, useQueryClient } from '@tanstack/react-query'
import { todoOptions, todosOptions } from './queries'

// ✅ passes: consuming imported queryOptions result directly
export function Todos() {
  const query = useQuery(todosOptions)
  return query.data
}

// ✅ passes: spreading imported queryOptions result with additional options
export function Todo({ id }: { id: string }) {
  const query = useQuery({
    ...todoOptions(id),
    select: (data) => data.title,
  })
  return query.data
}

// ✅ passes: referencing queryKey from imported queryOptions result
export function invalidateTodos() {
  const queryClient = useQueryClient()
  queryClient.invalidateQueries({ queryKey: todosOptions.queryKey })
}

// ❌ fails: inline queryKey + queryFn should use queryOptions()
export function TodosBad() {
  const query = useQuery(
    // eslint-disable-next-line @tanstack/query/prefer-query-options -- Prefer using queryOptions() or infiniteQueryOptions() to co-locate queryKey and queryFn.
    {
      queryKey: ['todos'],
      queryFn: () => fetch('/api/todos').then((r) => r.json()),
    },
  )
  return query.data
}

// ❌ fails: inline queryKey should reference queryOptions result
export function InvalidateTodosBad() {
  const queryClient = useQueryClient()
  // eslint-disable-next-line @tanstack/query/prefer-query-options -- Prefer referencing a queryKey from a queryOptions() result instead of typing it manually.
  queryClient.invalidateQueries({ queryKey: ['todos'] })
}

// ❌ fails: inline queryKey as direct parameter
export function GetTodosDataBad() {
  const queryClient = useQueryClient()
  // eslint-disable-next-line @tanstack/query/prefer-query-options -- Prefer referencing a queryKey from a queryOptions() result instead of typing it manually.
  return queryClient.getQueryData(['todos'])
}
