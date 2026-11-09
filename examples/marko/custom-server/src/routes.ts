// Marko pages must be imported from a JS module so @marko/vite treats them as
// entries and injects the browser assets.
import { noop } from '@tanstack/marko-query'
import infinite from './pages/infinite.marko'
import todos from './pages/todos.marko'
import { todoFeedQueryOptions, todosQueryOptions } from './lib/queries.ts'
import type { QueryClient } from '@tanstack/marko-query'

interface Route {
  template: typeof todos
  prefetch?: (client: QueryClient) => Promise<unknown>
}

export const routes: Record<string, Route> = {
  '/': {
    template: todos,
    prefetch: (client) => client.query(todosQueryOptions).catch(noop),
  },
  '/infinite': {
    template: infinite,
    prefetch: (client) =>
      client.infiniteQuery(todoFeedQueryOptions).catch(noop),
  },
}
