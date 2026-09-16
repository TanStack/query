---
id: migrating-from-ngneat-query
title: Migrating from ngneat/query
---

Angular Query requires Angular 20.1 or newer.

This guide uses `@ngneat/query` in its examples. The same migration applies to its
`@openng/query` fork.

## Replace the packages

Remove whichever legacy package name your application uses, along with its devtools package. The
stable adapter includes `@tanstack/query-core` as a dependency, so remove a direct installation
unless your application imports it independently.

```bash
npm uninstall @ngneat/query @ngneat/query-devtools @tanstack/query-core
npm install @tanstack/angular-query @tanstack/angular-query-devtools
```

If you use OpenNG, uninstall `@openng/query` and `@openng/query-devtools` instead.

## Configure the `QueryClient`

Replace `provideQueryClientOptions` with a `QueryClient` factory passed to
`provideTanStackQuery`. The factory runs in an Angular injection context, so it can call `inject()`
when building caches or default options.

```ts
import { QueryCache } from '@ngneat/query' // [!code --]
import { provideQueryClientOptions } from '@ngneat/query' // [!code --]
import { QueryCache, QueryClient } from '@tanstack/angular-query' // [!code ++]
import { provideTanStackQuery } from '@tanstack/angular-query' // [!code ++]

const queryClientConfig = {
  queryCache: new QueryCache({ onError: handleError }),
}

providers: [
  provideQueryClientOptions(queryClientConfig), // [!code --]
  provideTanStackQuery(() => new QueryClient(queryClientConfig)), // [!code ++]
]
```

## Migrate queries

The legacy `injectQuery()` call returned a function that accepted query options. The stable API
accepts a reactive options callback and returns the query result directly.

```ts
private readonly useQuery = injectQuery() // [!code --]

readonly todos = this.useQuery({ // [!code --]
  queryKey: ['todos'], // [!code --]
  queryFn: fetchTodos, // [!code --]
}) // [!code --]
readonly todos = injectQuery(() => ({ // [!code ++]
  queryKey: ['todos'], // [!code ++]
  queryFn: fetchTodos, // [!code ++]
})) // [!code ++]
```

Read signals inside the callback to update options reactively. This replaces calling
`updateOptions` yourself.

```ts
readonly filter = signal('')
private readonly useQuery = injectQuery() // [!code --]
readonly todos = this.useQuery({ // [!code --]
  queryKey: ['todos', this.filter()], // [!code --]
  queryFn: () => fetchTodos(this.filter()), // [!code --]
}) // [!code --]
readonly todos = injectQuery(() => ({ // [!code ++]
  queryKey: ['todos', this.filter()], // [!code ++]
  queryFn: () => fetchTodos(this.filter()), // [!code ++]
})) // [!code ++]
```

When a helper must be called from a callback that is not already in an injection context, use
Angular's `runInInjectionContext` at the call site:

```ts
runInInjectionContext(injector, () => injectQuery(() => queryOptions))
```

## Migrate infinite queries and mutations

`injectInfiniteQuery` and `injectMutation` use the same callback pattern:

```ts
private readonly useInfiniteQuery = injectInfiniteQuery() // [!code --]
readonly posts = this.useInfiniteQuery({ // [!code --]
  queryKey: ['posts'], // [!code --]
  queryFn: ({ pageParam }) => fetchPosts(pageParam), // [!code --]
  initialPageParam: 0, // [!code --]
  getNextPageParam: (lastPage) => lastPage.nextId, // [!code --]
}) // [!code --]
readonly posts = injectInfiniteQuery(() => ({ // [!code ++]
  queryKey: ['posts'], // [!code ++]
  queryFn: ({ pageParam }) => fetchPosts(pageParam), // [!code ++]
  initialPageParam: 0, // [!code ++]
  getNextPageParam: (lastPage) => lastPage.nextId, // [!code ++]
})) // [!code ++]
```

```ts
private readonly useMutation = injectMutation() // [!code --]
readonly addTodo = this.useMutation({ // [!code --]
  mutationFn: addTodo, // [!code --]
}) // [!code --]
readonly addTodo = injectMutation(() => ({ // [!code ++]
  mutationFn: addTodo, // [!code ++]
})) // [!code ++]
```

Imperative methods remain direct methods, for example `addTodo.mutate(value)`,
`addTodo.reset()`, `posts.fetchNextPage()`, and `todos.refetch()`.

## Migrate query and mutation results

The legacy adapter exposed one signal and one Observable containing the entire observer result.
The stable adapter exposes each result field as a signal and keeps imperative methods as functions.

