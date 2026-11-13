# TanStack Angular Query Dynamic Devtools Example

Loads the devtools on demand in a production build with a keyboard shortcut.

## How it works

- `src/app/devtools-options.manager.ts` is an `@Injectable` `DevtoolsOptionsManager` whose `loadDevtools` signal becomes `true` the first time <kbd>⌘</kbd> <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>D</kbd> is pressed. It is built with `fromEvent`, `scan` and `toSignal`.
- `src/app/app.config.ts` imports `withDevtools` from `@tanstack/angular-query-devtools/production`, so the devtools are also available in production builds, and passes the signal as the `loadDevtools` option in an options function that can call `inject`.
- `src/app/components/dynamic-devtools-example.component.ts` reads the `TanStack/query` repository with `injectQuery`, `HttpClient` and `lastValueFrom`, so the devtools have a query to show.

To run this example:

- `npm install`
- `npm start`

To try the shortcut in a production build, run `npm start -- --configuration production`.
