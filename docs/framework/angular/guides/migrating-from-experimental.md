---
id: migrating-from-experimental
title: Migrating from Angular Query Experimental
---

The stable package keeps the callback-based query, mutation, and signal result APIs from the
experimental adapter. Most application queries therefore only need an import change. The following
sections cover the breaking configuration and entrypoint changes.

Angular 20.1 or newer is required by the stable package. Upgrade Angular first if your
application is on an older version. Save your work and confirm the application builds before
running the migration.

## Active codebase recommendations

Before migrating an active codebase, it is recommended that you:

- Block imports of the removed `provideQueryClient` in favor of `provideTanStackQuery`.
- Create a `provideTestTanStackQuery` helper or a `createTestQueryClient` factory to pass to `provideTanStackQuery`, so new tests use a shared provider setup.

Use ESLint's [`no-restricted-imports`](https://eslint.org/docs/latest/rules/no-restricted-imports)
to restrict experimental package imports while new code adopts `@tanstack/angular-query`.
Suppress existing imports with [ESLint suppressions](https://eslint.org/docs/latest/use/suppressions)
or a [rule-specific disable comment](https://eslint.org/docs/latest/use/configure/rules#using-configuration-comments-1),
and remove each suppression as its import is migrated.

For a gradual import migration, a package-manager alias can let new imports use the experimental
adapter before you switch packages. For example, with pnpm:

```json
{
  "dependencies": {
    "@tanstack/angular-query": "npm:@tanstack/angular-query-experimental@5.90.25",
    "@tanstack/angular-query-experimental": "5.90.25"
  }
}
```

Keep both names on the same resolved version and peer dependency configuration, and verify they
resolve to the same adapter instance. The alias still exposes the experimental API; it does not
make the stable provider signatures available. Leave devtools and `inject-queries-experimental`
imports on their original experimental paths until the package switch so the schematic can
recognize them. Replace the alias with the real stable package before running the schematic.

## Run the migration schematic

Install the stable package, then preview the bundled migration:

```bash
npm install @tanstack/angular-query

# With the Angular CLI
ng generate @tanstack/angular-query:migrate-from-experimental --dry-run
ng generate @tanstack/angular-query:migrate-from-experimental

# With Nx
nx g @tanstack/angular-query:migrate-from-experimental --skipInstall
```

With `--skipInstall`, run your package manager's install command after applying the migration
to synchronize the dependencies and lockfile.

The schematic handles common migration steps like updating package and devtools imports,
updating dependencies, renaming providers, and converting direct `new QueryClient()` provider
arguments to factories. Review its warnings and the remaining sections for changes that require
manual updates.

Two additional migrations are opt-in:

- `--unsafe-wrap-client-references` wraps references such as `provideTanStackQuery(client)`
  in a factory. Review every warning: injection tokens and existing factories need different handling.
- `--migrate-query-core-imports` moves `@tanstack/query-core` imports to `@tanstack/angular-query`
  and removes direct core dependencies. Dependencies are kept when unmigrated references remain.

The schematic also discovers `project.json` and `package.json` `nx` configurations.
It checks project-local `tsconfig.spec.json` and `tsconfig.test.json` for manually configured
test runners, unless a test target supplies an explicit `tsConfig`. Configured includes and
exclusions determine which files are migrated. Projects configured entirely through inferred
plugin settings may need manual review.

## Replace the experimental package

```bash
npm uninstall @tanstack/angular-query-experimental
npm install @tanstack/angular-query
```

```ts
import { injectQuery } from '@tanstack/angular-query-experimental' // [!code --]
import { injectQuery } from '@tanstack/angular-query' // [!code ++]
```

## Provide a client factory

`provideTanStackQuery` no longer accepts a pre-created `QueryClient`. Pass a factory instead.

```ts
provideTanStackQuery(new QueryClient()) // [!code --]
provideTanStackQuery(() => new QueryClient()) // [!code ++]
```

`provideTanStackQuery` now returns one `EnvironmentProviders` value rather than an array. Use it in
an environment injector, such as `ApplicationConfig.providers`, the `providers` passed to
`bootstrapApplication`, route-level `Route.providers`, or `createEnvironmentInjector`. It is not
supported in `@Component.providers` or `@Directive.providers`. Add the result directly; do not
spread it.

```ts
providers: [...provideTanStackQuery(() => new QueryClient())] // [!code --]
providers: [provideTanStackQuery(() => new QueryClient())] // [!code ++]
```

If another provider already owns the client, resolve it inside the factory:

```ts
provideTanStackQuery(() => inject(MY_QUERY_CLIENT))
```

Replace direct token arguments with this form.

`provideAngularQuery` and `provideQueryClient` have been removed. Use `provideTanStackQuery`,
which handles mounting, unmounting, and default hydration. Replacing it with a bare Angular
`useFactory` provider would omit that setup.

```ts
provideAngularQuery(new QueryClient()) // [!code --]
provideTanStackQuery(() => new QueryClient()) // [!code ++]
```

For `provideQueryClient`, rename it to `provideTanStackQuery` and keep the existing client factory.

## Replace `injectQueryClient`

`injectQueryClient` has been removed. Inject `QueryClient` directly instead:

```ts
const queryClient = injectQueryClient() // [!code --]
const queryClient = inject(QueryClient) // [!code ++]
```

## Install the standalone devtools package

Devtools no longer ship as entrypoints of the core Angular package.

```bash
npm install @tanstack/angular-query-devtools
```

```ts
import { withDevtools } from '@tanstack/angular-query-experimental/devtools' // [!code --]
import { withDevtools } from '@tanstack/angular-query-devtools' // [!code ++]
```

The production and panel entrypoints move in the same way:

```ts
import { withDevtools } from '@tanstack/angular-query-experimental/devtools/production' // [!code --]
import { withDevtools } from '@tanstack/angular-query-devtools/production' // [!code ++]
```

The devtools options callback now runs in an injection context. Remove the `deps` option and call
`inject()` inside the callback instead.

```ts
const optionsFromManager = (manager: DevtoolsOptionsManager) => ({
  loadDevtools: manager.loadDevtools,
})

withDevtools(optionsFromManager, { deps: [DevtoolsOptionsManager] }) // [!code --]
withDevtools(() => optionsFromManager(inject(DevtoolsOptionsManager))) // [!code ++]
```

See the [Devtools guide](../devtools.md) for setup, production entrypoints, and configuration
options.

## Use the stable `injectQueries` export

`injectQueries` is now exported from the main package. The helper must be called from an Angular
injection context.

```ts
import {
  injectQueries, // [!code --]
} from '@tanstack/angular-query-experimental/inject-queries-experimental' // [!code --]
import { injectQueries } from '@tanstack/angular-query' // [!code ++]

const getQueries = () => ({ queries })
const results = injectQueries(getQueries, injector) // [!code --]
const results = runInInjectionContext(injector, () => injectQueries(getQueries)) // [!code ++]
```

The `queries` callback is reactive, tuple inference is preserved, and `combine` can derive a single
result:

```ts
readonly summary = injectQueries(() => ({
  queries: [todosOptions(), usersOptions()],
  combine: ([todos, users]) => ({
    pending: todos.isPending || users.isPending,
    todoCount: todos.data?.length ?? 0,
    userCount: users.data?.length ?? 0,
  }),
}))
```

## Move explicit injectors into an injection context

All stable injection helpers must run in an Angular injection context. The
experimental `injectQuery`, `injectInfiniteQuery`, `injectMutation`,
`injectMutationState`, `injectIsFetching`, and `injectIsMutating` accepted a second
`{ injector }` options argument. `injectIsRestoring` accepted that options object
as its first argument. The experimental `injectDevtoolsPanel` also accepted a second
`{ injector }` options argument. These arguments have been removed.

```ts
injectQuery(options, { injector }) // [!code --]
runInInjectionContext(injector, () => injectQuery(options)) // [!code ++]

injectMutation(options, { injector }) // [!code --]
runInInjectionContext(injector, () => injectMutation(options)) // [!code ++]

injectIsFetching({ queryKey: ['todos'] }, { injector }) // [!code --]
runInInjectionContext(injector, () =>
  injectIsFetching(() => ({ queryKey: ['todos'] })),
) // [!code ++]

injectIsRestoring({ injector }) // [!code --]
runInInjectionContext(injector, () => injectIsRestoring()) // [!code ++]
```

Import `runInInjectionContext` from `@angular/core`. Unlike these helpers,
`injectQueries` previously took the injector directly, as shown above. When the
old argument is `undefined` or an empty options object, remove it and ensure the
call already runs in an injection context.

The `InjectQueryOptions`, `InjectInfiniteQueryOptions`, `InjectMutationOptions`,
`InjectMutationStateOptions`, `InjectIsFetchingOptions`, and
`InjectIsMutatingOptions` types have also been removed, along with the devtools
`InjectDevtoolsPanelOptions` type. Update wrappers that use
these types. The schematic reports explicit arguments, spread arguments, and
imports of these removed types for manual review; it does not infer injector
handling through custom wrappers.

## Review SSR hydration

`provideTanStackQuery` now dehydrates the server cache into Angular `TransferState` and hydrates it
in the browser by default. In most SSR applications, no additional setup is necessary.

If your application already performs manual dehydration and hydration, either remove the manual
implementation or disable the built-in behavior to avoid hydrating the same client twice:

```ts
provideTanStackQuery(() => new QueryClient(), withNoQueryHydration())
```

Give each client a unique key when multiple clients use automatic hydration:

```ts
provideTanStackQuery(
  () => new QueryClient(),
  withHydrationKey('admin-query-cache'),
)
```

See the [SSR guide](./ssr.md) for request-scoped client setup and the interaction with Angular
`HttpClient` transfer caching.

## Update tests that wait for stability

Observed queries, parallel queries, and mutations started through the adapter register with Angular's `PendingTasks`.
As a result, `ApplicationRef.whenStable()` and `fixture.whenStable()` wait until that work settles.

In zone-based component tests, call `fixture.autoDetectChanges()` before awaiting stability.
Resolve controlled operations before `whenStable()`; assert pending state while they remain
unresolved. HTTP mutations can start asynchronously, so wait for the request itself before flushing
it. `isPending()` does not prove that a mocked API has been called.

With fake timers, advance timers and queued microtasks before awaiting stability. Disabled queries
do not fetch automatically; a manual refetch still registers pending work.
See [Testing](./testing.md) for query, mutation, HTTP, and fake-timer examples.

After a query-key signal changes, `data()` can immediately return cached data for the new key,
before another change-detection pass. Assert the state the test intends to observe rather than
requiring an empty intermediate value.

## Error handling

Observer options no longer include `throwOnError`. Errors are exposed through the result's
`error`, `status`, and related signals, without an automatic global report. Cached query data
remains readable when a background refetch fails.

```ts
injectQuery(() => ({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  throwOnError: true,
})) // [!code --]
injectQuery(() => ({ queryKey: ['todos'], queryFn: fetchTodos })) // [!code ++]
```

Remove observer `throwOnError` from query, infinite-query, and mutation options, including your
Angular-specific client defaults. The shared core client still accepts this option for other
framework adapters, but Angular does not use it for reporting.

`mutateAsync()` still rejects on failure, and `mutate()` still returns void. Imperative options
such as `query.refetch({ throwOnError: true })` retain their promise-rejection behavior.
To report cache failures to Angular, use the [ErrorHandler guide](./error-handling.md).
`toResource(query).value()` throws when the Resource is in its error state; guard the read with
`hasValue()` or inspect `error()` first.

## Make activity filters reactive

```ts
injectIsFetching({ queryKey: ['todos'] }) // [!code --]
injectIsFetching(() => ({ queryKey: ['todos', userId()] })) // [!code ++]

injectIsMutating({ mutationKey: ['save'] }) // [!code --]
injectIsMutating(() => ({ mutationKey: ['save'] })) // [!code ++]
```

Calls without filters remain unchanged. Filter factories can read required inputs and signals;
changing a filter updates the count without waiting for a cache event.

## Imperative methods

Methods such as `refetch()` and `fetchNextPage()` use the current options even when called
immediately after changing an options signal.

Read the current `injectQueries()` result when calling a method after adding, removing, or
reordering queries.

`injectMutationState` selections and `injectQueries` combined results are no longer deeply
compared by the adapter. A newly allocated selected object or combined result can trigger consumers
even when its contents match the previous value. Prefer returning existing values when possible.

## Stability and notifications

Signal updates no longer enter `NgZone` or wait for adapter microtasks. Angular's change-detection
scheduler handles rendering. Keep reading reactive values as signals; callbacks do not gain an
injection context or guaranteed zone membership.

Each mutation invocation blocks stability until its promise settles, including awaited lifecycle
callbacks. A later invocation completing, or calling `reset()`, does not release an earlier mutation's
work. Destroying the owning component or injector releases its pending tasks. Queries that are
paused offline continue to block stability until resumed, cancelled, or unobserved.

## Persistence configuration

Pass a factory to `withPersistQueryClient`:

```ts
withPersistQueryClient(() => ({
  persistOptions: { persister },
}))
```

The factory runs once per injector, in an injection context, only in the browser.
Create persisters that access `localStorage` inside this factory.

Persistence manages its restoration state automatically through `withPersistQueryClient`.

## New behavior that needs no migration

The stable package also includes the following compatible improvements:

- Query results can be converted into an Angular Resource with `toResource`. See the
  [Resource API](../resource-api.md).
- `injectQueries` is supported from the main package with reactive options and field-level signals.
- Result field signals are evaluated lazily, so options can safely read required input signals without
  being evaluated during class construction.
- Persistence options may be supplied as a browser-only factory, making references such as
  `localStorage` safe in SSR applications.
