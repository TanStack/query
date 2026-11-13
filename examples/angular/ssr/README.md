# TanStack Angular Query SSR Example

A list of posts that is rendered on the server and hydrated in the browser without fetching again.

Built with [Angular SSR](https://angular.dev/guide/ssr).

## How it works

- `src/app/services/posts.service.ts` is an `@Injectable` `PostsService` that returns in-memory posts as an observable, so the example needs no API.
- `src/app/components/posts.component.ts` reads the posts with `injectQuery` and `lastValueFrom`. The query runs during server rendering, and the server waits for it before sending the HTML.
- `src/app/query-client.ts` exports the `createQueryClient` factory. It runs in an injection context, so it uses `PLATFORM_ID` to turn off `retry` on the server.
- `src/app/app.config.ts` passes the factory to `provideTanStackQuery`, which transfers the query cache from the server to the browser, and adds `provideClientHydration` and `withDevtools()`.
- `src/app/app.config.server.ts`, `src/main.server.ts` and `src/server.ts` are the Angular CLI server files. `src/app/app.routes.server.ts` renders every route with `RenderMode.Server`.

To run this example:

- `npm install`
- `npm start`

To run the production server, run `npm run build` and then `npm run serve:ssr`.
