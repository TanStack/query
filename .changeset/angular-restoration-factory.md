---
'@tanstack/angular-query': major
'@tanstack/angular-query-persist-client': patch
---

Simplify `provideTanStackQuery` to accept only a DI factory. Replace `provideTanStackQuery(TOKEN)` with `provideTanStackQuery(() => inject(TOKEN))`.

Move `provideIsRestoring` to the internal entry point used by the persistence integration. Applications configure persistence with `withPersistQueryClient`; restoration state is managed by that integration.

Simplify persistence callback return types without changing behavior: synchronous results and returned promises remain supported, and promises are still awaited.
