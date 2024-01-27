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
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: { queries: { queryFn: defaultQueryFn } },
  },
}
app.use(VueQueryPlugin, vueQueryPluginOptions)

// All you have to do now is pass a key!
const { status, data, error, isFetching } = useQuery({
  queryKey: [`/posts/${postId}`],
})
```

[//]: # 'Example'
