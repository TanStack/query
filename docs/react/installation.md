---
id: installation
title: Installation
---

You can install React Query via [NPM](https://npmjs.com),
or a good ol' `<script>` via
[unpkg.com](https://unpkg.com).

> v5 is currently in alpha.

### NPM

```bash
$ npm i @tanstack/react-query@alpha
# or
$ pnpm add @tanstack/react-query@alpha
# or
$ yarn add @tanstack/react-query@alpha
```

React Query is compatible with React v18+ and works with ReactDOM and React Native.

> Wanna give it a spin before you download? Try out the [simple](../examples/react/simple) or [basic](../examples/react/basic) examples!

### CDN

If you're not using a module bundler or package manager, you can also use this library via an ESM-compatible CDN such as [ESM.sh](https://esm.sh/) or [Skypack](https://www.skypack.dev/). Simply add a `<script type="module">` tag to the bottom of your HTML file:

```html
<script type="module">
  import React from 'https://esm.sh/react@18.2.0'
  import ReactDOM from 'https://esm.sh/react-dom@18.2.0'
  import { QueryClient } from 'https://esm.sh/@tanstack/react-query@alpha'
</script>
```

> You can find instructions on how to use React without JSX [here](https://react.dev/reference/react/createElement#creating-an-element-without-jsx).

### Requirements

React Query is optimized for modern browsers. It is compatible with the following browsers config

```
Chrome >= 84
Firefox >= 90
Edge >= 84
Safari >= 15
iOS >= 15
opera >= 70
```

> Depending on your environment, you might need to add polyfills. If you want to support older browsers, you need to transpile the library from `node_modules` yourselves.

### Recommendations

It is recommended to also use our [ESLint Plugin Query](./eslint/eslint-plugin-query) to help you catch bugs and inconsistencies while you code. You can install it via:

```bash
$ npm i -D @tanstack/eslint-plugin-query@alpha
# or
$ pnpm add -D @tanstack/eslint-plugin-query@alpha
# or
$ yarn add -D @tanstack/eslint-plugin-query@alpha
```
