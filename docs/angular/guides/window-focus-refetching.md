---
id: window-focus-refetching
title: Window Focus Refetching
ref: docs/react/guides/window-focus-refetching.md
replace: { '@tanstack/react-query': '@tanstack/angular-query-experimental' }
---

[//]: # 'Example'

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // default: true
          },
        },
      }),
    ),
  ],
})
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
injectQuery(() => ({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchOnWindowFocus: false,
}))
```

[//]: # 'Example2'
[//]: # 'ReactNative'
[//]: # 'ReactNative'
