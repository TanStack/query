---
id: typescript
title: TypeScript
ref: docs/framework/react/typescript.md
replace:
  {
    'useQuery': 'injectQuery',
    'useMutation': 'injectMutation',
    'react-query': 'angular-query-experimental',
    'public API of React Query': 'public API of TanStack Query and - after the experimental phase, the angular-query package',
    'still follows': 'still follow',
    'React Query': 'TanStack Query',
    '`success`': '`isSuccess()`',
    'function:': 'function.',
  }
---

[//]: # 'TypeInference1'

```angular-ts
@Component({
  // ...
  template: `@let data = query.data();`,
  //               ^? data: number | undefined
})
class MyComponent {
  query = injectQuery(() => ({
    queryKey: ['test'],
    queryFn: () => Promise.resolve(5),
  }))
}
```

[//]: # 'TypeInference1'
[//]: # 'TypeInference2'

```angular-ts
@Component({
  // ...
  template: `@let data = query.data();`,
  //               ^? data: string | undefined
})
class MyComponent {
  query = injectQuery(() => ({
    queryKey: ['test'],
    queryFn: () => Promise.resolve(5),
    select: (data) => data.toString(),
  }))
}
```

[//]: # 'TypeInference2'
[//]: # 'TypeInference3'

In this example we pass Group[] to the type parameter of HttpClient's `get` method.

```angular-ts
@Component({
  template: `@let data = query.data();`,
  //               ^? data: Group[] | undefined
})
class MyComponent {
  http = inject(HttpClient)

  query = injectQuery(() => ({
    queryKey: ['groups'],
    queryFn: () => lastValueFrom(this.http.get<Group[]>('/groups')),
  }))
}
```

[//]: # 'TypeInference3'
[//]: # 'TypeNarrowing'

```angular-ts
@Component({
  // ...
  template: `
    @if (query.isSuccess()) {
      @let data = query.data();
      // ^? data: number
    }
  `,
})
class MyComponent {
  query = injectQuery(() => ({
    queryKey: ['test'],
    queryFn: () => Promise.resolve(5),
  }))
}
```

> TypeScript currently does not support discriminated unions on object methods. Narrowing on signal fields on objects such as query results only works on signals returning a boolean. Prefer using `isSuccess()` and similar boolean status signals over `status() === 'success'`.

[//]: # 'TypeNarrowing'
[//]: # 'TypingError'

```angular-ts
@Component({
  // ...
  template: `@let error = query.error();`,
  //                ^? error: Error | null
})
class MyComponent {
  query = injectQuery(() => ({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  }))
}
```

[//]: # 'TypingError'
[//]: # 'TypingError2'

```angular-ts
@Component({
  // ...
  template: `@let error = query.error();`,
  //                ^? error: string | null
})
class MyComponent {
  query = injectQuery<Group[], string>(() => ({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  }))
}
```

[//]: # 'TypingError2'
[//]: # 'TypingError3'

```ts
import axios from 'axios'

query = injectQuery(() => ({ queryKey: ['groups'], queryFn: fetchGroups }))

computed(() => {
  const error = query.error()
  //     ^? error: Error | null

  if (axios.isAxiosError(error)) {
    error
    // ^? const error: AxiosError
  }
})
```

[//]: # 'TypingError3'
[//]: # 'RegisterErrorType'

```ts
import '@tanstack/angular-query-experimental'

declare module '@tanstack/angular-query-experimental' {
  interface Register {
    // Use unknown so call sites must narrow explicitly.
    defaultError: unknown
  }
}

const query = injectQuery(() => ({
  queryKey: ['groups'],
  queryFn: fetchGroups,
}))

computed(() => {
  const error = query.error()
  //      ^? error: unknown | null
})
```

[//]: # 'RegisterErrorType'
[//]: # 'TypingQueryOptions'

## Typing Query Options

If you inline query options into `injectQuery`, you'll get automatic type inference. However, you might want to extract the query options into a separate function to share them between `injectQuery` and e.g. `prefetchQuery` or manage them in a service. In that case, you'd lose type inference. To get it back, you can use the `queryOptions` helper:

```ts
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

@Component({
  // ...
})
export class Component {
  queryClient = inject(QueryClient)

  postId = signal(1)

  queries = inject(QueriesService)
  optionsSignal = computed(() => this.queries.post(this.postId()))

  postQuery = injectQuery(() => this.queries.post(1))
  postQuery = injectQuery(() => this.queries.post(this.postId()))

  // You can also pass a signal which returns query options
  postQuery = injectQuery(this.optionsSignal)

  someMethod() {
    this.queryClient.prefetchQuery(this.queries.post(23))
  }
}
```

Further, the `queryKey` returned from `queryOptions` knows about the `queryFn` associated with it, and we can leverage that type information to make functions like `queryClient.getQueryData` aware of those types as well:

```ts
data = this.queryClient.getQueryData(groupOptions().queryKey)
// ^? data: Post | undefined
```

Without `queryOptions`, the type of data would be unknown, unless we'd pass a type parameter:

```ts
data = queryClient.getQueryData<Post>(['post', 1])
```

## Typing Mutation Options

Similarly to `queryOptions`, you can use `mutationOptions` to extract mutation options into a separate function:

```ts
export class QueriesService {
  private http = inject(HttpClient)

  updatePost(id: number) {
    return mutationOptions({
      mutationFn: (post: Post) => Promise.resolve(post),
      mutationKey: ['updatePost', id],
      onSuccess: (newPost) => {
        //           ^? newPost: Post
        this.queryClient.setQueryData(['posts', id], newPost)
      },
    })
  }
}
```

[//]: # 'TypingQueryOptions'
[//]: # 'Materials'
[//]: # 'Materials'
