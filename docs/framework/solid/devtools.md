---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because Solid Query comes with dedicated devtools! 🥳

When you begin your Solid Query journey, you'll want these devtools by your side. They help visualize all of the inner workings of Solid Query and will likely save you hours of debugging if you find yourself in a pinch!

> For Chrome, Firefox, and Edge users: Third-party browser extensions are available for debugging TanStack Query directly in browser DevTools. These provide the same functionality as the framework-specific devtools packages:
>
> - <img alt="Chrome logo" src="https://www.google.com/chrome/static/images/chrome-logo.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://chromewebstore.google.com/detail/tanstack-query-devtools/annajfchloimdhceglpgglpeepfghfai">Devtools for Chrome</a>
> - <img alt="Firefox logo" src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://addons.mozilla.org/en-US/firefox/addon/tanstack-query-devtools/">Devtools for Firefox</a>
> - <img alt="Edge logo" src="https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://microsoftedge.microsoft.com/addons/detail/tanstack-query-devtools/edmdpkgkacmjopodhfolmphdenmddobj">Devtools for Edge</a>

## Install and Import the Devtools

The devtools are a separate package that you need to install:

```sh
npm i @tanstack/solid-query-devtools
```

or

```sh
pnpm add @tanstack/solid-query-devtools
```

or

```sh
yarn add @tanstack/solid-query-devtools
```

or

```sh
bun add @tanstack/solid-query-devtools
```

You can import the devtools like this:

```tsx
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
```

By default, Solid Query Devtools are only enabled when `process.env.NODE_ENV === 'development'`. In production, the devtools components render nothing. During development, the server renders an empty container element and the devtools mount into it on the client.

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

- `initialIsOpen: boolean`
  - Set this `true` if you want the dev tools to default to being open
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "relative"`
  - Defaults to `bottom-right`
  - The position of the TanStack logo to open and close the devtools panel
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the Solid Query devtools panel
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}[]`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.
- `hideDisabledQueries?: boolean`
  - Defaults to `false`.
  - Set this to true to hide disabled queries from the devtools panel.
- `theme?: "light" | "dark" | "system"`
  - Defaults to the theme selected in the devtools Settings menu, or `system` if none is selected.
  - Set this to change the theme of the devtools panel. This overrides the theme selected in the Settings menu.

## Embedded Mode

Embedded mode will show the development tools as a fixed element in your application, so you can use our panel in your own development tools.

Place the following code as high in your Solid app as you can. The closer it is to the root of the page, the better it will work!

```tsx
import { SolidQueryDevtoolsPanel } from '@tanstack/solid-query-devtools'
import { createSignal, Show } from 'solid-js'

function App() {
  const [isOpen, setIsOpen] = createSignal(false)

  return (
    <QueryClientProvider client={queryClient}>
      {/* The rest of your application */}
      <button
        onClick={() => setIsOpen(!isOpen())}
      >{`${isOpen() ? 'Close' : 'Open'} the devtools panel`}</button>
      <Show when={isOpen()}>
        <SolidQueryDevtoolsPanel onClose={() => setIsOpen(false)} />
      </Show>
    </QueryClientProvider>
  )
}
```

### Options

- `style?: JSX.CSSProperties`
  - Custom styles for the devtools panel
  - Default: `{ height: '100%', display: 'flex', 'flex-direction': 'column' }`
  - The panel fills the height of its container, or is `500px` tall when the container has no set height.
  - Example: `{ height: '100%' }`
  - Example: `{ height: '100%', width: '100%' }`
- `onClose?: () => void`
  - Callback function that is called when the devtools panel is closed
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}[]`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.
- `hideDisabledQueries?: boolean`
  - Defaults to `false`.
  - Set this to true to hide disabled queries from the devtools panel.
- `theme?: "light" | "dark" | "system"`
  - Defaults to the theme selected in the devtools Settings menu, or `system` if none is selected.
  - Set this to change the theme of the devtools panel. This overrides the theme selected in the Settings menu.

## Filter queries and mutations

The **Filter** input above the query and mutation lists uses the **Key** scope by default. Select the scope button inside the input to switch between **Key**, **Data**, and **All**:

- **Key** matches the query hash, or the mutation key and submission time.
- **Data** matches the query data, or the mutation variables or data, the same way **Search data** does below.
- **All** matches either.

The selected scope is remembered across reloads, like the other filter settings.

## Search query and mutation data

Select a query or mutation and use **Search data** in its Data Explorer to search nested property names and primitive values. Search uses case-insensitive text matching and treats special characters as plain text.

Matching text is highlighted. Matching editable values have a highlighted input. The explorer opens matching branches and the first matching page in each paginated collection. Other pages with matches are highlighted so you can open them. You can still inspect other rows and edit query data.

The Data Explorer highlights up to 1,000 matches at a time.

Select **Clear** or press **Escape** in the search field to restore your manual expansion. Selecting another query or mutation clears the search, unless the filter scope is **Data** or **All**: then the search starts with the filter text. For a mutation, it starts only in the variables or data that match the filter.

## Devtools in production

Devtools are excluded in production builds. However, it might be desirable to lazy load the devtools in production:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { createSignal, lazy, onMount, Show, Suspense } from 'solid-js'
import { Example } from './Example'

const queryClient = new QueryClient()

const SolidQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/solid-query-devtools/production').then((d) => ({
    default: d.SolidQueryDevtools,
  })),
)

function App() {
  const [showDevtools, setShowDevtools] = createSignal(false)

  onMount(() => {
    Object.assign(window, {
      toggleDevtools: () => setShowDevtools((old) => !old),
    })
  })

  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      <SolidQueryDevtools initialIsOpen />
      <Show when={showDevtools()}>
        <Suspense fallback={null}>
          <SolidQueryDevtoolsProduction />
        </Suspense>
      </Show>
    </QueryClientProvider>
  )
}

export default App
```

With this, calling `window.toggleDevtools()` will download the devtools bundle and show them.

`@tanstack/solid-query-devtools/production` also exports `SolidQueryDevtoolsPanel` for Embedded Mode.

For TypeScript, you would need to set `moduleResolution` to `'bundler'`, `'node16'`, or `'nodenext'` in your tsconfig.
