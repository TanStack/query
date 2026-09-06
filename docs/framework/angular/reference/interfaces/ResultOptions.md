---
id: ResultOptions
title: ResultOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:338

## Extended by

- [`RefetchOptions`](RefetchOptions.md)
- [`FetchNextPageOptions`](FetchNextPageOptions.md)
- [`FetchPreviousPageOptions`](FetchPreviousPageOptions.md)

## Properties

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:344

If set to `true`, the method throws if any of the underlying query refetch tasks fail.
Defaults to `false`, in which case failed refetches are swallowed and not surfaced to the
caller.
