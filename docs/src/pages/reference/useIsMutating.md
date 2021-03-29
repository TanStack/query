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

- `filters?: MutationFilters`: [Mutation Filters](../guides/filters#mutation-filters)

**Returns**

- `isMutating: number`
  - Will be the `number` of the mutations that your application is currently fetching.
