---
id: default-query-function
title: Default Query Function
---

If you find yourself wishing for whatever reason that you could just share the same query function for your entire app and just use query keys to identify what it should fetch, you can do that by providing a **default query function** to React Query:

```js
// Define a default query function that will receive the query key
const defaultQueryFn = async key => {
  const { data } = await axios.get(`https://jsonplaceholder.typicode.com${key}`)
  return data
}

// provide the default query function to your app with defaultConfig
const queryCache = new QueryCache({
  defaultConfig: {
    queries: {
      queryFn: defaultQueryFn,
    },
  },
})

function App() {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <YourApp />
    </ReactQueryCacheProvider>
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
    enabled: postId,
  })

  // ...
}
```

If you ever want to override the default queryFn, you can just provide your own like you normally would.
