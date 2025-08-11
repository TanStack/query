---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because Solid Query comes with dedicated devtools! 🥳

When you begin your Solid Query journey, you'll want these devtools by your side. They help visualize all of the inner workings of Solid Query and will likely save you hours of debugging if you find yourself in a pinch!

> For Chrome, Firefox, and Edge users: Third-party browser extensions are available for debugging TanStack Query directly in browser DevTools. These provide the same functionality as the framework-specific devtools packages:
>
> - <img alt="Chrome logo" src="https://raw.githubusercontent.com/TanStack/query/refs/heads/main/media/browser-logos/chrome.svg" width="12" height="12" /> [Devtools for Chrome](https://chromewebstore.google.com/detail/tanstack-query-devtools/annajfchloimdhceglpgglpeepfghfai)
> - <img alt="Firefox logo" src="https://raw.githubusercontent.com/TanStack/query/refs/heads/main/media/browser-logos/firefox.svg" width="12" height="12" /> [Devtools for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tanstack-query-devtools/)
> - <img alt="Edge logo" src="https://raw.githubusercontent.com/TanStack/query/refs/heads/main/media/browser-logos/edge.svg" width="12" height="12" /> [Devtools for Edge](https://microsoftedge.microsoft.com/addons/detail/tanstack-query-devtools/edmdpkgkacmjopodhfolmphdenmddobj)

## Install and Import the Devtools

The devtools are a separate package that you need to install:

```bash
npm i @tanstack/solid-query-devtools
```

or

```bash
pnpm add @tanstack/solid-query-devtools
```

or

```bash
yarn add @tanstack/solid-query-devtools
```

or

```bash
bun add @tanstack/solid-query-devtools
```

You can import the devtools like this:

```tsx
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
```

By default, Solid Query Devtools are only included in bundles when `isServer === true` ([`isServer`](https://github.com/solidjs/solid/blob/a72d393a07b22f9b7496e5eb93712188ccce0d28/packages/solid/web/src/index.ts#L37) comes from the `solid-js/web` package), so you don't need to worry about excluding them during a production build.

## Floating Mode

Floating Mode will mount the devtools as a fixed, floating element in your app and provide a toggle in the corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your Solid app as you can. The closer it is to the root of the page, the better it will work!

```tsx
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* The rest of your application */}
      <SolidQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Options

- `initialIsOpen: Boolean`
  - Set this `true` if you want the dev tools to default to being open
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"`
  - Defaults to `bottom-right`
  - The position of the Solid Query logo to open and close the devtools panel
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the Solid Query devtools panel
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.
