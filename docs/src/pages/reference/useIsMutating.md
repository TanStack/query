---
id: useIsMutating
title: useIsMutating
---

`useIsMutating` is an optional hook that returns the `number` of mutations that your application is fetching (useful for app-wide loading indicators).

```js
import { useIsMutating } from 'react-query'
// How many mutations are fetching?
const isMutating = useIsMutating()
// How many mutations matching the posts prefix are fetching?
const isMutatingPosts = useIsMutating(['posts'])
```

**Options**

- `filters?: MutationFilters`

A mutation filter object supports the following properties:

- `exact?: boolean`
  - If you don't want to search mutations inclusively by mutation key, you can pass the `exact: true` option to return only the mutation with the exact mutation key you have passed.
- `fetching?: boolean`
  - When set to `true` it will match mutations that are currently fetching.
  - When set to `false` it will match mutations that are not fetching.
- `predicate?: (mutation: Mutation) => boolean`
  - This predicate function will be called for every single mutation in the cache and be expected to return truthy for mutations that are `found`.
- `mutationKey?: MutationKey`
  - Set this property to define a mutation key to match on.

**Returns**

- `isMutating: number`
  - Will be the `number` of the mutations that your application is currently fetching.
