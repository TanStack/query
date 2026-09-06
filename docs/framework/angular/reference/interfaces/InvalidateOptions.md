---
id: InvalidateOptions
title: InvalidateOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:356

## Extends

- [`RefetchOptions`](RefetchOptions.md)

## Properties

### cancelRefetch?

```ts
optional cancelRefetch: boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:349

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:339

#### Inherited from

[`RefetchOptions`](RefetchOptions.md).[`throwOnError`](RefetchOptions.md#throwonerror)
