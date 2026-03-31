---
id: InjectInfiniteQueryOptions
title: InjectInfiniteQueryOptions
---

# Interface: InjectInfiniteQueryOptions

Defined in: [inject-infinite-query.ts:27](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L27)

## Properties

### injector?

```ts
optional injector: Injector;
```

Defined in: [inject-infinite-query.ts:33](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L33)

The `Injector` in which to create the infinite query.

If this is not provided, the current injection context will be used instead (via `inject`).
