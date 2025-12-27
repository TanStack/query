---
id: ssr
title: SSR
---

Vue Query supports prefetching multiple queries on the server and then _dehydrating_ those queries to the queryClient. This means the server can prerender markup that is immediately available on page load and as soon as JS is available, Vue Query can upgrade or _hydrate_ those queries with the full functionality of the library. This includes refetching those queries on the client if they have become stale since the time they were rendered on the server.

## Using Nuxt.js

### Nuxt 3

First create `vue-query.ts` file in your `plugins` directory with the following content:

```ts
import type {
  DehydratedState,
  VueQueryPluginOptions,
} from '@tanstack/vue-query'
import {
  VueQueryPlugin,
  QueryClient,
  hydrate,
  dehydrate,
} from '@tanstack/vue-query'
// Nuxt 3 app aliases
import { defineNuxtPlugin, useState } from '#imports'

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query')

  // Modify your Vue Query global settings here
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5000 } },
  })
  const options: VueQueryPluginOptions = { queryClient }

  nuxt.vueApp.use(VueQueryPlugin, options)

  if (import.meta.server) {
    nuxt.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }

  if (import.meta.client) {
    hydrate(queryClient, vueQueryState.value)
  }
})
```

Now you are ready to prefetch some data in your pages with `onServerPrefetch`.

- Prefetch all the queries that you need with `queryClient.prefetchQuery` or `suspense`

```ts
export default defineComponent({
  setup() {
    const { data, suspense } = useQuery({
      queryKey: ['test'],
      queryFn: fetcher,
    })

    onServerPrefetch(async () => {
      await suspense()
    })

    return { data }
  },
})
```

### Nuxt 2

First create `vue-query.js` file in your `plugins` directory with the following content:

```js
import Vue from 'vue'
import { VueQueryPlugin, QueryClient, hydrate } from '@tanstack/vue-query'

export default (context) => {
  // Modify your Vue Query global settings here
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5000 } },
  })

  if (process.server) {
    context.ssrContext.VueQuery = queryClient
  }

  if (process.client) {
    Vue.use(VueQueryPlugin, { queryClient })

    if (context.nuxtState && context.nuxtState.vueQueryState) {
      hydrate(queryClient, context.nuxtState.vueQueryState)
    }
  }
}
```

Add this plugin to your `nuxt.config.js`

```js
module.exports = {
  ...
  plugins: ['~/plugins/vue-query.js'],
}
```

Now you are ready to prefetch some data in your pages with `onServerPrefetch`.

- Use `useContext` to get nuxt context
- Use `useQueryClient` to get server-side instance of `queryClient`
- Prefetch all the queries that you need with `queryClient.prefetchQuery` or `suspense`
- Dehydrate `queryClient` to the `nuxtContext`

```vue
// pages/todos.vue
<template>
  <div>
    <button @click="refetch">Refetch</button>
    <p>{{ data }}</p>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onServerPrefetch,
  useContext,
} from '@nuxtjs/composition-api'
import { useQuery, useQueryClient, dehydrate } from '@tanstack/vue-query'

export default defineComponent({
  setup() {
    // Get QueryClient either from SSR context, or Vue context
    const { ssrContext } = useContext()
    // Make sure to provide `queryClient` as a second parameter to `useQuery` calls
    const queryClient =
      (ssrContext != null && ssrContext.VueQuery) || useQueryClient()

    // This will be prefetched and sent from the server
    const { data, refetch, suspense } = useQuery(
      {
        queryKey: ['todos'],
        queryFn: getTodos,
      },
      queryClient,
    )
    // This won't be prefetched, it will start fetching on client side
    const { data2 } = useQuery(
      {
        queryKey: 'todos2',
        queryFn: getTodos,
      },
      queryClient,
    )

    onServerPrefetch(async () => {
      await suspense()
      ssrContext.nuxt.vueQueryState = dehydrate(queryClient)
    })

    return {
      refetch,
      data,
    }
  },
})
</script>
```

As demonstrated, it's fine to prefetch some queries and let others fetch on the queryClient. This means you can control what content server renders or not by adding or removing `prefetchQuery` or `suspense` for a specific query.

## Using Vite SSR

Sync VueQuery client state with [vite-ssr](https://github.com/frandiox/vite-ssr) in order to serialize it in the DOM:

```js
// main.js (entry point)
import App from './App.vue'
import viteSSR from 'vite-ssr/vue'
import {
  QueryClient,
  VueQueryPlugin,
  hydrate,
  dehydrate,
} from '@tanstack/vue-query'

export default viteSSR(App, { routes: [] }, ({ app, initialState }) => {
  // -- This is Vite SSR main hook, which is called once per request

  // Create a fresh VueQuery client
  const queryClient = new QueryClient()

  // Sync initialState with the client state
  if (import.meta.env.SSR) {
    // Indicate how to access and serialize VueQuery state during SSR
    initialState.vueQueryState = { toJSON: () => dehydrate(queryClient) }
  } else {
    // Reuse the existing state in the browser
    hydrate(queryClient, initialState.vueQueryState)
  }

  // Mount and provide the client to the app components
  app.use(VueQueryPlugin, { queryClient })
})
```

Then, call VueQuery from any component using Vue's `onServerPrefetch`:

```html
<!-- MyComponent.vue -->
<template>
  <div>
    <button @click="refetch">Refetch</button>
    <p>{{ data }}</p>
  </div>
</template>

<script setup>
  import { useQuery } from '@tanstack/vue-query'
  import { onServerPrefetch } from 'vue'

  // This will be prefetched and sent from the server
  const { refetch, data, suspense } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  })

  onServerPrefetch(suspense)
</script>
```

## Tips, Tricks and Caveats

### Only successful queries are included in dehydration

Any query with an error is automatically excluded from dehydration. This means that the default behavior is to pretend these queries were never loaded on the server, usually showing a loading state instead, and retrying the queries on the queryClient. This happens regardless of error.

Sometimes this behavior is not desirable, maybe you want to render an error page with a correct status code instead on certain errors or queries. In those cases, use `fetchQuery` and catch any errors to handle those manually.

### Staleness is measured from when the query was fetched on the server

A query is considered stale depending on when it was `dataUpdatedAt`. A caveat here is that the server needs to have the correct time for this to work properly, but UTC time is used, so timezones do not factor into this.

Because `staleTime` defaults to `0`, queries will be refetched in the background on page load by default. You might want to use a higher `staleTime` to avoid this double fetching, especially if you don't cache your markup.

This refetching of stale queries is a perfect match when caching markup in a CDN! You can set the cache time of the page itself decently high to avoid having to re-render pages on the server, but configure the `staleTime` of the queries lower to make sure data is refetched in the background as soon as a user visits the page. Maybe you want to cache the pages for a week, but refetch the data automatically on page load if it's older than a day?

### High memory consumption on server

In case you are creating the `QueryClient` for every request, Vue Query creates the isolated cache for this client, which is preserved in memory for the `gcTime` period. That may lead to high memory consumption on server in case of high number of requests during that period.

On the server, `gcTime` defaults to `Infinity` which disables manual garbage collection and will automatically clear memory once a request has finished. If you are explicitly setting a non-Infinity `gcTime` then you will be responsible for clearing the cache early.

To clear the cache after it is not needed and to lower memory consumption, you can add a call to [`queryClient.clear()`](../../../reference/QueryClient/#queryclientclear) after the request is handled and dehydrated state has been sent to the client.

Alternatively, you can set a smaller `gcTime`.
