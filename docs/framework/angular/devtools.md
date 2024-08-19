---
id: devtools
title: Devtools
---

## Install and Import the Devtools

The devtools are a separate package that you need to install:

```bash
$ npm i @tanstack/angular-query-devtools-experimental
```

or

```bash
$ pnpm add @tanstack/angular-query-devtools-experimental
```

or

```bash
$ yarn add @tanstack/angular-query-devtools-experimental
```

or

```bash
$ bun add @tanstack/angular-query-devtools-experimental
```

You can import the devtools like this:

```ts
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
```

## Floating Mode

Floating Mode will mount the devtools as a fixed, floating element in your app and provide a toggle in the corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your Angular app as you can. The closer it is to the root of the page, the better it will work!

```angular-ts
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AngularQueryDevtools],
  template: `
   <angular-query-devtools initialIsOpen />
  `,
})
```

### Options

- `initialIsOpen: Boolean`
  - Set this `true` if you want the dev tools to default to being open
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "relative"`
  - Defaults to `bottom-right`
  - The position of the TanStack logo to open and close the devtools panel
  - If `relative`, the button is placed in the location that you render the devtools.
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the Angular Query devtools panel
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the QueryClient provided through provideAngularQuery() will be injected.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.
