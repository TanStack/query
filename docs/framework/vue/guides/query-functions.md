---
id: query-functions
title: Query Functions
ref: docs/framework/react/guides/query-functions.md
---

[//]: # 'Example4'

```js
const result = useQuery({
  queryKey: ['todos', { status, page }],
  queryFn: fetchTodoList,
})

// Access the key, status and page variables in your query function!
function fetchTodoList({ queryKey }) {
  const [_key, { status, page }] = queryKey
  return new Promise()
}
```

[//]: # 'Example4'
