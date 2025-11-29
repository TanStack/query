---
id: ResetOptions
title: ResetOptions
---

# Interface: ResetOptions

Defined in: [packages/query-core/src/types.ts:591](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L591)

## Extends

- [`RefetchOptions`](RefetchOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: [packages/query-core/src/types.ts:579](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L579)

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

Defined in: [packages/query-core/src/types.ts:568](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L568)

#### Inherited from

[`RefetchOptions`](RefetchOptions.md).[`throwOnError`](RefetchOptions.md#throwonerror)
