---
id: FetchPreviousPageOptions
title: FetchPreviousPageOptions
---

# Interface: FetchPreviousPageOptions

Defined in: [packages/query-core/src/types.ts:605](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L605)

## Extends

- [`ResultOptions`](ResultOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: [packages/query-core/src/types.ts:614](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L614)

If set to `true`, calling `fetchPreviousPage` repeatedly will invoke `queryFn` every time,
whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.

If set to `false`, calling `fetchPreviousPage` repeatedly won't have any effect until the first invocation has resolved.

Defaults to `true`.

***

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: [packages/query-core/src/types.ts:568](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L568)

#### Inherited from

[`ResultOptions`](ResultOptions.md).[`throwOnError`](ResultOptions.md#throwonerror)
