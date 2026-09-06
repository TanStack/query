---
id: RefetchOptions
title: RefetchOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:341

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:349

If set to `true`, a currently running request will be cancelled before a new request is made

If set to `false`, no refetch will be made if there is already a request running.

Defaults to `true`.

***

### throwOnError?

```ts
optional throwOnError: boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:339

#### Inherited from

[`ResultOptions`](ResultOptions.md).[`throwOnError`](ResultOptions.md#throwonerror)
