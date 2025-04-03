---
id: query-cancellation
title: Query Cancellation
ref: docs/framework/react/guides/query-cancellation.md
replace: {
    '@tanstack/react-query': '@tanstack/solid-query',
    'useMutationState[(]': 'useMutationState(() => ',
    'useMutation[(]': 'useMutation(() => ',
    'useQuery[(]': 'useQuery(() => ',
    'useQueries[(]': 'useQueries(() => ',
    'useInfiniteQuery[(]': 'useInfiniteQuery(() => ',
}
---

[//]: # 'Example7'

```ts
const query = useQuery({
  queryKey: ['todos'],
  queryFn: async ({ signal }) => {
    const resp = await fetch('/todos', { signal })
    return resp.json()
  },
})

const queryClient = useQueryClient()

function onButtonClick() {
  queryClient.cancelQueries({ queryKey: ['todos'] })
}
```

[//]: # 'Example7'
