---
id: ssr
title: Server Rendering & Hydration
---

Lit Query can be used with server rendering by combining Lit SSR with TanStack Query Core hydration APIs re-exported from `@tanstack/lit-query`.

The runnable source for this guide is the [SSR example](../examples/ssr).

## Flow

Server rendering has three phases:

1. Create a per-request `QueryClient`.
2. Prefetch queries on the server and render Lit HTML with that client.
3. Dehydrate the cache into the HTML, then hydrate a browser `QueryClient` before the client app renders.

Never share one server `QueryClient` between users or requests.

## Server Prefetch and Render

```ts
import { render as renderLit } from '@lit-labs/ssr'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { html } from 'lit'
import { uneval } from 'devalue'
import { dehydrate, hydrate, noop } from '@tanstack/lit-query'
import { makeQueryClient } from './makeQueryClient'
import { postsQueries } from './services/posts/queries'
import { usersQueries } from './services/users/queries'
import './app'

export async function render() {
  const prefetchClient = makeQueryClient()

  const posts = await prefetchClient.query(postsQueries.list())

  const authorId = posts[0]?.userId
  if (authorId) {
    await prefetchClient.query(usersQueries.detail(authorId)).catch(noop)
  }

  const dehydratedState = dehydrate(prefetchClient)

  const renderClient = makeQueryClient()
  hydrate(renderClient, dehydratedState)

  const appHtml = await collectResult(
    renderLit(html`<ssr-app .queryClient=${renderClient}></ssr-app>`),
  )

  return { html: appHtml, state: uneval(dehydratedState) }
}
```

`makeQueryClient` creates a `QueryClient` with a `staleTime` above 0, so the client doesn't refetch right after hydration. The server passes the client into the Lit element with a property binding. This lets `createQueryController` read the prefetched cache during server render. If your query function calls `fetch` during SSR, use an absolute URL instead of a browser-relative one.

## Client Hydration

```ts
import '@lit-labs/ssr-client/lit-element-hydrate-support.js'
import { hydrate } from '@tanstack/lit-query'
import { makeQueryClient } from './makeQueryClient'

const queryClient = makeQueryClient()
queryClient.mount()
hydrate(queryClient, window.__DEHYDRATED_STATE__)

const appElement = document.querySelector('ssr-app')
if (!appElement) {
  throw new Error('Expected the server-rendered <ssr-app> element')
}

appElement.queryClient = queryClient
await import('./app')
```

Unmount the client when the page is unloaded if you mounted it manually:

```ts
window.addEventListener(
  'pagehide',
  () => {
    queryClient.unmount()
  },
  { once: true },
)
```

## Component Pattern

The SSR example creates its controllers only after a `queryClient` property is available:

```ts
import { LitElement } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { postsQueries } from './services/posts/queries'
import { usersQueries } from './services/users/queries'
import type { QueryClient, QueryResultAccessor } from '@tanstack/lit-query'
import type { Post } from './services/posts/types'
import type { User } from './services/users/types'

class SsrApp extends LitElement {
  static properties = {
    queryClient: { attribute: false },
  }

  queryClient?: QueryClient
  private postsQuery?: QueryResultAccessor<Array<Post>, Error>
  private authorQuery?: QueryResultAccessor<User, Error>

  protected override willUpdate(): void {
    if (this.postsQuery || !this.queryClient) return

    const postsQuery = createQueryController(
      this,
      postsQueries.list(),
      this.queryClient,
    )
    this.postsQuery = postsQuery

    this.authorQuery = createQueryController(
      this,
      usersQueries.detail(postsQuery().data?.[0]?.userId),
      this.queryClient,
    )
  }
}
```

This explicit-client pattern is useful for SSR because the client is created by the renderer rather than discovered from a connected DOM provider. Pass options objects rather than option getters to controllers that render on the server: a getter is first read on a host update, which Lit SSR doesn't run, so the server would render the query as pending.

## Serialization

Embed the dehydrated state in the HTML and escape characters that can break out of a script tag. The example serializes it with `uneval` from `devalue` and puts it into `window.__DEHYDRATED_STATE__` in `index.html`.

Lit Query re-exports `dehydrate` and `hydrate` from TanStack Query Core. Use `dehydrate(queryClient)` after server prefetching to capture the cache state. In the browser, create a fresh `QueryClient`, call `hydrate(queryClient, dehydratedState)`, assign the client to the server-rendered element, and only then import the Lit component so it upgrades with the prefetched cache available.
