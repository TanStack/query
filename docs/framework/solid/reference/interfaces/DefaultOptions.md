---
id: DefaultOptions
title: DefaultOptions
---

Defined in: [QueryClient.ts:94](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L94)

The default options a `QueryClient` applies to every query, with Solid's `reconcile` option added to
`queries`.

## Extends

- `DefaultOptions`\<`TError`\>

## Type Parameters

### TError

`TError` = `DefaultError`

The default type of errors thrown by queries and mutations using this `QueryClient`.

## Properties

### queries?

```ts
optional queries: OmitKeyof<QueryObserverOptions<unknown, TError, unknown, unknown, readonly unknown[], never>, "queryKey">;
```

Defined in: [QueryClient.ts:97](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L97)

#### Overrides

```ts
CoreDefaultOptions.queries
```
