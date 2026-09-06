---
id: ResetOptions
title: ResetOptions
---

Defined in: [packages/query-core/src/types.ts:735](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L735)

## Extends

- [`RefetchOptions`](RefetchOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: [packages/query-core/src/types.ts:712](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L712)

If set to `true`, a currently running request will be cancelled before a new request is made

If set to `false`, no refetch will be made if there is already a request running.

Defaults to `true`.

#### Inherited from

[`RefetchOptions`](RefetchOptions.md).[`cancelRefetch`](RefetchOptions.md#cancelrefetch)

***

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: [packages/query-core/src/types.ts:701](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L701)

If set to `true`, the method throws if any of the underlying query refetch tasks fail.

Defaults to `false`, in which case failed refetches are swallowed and not surfaced to the
caller.

#### Inherited from

[`RefetchOptions`](RefetchOptions.md).[`throwOnError`](RefetchOptions.md#throwonerror)
