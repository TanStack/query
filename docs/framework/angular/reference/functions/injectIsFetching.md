---
id: injectIsFetching
title: injectIsFetching
---

# Function: injectIsFetching()

```ts
function injectIsFetching(filters?, options?): Signal<number>;
```

Defined in: [inject-is-fetching.ts:31](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-fetching.ts#L31)

Injects a signal that tracks the number of queries that your application is loading or
fetching in the background.

Can be used for app-wide loading indicators

## Parameters

### filters?

`QueryFilters`\<readonly `unknown`[]\>

The filters to apply to the query.

### options?

[`InjectIsFetchingOptions`](../interfaces/InjectIsFetchingOptions.md)

Additional configuration

## Returns

`Signal`\<`number`\>

signal with number of loading or fetching queries.
