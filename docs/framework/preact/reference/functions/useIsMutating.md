---
id: useIsMutating
title: useIsMutating
---

```ts
function useIsMutating(filters?, queryClient?): number;
```

Defined in: [preact-query/src/useMutationState.ts:33](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useMutationState.ts#L33)

`useIsMutating` is an optional hook that returns the `number` of mutations that your application is fetching
(useful for app-wide loading indicators).

## Parameters

### filters?

`MutationFilters`\<`unknown`, `Error`, `unknown`, `unknown`\>

The MutationFilters to narrow down the matched mutations.

### queryClient?

`QueryClient`

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

`number`

Will be the `number` of the mutations that your application is currently fetching.

## Example

```tsx
import { useIsMutating } from '@tanstack/preact-query'

// How many mutations are fetching?
const isMutating = useIsMutating()
// How many mutations matching the posts prefix are fetching?
const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })
```
