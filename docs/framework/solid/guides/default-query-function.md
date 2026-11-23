---
id: default-query-function
title: Default Query Function
ref: docs/framework/react/guides/default-query-function.md
---

[//]: # 'Example'

```tsx
import { defaultQueryFn } from '@tanstack/solid-query'

// Define a default query function that will receive the query key
const fetchByQueryKey = async ({ queryKey }) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com${queryKey[0]}`,
  )
  return data
}

// provide the default query function to your app with defaultOptions
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: fetchByQueryKey,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  )
}

function Posts() {
  const postsQuery = useQuery(() => ({
    queryKey: ['/posts'],
    queryFn: defaultQueryFn,
  }))

  // ...
}

function Post(props) {
  const postQuery = useQuery(() => ({
    queryKey: [`/posts/${props.postId}`],
    queryFn: defaultQueryFn,
    enabled: !!props.postId,
  }))

  // ...
}
```

[//]: # 'Example'
