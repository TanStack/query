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

Add the devtools package (in addition to `@tanstack/angular-query-experimental`):

```bash
npm install @tanstack/angular-query-devtools
```

The devtools help you debug and inspect your queries and mutations. You can enable the devtools by adding `withDevtools` to `provideTanStackQuery`.

By default, Angular Query Devtools only load in development.

```ts
import {
  QueryClient,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'

import { withDevtools } from '@tanstack/angular-query-devtools'

export const appConfig: ApplicationConfig = {
  providers: [...provideTanStackQuery(new QueryClient(), withDevtools())],
}
```

## Devtools in production

If you need the real implementation in production, import from the `production` entrypoint.

```ts
import { withDevtools } from '@tanstack/angular-query-devtools/production'
```

To control when devtools are loaded, use the `loadDevtools` option.

When omitted or set to `'auto'`, devtools only load in development mode.

```ts
import { withDevtools } from '@tanstack/angular-query-devtools'

providers: [...provideTanStackQuery(new QueryClient(), withDevtools())]

// which is equivalent to
providers: [
  provideTanStackQuery(
    new QueryClient(),
    withDevtools(() => ({ loadDevtools: 'auto' })),
  ),
]
```

When setting the option to true, the devtools will be loaded in both development and production mode.

This is useful if you want to load devtools based on [Angular environment configurations](https://angular.dev/tools/cli/environments). E.g. you could set this to true when the application is running on your production build staging environment.

```ts
import { environment } from './environments/environment'
// Make sure to use the production sub-path to load devtools in production builds
import { withDevtools } from '@tanstack/angular-query-devtools/production'

providers: [
  provideTanStackQuery(
    new QueryClient(),
    withDevtools(() => ({ loadDevtools: environment.loadDevtools })),
  ),
]
```

When setting the option to false, the devtools will not be loaded.

```ts
providers: [
  provideTanStackQuery(
    new QueryClient(),
    withDevtools(() => ({ loadDevtools: false })),
  ),
]
```

## Derive options through reactivity

Options can be returned from a callback so they can react to signals. For example, a signal derived from a keyboard shortcut can enable devtools on demand:

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

To use an injectable such as a service in the callback, pass it through `deps`:

```ts
// ...
// 👇 Note we import from the production sub-path to enable devtools lazy loading in production builds
import { withDevtools } from '@tanstack/angular-query-devtools/production'

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
  - Omit or `'auto'`: load devtools only in development mode.
  - Use this to control whether devtools load when using the `/production` import.
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
