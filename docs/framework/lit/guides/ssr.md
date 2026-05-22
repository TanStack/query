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
import { render } from '@lit-labs/ssr'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { html } from 'lit'
import { QueryClient, dehydrate } from '@tanstack/lit-query'
import { createDataQueryOptions } from './api.js'
import './app.js'

async function renderPage() {
  const apiBaseUrl = 'https://example.com'
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
  })

  await queryClient.prefetchQuery(createDataQueryOptions(apiBaseUrl))

  const appHtml = await collectResult(
    render(
      html`<ssr-app
        api-base-url=${apiBaseUrl}
        .queryClient=${queryClient}
      ></ssr-app>`,
    ),
  )

  const dehydratedState = dehydrate(queryClient)

  return { appHtml, dehydratedState }
}
```

The server passes the same client into the Lit element with a property binding. This lets `createQueryController` read the prefetched cache during server render. If your query function calls `fetch` during SSR, pass an absolute API origin instead of relying on a browser-relative URL.

## Client Hydration

```ts
import '@lit-labs/ssr-client/lit-element-hydrate-support.js'
import { QueryClient, hydrate, type DehydratedState } from '@tanstack/lit-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
})

const dehydratedState = JSON.parse(
  document.getElementById('__QUERY_STATE__')?.textContent ?? 'null',
) as DehydratedState

queryClient.mount()
hydrate(queryClient, dehydratedState)

const appElement = document.querySelector('ssr-app') as
  | (HTMLElement & { queryClient?: QueryClient })
  | null

if (!appElement) {
  throw new Error('Expected the SSR app element to exist before hydration.')
}

appElement.queryClient = queryClient
await import('./app.js')
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

The SSR example creates its controller only after a `queryClient` property is available:

```ts
import { LitElement } from 'lit'
import {
  createQueryController,
  type QueryClient,
  type QueryResultAccessor,
} from '@tanstack/lit-query'
import { createDataQueryOptions, type DataResponse } from './api.js'

class SsrApp extends LitElement {
  static properties = {
    apiBaseUrl: { attribute: 'api-base-url' },
    queryClient: { attribute: false },
  }

  apiBaseUrl = ''
  queryClient?: QueryClient
  private dataQuery?: QueryResultAccessor<DataResponse, Error>

  protected override willUpdate(): void {
    if (!this.dataQuery && this.queryClient) {
      this.dataQuery = createQueryController(
        this,
        createDataQueryOptions(this.apiBaseUrl),
        this.queryClient,
      )
    }
  }
}
```

This explicit-client pattern is useful for SSR because the client is created by the renderer rather than discovered from a connected DOM provider.

## Serialization

Embed dehydrated state as JSON in the HTML and escape characters that can break out of a script tag. The example server uses a small serializer before replacing `__QUERY_STATE_JSON__` in the built HTML template.

Lit Query re-exports `dehydrate` and `hydrate` from TanStack Query Core. Use `dehydrate(queryClient)` after server prefetching to capture the cache state. In the browser, parse that state, create a fresh `QueryClient`, call `hydrate(queryClient, dehydratedState)`, assign the client to the server-rendered element, and only then import the Lit component so it upgrades with the prefetched cache available.
