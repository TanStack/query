---
id: watchQuery
title: watchQuery
---

## `watchQuery`

The `watchQuery` function can be used to observe and switch between queries.

```js
import { watchQuery } from 'react-query'

const observer = watchQuery(environment, { queryKey: 'posts' })

const unsubscribe = observer.subscribe(result => {
  console.log(result)
  unsubscribe()
})
```

**Options**

The options for `watchQuery` are exactly the same as those of [`useQuery`](#usequery).
