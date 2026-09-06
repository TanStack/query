---
id: FetchPreviousPageOptions
title: FetchPreviousPageOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:384

## Extends

- [`ResultOptions`](ResultOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:393

If set to `true`, calling `fetchPreviousPage` repeatedly will invoke `queryFn` every time,
whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.

If set to `false`, calling `fetchPreviousPage` repeatedly won't have any effect until the first invocation has resolved.

Defaults to `true`.

***

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:344

If set to `true`, the method throws if any of the underlying query refetch tasks fail.
Defaults to `false`, in which case failed refetches are swallowed and not surfaced to the
caller.

#### Inherited from

[`ResultOptions`](ResultOptions.md).[`throwOnError`](ResultOptions.md#throwonerror)
