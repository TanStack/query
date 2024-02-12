---
id: angular-query
title: Angular Query
---

The Angular adapter is now available for TanStack Query v5.

```ts
  postQuery = injectQuery(() => ({
    enabled: this.postId() > 0,
    queryKey: ['post', this.postId()],
    queryFn: () => lastValueFrom(this.getPost$(this.postId()))
  }))
```

It's based on Angular signals and compatible with Angular v17+.

Check the complete documentation: [Angular Query overview](https://tanstack.com/query/latest/docs/framework/angular/overview).
