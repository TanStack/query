---
id: injectIsFetching
title: injectIsFetching
---

```ts
function injectIsFetching(filters: () => QueryFilters): Signal<number>;
```

Defined in: [packages/angular-query/src/inject-is-fetching.ts:15](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-is-fetching.ts#L15)

Injects a signal that tracks the number of queries that your application is loading or fetching in the
background (useful for app-wide loading indicators).

Can be used for app-wide loading indicators

## Parameters

### filters

() => [`QueryFilters`](../interfaces/QueryFilters.md)

A reactive factory for the filters.

## Returns

`Signal`\<`number`\>

signal with number of loading or fetching queries.
