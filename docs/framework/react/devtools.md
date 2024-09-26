---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because React Query comes with dedicated devtools! 🥳

When you begin your React Query journey, you'll want these devtools by your side. They help visualize all of the inner workings of React Query and will likely save you hours of debugging if you find yourself in a pinch!

> Please note that for now, the devtools **do not support React Native**. If you would like to help us make the devtools platform agnostic, please let us know!

> Also note that you can use these devtools to observe queries, but **not mutations**

## Install and Import the Devtools

The devtools are a separate package that you need to install.

The major version of all the packages must be in sync.

```bash
npm i @tanstack/react-query-devtools@4
```

or

```bash
pnpm add @tanstack/react-query-devtools@4
```

or

```bash
yarn add @tanstack/react-query-devtools@4
```

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
- `panelProps: PropsObject`
  - Use this to add props to the panel. For example, you can add `className`, `style` (merge and override default style), etc.
- `closeButtonProps: PropsObject`
  - Use this to add props to the close button. For example, you can add `className`, `style` (merge and override default style), `onClick` (extend default handler), etc.
- `toggleButtonProps: PropsObject`
  - Use this to add props to the toggle button. For example, you can add `className`, `style` (merge and override default style), `onClick` (extend default handler), etc.
- `position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"`
  - Defaults to `bottom-left`
  - The position of the React Query logo to open and close the devtools panel
- `panelPosition?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the React Query devtools panel
- `context?: React.Context<QueryClient | undefined>`
  - Use this to use a custom React Query context. Otherwise, `defaultContext` will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => { toString(): string }}`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an item that can be stringified so we can check for its presence on any given query.

## Embedded Mode

Embedded Mode will embed the devtools as a regular component in your application. You can style it however you'd like after that!

```tsx
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* The rest of your application */}
      <ReactQueryDevtoolsPanel style={styles} className={className} />
    </QueryClientProvider>
  )
}
```

### Options

Use these options to style the dev tools.

- `style: StyleObject`
  - The standard React style object used to style a component with inline styles
- `className: string`
  - The standard React className property used to style a component with classes
- `showCloseButton?: boolean`
  - Show a close button inside the devtools panel
- `closeButtonProps: PropsObject`
  - Use this to add props to the close button. For example, you can add `className`, `style` (merge and override default style), `onClick` (extend default handler), etc.

## Devtools in production

Devtools are excluded in production builds. However, it might be desirable to lazy load the devtools in production:

```tsx
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Example } from './Example'

const queryClient = new QueryClient()

const ReactQueryDevtoolsProduction = React.lazy(() =>
  import('@tanstack/react-query-devtools/build/lib/index.prod.js').then(
    (d) => ({
      default: d.ReactQueryDevtools,
    }),
  ),
)

function App() {
  const [showDevtools, setShowDevtools] = React.useState(false)

  React.useEffect(() => {
    // @ts-ignore
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
