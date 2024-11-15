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
    'separate function': 'separate function or a service',
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
      //    ^? data: number
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
    queryFn: fetchGroups
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
    defaultError: AxiosError
  }
}

const query = injectQuery(() => ({
  queryKey: ['groups'],
  queryFn: fetchGroups,
}))

computed(() => {
  const error = query.error()
  //      ^? error: AxiosError | null
})
```

[//]: # 'RegisterErrorType'
[//]: # 'Materials'
[//]: # 'Materials'
