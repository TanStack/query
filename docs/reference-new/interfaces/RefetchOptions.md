---
id: RefetchOptions
title: RefetchOptions
---

# Interface: RefetchOptions

Defined in: [packages/query-core/src/types.ts:571](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L571)

## Extends

- [`ResultOptions`](ResultOptions.md)

## Extended by

- [`InvalidateOptions`](InvalidateOptions.md)
- [`ResetOptions`](ResetOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: [packages/query-core/src/types.ts:579](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L579)

If set to `true`, a currently running request will be cancelled before a new request is made

If set to `false`, no refetch will be made if there is already a request running.

Defaults to `true`.

***

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: [packages/query-core/src/types.ts:568](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L568)

#### Inherited from

[`ResultOptions`](ResultOptions.md).[`throwOnError`](ResultOptions.md#throwonerror)
