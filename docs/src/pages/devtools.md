---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because React Query comes with dedicated devtools! 🥳

When you begin your React Query journey, you'll want these devtools by your side. They help visualize all of the inner workings of React Query and will likely save you hours of debugging if you find yourself in a pinch!

> Please note that for now, the devtools **do not support React Native**. If you would like to help us make the devtools platform agnostic, please let us know!

## Import the Devtools

The devtools are bundle split into the `react-query/devtools` package. No need to install anything extra, just:

```js
import { ReactQueryDevtools } from 'react-query/devtools'
```

By default, React Query Devtools are not included in production bundles when `process.env.NODE_ENV === 'production'`, so you don't need to worry about excluding them during a production build.

## Floating Mode

Floating Mode will mount the devtools as a fixed, floating element in your app and provide a toggle in the corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your React app as you can. The closer it is to the root of the page, the better it will work!

```js
import { ReactQueryDevtools } from 'react-query/devtools'

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

## Embedded Mode

Embedded Mode will embed the devtools as a regular component in your application. You can style it however you'd like after that!

```js
import { ReactQueryDevtoolsPanel } from 'react-query/devtools'

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
