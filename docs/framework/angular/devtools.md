---
id: devtools
title: Devtools
---

## Enable devtools

The devtools help you debug and inspect your queries and mutations. You can enable the devtools by adding `withDevtools` to `provideTanStackQuery`.

By default, the devtools are enabled when Angular is in development mode. So you don't need to worry about excluding them during a production build. The tools are lazily loaded and excluded from bundled code. In most cases, all you'll need to do is add `withDevtools()` to `provideTanStackQuery` without any additional configuration.

```ts
import {
  QueryClient,
  provideTanStackQuery,
  withDevtools,
} from '@tanstack/angular-query-experimental'

export const appConfig: ApplicationConfig = {
  providers: [provideTanStackQuery(new QueryClient(), withDevtools())],
}
```

## Configuring if devtools are loaded

If you need more control over when devtools are loaded, you can use the `loadDevtools` option. This is particularly useful if you want to load devtools based on environment configurations. For instance, you might have a test environment running in production mode but still require devtools to be available.

When not setting the option or setting it to 'auto', the devtools will be loaded when Angular is in development mode.

```ts
provideTanStackQuery(new QueryClient(), withDevtools())

// which is equivalent to
provideTanStackQuery(
  new QueryClient(),
  withDevtools(() => ({ loadDevtools: 'auto' })),
)
```

When setting the option to true, the devtools will be loaded in both development and production mode.

```ts
provideTanStackQuery(
  new QueryClient(),
  withDevtools(() => ({ loadDevtools: true })),
)
```

When setting the option to false, the devtools will not be loaded.

```ts
provideTanStackQuery(
  new QueryClient(),
  withDevtools(() => ({ loadDevtools: false })),
)
```

The `withDevtools` options are returned from a callback function to support reactivity through signals. In the following example
a signal is created from a RxJS observable that listens for a keyboard shortcut. When the event is triggered, the devtools are lazily loaded.
Using this technique allows you to support on-demand loading of the devtools even in production mode, without including the full tools in the bundled code.

```ts
@Injectable({ providedIn: 'root' })
export class DevtoolsOptionsManager {
  loadDevtools = toSignal(
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      map(
        (event): boolean =>
          event.metaKey && event.ctrlKey && event.shiftKey && event.key === 'D',
      ),
      scan((acc, curr) => acc || curr, false),
    ),
    {
      initialValue: false,
    },
  )
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTanStackQuery(
      new QueryClient(),
      withDevtools(
        (devToolsOptionsManager: DevtoolsOptionsManager) => ({
          loadDevtools: devToolsOptionsManager.loadDevtools(),
        }),
        {
          // `deps` can be used to pass one or more injectables as parameters to the `withDevtools` callback.
          deps: [DevtoolsOptionsManager],
        },
      ),
    ),
  ],
}
```

### Options

Of these options `loadDevtools`, `client`, `position`, `errorTypes`, `buttonPosition`, and `initialIsOpen` support reactivity through signals.

- `loadDevtools?: 'auto' | boolean`
  - Defaults to `auto`: lazily loads devtools when in development mode. Skips loading in production mode.
  - Use this to control if the devtools are loaded.
- `initialIsOpen?: Boolean`
  - Set this to `true` if you want the tools to default to being open
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "relative"`
  - Defaults to `bottom-right`
  - The position of the TanStack logo to open and close the devtools panel
  - If `relative`, the button is placed in the location that you render the devtools.
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the Angular Query devtools panel
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the QueryClient provided through `provideTanStackQuery` will be injected.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}[]`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.
