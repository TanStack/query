---
id: placeholder-query-data
title: Placeholder Query Data
ref: docs/framework/react/guides/placeholder-query-data.md
---

[//]: # 'ExampleValue'

```ts
class TodosComponent {
  result = injectQuery(() => ({
    queryKey: ['todos'],
    queryFn: () => fetch('/todos'),
    placeholderData: placeholderTodos,
  }))
}
```

[//]: # 'ExampleValue'
[//]: # 'Memoization'
[//]: # 'Memoization'
[//]: # 'ExampleFunction'

```ts
class TodosComponent {
  result = injectQuery(() => ({
    queryKey: ['todos', id()],
    queryFn: () => fetch(`/todos/${id}`),
    placeholderData: (previousData, previousQuery) => previousData,
  }))
}
```

[//]: # 'ExampleFunction'
[//]: # 'ExampleCache'

```ts
export class BlogPostComponent {
  postId = input.required<number>()
  queryClient = inject(QueryClient)

  result = injectQuery(() => ({
    queryKey: ['blogPost', this.postId()],
    queryFn: () => fetch(`/blogPosts/${this.postId()}`),
    placeholderData: () => {
      // Use the smaller/preview version of the blogPost from the 'blogPosts'
      // query as the placeholder data for this blogPost query
      return this.queryClient
        .getQueryData(['blogPosts'])
        ?.find((d) => d.id === this.postId())
    },
  }))
}
```

[//]: # 'ExampleCache'
[//]: # 'ExampleCacheContext'

```ts
@Injectable({
  providedIn: 'root',
})
export class BlogPostsService {
  blogPost(blogPostId: number) {
    return queryOptions({
      queryKey: ['blogPost', blogPostId],
      queryFn: () => fetch(`/blogPosts/${blogPostId}`),
      placeholderData: (_previousData, _previousQuery, { client }) =>
        client.getQueryData(['blogPosts'])?.find((d) => d.id === blogPostId),
    })
  }
}
```

[//]: # 'ExampleCacheContext'
[//]: # 'Materials'
[//]: # 'Materials'
