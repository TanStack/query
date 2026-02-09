![TanStack Query Header](https://github.com/TanStack/query/raw/main/media/repo-header.png)

[![npm version](https://img.shields.io/npm/v/@tanstack/angular-query-experimental)](https://www.npmjs.com/package/@tanstack/angular-query-experimental)
[![npm license](https://img.shields.io/npm/l/@tanstack/angular-query-experimental)](https://github.com/TanStack/query/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tanstack/angular-query-experimental)](https://bundlephobia.com/package/@tanstack/angular-query-experimental)
[![npm](https://img.shields.io/npm/dm/@tanstack/angular-query-experimental)](https://www.npmjs.com/package/@tanstack/angular-query-experimental)

# Angular Query

> IMPORTANT: This library is currently in an experimental stage. This means that breaking changes may happen in minor AND patch releases. Upgrade carefully. If you use this in production while in experimental stage, please lock your version to a patch-level version to avoid unexpected breaking changes.

Functions for fetching, caching and updating asynchronous data in Angular

# Documentation

Visit https://tanstack.com/query/latest/docs/framework/angular/overview

## Quick Features

- Transport/protocol/backend agnostic data fetching (REST, GraphQL, promises, whatever!)
- Auto Caching + Refetching (stale-while-revalidate, Window Refocus, Polling/Realtime)
- Parallel + Dependent Queries
- Mutations + Reactive Query Refetching
- Multi-layer Cache + Automatic Garbage Collection
- Paginated + Cursor-based Queries
- Load-More + Infinite Scroll Queries w/ Scroll Recovery
- Request Cancellation
- Dedicated Devtools

# Quick Start

> The Angular adapter for TanStack Query requires Angular 19 or higher.

1. Install `angular-query`

```bash
$ npm i @tanstack/angular-query-experimental
```

or

```bash
$ pnpm add @tanstack/angular-query-experimental
```

or

```bash
$ yarn add @tanstack/angular-query-experimental
```

or

```bash
$ bun add @tanstack/angular-query-experimental
```

2. Initialize **TanStack Query** by adding **provideTanStackQuery** to your application

```ts
import { provideTanStackQuery } from '@tanstack/angular-query-experimental'
import { QueryClient } from '@tanstack/angular-query-experimental'

bootstrapApplication(AppComponent, {
  providers: [provideTanStackQuery(new QueryClient())],
})
```

or in a NgModule-based app

```ts
import { provideHttpClient } from '@angular/common/http'
import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [provideTanStackQuery(new QueryClient()), provideHttpClient()],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

3. Inject query

```ts
import { injectQuery } from '@tanstack/angular-query-experimental'
import { Component } from '@angular/core'

@Component({...})
export class TodosComponent {
  info = injectQuery(() => ({ queryKey: ['todos'], queryFn: fetchTodoList }))
}
```

4. If you need to update options on your query dynamically, make sure to pass them as signals. The query will refetch automatically if data for an updated query key is stale or not present.

[Open in StackBlitz](https://stackblitz.com/github/TanStack/query/tree/main/examples/angular/router)

```ts
@Component({})
export class PostComponent {
  #postsService = inject(PostsService)
  postId = input.required({
    transform: numberAttribute,
  })

  postQuery = injectQuery(() => ({
    queryKey: ['post', this.postId()],
    queryFn: () => {
      return lastValueFrom(this.#postsService.postById$(this.postId()))
    },
  }))
}

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  #http = inject(HttpClient)

  postById$ = (postId: number) =>
    this.#http.get<Post>(`https://jsonplaceholder.typicode.com/posts/${postId}`)
}

export interface Post {
  id: number
  title: string
  body: string
}
```

<!-- -->
