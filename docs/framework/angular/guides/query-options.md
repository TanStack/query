---
id: query-options
title: Query Options
ref: docs/framework/react/guides/query-options.md
---

[//]: # 'Example1'

```ts
import { noop, query, queryOptions, setQueryData } from '@tanstack/angular-query'

@Injectable({
  providedIn: 'root',
})
export class QueriesService {
  private readonly http = inject(HttpClient)

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

void query(queryClient, this.queries.post(23)).catch(noop)
setQueryData(queryClient, this.queries.post(42).queryKey, newPost)
```

[//]: # 'Example1'
[//]: # 'Example2'

```ts
import { select } from '@tanstack/angular-query'

// Type inference still works, so postQuery.data will be the return type of select instead of queryFn
queries = inject(QueriesService)

postQuery = injectQuery(() => ({
  ...this.queries.post(1),
  select: select((data) => data.title),
}))
```

[//]: # 'Example2'
