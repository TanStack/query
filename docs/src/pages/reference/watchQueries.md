---
id: watchQueries
title: watchQueries
---

## `watchQueries`

The `watchQueries` function can be used to observe multiple queries.

```js
import { watchQueries } from 'react-query'

const observer = watchQueries(environment, [
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 2], queryFn: fetchPost },
])

const unsubscribe = observer.subscribe(result => {
  console.log(result)
  unsubscribe()
})
```

**Options**

The options for `watchQueries` are exactly the same as those of [`useQueries`](#usequeries).
