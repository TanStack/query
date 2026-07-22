# TanStack Query for Octane

Official Octane bindings for [TanStack Query](https://tanstack.com/query).
The package reuses `@tanstack/query-core` and exposes the same query, mutation,
suspense, hydration, and error-reset primitives as the React adapter through
Octane hooks and components.

```tsrx
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/octane-query'

const queryClient = new QueryClient()

function Todos() @{
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  @if (query.isPending) {
    <span>{'Loading'}</span>
  } @else if (query.isError) {
    <span>{query.error.message}</span>
  } @else {
    <ul>{query.data as unknown}</ul>
  }
}

function App() @{
  <QueryClientProvider client={queryClient}>
    <Todos />
  </QueryClientProvider>
}
```

## API coverage

- Queries: `useQuery`, `useInfiniteQuery`, `useSuspenseQuery`,
  `useSuspenseInfiniteQuery`, `useQueries`, `useSuspenseQueries`,
  `usePrefetchQuery`, and `usePrefetchInfiniteQuery`
- Mutations and status: `useMutation`, `useMutationState`, `useIsFetching`, and
  `useIsMutating`
- Context and boundaries: `QueryClientProvider`, `useQueryClient`,
  `QueryClientContext`, `HydrationBoundary`, `IsRestoringProvider`,
  `useIsRestoring`, `QueryErrorResetBoundary`, and
  `useQueryErrorResetBoundary`
- Query Core: every export from `@tanstack/query-core`, including
  `QueryClient`, `dehydrate`, and `hydrate`

The separate React companion packages, including React Query Devtools and
`@tanstack/react-query-persist-client`, are not part of this adapter.

## Suspense, errors, and hydration

Suspense hooks integrate with Octane's `use(thenable)` semantics. Catch pending
and error states with Octane's `Suspense` and `ErrorBoundary` components or its
`@pending` and `@catch` directives. Use `QueryErrorResetBoundary` or
`useQueryErrorResetBoundary` when a retry must reset a failed query.

For server rendering, create a `QueryClient` per request. The adapter re-exports
Query Core's `dehydrate` and `hydrate`, and `HydrationBoundary` also accepts
streamed dehydrated queries. `IsRestoringProvider` can pause fetching while a
persisted cache is restored.

The package publishes TSRX source so the Octane compiler can produce the
correct client and server output. Its manifest marks the binding hooks as
manually slotted; consumers should use the standard Octane Vite integration.
It is a compiler-source package, not a direct Node.js runtime entry point.
