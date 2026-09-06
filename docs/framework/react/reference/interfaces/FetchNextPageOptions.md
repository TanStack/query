---
id: FetchNextPageOptions
title: FetchNextPageOptions
---

Defined in: [packages/query-core/src/types.ts:703](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L703)

## Extends

- [`ResultOptions`](ResultOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: [packages/query-core/src/types.ts:712](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L712)

If set to `true`, calling `fetchNextPage` repeatedly will invoke `queryFn` every time,
whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.

If set to `false`, calling `fetchNextPage` repeatedly won't have any effect until the first invocation has resolved.

Defaults to `true`.

***

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: [packages/query-core/src/types.ts:676](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L676)

#### Inherited from

[`ResultOptions`](ResultOptions.md).[`throwOnError`](ResultOptions.md#throwonerror)
