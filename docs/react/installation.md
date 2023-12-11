---
id: installation
title: Installation
---

You can install React Query via [NPM](https://npmjs.com),
or a good ol' `<script>` via
[unpkg.com](https://unpkg.com).

### NPM

```bash
$ npm i @tanstack/react-query
# or
$ pnpm add @tanstack/react-query
# or
$ yarn add @tanstack/react-query
```

React Query is compatible with React v16.8+ and works with ReactDOM and React Native.

> Wanna give it a spin before you download? Try out the [simple](/query/v4/docs/examples/react/simple) or [basic](/query/v4/docs/examples/react/basic) examples!

### CDN

If you're not using a module bundler or package manager we also have a global ("UMD") build hosted on the [unpkg.com](https://unpkg.com) CDN. Simply add the following `<script>` tag to the bottom of your HTML file:

```html
<script src="https://unpkg.com/@tanstack/react-query@4/build/umd/index.production.js"></script>
```

Once you've added this you will have access to the `window.ReactQuery` object and its exports.

> This installation/usage requires the [React CDN script bundles](https://reactjs.org/docs/cdn-links.html) to be on the page as well.

### Requirements

React Query is optimized for modern browsers. It is compatible with the following browsers config

```
Chrome >= 73
Firefox >= 78
Edge >= 79
Safari >= 12.1
iOS >= 12.2
Opera >= 53
```

> Depending on your environment, you might need to add polyfills. If you want to support older browsers, you need to transpile the library from `node_modules` yourselves.

### Recommendations

It is recommended to also use our [ESLint Plugin Query](./eslint/eslint-plugin-query) to help you catch bugs and inconsistencies while you code. You can install it via:

```bash
$ npm i -D @tanstack/eslint-plugin-query
# or
$ pnpm add -D @tanstack/eslint-plugin-query
# or
$ yarn add -D @tanstack/eslint-plugin-query
```