```ts
todos.result().isPending // [!code --]
todos.result().data // [!code --]
todos.result().error // [!code --]
todos.isPending() // [!code ++]
todos.data() // [!code ++]
todos.error() // [!code ++]
```

Templates use the field signals in the same way:

```angular-html
@if (todos.result().isPending) { <!-- [!code --] -->
@if (todos.isPending()) { <!-- [!code ++] -->
  <span>Loading...</span>
} @else if (todos.isError()) {
  <span>{{ todos.error()?.message }}</span>
} @else {
  @for (todo of todos.data(); track todo.id) {
    <span>{{ todo.title }}</span>
  }
}
```

There is no direct replacement for `result$`. Convert the field signal you need with Angular's
`toObservable`, or compose several fields with `computed` first.

```ts
readonly todosResult$ = this.todos.result$ // [!code --]
readonly todosState = computed(() => ({ // [!code ++]
  data: this.todos.data(), // [!code ++]
  error: this.todos.error(), // [!code ++]
  status: this.todos.status(), // [!code ++]
})) // [!code ++]
readonly todosResult$ = toObservable(this.todosState) // [!code ++]
```

Mutation state follows the same rule:

```ts
addTodo.result().isPending // [!code --]
addTodo.result().data // [!code --]
addTodo.isPending() // [!code ++]
addTodo.data() // [!code ++]
```

## Convert Observable query functions

The legacy adapter accepted an RxJS `Observable` from `queryFn` and `mutationFn`. The stable
adapter follows TanStack Query's Promise-based contract, so convert an Observable with
`firstValueFrom` or `lastValueFrom`.

```ts
queryFn: () => this.http.get<Todo[]>('/api/todos') // [!code --]
queryFn: () => lastValueFrom(this.http.get<Todo[]>('/api/todos')) // [!code ++]
```

```ts
const createTodo = (todo: Todo) => this.http.post<Todo>('/api/todos', todo)

mutationFn: createTodo // [!code --]
mutationFn: (todo) => lastValueFrom(createTodo(todo)) // [!code ++]
```

See [Angular HttpClient](../angular-httpclient-and-other-data-fetching-clients.md)
for a complete example. If an Observable does not complete, prefer `firstValueFrom` or make it
complete before converting it.

## Migrate background indicators

`injectIsFetching` and `injectIsMutating` now accept a reactive filters callback and return a
`Signal<number>`.

```ts
private readonly useIsFetching = injectIsFetching() // [!code --]
readonly fetchingTodos = // [!code --]
  this.useIsFetching({ queryKey: ['todos'] }).toSignal() // [!code --]
readonly fetchingTodos = injectIsFetching(() => ({ queryKey: ['todos'] })) // [!code ++]
```

```ts
private readonly useIsMutating = injectIsMutating() // [!code --]
readonly mutatingTodos = // [!code --]
  this.useIsMutating({ mutationKey: ['todos'] }).toSignal() // [!code --]
readonly mutatingTodos = injectIsMutating(() => ({ mutationKey: ['todos'] })) // [!code ++]
```

Use `toObservable(this.fetchingTodos)` if a consumer still needs an Observable.

## Inject the `QueryClient`

Use Angular dependency injection directly instead of `injectQueryClient`:

```ts
import { injectQueryClient } from '@ngneat/query' // [!code --]
import { inject } from '@angular/core' // [!code ++]
import { QueryClient } from '@tanstack/angular-query' // [!code ++]

private readonly queryClient = injectQueryClient() // [!code --]
private readonly queryClient = inject(QueryClient) // [!code ++]
```

## Migrate devtools

Replace the legacy devtools provider with the `withDevtools` feature from the standalone Angular
Query devtools package.

```ts
import { provideQueryClientOptions } from '@ngneat/query' // [!code --]
import { provideQueryDevTools } from '@ngneat/query-devtools' // [!code --]
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query' // [!code ++]
import { withDevtools } from '@tanstack/angular-query-devtools' // [!code ++]

const devtools = withDevtools(() => ({ initialIsOpen: true }))

providers: [
  provideQueryClientOptions({}), // [!code --]
  provideQueryDevTools({ initialIsOpen: true }), // [!code --]
  provideTanStackQuery(() => new QueryClient(), devtools), // [!code ++]
]
```

See the [Devtools guide](../devtools.md) for production entrypoints and reactive options.

See [Error handling](./error-handling.md) for optional Angular `ErrorHandler` integration.
