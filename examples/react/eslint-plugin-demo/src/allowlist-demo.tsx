import { queryOptions } from '@tanstack/react-query'

export function todosOptions(userId: string) {
  const api = getApiClient()
  return queryOptions({
    // ✅ passes: 'api' is in allowlist.variables
    queryKey: ['todos', userId],
    queryFn: () => fetchTodos(api, userId),
  })
}

export function todosByApiOptions(userId: string) {
  const todoApi = getApiClient()
  // ❌ fails: 'api' is in allowlist.variables, but this variable is named 'todoApi'
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- The following dependencies are missing in your queryKey: todoApi
  return queryOptions({
    queryKey: ['todos', userId],
    queryFn: () => fetchTodos(todoApi, userId),
  })
}

export function todosWithTrackingOptions(
  tracker: AnalyticsClient,
  userId: string,
) {
  return queryOptions({
    // ✅ passes: AnalyticsClient is in allowlist.types
    queryKey: ['todos', userId],
    queryFn: () => fetchTrackedTodos(tracker, userId),
  })
}

export function todosWithClientOptions(client: ApiClient, userId: string) {
  // ❌ fails: AnalyticsClient is in allowlist.types, but this param is typed as ApiClient
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- The following dependencies are missing in your queryKey: client
  return queryOptions({
    queryKey: ['todos', userId],
    queryFn: () => fetchTodos(client, userId),
  })
}

interface ApiClient {
  fetchTodos: (userId: string) => Promise<Array<{ id: string }>>
}

interface AnalyticsClient {
  track: (event: string) => Promise<void>
}

function getApiClient(): ApiClient {
  throw new Error('not implemented')
}

function fetchTodos(api: ApiClient, userId: string) {
  return api.fetchTodos(userId)
}

async function fetchTrackedTodos(tracker: AnalyticsClient, userId: string) {
  await tracker.track('todos')
  return fetch(`/api/todos?userId=${userId}`).then((r) => r.json())
}
