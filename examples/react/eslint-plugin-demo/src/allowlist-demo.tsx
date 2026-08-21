import { queryOptions } from '@tanstack/react-query'

export function todosOptions(userId: string) {
  const api = useApiClient()
  return queryOptions({
    // ✅ passes: 'api' is in allowlist.variables
    queryKey: ['todos', userId],
    queryFn: () => api.fetchTodos(userId),
  })
}

export function todosByApiOptions(userId: string) {
  const todoApi = useApiClient()
  // ❌ fails: 'api' is in allowlist.variables, but this variable is named 'todoApi'
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- The following dependencies are missing in your queryKey: todoApi
  return queryOptions({
    queryKey: ['todos', userId],
    queryFn: () => todoApi.fetchTodos(userId),
  })
}

export function todosWithTrackingOptions(
  tracker: AnalyticsClient,
  userId: string,
) {
  return queryOptions({
    // ✅ passes: AnalyticsClient is in allowlist.types
    queryKey: ['todos', userId],
    queryFn: async () => {
      tracker.track('todos')
      return fetch(`/api/todos?userId=${userId}`).then((r) => r.json())
    },
  })
}

export function todosWithClientOptions(client: ApiClient, userId: string) {
  // ❌ fails: AnalyticsClient is in allowlist.types, but this param is typed as ApiClient
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- The following dependencies are missing in your queryKey: client
  return queryOptions({
    queryKey: ['todos', userId],
    queryFn: () => client.fetchTodos(userId),
  })
}

interface ApiClient {
  fetchTodos: (userId: string) => Promise<Array<{ id: string }>>
}

interface AnalyticsClient {
  track: (event: string) => Promise<void>
}

function useApiClient(): ApiClient {
  throw new Error('not implemented')
}
