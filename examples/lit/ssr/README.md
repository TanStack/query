# TanStack Lit Query SSR Example

Server-side rendering: the server prefetches queries, dehydrates the cache into the page, and the client hydrates it.

Built with [Lit SSR](https://lit.dev/docs/ssr/overview/).

## How it works

- `src/services/posts/queries.ts`, `src/services/users/queries.ts` and `src/services/comments/queries.ts` define `postsQueries.list()`, `usersQueries.detail(id)` and `commentsQueries.list()` with `queryOptions`. `usersQueries.detail` uses `skipToken` while `id` is `undefined`.
- `src/entry-server.ts` prefetches the posts and the first post's author with `queryClient.query`, dehydrates the cache, hydrates a second `QueryClient` with it, renders `<ssr-app .queryClient=${client}>` with `render` and `collectResult` from `@lit-labs/ssr`, and returns the state serialized with `devalue`.
- `src/entry-client.ts` imports `lit-element-hydrate-support.js`, hydrates a `QueryClient` from `window.__DEHYDRATED_STATE__`, assigns it to the server-rendered `<ssr-app>`, and only then imports `src/app.ts` so the element upgrades with the cache in place.
- `src/app.ts` creates its `createQueryController`s in `willUpdate` once `queryClient` is set, passing the client explicitly. The posts and author come from the cache, and the comments are only fetched on the client.
- `server.js` is an Express server that uses Vite's middleware mode in development and serves `dist/client` in production, and puts the rendered HTML and state into `index.html`.

To run this example:

- `npm install`
- `npm run dev`
