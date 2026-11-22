---
id: default-query-function
title: Default Query Function
ref: docs/framework/react/guides/default-query-function.md
---

[//]: # 'Example'

```ts
import { defaultQueryFn } from '@tanstack/angular-query'

// Define a default query function that will receive the query key
const fetchByQueryKey: QueryFunction = async ({ queryKey }) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com${queryKey[0]}`,
  )
  return data
}

// provide the default query function to your app with defaultOptions
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: fetchByQueryKey,
      },
    },
  })

bootstrapApplication(MyAppComponent, {
  providers: [provideTanStackQuery(createQueryClient)],
})

export class PostsComponent {
  readonly postsQuery = injectQuery<Array<Post>>(() => ({
    queryKey: ['/posts'],
    queryFn: defaultQueryFn,
  }))
  // ...
}

export class PostComponent {
  readonly postQuery = injectQuery<Post>(() => ({
    enabled: this.postIdSignal() > 0,
    queryKey: [`/posts/${this.postIdSignal()}`],
    queryFn: defaultQueryFn,
  }))
  // ...
}
```

[//]: # 'Example'
