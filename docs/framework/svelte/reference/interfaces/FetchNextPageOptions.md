---
id: FetchNextPageOptions
title: FetchNextPageOptions
---

Defined in: [packages/query-core/src/types.ts:727](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L727)

## Extends

- [`ResultOptions`](ResultOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: [packages/query-core/src/types.ts:736](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L736)

If set to `true`, calling `fetchNextPage` repeatedly will invoke `queryFn` every time,
whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.

If set to `false`, calling `fetchNextPage` repeatedly won't have any effect until the first invocation has resolved.

Defaults to `true`.

***

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: [packages/query-core/src/types.ts:692](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L692)

If set to `true`, the method throws if any of the underlying query refetch tasks fail.
Defaults to `false`, in which case failed refetches are swallowed and not surfaced to the
caller.

#### Inherited from

[`ResultOptions`](ResultOptions.md).[`throwOnError`](ResultOptions.md#throwonerror)
