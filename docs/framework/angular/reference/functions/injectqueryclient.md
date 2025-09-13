---
id: injectQueryClient
title: injectQueryClient
---

# Function: ~~injectQueryClient()~~

```ts
function injectQueryClient(injectOptions): QueryClient
```

Injects a `QueryClient` instance and allows passing a custom injector.

## Parameters

### injectOptions

`InjectOptions` & `object` = `{}`

Type of the options argument to inject and optionally a custom injector.

## Returns

`QueryClient`

The `QueryClient` instance.

## Deprecated

Use `inject(QueryClient)` instead.
If you need to get a `QueryClient` from a custom injector, use `injector.get(QueryClient)`.

**Example**

```ts
const queryClient = injectQueryClient()
```

## Defined in

[inject-query-client.ts:19](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query-client.ts#L19)
