---
id: devtools
title: Devtools
---

## Enable developer tools

The developer tools help you debug and inspect your queries and mutations. You can enable the developer tools by adding `withDeveloperTools` to `provideTanStackQuery`.

By default, the developer tools are enabled when Angular [`isDevMode`](https://angular.dev/api/core/isDevMode) returns true. So you don't need to worry about excluding them during a production build. The tools are lazily loaded and not included in bundled code.

```ts
import {
  QueryClient,
  provideTanStackQuery,
  withDeveloperTools,
} from '@tanstack/angular-query-experimental'

export const appConfig: ApplicationConfig = {
  providers: [provideTanStackQuery(new QueryClient(), withDeveloperTools())],
}
```

## Configuring if developer tools are loaded

As by default developer tools are only loaded in development mode you usually don't have to configure anything. However, if you need more control over when developer tools are loaded, you can use the `loadDeveloperTools` option. This is particularly useful if you want to load development tools based on environment configurations. For instance, you might have a test environment running in production mode but still require developer tools to be available.

When not setting the option or setting it to 'enabledInDevelopmentMode', the developer tools will be loaded when Angular is in development mode.

```ts
provideTanStackQuery(new QueryClient(), withDeveloperTools())

// which is equivalent to
provideTanStackQuery(
  new QueryClient(),
  withDeveloperTools({ loadDeveloperTools: 'enabledInDevelopmentMode' }),
)
```

When setting the option to 'enabled', the developer tools will be loaded in both development and production mode.

```ts
provideTanStackQuery(
  new QueryClient(),
  withDeveloperTools({ loadDeveloperTools: 'enabled' }),
)
```

When setting the option to 'disabled', the developer tools will not be loaded.

```ts
provideTanStackQuery(
  new QueryClient(),
  withDeveloperTools({ loadDeveloperTools: 'disabled' }),
)
```

### Options

- `loadDeveloperTools?: 'enabled' | 'enabledInDevelopmentMode' | 'disabled'`
  - Defaults to 'enabledInDevelopmentMode'
  - Use this to control when the developer tools are loaded.
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
