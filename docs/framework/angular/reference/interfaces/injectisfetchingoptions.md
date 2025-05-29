---
id: InjectIsFetchingOptions
title: InjectIsFetchingOptions
---

# Interface: InjectIsFetchingOptions

## Properties

### injector?

```ts
optional injector: Injector;
```

The `Injector` in which to create the isFetching signal.

If this is not provided, the current injection context will be used instead (via `inject`).

#### Defined in

[inject-is-fetching.ts:19](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-fetching.ts#L19)
