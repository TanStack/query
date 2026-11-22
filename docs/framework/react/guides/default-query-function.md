---
id: default-query-function
title: Default Query Function
---

Set a default query function on the client to share it across queries. Pass `queryFn: defaultQueryFn` in the query options to use that function. The function receives the query key and can use it to decide what to fetch.

[//]: # 'Example'

```tsx
import { defaultQueryFn } from '@tanstack/react-query'

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
  const { status, data, error, isFetching } = useQuery({
    queryKey: ['/posts'],
    queryFn: defaultQueryFn,
  })

  // ...
}

function Post({ postId }) {
  const { status, data, error, isFetching } = useQuery({
    queryKey: [`/posts/${postId}`],
    queryFn: defaultQueryFn,
    enabled: !!postId,
  })

  // ...
}
```

[//]: # 'Example'

Pass your own function as `queryFn` to override the client defaults. To configure a default function for specific query keys, use `queryClient.setQueryDefaults`.
