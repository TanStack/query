---
id: devtools
title: Devtools
---

> For Chrome, Firefox, and Edge users: Third-party browser extensions are available for debugging TanStack Query directly in browser DevTools. These provide the same functionality as the framework-specific devtools packages:
>
> - <img alt="Chrome logo" src="https://www.google.com/chrome/static/images/chrome-logo.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://chromewebstore.google.com/detail/tanstack-query-devtools/annajfchloimdhceglpgglpeepfghfai">Devtools for Chrome</a>
> - <img alt="Firefox logo" src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://addons.mozilla.org/en-US/firefox/addon/tanstack-query-devtools/">Devtools for Firefox</a>
> - <img alt="Edge logo" src="https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://microsoftedge.microsoft.com/addons/detail/tanstack-query-devtools/edmdpkgkacmjopodhfolmphdenmddobj">Devtools for Edge</a>

## Enable devtools

Add the devtools package (in addition to `@tanstack/angular-query`):

```bash
npm install @tanstack/angular-query-devtools
```

The devtools help you debug and inspect your queries and mutations. You can enable the devtools by adding `withDevtools` to `provideTanStackQuery`.

By default, Angular Query Devtools only load in development.

```ts
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query'

import { withDevtools } from '@tanstack/angular-query-devtools'

export const appConfig: ApplicationConfig = {
  providers: [provideTanStackQuery(() => new QueryClient(), withDevtools())],
}
```

## Devtools in production

If you need the real implementation in production, import from the `production` entrypoint.

```ts
import { withDevtools } from '@tanstack/angular-query-devtools/production'
```

To control when devtools are rendered, use the `loadDevtools` option.

When omitted or set to `'auto'`, devtools are only rendered in development mode.

```ts
import { withDevtools } from '@tanstack/angular-query-devtools'

providers: [provideTanStackQuery(() => new QueryClient(), withDevtools())]

// which is equivalent to
providers: [
  provideTanStackQuery(
    () => new QueryClient(),
    withDevtools(() => ({ loadDevtools: 'auto' })),
  ),
]
```

When setting the option to true, the devtools will be rendered in both development and production mode.

This is useful if you want to load devtools based on [Angular environment configurations](https://angular.dev/tools/cli/environments). E.g. you could set this to true when the application is running on your production build staging environment.

```ts
import { environment } from './environments/environment'
// Make sure to use the production sub-path to load devtools in production builds
import { withDevtools } from '@tanstack/angular-query-devtools/production'

providers: [
  provideTanStackQuery(
    () => new QueryClient(),
    withDevtools(() => ({ loadDevtools: environment.loadDevtools })),
  ),
]
```

When setting the option to false, the devtools will not be rendered.

```ts
providers: [
  provideTanStackQuery(
    () => new QueryClient(),
    withDevtools(() => ({ loadDevtools: false })),
  ),
]
```

### Webpack file replacements

Some webpack-based Angular builders do not apply package export conditions when
they bundle application code. Use the explicit `production` and `stub`
entrypoints with Angular CLI file replacements to keep the devtools dependency
out of production bundles.

Create an application-level import that can be replaced:

```ts
// src/app/query-devtools.ts
export { withDevtools } from '@tanstack/angular-query-devtools/production'
```

```ts
// src/app/query-devtools.stub.ts
export { withDevtools } from '@tanstack/angular-query-devtools/stub'
```

Import the application-level module from your config:

```ts
import { withDevtools } from './query-devtools'
```

Then configure the production build:

```json
{
  "configurations": {
    "production": {
      "fileReplacements": [
        {
          "replace": "src/app/query-devtools.ts",
          "with": "src/app/query-devtools.stub.ts"
        }
      ]
    }
  }
}
```

The same pattern is available for the programmatic panel:
`@tanstack/angular-query-devtools/devtools-panel/production` and
`@tanstack/angular-query-devtools/devtools-panel/stub`.

## Reactive options

Mutable options can be Angular signals. For example, a signal derived from a keyboard shortcut can show devtools on demand:

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

The callback runs once in an Angular injection context, so it can call
`inject()`. Return signals as option values to update them reactively:

```ts
// ...
// 👇 Import from the production sub-path to make devtools available in production builds
import { inject } from '@angular/core'
import { withDevtools } from '@tanstack/angular-query-devtools/production'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTanStackQuery(
      () => new QueryClient(),
      withDevtools(() => ({
        loadDevtools: inject(DevtoolsOptionsManager).loadDevtools,
      })),
    ),
  ],
}
```

### Options returned from the callback

`loadDevtools`, `client`, `position`, `errorTypes`, `buttonPosition`,
`initialIsOpen`, and `theme` accept either their documented static value or a
signal containing that value.

`styleNonce`, `shadowDOMTarget`, and `hideDisabledQueries` are construction-time
options and do not accept signals.

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
- `theme?: "light" | "dark" | "system"`
  - Defaults to `system`.
  - Sets the theme of the devtools panel.
