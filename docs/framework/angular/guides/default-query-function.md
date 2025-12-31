---
id: default-query-function
title: Default Query Function
ref: docs/framework/react/guides/default-query-function.md
---

[//]: # 'Example'

```ts
// Define a default query function that will receive the query key
const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
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

bootstrapApplication(MyAppComponent, {
  providers: [provideTanStackQuery(queryClient)],
})

@Component({
  // ...
})
class PostsComponent {
  // All you have to do now is pass a key!
  postsQuery = injectQuery<Array<Post>>(() => ({
    queryKey: ['/posts'],
  }))
  // ...
}

@Component({
  // ...
})
class PostComponent {
  postId = input(0)

  // You can even leave out the queryFn and just go straight into options
  postQuery = injectQuery<Post>(() => ({
    enabled: this.postId() > 0,
    queryKey: [`/posts/${this.postId()}`],
  }))
  // ...
}
```

[//]: # 'Example'
