---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because Preact Query comes with dedicated devtools! 🥳

When you begin your Preact Query journey, you'll want these devtools by your side. They help visualize all the inner workings of Preact Query and will likely save you hours of debugging if you find yourself in a pinch!

> For Chrome, Firefox, and Edge users: Third-party browser extensions are available for debugging TanStack Query directly in browser DevTools. These provide the same functionality as the framework-specific devtools packages:
>
> - <img alt="Chrome logo" src="https://www.google.com/chrome/static/images/chrome-logo.svg" width="16" height="16" class="inline mr-1 not-prose" /> [Devtools for Chrome](https://chromewebstore.google.com/detail/tanstack-query-devtools/annajfchloimdhceglpgglpeepfghfai)
> - <img alt="Firefox logo" src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" width="16" height="16" class="inline mr-1 not-prose" /> [Devtools for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tanstack-query-devtools/)
> - <img alt="Edge logo" src="https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg" width="16" height="16" class="inline mr-1 not-prose" /> [Devtools for Edge](https://microsoftedge.microsoft.com/addons/detail/tanstack-query-devtools/edmdpkgkacmjopodhfolmphdenmddobj)

> Note that since version 5, the dev tools support observing mutations as well.

## Install and Import the Devtools

The devtools are a separate package that you need to install:

```bash
npm i @tanstack/preact-query-devtools
```

or

```bash
pnpm add @tanstack/preact-query-devtools
```

or

```bash
yarn add @tanstack/preact-query-devtools
```

or

```bash
bun add @tanstack/preact-query-devtools
```

For Next 13+ App Dir you must install it as a dev dependency for it to work.

You can import the devtools like this:

```tsx
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
```

By default, Preact Query Devtools are only included in bundles when `process.env.NODE_ENV === 'development'`, so you don't need to worry about excluding them during a production build.

## Floating Mode

Floating Mode will mount the devtools as a fixed, floating element in your app and provide a toggle in corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your Preact app as you can. The closer it is to the root of the page, the better it will work!

```tsx
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* The rest of your application */}
      <PreactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Options

- `initialIsOpen: boolean`
  - Set this `true` if you want the dev tools to default to being open
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "relative"`
  - Defaults to `bottom-right`
  - The position of the Preact Query logo to open and close the devtools panel
  - If `relative`, the button is placed in the location that you render the devtools.
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the Preact Query devtools panel
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}[]`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within head tag in the light DOM.

## Embedded Mode

Embedded mode will show the development tools as a fixed element in your application, so you can use our panel in your own development tools.

Place the following code as high in your Preact app as you can. The closer it is to the root of the page, the better it will work!

```tsx
import { PreactQueryDevtoolsPanel } from '@tanstack/preact-query-devtools'

function App() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      {/* The rest of your application */}
      <button
        onClick={() => setIsOpen(!isOpen)}
      >{`${isOpen ? 'Close' : 'Open'} the devtools panel`}</button>
      {isOpen && <PreactQueryDevtoolsPanel onClose={() => setIsOpen(false)} />}
    </QueryClientProvider>
  )
}
```

### Options

- `style?: JSX.CSSProperties`
  - Custom styles for the devtools panel
  - Default: `{ height: '500px' }`
  - Example: `{ height: '100%' }`
  - Example: `{ height: '100%', width: '100%' }`
- `onClose?: () => unknown`
  - Callback function that is called when the devtools panel is closed
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}[]`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within head tag in the light DOM.

## Devtools in production

Devtools are excluded in production builds. However, it might be desirable to lazy load the devtools in production:

```tsx
import { Suspense } from 'preact/compat'
import { lazy } from 'preact/iso'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import { Example } from './Example'

const queryClient = new QueryClient()

const PreactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/preact-query-devtools/build/modern/production.js').then(
    (d) => ({
      default: d.PreactQueryDevtools,
    }),
  ),
)

function App() {
  const [showDevtools, setShowDevtools] = useState(false)

  useEffect(() => {
    // @ts-expect-error
    window.toggleDevtools = () => setShowDevtools((old) => !old)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      <PreactQueryDevtools initialIsOpen />
      {showDevtools && (
        <Suspense fallback={null}>
          <PreactQueryDevtoolsProduction />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}

export default App
```

With this, calling `window.toggleDevtools()` will download the devtools bundle and show them.

### Modern bundlers

If your bundler supports package exports, you can use the following import path:

```tsx
const PreactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/preact-query-devtools/production').then((d) => ({
    default: d.PreactQueryDevtools,
  })),
)
```

For TypeScript, you would need to set `moduleResolution: 'nodenext'` in your tsconfig, which requires at least TypeScript v4.7.
