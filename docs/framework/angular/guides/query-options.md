---
id: query-options
title: Query Options
ref: docs/framework/react/guides/query-options.md
---

[//]: # 'Example1'

```ts
import { queryOptions } from '@tanstack/angular-query-experimental'

@Injectable({
  providedIn: 'root',
})
export class QueriesService {
  private http = inject(HttpClient)

  post(postId: number) {
    return queryOptions({
      queryKey: ['post', postId],
      queryFn: () => {
        return lastValueFrom(
          this.http.get<Post>(
            `https://jsonplaceholder.typicode.com/posts/${postId}`,
          ),
        )
      },
    })
  }
}

// usage:

postId = input.required({
  transform: numberAttribute,
})
queries = inject(QueriesService)

postQuery = injectQuery(() => this.queries.post(this.postId()))

queryClient.prefetchQuery(this.queries.post(23))
queryClient.setQueryData(this.queries.post(42).queryKey, newPost)
```

[//]: # 'Example1'
[//]: # 'Example2'

```ts
// Type inference still works, so query.data will be the return type of select instead of queryFn
queries = inject(QueriesService)

query = injectQuery(() => ({
  ...groupOptions(1),
  select: (data) => data.title,
}))
```

[//]: # 'Example2'
