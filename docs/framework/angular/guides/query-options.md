---
id: query-options
title: Query Options
ref: docs/framework/react/guides/query-options.md
---

[//]: # 'Example1'

```ts
import { queryOptions } from '@tanstack/angular-query'

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

queries = inject(QueriesService)

injectQuery(this.queries.post(1))
injectQueries({
  queries: [this.queries.post(1), this.queries.post(2)],
})
queryClient.prefetchQuery(this.queries.post(23))
queryClient.setQueryData(this.queries.post(42).queryKey, newGroups)
```

[//]: # 'Example1'
