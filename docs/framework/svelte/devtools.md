---
id: devtools
title: Devtools
---

## Install and Import the Devtools

The devtools are a separate package that you need to install:

```bash
npm i @tanstack/svelte-query-devtools
```

or

```bash
pnpm add @tanstack/svelte-query-devtools
```

or

```bash
yarn add @tanstack/svelte-query-devtools
```

or

```bash
bun add @tanstack/svelte-query-devtools
```

You can import the devtools like this:

```ts
import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
```

## Floating Mode

Floating Mode will mount the devtools as a fixed, floating element in your app and provide a toggle in the corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your Svelte app as you can. The closer it is to the root of the page, the better it will work!

```ts
<script>
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
</script>

<QueryClientProvider client={queryClient}>
  {/* The rest of your application */}
  <SvelteQueryDevtools />
</QueryClientProvider>
```

### Options

- `initialIsOpen: boolean`
  - Set this `true` if you want the dev tools to default to being open
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "relative"`
  - Defaults to `bottom-right`
  - The position of the TanStack logo to open and close the devtools panel
  - If `relative`, the button is placed in the location that you render the devtools.
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the Svelte Query devtools panel
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.
