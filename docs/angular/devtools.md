---
id: devtools
title: Devtools
---

## Install and Import the Devtools

The devtools are a separate package that you need to install:

```bash
$ npm i @tanstack/angular-query-devtools-experimental
# or
$ pnpm add @tanstack/angular-query-devtools-experimental
# or
$ yarn add @tanstack/angular-query-devtools-experimental
```

You can import the devtools like this:

```typescript
import { AngularQueryDevtools } from '@tanstack/angular-query-devtools-experimental'
```

## Floating Mode

Floating Mode will mount the devtools as a fixed, floating element in your app and provide a toggle in the corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your Angular app as you can. The closer it is to the root of the page, the better it will work!

```typescript
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
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"`
  - Defaults to `bottom-left`
  - The position of the TanStack logo to open and close the devtools panel
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the Angular Query devtools panel
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the QueryClient provided through provideAngularQuery() will be injected.
