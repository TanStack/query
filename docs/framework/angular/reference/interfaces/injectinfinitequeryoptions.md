---
id: InjectInfiniteQueryOptions
title: InjectInfiniteQueryOptions
---

# Interface: InjectInfiniteQueryOptions

## Properties

### injector?

```ts
optional injector: Injector;
```

The `Injector` in which to create the infinite query.

If this is not provided, the current injection context will be used instead (via `inject`).

#### Defined in

[inject-infinite-query.ts:31](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L31)
