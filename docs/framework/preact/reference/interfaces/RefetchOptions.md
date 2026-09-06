---
id: RefetchOptions
title: RefetchOptions
---

Defined in: [packages/query-core/src/types.ts:679](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L679)

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

Defined in: [packages/query-core/src/types.ts:687](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L687)

If set to `true`, a currently running request will be cancelled before a new request is made

If set to `false`, no refetch will be made if there is already a request running.

Defaults to `true`.

***

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: [packages/query-core/src/types.ts:676](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L676)

#### Inherited from

[`ResultOptions`](ResultOptions.md).[`throwOnError`](ResultOptions.md#throwonerror)
