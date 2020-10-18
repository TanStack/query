---
id: watchInfiniteQuery
title: watchInfiniteQuery
---

## `watchInfiniteQuery`

The `watchInfiniteQuery` function can be used to observe and switch between infinite queries.

```js
import { watchInfiniteQuery } from 'react-query'

const observer = watchInfiniteQuery(environment, { queryKey: 'posts' })

const unsubscribe = observer.subscribe(result => {
  console.log(result)
  unsubscribe()
})
```

**Options**

The options for `watchInfiniteQuery` are exactly the same as those of [`useInfiniteQuery`](#useinfinitequery).
