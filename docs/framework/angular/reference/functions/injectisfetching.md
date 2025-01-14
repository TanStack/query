---
id: injectIsFetching
title: injectIsFetching
---

# Function: injectIsFetching()

```ts
function injectIsFetching(filters?, injector?): Signal<number>
```

Injects a signal that tracks the number of queries that your application is loading or
fetching in the background.

Can be used for app-wide loading indicators

## Parameters

### filters?

`QueryFilters`\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>

The filters to apply to the query.

### injector?

`Injector`

The Angular injector to use.

## Returns

`Signal`\<`number`\>

signal with number of loading or fetching queries.

## Defined in

[inject-is-fetching.ts:17](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-fetching.ts#L17)
