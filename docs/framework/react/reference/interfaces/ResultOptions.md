---
id: ResultOptions
title: ResultOptions
---

Defined in: [packages/query-core/src/types.ts:694](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L694)

## Extended by

- [`RefetchOptions`](RefetchOptions.md)
- [`FetchNextPageOptions`](FetchNextPageOptions.md)
- [`FetchPreviousPageOptions`](FetchPreviousPageOptions.md)

## Properties

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: [packages/query-core/src/types.ts:701](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L701)

If set to `true`, the method throws if any of the underlying query refetch tasks fail.

Defaults to `false`, in which case failed refetches are swallowed and not surfaced to the
caller.
