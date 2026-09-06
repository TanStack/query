---
id: FetchPreviousPageOptions
title: FetchPreviousPageOptions
---

Defined in: [packages/query-core/src/types.ts:715](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L715)

## Extends

- [`ResultOptions`](ResultOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: [packages/query-core/src/types.ts:724](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L724)

If set to `true`, calling `fetchPreviousPage` repeatedly will invoke `queryFn` every time,
whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.

If set to `false`, calling `fetchPreviousPage` repeatedly won't have any effect until the first invocation has resolved.

Defaults to `true`.

***

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: [packages/query-core/src/types.ts:676](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L676)

#### Inherited from

[`ResultOptions`](ResultOptions.md).[`throwOnError`](ResultOptions.md#throwonerror)
