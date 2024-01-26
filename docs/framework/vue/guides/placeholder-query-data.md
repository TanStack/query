---
id: placeholder-query-data
title: Placeholder Query Data
ref: docs/framework/react/guides/placeholder-query-data.md
---

[//]: # 'ExampleValue'

```tsx
const result = useQuery({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  placeholderData: placeholderTodos,
})
```

[//]: # 'ExampleValue'
[//]: # 'Memoization'
[//]: # 'Memoization'
[//]: # 'ExampleCache'

```tsx
const result = useQuery({
  queryKey: ['blogPost', blogPostId],
  queryFn: () => fetch(`/blogPosts/${blogPostId}`),
  placeholderData: () => {
    // Use the smaller/preview version of the blogPost from the 'blogPosts'
    // query as the placeholder data for this blogPost query
    return queryClient
      .getQueryData(['blogPosts'])
      ?.find((d) => d.id === blogPostId)
  },
})
```

[//]: # 'ExampleCache'
[//]: # 'Materials'
[//]: # 'Materials'
