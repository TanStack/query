---
id: devtools
title: Devtools
---

> For Chrome, Firefox, and Edge users: Third-party browser extensions are available for debugging TanStack Query directly in browser DevTools. These provide the same functionality as the framework-specific devtools packages:
>
> - <img alt="Chrome logo" src="https://www.google.com/chrome/static/images/chrome-logo.svg" width="16" height="16" class="inline mr-1 not-prose" /> [Devtools for Chrome](https://chromewebstore.google.com/detail/tanstack-query-devtools/annajfchloimdhceglpgglpeepfghfai)
> - <img alt="Firefox logo" src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" width="16" height="16" class="inline mr-1 not-prose" /> [Devtools for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tanstack-query-devtools/)
> - <img alt="Edge logo" src="https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg" width="16" height="16" class="inline mr-1 not-prose" /> [Devtools for Edge](https://microsoftedge.microsoft.com/addons/detail/tanstack-query-devtools/edmdpkgkacmjopodhfolmphdenmddobj)

## Enable devtools

The devtools help you debug and inspect your queries and mutations. You can enable the devtools by adding `withDevtools` to `provideTanStackQuery`.

By default, Angular Query Devtools are only included in development mode bundles, so you don't need to worry about excluding them during a production build.

```ts
import {
  QueryClient,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'

import { withDevtools } from '@tanstack/angular-query-experimental/devtools'

export const appConfig: ApplicationConfig = {
  providers: [provideTanStackQuery(new QueryClient(), withDevtools())],
}
```

## Devtools in production

Devtools are automatically excluded from production builds. However, it might be desirable to lazy load the devtools in production.

To use `withDevtools` in production builds, import using the `production` sub-path. The function exported from the production subpath is identical to the main one, but won't be excluded from production builds.

```ts
import { withDevtools } from '@tanstack/angular-query-experimental/devtools/production'
```

To control when devtools are loaded, you can use the `loadDevtools` option.

When not setting the option or setting it to 'auto', the devtools will be loaded automatically when Angular runs in development mode.

```ts
import { withDevtools } from '@tanstack/angular-query-experimental/devtools'

provideTanStackQuery(new QueryClient(), withDevtools())

// which is equivalent to
provideTanStackQuery(
  new QueryClient(),
  withDevtools(() => ({ loadDevtools: 'auto' })),
)
```

When setting the option to true, the devtools will be loaded in both development and production mode.

This is useful if you want to load devtools based on [Angular environment configurations](https://angular.dev/tools/cli/environments). E.g. you could set this to true when the application is running on your production build staging environment.

```ts
import { environment } from './environments/environment'
// Make sure to use the production sub-path to load devtools in production builds
import { withDevtools } from '@tanstack/angular-query-experimental/devtools/production'

provideTanStackQuery(
  new QueryClient(),
  withDevtools(() => ({ loadDevtools: environment.loadDevtools })),
)
```

When setting the option to false, the devtools will not be loaded.

```ts
provideTanStackQuery(
  new QueryClient(),
  withDevtools(() => ({ loadDevtools: false })),
)
```

## Derive options through reactivity

Options are passed to `withDevtools` from a callback function to support reactivity through signals. In the following example
a signal is created from a RxJS observable that emits on a keyboard shortcut. When the derived signal is set to true, the devtools are lazily loaded.

> If you don't need devtools in production builds, don't use the `production` sub-path. Even though most of the devtools are lazy loaded on-demand, code is needed for on-demand loading and option handling. When importing devtools from `@tanstack/angular-query-experimental/devtools`, all devtools code will be excluded from your build and no lazy chunks will be created, minimizing deployment size.

The example below always loads devtools in development mode and loads on-demand in production mode when a keyboard shortcut is pressed.

```ts
import { Injectable, isDevMode } from '@angular/core'
import { fromEvent, map, scan } from 'rxjs'
import { toSignal } from '@angular/core/rxjs-interop'

@Injectable({ providedIn: 'root' })
export class DevtoolsOptionsManager {
  loadDevtools = toSignal(
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      map(
        (event): boolean =>
          event.metaKey && event.ctrlKey && event.shiftKey && event.key === 'D',
      ),
      scan((acc, curr) => acc || curr, isDevMode()),
    ),
    {
      initialValue: isDevMode(),
    },
  )
}
```

If you want to use an injectable such as a service in the callback you can use `deps`. The injected value will be passed as parameter to the callback function.

This is similar to `deps` in Angular's [`useFactory`](https://angular.dev/guide/di/dependency-injection-providers#factory-providers-usefactory) provider.

```ts
// ...
// 👇 Note we import from the production sub-path to enable devtools lazy loading in production builds
import { withDevtools } from '@tanstack/angular-query-experimental/devtools/production'

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
          // `deps` is used to inject and pass `DevtoolsOptionsManager` to the `withDevtools` callback.
          deps: [DevtoolsOptionsManager],
        },
      ),
    ),
  ],
}
```

### Options returned from the callback

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
- `hideDisabledQueries?: boolean`
  - Set this to true to hide disabled queries from the devtools panel.
