import {
  useQuery,
  useQueryClient,
  queryOptions,
  select,
  invalidateQueries,
  getQueryData,
} from '@tanstack/react-query'
import { todoOptions, todosOptions } from './queries'

// ✅ passes: consuming imported queryOptions result directly
export function Todos() {
  const query = useQuery(todosOptions)
  return query.data
}

// ✅ passes: spreading imported queryOptions result with additional options
export function Todo({ id }: { id: string }) {
  const query = useQuery(
    queryOptions({
      ...todoOptions(id),
      select: select((data) => data.title),
    }),
  )
  return query.data
}

// ✅ passes: referencing queryKey from imported queryOptions result
export function invalidateTodos() {
  const queryClient = useQueryClient()
  invalidateQueries(queryClient, { queryKey: todosOptions.queryKey })
}

// ❌ fails: inline queryKey + queryFn should use queryOptions()
export function TodosBad() {
  // Raw options are rejected by the hook's public types as well as the rule.
  /* eslint-disable @tanstack/query/prefer-query-options -- Demonstrates the inline options diagnostic. */
  const query = useQuery(
    // @ts-expect-error -- a queryOptions descriptor is required
    {
      queryKey: ['todos'],
      queryFn: () => fetch('/api/todos').then((r) => r.json()),
    },
  )
  /* eslint-enable @tanstack/query/prefer-query-options */
  return query.data
}

// ❌ fails: inline queryKey should reference queryOptions result
export function InvalidateTodosBad() {
  const queryClient = useQueryClient()
  // eslint-disable-next-line @tanstack/query/prefer-query-options -- Prefer referencing a queryKey from a queryOptions() result instead of typing it manually.
  invalidateQueries(queryClient, { queryKey: ['todos'] })
}

// ❌ fails: inline queryKey as direct parameter
export function GetTodosDataBad() {
  const queryClient = useQueryClient()
  // eslint-disable-next-line @tanstack/query/prefer-query-options -- Prefer referencing a queryKey from a queryOptions() result instead of typing it manually.
  return getQueryData(queryClient, ['todos'])
}
