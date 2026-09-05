---
id: provideQueryClient
title: provideQueryClient
---

```ts
function provideQueryClient(queryClient): Provider;
```

Defined in: [providers.ts:22](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L22)

Usually [provideTanStackQuery](provideTanStackQuery.md) is used once to set up TanStack Query and the
[`QueryClient`](https://tanstack.com/query/latest/docs/reference/QueryClient) for the entire application —
it calls `provideQueryClient` internally. Use `provideQueryClient` directly to provide a different
`QueryClient` instance for part of the application, or for unit testing.

## Parameters

### queryClient

A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.

`QueryClient` | `InjectionToken`\<`QueryClient`\>

## Returns

`Provider`

A provider object that can be used to provide the `QueryClient` instance.

## Example

Providing a test-only `QueryClient` in a component test, without wiring up `provideTanStackQuery`'s other
defaults:
```ts
TestBed.configureTestingModule({
  providers: [provideQueryClient(new QueryClient())],
})
```
