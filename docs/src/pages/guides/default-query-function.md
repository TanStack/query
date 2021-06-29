---
id: default-query-function
title: Default Query Function
---

If you find yourself wishing for whatever reason that you could just share the same query function for your entire app and just use query keys to identify what it should fetch, you can do that by providing a **default query function** to React Query:

```js
// Define a default query function that will receive the query key
// the queryKey is guaranteed to be an Array here
const defaultQueryFn = async ({ queryKey }) => {
  const { data } = await axios.get(`https://jsonplaceholder.typicode.com${queryKey[0]}`);
  return data;
};

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
  const { status, data, error, isFetching } = useQuery('/posts')

  // ...
}

// You can even leave out the queryFn and just go straight into options
function Post({ postId }) {
  const { status, data, error, isFetching } = useQuery(`/posts/${postId}`, {
    enabled: !!postId,
  })

  // ...
}
```

If you ever want to override the default queryFn, you can just provide your own like you normally would.
