---
id: installation
title: Installation
---

You can install React Query via [NPM](https://npmjs.com/),
or a good ol' `<script>` via
[ESM.sh](https://esm.sh/).

### NPM

```bash
npm i @tanstack/react-query
```

or

```bash
pnpm add @tanstack/react-query
```

or

```bash
yarn add @tanstack/react-query
```

or

```bash
bun add @tanstack/react-query
```

[//]: # 'Compatibility'

React Query is compatible with React v18+ and works with ReactDOM and React Native.

> Wanna give it a spin before you download? Try out the [simple](./examples/simple) or [basic](./examples/basic) examples!

[//]: # 'Compatibility'

### CDN

If you're not using a module bundler or package manager, you can also use this library via an ESM-compatible CDN such as [ESM.sh](https://esm.sh/). Simply add a `<script type="module">` tag to the bottom of your HTML file:

[//]: # 'CDNExample'

```html
<script type="module">
  import React from 'https://esm.sh/react@18.2.0'
  import ReactDOM from 'https://esm.sh/react-dom@18.2.0'
  import { QueryClient } from 'https://esm.sh/@tanstack/react-query'
</script>
```

> You can find instructions on how to use React without JSX [here](https://react.dev/reference/react/createElement#creating-an-element-without-jsx).

[//]: # 'CDNExample'

### Requirements

React Query is optimized for modern browsers. It is compatible with the following browsers config

```
Chrome >= 91
Firefox >= 90
Edge >= 91
Safari >= 15
iOS >= 15
Opera >= 77
```

> Depending on your environment, you might need to add polyfills. If you want to support older browsers, you need to transpile the library from `node_modules` yourselves.

### Recommendations

It is recommended to also use our [ESLint Plugin Query](../../eslint/eslint-plugin-query.md) to help you catch bugs and inconsistencies while you code. You can install it via:

```bash
npm i -D @tanstack/eslint-plugin-query
```

or

```bash
pnpm add -D @tanstack/eslint-plugin-query
```

or

```bash
yarn add -D @tanstack/eslint-plugin-query
```

or

```bash
bun add -D @tanstack/eslint-plugin-query
```
