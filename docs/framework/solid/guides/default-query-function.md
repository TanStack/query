---
id: default-query-function
title: Default Query Function
ref: docs/framework/react/guides/default-query-function.md
---

[//]: # 'Example'

```tsx
// Define a default query function that will receive the query key
const defaultQueryFn = async ({ queryKey }) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com${queryKey[0]}`,
  )
  return data
}

// provide the default query function to your app with defaultOptions
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
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

// All you have to do now is pass a key!
function Posts() {
  const postsQuery = useQuery(() => ({ queryKey: ['/posts'] }))

  // ...
}

// You can even leave out the queryFn and just go straight into options
function Post(props) {
  const postQuery = useQuery(() => ({
    queryKey: [`/posts/${props.postId}`],
    enabled: !!props.postId,
  }))

  // ...
}
```

[//]: # 'Example'
