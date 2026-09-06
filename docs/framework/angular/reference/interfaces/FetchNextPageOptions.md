---
id: FetchNextPageOptions
title: FetchNextPageOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:373

## Extends

- [`ResultOptions`](ResultOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:382

If set to `true`, calling `fetchNextPage` repeatedly will invoke `queryFn` every time,
whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.

If set to `false`, calling `fetchNextPage` repeatedly won't have any effect until the first invocation has resolved.

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
