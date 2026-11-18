# TanStack Angular Query Devtools Panel Example (Angular Router)

Embeds the devtools as a panel inside the page instead of the floating toggle.

Built with [Angular Router](https://angular.dev/guide/routing).

## How it works

- `src/app/services/repos/queries.ts` is an `@Injectable` `ReposQueries` whose `detail()` returns `queryOptions` that fetch the `TanStack/query` repository with `HttpClient` and `lastValueFrom`.
- `src/app/components/example-query.component.ts` reads it with `injectQuery(() => this.#reposQueries.detail())` and is rendered on both routes.
- `src/app/components/basic-devtools-panel-example.component.ts` calls `injectDevtoolsPanel` with the `<div>` from `viewChild` as `hostElement`, so the panel mounts in that `<div>` while it is open.
- `src/app/components/lazy-load-devtools-panel-example.component.ts` imports `@tanstack/angular-query-devtools/devtools-panel` in an `effect` only the first time the panel is opened, then calls `injectDevtoolsPanel` with the component's `Injector`.
- `src/app/app.routes.ts` lazy loads the two examples at `basic` and `lazy` with `loadComponent`, and `src/app/app.config.ts` registers `provideTanStackQuery` without `withDevtools()`.

To run this example:

- `npm install`
- `npm start`
