---
id: FetchNextPageOptions
title: FetchNextPageOptions
---

Defined in: [packages/query-core/src/types.ts:716](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L716)

## Extends

- [`ResultOptions`](ResultOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: [packages/query-core/src/types.ts:725](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L725)

If set to `true`, calling `fetchNextPage` repeatedly will invoke `queryFn` every time,
whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.

If set to `false`, calling `fetchNextPage` repeatedly won't have any effect until the first invocation has resolved.

Defaults to `true`.

***

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: [packages/query-core/src/types.ts:681](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L681)

If set to `true`, the method throws if any of the underlying query refetch tasks fail.
Defaults to `false`, in which case failed refetches are swallowed and not surfaced to the
caller.

#### Inherited from

[`ResultOptions`](ResultOptions.md).[`throwOnError`](ResultOptions.md#throwonerror)
