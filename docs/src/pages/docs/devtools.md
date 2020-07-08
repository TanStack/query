---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because React Query comes with dedicated devtools! 🥳

When you begin your React Query journey, you'll want these devtools by your side. They help visualize all of the inner workings of React Query and will likely save you hours of debugging if you find yourself in a pinch!

## Installation

```bash
$ npm i --save react-query-devtools
# or
$ yarn add react-query-devtools
```

Using React Native? Try [react-query-native-devtools](https://github.com/bgaleotti/react-query-native-devtools) instead.

## Usage

By default, React Query Devtools are not imported and used when `process.env.NODE_ENV === 'production'`, so you don't need to worry about excluding them during a production build.

If you want to use the devtools in production, you can manually import them (preferably asynchronously code-split) by importing the `dist/react-query-devtools.production.min.js` file directly.

### Floating Mode

Floating Mode will mount the devtools as a fixed, floating element in your app and provide a toggle in the corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your React app as you can. The closer it is to the root of the page, the better it will work!

```js
import { ReactQueryDevtools } from 'react-query-devtools'

function App() {
  return (
    <>
      {/* The rest of your application */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

#### Options

- `initialIsOpen: Boolean`
  - Set this `true` if you want the dev tools to default to being open
- `panelProps: PropsObject`
  - Use this to add props to the panel. For example, you can add `className`, `style` (merge and override default style), etc.
- `closeButtonProps: PropsObject`
  - Use this to add props to the close button. For example, you can add `className`, `style` (merge and override default style), `onClick` (extend default handler), etc.
- `toggleButtonProps: PropsObject`
  - Use this to add props to the toggle button. For example, you can add `className`, `style` (merge and override default style), `onClick` (extend default handler), etc.

### Embedded Mode

Embedded Mode will embed the devtools as a regular component in your application. You can style it however you'd like after that!

```js
import { ReactQueryDevtoolsPanel } from 'react-query-devtools'

function App() {
  return (
    <>
      {/* The rest of your application */}
      <ReactQueryDevtoolsPanel style={styles} className={className} />
    </>
  )
}
```

#### Options

Use these options to style the dev tools.

- `style: StyleObject`
  - The standard React style object used to style a component with inline styles
- `className: string`
  - The standard React className property used to style a component with classes
