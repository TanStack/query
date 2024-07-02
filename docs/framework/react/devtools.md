---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because React Query comes with dedicated devtools! 🥳

When you begin your React Query journey, you'll want these devtools by your side. They help visualize all the inner workings of React Query and will likely save you hours of debugging if you find yourself in a pinch!

> Please note that for now, the devtools **do not support React Native**. If you would like to help us make the devtools platform-agnostic, please let us know!

> Exciting News: We now have a separate package for React Native React Query DevTools! This new addition brings native support, allowing you to integrate DevTools directly into your React Native projects. Check it out and contribute here: [react-native-react-query-devtools](https://github.com/LovesWorking/react-native-react-query-devtools)

> An external tool is also available that enables the use of React Query DevTools via an external dashboard. Find out more and contribute on [react-query-external-sync](https://github.com/LovesWorking/react-query-external-sync)

> Note that since version 5, the dev tools support observing mutations as well.

> There is a new external tool [@jsmdeleon/react-query-native-devtool](https://github.com/jossydeleon/react-native-query-devtool-monorepo)
This library provides a component specifically designed for integrating query data in React Native applications running react-query v3, and @tanstack/query v4 and v5. 

> Explore and visualize your query data using the optional standalone app included with this library. Simply follow the instructions in the documentation to get started.
> Contributions to this library are welcome! If you encounter any issues or have suggestions for improvements, please visit the [GitHub repository](https://github.com/jossydeleon/react-native-query-devtool-monorepo) to contribute.

## Install and Import the Devtools

The devtools are a separate package that you need to install:

```bash
$ npm i @tanstack/react-query-devtools
# or
$ pnpm add @tanstack/react-query-devtools
# or
$ yarn add @tanstack/react-query-devtools
# or
$ bun add @tanstack/react-query-devtools
```

For Next 13+ App Dir you must install it as a dev dependency for it to work.

You can import the devtools like this:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
```

By default, React Query Devtools are only included in bundles when `process.env.NODE_ENV === 'development'`, so you don't need to worry about excluding them during a production build.

## Floating Mode

Floating Mode will mount the devtools as a fixed, floating element in your app and provide a toggle in the corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your React app as you can. The closer it is to the root of the page, the better it will work!

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* The rest of your application */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Options

- `initialIsOpen: Boolean`
  - Set this `true` if you want the dev tools to default to being open
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "relative"`
  - Defaults to `bottom-right`
  - The position of the React Query logo to open and close the devtools panel
  - If `relative`, the button is placed in the location that you render the devtools.
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the React Query devtools panel
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.

## Devtools in production

Devtools are excluded in production builds. However, it might be desirable to lazy load the devtools in production:

```tsx
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Example } from './Example'

const queryClient = new QueryClient()

const ReactQueryDevtoolsProduction = React.lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then(
    (d) => ({
      default: d.ReactQueryDevtools,
    }),
  ),
)

function App() {
  const [showDevtools, setShowDevtools] = React.useState(false)

  React.useEffect(() => {
    // @ts-expect-error
    window.toggleDevtools = () => setShowDevtools((old) => !old)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      <ReactQueryDevtools initialIsOpen />
      {showDevtools && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtoolsProduction />
        </React.Suspense>
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
const ReactQueryDevtoolsProduction = React.lazy(() =>
  import('@tanstack/react-query-devtools/production').then((d) => ({
    default: d.ReactQueryDevtools,
  })),
)
```

For TypeScript, you would need to set `moduleResolution: 'nodenext'` in your tsconfig, which requires at least TypeScript v4.7.
