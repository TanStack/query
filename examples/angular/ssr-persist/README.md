# TanStack Angular Query SSR Persist Example

The SSR posts example with a `localStorage` persister and a query that only runs in the browser.

Built with [Angular SSR](https://angular.dev/guide/ssr).

## How it works

- `src/app/components/posts.component.ts` reads in-memory posts from `src/app/services/posts.service.ts` with `injectQuery`. The query runs during server rendering and its result is transferred to the browser.
- `src/app/app.config.ts` adds `withPersistQueryClient` to `provideTanStackQuery` with a `localStorage` persister from `createAsyncStoragePersister`. The options factory only runs in the browser, so `localStorage` is not touched on the server.
- `src/app/app.component.ts` sets `showClientDemo` to `true` in `afterNextRender`, so `src/app/components/client-persist-demo.component.ts` is only created in the browser and its query never runs on the server.
- That query stores a timestamp with `staleTime: Infinity`. After a hard reload, the posts come from the server again and the timestamp is restored from `localStorage`.
- `src/app/query-client.ts` exports the `createQueryClient` factory, which turns off `retry` on the server and sets a `gcTime` of 24 hours so the persisted cache is kept.

To run this example:

- `npm install`
- `npm start`

To run the production server, run `npm run build` and then `npm run serve:ssr`.
